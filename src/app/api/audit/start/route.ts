import { NextRequest } from "next/server";
import PocketBase from "pocketbase";
import { generateQueries } from "@/lib/ai/query-gen";
import { scanClaude } from "@/lib/scanners/claude";
import { generateDiagnosis } from "@/lib/ai/diagnose";
import { extractCitations } from "@/lib/ai/citation-extractor";
import { analyzeSentiment } from "@/lib/ai/sentiment-analyzer";
import type { SkuRecord, CompetitorRecord } from "@/types/pocketbase";

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
  const brandDomain = pb.authStore.record.domain || "";

  // Fetch SKUs and competitors
  let skus: SkuRecord[];
  let competitors: CompetitorRecord[];
  try {
    [skus, competitors] = await Promise.all([
      pb.collection("skus").getFullList<SkuRecord>({
        filter: `user="${userId}"`,
      }),
      pb.collection("competitors").getFullList<CompetitorRecord>({
        filter: `user="${userId}"`,
      }),
    ]);
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

  const competitorDomains = competitors.map((c) => c.domain);

  // Create audit record
  let auditId: string;
  try {
    const audit = await pb.collection("audits").create({
      user: userId,
      status: "PENDING",
    });
    auditId = audit.id;
  } catch {
    return new Response(
      JSON.stringify({ error: "Failed to create audit" }),
      { status: 500 }
    );
  }

  // Set up SSE
  const { stream, send, close } = createSSEStream();

  // Run the audit pipeline in the background
  (async () => {
    try {
      await pb
        .collection("audits")
        .update(auditId, { status: "SCANNING" });

      send("audit:started", {
        auditId,
        message: `Audit started for ${skus.length} SKUs`,
        progress: 0,
      });

      const totalSteps = skus.length * 7; // query gen + 5 queries scanned + diagnosis per SKU
      let completedSteps = 0;

      const allScanResults: Array<{
        skuId: string;
        skuName: string;
        skuDescription: string;
        engine: string;
        query: string;
        brandVisible: boolean;
        competitorDomain: string;
        rawResponse: string;
      }> = [];

      for (const sku of skus) {
        // Step 1: Generate queries
        send("audit:query-gen", {
          auditId,
          message: `Generating search queries for "${sku.name}"...`,
          skuName: sku.name,
          progress: Math.round((completedSteps / totalSteps) * 100),
        });

        let queries: string[];
        try {
          queries = await generateQueries({
            name: sku.name,
            category: sku.category || "",
            description: sku.description || "",
          });
        } catch (err) {
          console.error(`[audit] Query gen failed for ${sku.name}:`, err);
          // Smart fallback — product-type queries without brand name
          const cat = (sku.category || "product").toLowerCase();
          queries = [
            `best ${cat} under 5000 India`,
            `${cat} with good quality for daily use`,
            `affordable ${cat} recommendation 2026`,
            `which ${cat} to buy on a budget`,
            `${cat} that lasts long and worth the money`,
          ];
        }

        completedSteps++;

        send("audit:scanning", {
          auditId,
          message: `Scanning ${queries.length} queries for "${sku.name}"...`,
          skuName: sku.name,
          progress: Math.round((completedSteps / totalSteps) * 100),
        });

        // Step 2: Scan ALL queries for this SKU (not just the first one)
        for (const query of queries) {
          try {
            const result = await scanClaude({
              query,
              brandDomain,
              competitorDomains,
            });

            const isSkipped = result.rawResponse.startsWith("[SKIPPED]") ||
              result.rawResponse.startsWith("[STUB]") ||
              result.rawResponse.startsWith("[ERROR]");

            // Store scan result — skip expensive enrichment for now, just store core data
            await pb.collection("scan_results").create({
              sku: sku.id,
              engine: result.engine,
              query: result.query,
              brandVisible: result.brandVisible,
              competitorDomain: result.competitorDomain,
              rawResponse: result.rawResponse.slice(0, 10000),
              sentimentLabel: "NEUTRAL",
              sentimentScore: 0,
              sentimentReasoning: "",
              citations: "[]",
              citationCount: 0,
              brandCited: result.brandVisible,
              brandPosition: result.brandPosition || 0,
            });

            allScanResults.push({
              skuId: sku.id,
              skuName: sku.name,
              skuDescription: sku.description || "",
              engine: result.engine,
              query: result.query,
              brandVisible: result.brandVisible,
              competitorDomain: result.competitorDomain,
              rawResponse: result.rawResponse,
            });

            const posLabel = result.brandPosition > 0 ? `#${result.brandPosition}` : "not found";

            send("audit:scan-result", {
              auditId,
              message: `"${query.slice(0, 50)}..." → ${posLabel}`,
              skuName: sku.name,
              engine: result.engine,
              progress: Math.round((completedSteps / totalSteps) * 100),
            });
          } catch (err) {
            console.error(`[audit] Scan failed for "${query}":`, err);
          }

          // Rate limit: 2s between queries
          await new Promise((r) => setTimeout(r, 2000));
        }

        completedSteps++;
      }

      // Step 3: Generate diagnoses for non-visible SKUs
      await pb
        .collection("audits")
        .update(auditId, { status: "ANALYZING" });

      const invisibleResults = allScanResults.filter((r) => !r.brandVisible);

      send("audit:diagnosing", {
        auditId,
        message: `Analyzing ${invisibleResults.length} visibility gaps...`,
        progress: 75,
      });

      let diagnosisCount = 0;
      for (const result of invisibleResults) {
        try {
          const diagnosis = await generateDiagnosis({
            query: result.query,
            engine: result.engine,
            brandDomain,
            brandProductName: result.skuName,
            brandProductDescription: result.skuDescription,
            competitorDomain: result.competitorDomain,
            rawResponse: result.rawResponse,
          });

          await pb.collection("diagnoses").create({
            audit: auditId,
            sku: result.skuId,
            engine: result.engine,
            severity: diagnosis.severity,
            reason: diagnosis.reason,
            fix: diagnosis.fix,
            competitorData: { missingElements: diagnosis.missingElements },
          });

          diagnosisCount++;

          send("audit:diagnosis-result", {
            auditId,
            message: `Diagnosed: ${result.skuName} on ${result.engine}`,
            skuName: result.skuName,
            engine: result.engine,
            severity: diagnosis.severity,
            progress: 75 + Math.round((diagnosisCount / invisibleResults.length) * 20),
          });
        } catch (err) {
          console.error(
            `[audit] Diagnosis failed for ${result.skuName}/${result.engine}:`,
            err
          );
        }

        // Rate limit
        await new Promise((r) => setTimeout(r, 1000));
      }

      // Step 4: Calculate Agent-Readiness Score
      send("audit:scoring", {
        auditId,
        message: "Calculating Agent-Readiness Score...",
        progress: 95,
      });

      const totalScans = allScanResults.length;
      const visibleScans = allScanResults.filter((r) => r.brandVisible).length;
      const agentScore =
        totalScans > 0 ? Math.round((visibleScans / totalScans) * 100) : 0;

      await pb.collection("audits").update(auditId, {
        status: "COMPLETE",
        agentScore,
        completedAt: new Date().toISOString(),
      });

      send("audit:complete", {
        auditId,
        message: `Audit complete! Agent-Readiness Score: ${agentScore}/100`,
        progress: 100,
      });
    } catch (err) {
      console.error("[audit] Pipeline error:", err);
      try {
        await pb
          .collection("audits")
          .update(auditId, { status: "FAILED" });
      } catch {
        // ignore
      }
      send("audit:error", {
        auditId,
        message: `Audit failed: ${err instanceof Error ? err.message : "Unknown error"}`,
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
