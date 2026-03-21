import { NextRequest } from "next/server";
import PocketBase from "pocketbase";
import { crawlProductSchema } from "@/lib/crawlers/schema-crawler";
import { generateSchemaFix } from "@/lib/ai/schema-fix-generator";
import type { SkuRecord } from "@/types/pocketbase";

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
  // Auth
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

  // Fetch SKUs
  let skus: SkuRecord[];
  try {
    skus = await pb.collection("skus").getFullList<SkuRecord>({
      filter: `user="${userId}"`,
    });
  } catch {
    return new Response(
      JSON.stringify({ error: "Failed to fetch catalog data" }),
      { status: 500 }
    );
  }

  if (skus.length === 0) {
    return new Response(
      JSON.stringify({ error: "No SKUs in catalog. Upload products first." }),
      { status: 400 }
    );
  }

  // Only audit SKUs that have a URL
  const skusWithUrl = skus.filter((s) => s.url && s.url.trim() !== "");

  if (skusWithUrl.length === 0) {
    return new Response(
      JSON.stringify({ error: "No SKUs have product URLs. Add URLs to your catalog first." }),
      { status: 400 }
    );
  }

  // Set up SSE
  const { stream, send, close } = createSSEStream();

  // Run the schema audit pipeline in the background
  (async () => {
    try {
      send("schema:started", {
        message: `Schema audit started for ${skusWithUrl.length} SKUs with URLs`,
        total: skusWithUrl.length,
        progress: 0,
      });

      const results: Array<{
        skuId: string;
        skuName: string;
        url: string;
        score: number;
        missingRequired: string[];
        missingOptional: string[];
        fixedJsonLd: string;
        changes: string[];
      }> = [];

      for (let i = 0; i < skusWithUrl.length; i++) {
        const sku = skusWithUrl[i];
        const progressBase = Math.round((i / skusWithUrl.length) * 80);

        send("schema:crawling", {
          message: `Crawling schema for "${sku.name}"...`,
          skuName: sku.name,
          url: sku.url,
          progress: progressBase,
        });

        let crawlResult;
        try {
          crawlResult = await crawlProductSchema({ url: sku.url, skuId: sku.id });
        } catch (err) {
          console.error(`[schema-audit] Crawl failed for ${sku.name}:`, err);
          send("schema:crawling", {
            message: `Failed to crawl "${sku.name}" — skipping`,
            skuName: sku.name,
            url: sku.url,
            progress: progressBase,
          });
          continue;
        }

        send("schema:crawling", {
          message: `"${sku.name}" scored ${crawlResult.completenessScore}/100 completeness`,
          skuName: sku.name,
          url: sku.url,
          score: crawlResult.completenessScore,
          progress: progressBase + Math.round(40 / skusWithUrl.length),
        });

        let fixedJsonLd = "";
        let changes: string[] = [];

        if (crawlResult.completenessScore < 60) {
          send("schema:fixing", {
            message: `Generating schema fix for "${sku.name}" (score: ${crawlResult.completenessScore})...`,
            skuName: sku.name,
            progress: progressBase + Math.round(60 / skusWithUrl.length),
          });

          try {
            const fix = await generateSchemaFix(
              crawlResult,
              sku.name,
              sku.description || "",
              sku.category || ""
            );
            fixedJsonLd = fix.fixedJsonLd;
            changes = fix.changes;
          } catch (err) {
            console.error(`[schema-audit] Fix gen failed for ${sku.name}:`, err);
          }
        }

        results.push({
          skuId: sku.id,
          skuName: sku.name,
          url: sku.url,
          score: crawlResult.completenessScore,
          missingRequired: crawlResult.missingRequired,
          missingOptional: crawlResult.missingOptional,
          fixedJsonLd,
          changes,
        });
      }

      // Calculate average completeness score
      const avgScore =
        results.length > 0
          ? Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length)
          : 0;

      const skusWithFixes = results.filter((r) => r.fixedJsonLd !== "").length;

      send("schema:complete", {
        message: `Schema audit complete! Average completeness: ${avgScore}/100`,
        progress: 100,
        averageScore: avgScore,
        totalAudited: results.length,
        skusWithFixes,
        results,
      });
    } catch (err) {
      console.error("[schema-audit] Pipeline error:", err);
      send("schema:error", {
        message: `Schema audit failed: ${err instanceof Error ? err.message : "Unknown error"}`,
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
