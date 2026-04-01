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
    // Get the most recent audit for this user
    const result = await pb.collection("audits").getList(1, 1, {
      filter: `user="${userId}"`,
      sort: "-created",
    });

    if (result.totalItems === 0) {
      return NextResponse.json({ audit: null, exists: false });
    }

    const audit = result.items[0];

    // Get scan results with SKU names for live progress
    let scanCount = 0;
    let visibleCount = 0;
    const skuProgress: Array<{ skuId: string; skuName: string; engine: string; visible: boolean }> = [];
    try {
      // First get user's SKUs to build a name lookup
      const userSkus = await pb.collection("skus").getFullList({
        filter: `user="${userId}"`,
        fields: "id,name",
      });
      const skuNameMap: Record<string, string> = {};
      for (const s of userSkus) {
        skuNameMap[s.id] = s.name as string;
      }

      // Get scan results - filter by SKU IDs we know belong to this user
      const skuIds = userSkus.map((s) => s.id);
      if (skuIds.length > 0) {
        // Build filter for SKUs belonging to this user
        const skuFilter = skuIds.map((id) => `sku="${id}"`).join(" || ");
        const scans = await pb.collection("scan_results").getList(1, 200, {
          filter: skuFilter,
          fields: "sku,brandVisible,engine",
          sort: "-created",
        });
        scanCount = scans.totalItems;
        visibleCount = scans.items.filter((s) => s.brandVisible).length;

        // Build per-SKU progress (last 20 scans)
        for (const s of scans.items.slice(0, 20)) {
          skuProgress.push({
            skuId: s.sku as string,
            skuName: skuNameMap[s.sku as string] || "Unknown SKU",
            engine: s.engine as string,
            visible: s.brandVisible as boolean,
          });
        }
      }
    } catch (err) {
      console.error("[audit/status] scan fetch error:", err);
    }

    // Count total SKUs for this user
    let totalSkus = 0;
    try {
      const skuList = await pb.collection("skus").getList(1, 1, {
        filter: `user="${userId}"`,
        fields: "id",
      });
      totalSkus = skuList.totalItems;
    } catch {
      // ignore
    }

    return NextResponse.json({
      audit: {
        id: audit.id,
        status: audit.status,
        agentScore: audit.agentScore,
        completedAt: audit.completedAt,
        created: audit.created,
        scanCount,
        visibleCount,
        skuProgress,
        totalSkus,
      },
      exists: true,
    });
  } catch (err) {
    console.error("[audit/status]", err);
    return NextResponse.json(
      { error: "Failed to fetch audit status" },
      { status: 500 }
    );
  }
}
