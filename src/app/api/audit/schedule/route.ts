import { NextRequest, NextResponse } from "next/server";
import PocketBase from "pocketbase";
import { z, ZodError } from "zod";

const POCKETBASE_URL =
  process.env.NEXT_PUBLIC_POCKETBASE_URL || "http://127.0.0.1:8090";

const ScheduleSchema = z.object({
  frequency: z.enum(["daily", "weekly", "off"]),
});

function getPocketBase(request: NextRequest) {
  const pb = new PocketBase(POCKETBASE_URL);
  const pbCookie = request.cookies.get("pb_auth");
  if (pbCookie) {
    pb.authStore.loadFromCookie(`pb_auth=${pbCookie.value}`);
  }
  return pb;
}

function createAdminClient() {
  return new PocketBase(POCKETBASE_URL);
}

// POST: save schedule preference (frequency: daily/weekly/off) for the user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = ScheduleSchema.parse(body);

    const pb = getPocketBase(request);
    if (!pb.authStore.isValid || !pb.authStore.record) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = pb.authStore.record.id;

    // Upsert schedule preference into the user's scan_schedule record
    let existing: { id: string } | null = null;
    try {
      const results = await pb
        .collection("scan_schedules")
        .getFullList({ filter: `user="${userId}"` });
      existing = results[0] ?? null;
    } catch {
      existing = null;
    }

    let record;
    if (existing) {
      record = await pb.collection("scan_schedules").update(existing.id, {
        frequency: validated.frequency,
        active: validated.frequency !== "off",
      });
    } else {
      record = await pb.collection("scan_schedules").create({
        user: userId,
        frequency: validated.frequency,
        active: validated.frequency !== "off",
      });
    }

    return NextResponse.json(record, { status: 200 });
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
    console.error("[audit/schedule POST]", error);
    return NextResponse.json(
      { message: "Failed to save schedule preference" },
      { status: 500 }
    );
  }
}

// GET: called by Vercel Cron — triggers audit pipeline for users with active schedules
export async function GET(request: NextRequest) {
  // Verify the request comes from Vercel Cron via CRON_SECRET
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ...

  try {
    const pb = createAdminClient();

    // Fetch all active schedules
    let schedules: Array<{ id: string; user: string; frequency: string }> = [];
    try {
      schedules = await pb
        .collection("scan_schedules")
        .getFullList({ filter: "active=true" });
    } catch (err) {
      console.error("[audit/schedule GET] Failed to fetch schedules:", err);
      return NextResponse.json(
        { message: "Failed to fetch schedules" },
        { status: 500 }
      );
    }

    // Filter by frequency: daily runs every day; weekly runs on Mondays (dayOfWeek === 1)
    const schedulesToRun = schedules.filter((s) => {
      if (s.frequency === "daily") return true;
      if (s.frequency === "weekly" && dayOfWeek === 1) return true;
      return false;
    });

    if (schedulesToRun.length === 0) {
      return NextResponse.json({
        message: "No scheduled audits to run",
        triggered: 0,
      });
    }

    const baseUrl =
      process.env.NEXTAUTH_URL ||
      process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000";

    const results: Array<{
      userId: string;
      status: "triggered" | "failed";
      error?: string;
    }> = [];

    for (const schedule of schedulesToRun) {
      try {
        // Trigger the audit pipeline for this user using a service-level call
        // We use the internal audit/start endpoint with an admin-generated token
        const response = await fetch(`${baseUrl}/api/audit/start`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-cron-user-id": schedule.user,
            authorization: `Bearer ${cronSecret}`,
          },
          body: JSON.stringify({ scheduledRun: true, userId: schedule.user }),
        });

        if (response.ok) {
          results.push({ userId: schedule.user, status: "triggered" });
        } else {
          const errData = await response.json().catch(() => ({}));
          results.push({
            userId: schedule.user,
            status: "failed",
            error: (errData as { error?: string }).error || `HTTP ${response.status}`,
          });
        }
      } catch (err) {
        console.error(
          `[audit/schedule GET] Failed to trigger audit for user ${schedule.user}:`,
          err
        );
        results.push({
          userId: schedule.user,
          status: "failed",
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    const triggered = results.filter((r) => r.status === "triggered").length;
    const failed = results.filter((r) => r.status === "failed").length;

    console.log(
      `[audit/schedule] Cron run complete: ${triggered} triggered, ${failed} failed`
    );

    return NextResponse.json({
      message: `Scheduled audit run complete`,
      triggered,
      failed,
      results,
    });
  } catch (error) {
    console.error("[audit/schedule GET]", error);
    return NextResponse.json(
      { message: "Scheduled audit run failed" },
      { status: 500 }
    );
  }
}
