import { NextRequest, NextResponse } from "next/server";
import PocketBase from "pocketbase";

const POCKETBASE_URL =
  process.env.NEXT_PUBLIC_POCKETBASE_URL || "http://127.0.0.1:8090";

export async function GET(request: NextRequest) {
  const pb = new PocketBase(POCKETBASE_URL);
  const pbCookie = request.cookies.get("pb_auth");
  if (!pbCookie) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  pb.authStore.loadFromCookie(`pb_auth=${pbCookie.value}`);

  if (!pb.authStore.isValid || !pb.authStore.record) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = pb.authStore.record.id;

  try {
    // Get the most recent brand scan for this user
    const result = await pb.collection("brand_scans").getList(1, 1, {
      filter: `user="${userId}"`,
      sort: "-created",
    });

    if (result.totalItems === 0) {
      return NextResponse.json({ scan: null, exists: false });
    }

    const scan = result.items[0];

    return NextResponse.json({
      scan: {
        id: scan.id,
        status: scan.status,
        visibilityScore: scan.visibilityScore,
        totalQueries: scan.totalQueries,
        completedQueries: scan.completedQueries,
        brandVisibleCount: scan.brandVisibleCount,
        tierScores: scan.tierScores ? JSON.parse(scan.tierScores as string) : null,
        results: scan.results ? JSON.parse(scan.results as string) : [],
        completedAt: scan.completedAt,
        created: scan.created,
      },
      exists: true,
    });
  } catch (err) {
    console.error("[brand-scan/status]", err);
    return NextResponse.json(
      { error: "Failed to fetch brand scan status" },
      { status: 500 }
    );
  }
}
