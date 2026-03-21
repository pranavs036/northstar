import { NextRequest, NextResponse } from "next/server";
import PocketBase from "pocketbase";
import { z, ZodError } from "zod";

const CreateCompetitorSchema = z.object({
  brandId: z.string().min(1, "Brand ID is required"),
  domain: z
    .string()
    .min(1, "Domain is required")
    .refine(
      (domain) => {
        try {
          new URL(`https://${domain}`);
          return true;
        } catch {
          return false;
        }
      },
      "Invalid domain format"
    ),
  name: z.string().optional(),
});

function getPocketBase(request: NextRequest) {
  const pbUrl = process.env.NEXT_PUBLIC_POCKETBASE_URL || "http://127.0.0.1:8090";
  const pb = new PocketBase(pbUrl);
  const pbCookie = request.cookies.get("pb_auth");
  if (pbCookie) {
    pb.authStore.loadFromCookie(`pb_auth=${pbCookie.value}`);
  }
  return pb;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = CreateCompetitorSchema.parse(body);

    const pb = getPocketBase(request);
    if (!pb.authStore.isValid) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const competitor = await pb.collection("competitors").create({
      user: validated.brandId,
      domain: validated.domain.toLowerCase(),
      name: validated.name || "",
    });

    return NextResponse.json(competitor, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      const messages = error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
      return NextResponse.json({ message: `Validation error: ${messages}` }, { status: 400 });
    }

    console.error("[competitors POST]", error);
    return NextResponse.json({ message: "Failed to add competitor" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ message: "Competitor ID is required" }, { status: 400 });
    }

    const pb = getPocketBase(request);
    if (!pb.authStore.isValid) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await pb.collection("competitors").delete(id);

    return NextResponse.json({ message: "Competitor deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("[competitors DELETE]", error);
    return NextResponse.json({ message: "Failed to delete competitor" }, { status: 500 });
  }
}
