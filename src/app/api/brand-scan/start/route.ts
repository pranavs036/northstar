import { NextRequest } from "next/server";
import PocketBase from "pocketbase";
import {
  generateBrandQueries,
  generateFallbackBrandQueries,
} from "@/lib/ai/brand-query-gen";
import { scanClaude } from "@/lib/scanners/claude";
import type { BrandScanResult, TierScores } from "@/types/brand-scan";

const POCKETBASE_URL =
  process.env.NEXT_PUBLIC_POCKETBASE_URL || "http://127.0.0.1:8090";

function createSSEStream() {
  const encoder = new TextEncoder();
  let controller: ReadableStreamDefaultController | null = null;

  const stream = new ReadableStream({
    start(c) {
      controller = c;
    },
  });

  function send(event: string, data: Record<string, unknown>) {
    if (controller) {
      controller.enqueue(
        encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
      );
    }
  }

  function close() {
    if (controller) {
      controller.close();
    }
  }

  return { stream, send, close };
}

export async function POST(request: NextRequest) {
  const pb = new PocketBase(POCKETBASE_URL);
  const pbCookie = request.cookies.get("pb_auth");
  if (!pbCookie) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }
  pb.authStore.loadFromCookie(`pb_auth=${pbCookie.value}`);

  if (!pb.authStore.isValid || !pb.authStore.record) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  const userId = pb.authStore.record.id;
  const brandName = pb.authStore.record.brandName || "";
  const brandDomain = pb.authStore.record.domain || "";

  // Accept optional body with brand description and categories
  let brandDescription = "";
  let categories: string[] = [];
  try {
    const body = await request.json();
    brandDescription = body.brandDescription || "";
    categories = body.categories || [];
  } catch {
    // No body is fine — we'll use defaults
  }

  if (!brandDescription) {
    brandDescription = `${brandName} is an online platform at ${brandDomain}`;
  }
  if (categories.length === 0) {
    // Fetch actual categories from user's SKUs instead of defaulting to "general products"
    try {
      const skus = await pb.collection("skus").getFullList({
        filter: `user="${userId}"`,
        fields: "category",
      });
      const uniqueCats = Array.from(new Set(
        skus.map((s) => s.category as string).filter(Boolean)
      ));
      categories = uniqueCats.length > 0 ? uniqueCats : ["general products"];
    } catch {
      categories = ["general products"];
    }
  }

  // Check if a brand scan is already running
  try {
    const existing = await pb.collection("brand_scans").getFullList({
      filter: `user="${userId}" && status="SCANNING"`,
    });
    if (existing.length > 0) {
      return new Response(
        JSON.stringify({
          error: "A brand scan is already in progress",
          scanId: existing[0].id,
        }),
        { status: 409 }
      );
    }
  } catch {
    // Collection might not exist yet — will be created below
  }

  // Create brand_scan record
  let scanId: string;
  try {
    const scan = await pb.collection("brand_scans").create({
      user: userId,
      status: "PENDING",
      brandName,
      brandDomain,
      brandDescription,
      categories: JSON.stringify(categories),
      totalQueries: 0,
      completedQueries: 0,
      brandVisibleCount: 0,
      visibilityScore: 0,
      results: "[]",
      tierScores: "{}",
    });
    scanId = scan.id;
  } catch (err) {
    console.error("[brand-scan] Failed to create scan record:", err);
    return new Response(
      JSON.stringify({ error: "Failed to create brand scan. Make sure the brand_scans collection exists in PocketBase." }),
      { status: 500 }
    );
  }

  const { stream, send, close } = createSSEStream();

  // Run brand scan pipeline in background
  (async () => {
    try {
      await pb.collection("brand_scans").update(scanId, { status: "SCANNING" });

      send("brand-scan:started", {
        scanId,
        message: `Brand scan started for ${brandName}`,
        progress: 0,
      });

      // Step 1: Generate brand-level queries
      send("brand-scan:progress", {
        scanId,
        message: "Generating brand visibility queries...",
        progress: 5,
      });

      let brandQueries;
      try {
        brandQueries = await generateBrandQueries({
          brandName,
          domain: brandDomain,
          brandDescription,
          categories,
        });
      } catch (err) {
        console.error("[brand-scan] Claude query gen failed, using fallback:", err);
        brandQueries = generateFallbackBrandQueries({
          brandName,
          domain: brandDomain,
          brandDescription,
          categories,
        });
      }

      const totalQueries = brandQueries.length;
      await pb
        .collection("brand_scans")
        .update(scanId, { totalQueries });

      send("brand-scan:progress", {
        scanId,
        message: `Generated ${totalQueries} brand queries across 4 tiers`,
        progress: 10,
      });

      // Step 2: Scan each query across available engines
      const scanResults: BrandScanResult[] = [];
      const engines = [
        { fn: scanClaude, name: "Claude" },
      ];

      // Fetch competitor domains for position tracking
      let competitorDomains: string[] = [];
      try {
        const competitors = await pb.collection("competitors").getFullList({
          filter: `user="${userId}"`,
          fields: "domain",
        });
        competitorDomains = competitors.map((c) => c.domain as string);
      } catch {
        // no competitors configured
      }

      let completedQueries = 0;

      for (const bq of brandQueries) {
        for (const engine of engines) {
          try {
            const result = await engine.fn({
              query: bq.query,
              brandDomain,
              competitorDomains,
            });

            const isSkipped =
              result.rawResponse.startsWith("[SKIPPED]") ||
              result.rawResponse.startsWith("[STUB]") ||
              result.rawResponse.startsWith("[ERROR]");

            // Check if brand name (not just domain) is mentioned
            const responseLower = result.rawResponse.toLowerCase();
            const brandNameVisible =
              responseLower.includes(brandName.toLowerCase()) ||
              result.brandVisible;

            const scanResult: BrandScanResult = {
              query: bq.query,
              tier: bq.tier,
              intent: bq.intent,
              engine: result.engine,
              brandVisible: isSkipped ? false : brandNameVisible,
              brandPosition: isSkipped ? 0 : (result.brandPosition || (brandNameVisible ? 1 : 0)),
              competitorMentioned: result.competitorDomain,
              competitorPositions: result.competitorPositions || [],
              totalBrandsMentioned: result.totalBrandsMentioned || 0,
              rawResponse: result.rawResponse.slice(0, 5000),
            };

            scanResults.push(scanResult);

            const posLabel = scanResult.brandPosition > 0
              ? `#${scanResult.brandPosition}`
              : "not found";
            const compAbove = scanResult.competitorPositions
              .filter((c) => c.position < scanResult.brandPosition || scanResult.brandPosition === 0)
              .map((c) => c.name)
              .slice(0, 2)
              .join(", ");

            send("brand-scan:query-result", {
              scanId,
              message: `${bq.tier}: ${posLabel}${compAbove ? ` (${compAbove} ranked higher)` : ""}`,
              query: bq.query,
              tier: bq.tier,
              engine: result.engine,
              brandVisible: scanResult.brandVisible,
              brandPosition: scanResult.brandPosition,
              progress: 10 + Math.round((completedQueries / (totalQueries * engines.length)) * 80),
            });
          } catch (err) {
            console.error(
              `[brand-scan] ${engine.name} failed for "${bq.query}":`,
              err
            );
          }

          // Rate limit: 2s between calls
          await new Promise((r) => setTimeout(r, 2000));
        }

        completedQueries++;

        // Update progress in DB periodically
        if (completedQueries % 3 === 0) {
          const brandVisibleCount = scanResults.filter((r) => r.brandVisible).length;
          await pb.collection("brand_scans").update(scanId, {
            completedQueries,
            brandVisibleCount,
            results: JSON.stringify(scanResults),
          });
        }
      }

      // Step 3: Calculate tier scores
      send("brand-scan:progress", {
        scanId,
        message: "Calculating visibility scores...",
        progress: 92,
      });

      const tiers: Array<"hero_sku" | "category" | "purchase_intent" | "competitor"> = [
        "hero_sku",
        "category",
        "purchase_intent",
        "competitor",
      ];

      const tierScores: TierScores = {} as TierScores;
      for (const tier of tiers) {
        const tierResults = scanResults.filter(
          (r) => r.tier === tier && !r.rawResponse.startsWith("[SKIPPED]") && !r.rawResponse.startsWith("[STUB]") && !r.rawResponse.startsWith("[ERROR]")
        );
        const visible = tierResults.filter((r) => r.brandVisible).length;
        const total = tierResults.length;

        // Calculate average position (only for results where brand was found)
        const positions = tierResults.filter((r) => r.brandPosition > 0).map((r) => r.brandPosition);
        const avgPosition = positions.length > 0
          ? Math.round((positions.reduce((a, b) => a + b, 0) / positions.length) * 10) / 10
          : 0;

        // Score based on position, not just binary visible/not
        // Position 1 = 100pts, Position 2 = 80pts, Position 3 = 60pts, 4-5 = 40pts, 6+ = 20pts, not found = 0
        let tierScore = 0;
        if (total > 0) {
          const positionScores: number[] = tierResults.map((r): number => {
            if (r.brandPosition === 0) return 0;
            if (r.brandPosition === 1) return 100;
            if (r.brandPosition === 2) return 80;
            if (r.brandPosition === 3) return 60;
            if (r.brandPosition <= 5) return 40;
            return 20;
          });
          tierScore = Math.round(positionScores.reduce((a: number, b: number) => a + b, 0) / total);
        }

        tierScores[tier] = {
          total,
          visible,
          score: tierScore,
          avgPosition,
        };
      }

      // Overall score (weighted)
      const weights = {
        hero_sku: 0.25,
        category: 0.25,
        purchase_intent: 0.25,
        competitor: 0.25,
      };

      let visibilityScore = 0;
      for (const tier of tiers) {
        visibilityScore += tierScores[tier].score * weights[tier];
      }
      visibilityScore = Math.round(visibilityScore);

      const brandVisibleCount = scanResults.filter((r) => r.brandVisible).length;

      await pb.collection("brand_scans").update(scanId, {
        status: "COMPLETE",
        completedQueries: totalQueries,
        brandVisibleCount,
        visibilityScore,
        results: JSON.stringify(scanResults),
        tierScores: JSON.stringify(tierScores),
        completedAt: new Date().toISOString(),
      });

      send("brand-scan:complete", {
        scanId,
        message: `Brand scan complete! Visibility Score: ${visibilityScore}/100`,
        progress: 100,
        visibilityScore,
        tierScores,
        totalResults: scanResults.length,
        brandVisibleCount,
      });
    } catch (err) {
      console.error("[brand-scan] Pipeline error:", err);
      try {
        await pb
          .collection("brand_scans")
          .update(scanId, { status: "FAILED" });
      } catch {
        // ignore
      }
      send("brand-scan:error", {
        scanId,
        message: `Brand scan failed: ${err instanceof Error ? err.message : "Unknown error"}`,
        progress: 0,
      });
    } finally {
      close();
    }
  })();

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
