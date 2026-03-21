import { NextRequest, NextResponse } from "next/server";
import PocketBase from "pocketbase";
import { z, ZodError } from "zod";

const POCKETBASE_URL =
  process.env.NEXT_PUBLIC_POCKETBASE_URL || "http://127.0.0.1:8090";

const AlertType = z.enum([
  "visibility_drop",
  "competitor_gain",
  "score_threshold",
]);

const CreateAlertSchema = z.object({
  type: AlertType,
  threshold: z.number().min(0).max(100).optional(),
  emailNotify: z.boolean().default(true),
});

const UpdateAlertSchema = z.object({
  id: z.string().min(1),
  enabled: z.boolean().optional(),
  threshold: z.number().min(0).max(100).optional(),
  emailNotify: z.boolean().optional(),
});

function getPocketBase(request: NextRequest) {
  const pb = new PocketBase(POCKETBASE_URL);
  const pbCookie = request.cookies.get("pb_auth");
  if (pbCookie) {
    pb.authStore.loadFromCookie(`pb_auth=${pbCookie.value}`);
  }
  return pb;
}

// GET: list alert configs for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const pb = getPocketBase(request);
    if (!pb.authStore.isValid || !pb.authStore.record) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = pb.authStore.record.id;
    const alerts = await pb
      .collection("alert_configs")
      .getFullList({ filter: `user="${userId}"`, sort: "-created" });

    return NextResponse.json(alerts);
  } catch (error) {
    console.error("[alerts GET]", error);
    return NextResponse.json(
      { message: "Failed to fetch alert configs" },
      { status: 500 }
    );
  }
}

// POST: create a new alert config
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = CreateAlertSchema.parse(body);

    const pb = getPocketBase(request);
    if (!pb.authStore.isValid || !pb.authStore.record) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = pb.authStore.record.id;

    const alert = await pb.collection("alert_configs").create({
      user: userId,
      type: validated.type,
      threshold: validated.threshold ?? null,
      emailNotify: validated.emailNotify,
      enabled: true,
    });

    return NextResponse.json(alert, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      const messages = error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; ");
      return NextResponse.json(
        { message: `Validation error: ${messages}` },
        { status: 400 }
      );
    }
    console.error("[alerts POST]", error);
    return NextResponse.json(
      { message: "Failed to create alert config" },
      { status: 500 }
    );
  }
}

// PATCH: update an existing alert config (enable/disable, threshold)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = UpdateAlertSchema.parse(body);

    const pb = getPocketBase(request);
    if (!pb.authStore.isValid || !pb.authStore.record) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = pb.authStore.record.id;

    // Verify ownership before updating
    const existing = await pb
      .collection("alert_configs")
      .getOne(validated.id);
    if (existing.user !== userId) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const updateData: Record<string, unknown> = {};
    if (validated.enabled !== undefined) updateData.enabled = validated.enabled;
    if (validated.threshold !== undefined)
      updateData.threshold = validated.threshold;
    if (validated.emailNotify !== undefined)
      updateData.emailNotify = validated.emailNotify;

    const updated = await pb
      .collection("alert_configs")
      .update(validated.id, updateData);

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof ZodError) {
      const messages = error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; ");
      return NextResponse.json(
        { message: `Validation error: ${messages}` },
        { status: 400 }
      );
    }
    console.error("[alerts PATCH]", error);
    return NextResponse.json(
      { message: "Failed to update alert config" },
      { status: 500 }
    );
  }
}

// DELETE: remove an alert config
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { message: "Alert config ID is required" },
        { status: 400 }
      );
    }

    const pb = getPocketBase(request);
    if (!pb.authStore.isValid || !pb.authStore.record) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = pb.authStore.record.id;

    // Verify ownership before deleting
    const existing = await pb.collection("alert_configs").getOne(id);
    if (existing.user !== userId) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    await pb.collection("alert_configs").delete(id);

    return NextResponse.json(
      { message: "Alert config deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("[alerts DELETE]", error);
    return NextResponse.json(
      { message: "Failed to delete alert config" },
      { status: 500 }
    );
  }
}
