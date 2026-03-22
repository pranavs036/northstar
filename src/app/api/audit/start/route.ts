import { NextRequest } from "next/server";
import PocketBase from "pocketbase";
import { generateQueries } from "@/lib/ai/query-gen";
import { scanChatGPT } from "@/lib/scanners/chatgpt";
import { scanPerplexity } from "@/lib/scanners/perplexity";
import { scanGoogle } from "@/lib/scanners/google";
import { scanGemini } from "@/lib/scanners/gemini";
import { scanCopilot } from "@/lib/scanners/copilot";
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

      const totalSteps = skus.length * 6; // queries + 5 engines per SKU
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
          queries = [
            `best ${sku.category || "product"} like ${sku.name}`,
            `${sku.name} review`,
            `recommended ${sku.category || "products"} 2025`,
          ];
        }

        completedSteps++;

        // Step 2: Scan each engine with first query (to keep audit fast)
        const primaryQuery = queries[0];
        const scanInput = {
          query: primaryQuery,
          brandDomain,
          competitorDomains,
        };

        send("audit:scanning", {
          auditId,
          message: `Scanning AI engines for "${sku.name}"...`,
          skuName: sku.name,
          progress: Math.round((completedSteps / totalSteps) * 100),
        });

        // Run scanners with delays to respect rate limits
        const scanners = [
          { fn: scanChatGPT, name: "ChatGPT" },
          { fn: scanPerplexity, name: "Perplexity" },
          { fn: scanGoogle, name: "Google" },
          { fn: scanGemini, name: "Gemini" },
          { fn: scanCopilot, name: "Copilot" },
        ];

        for (const scanner of scanners) {
          try {
            const result = await scanner.fn(scanInput);

            // Skip enrichment for stub/skipped responses
            const isSkipped = result.rawResponse.startsWith("[SKIPPED]") ||
              result.rawResponse.startsWith("[STUB]") ||
              result.rawResponse.startsWith("[ERROR]");

            let sentimentLabel = "NEUTRAL";
            let sentimentScore = 0;
            let sentimentReasoning = "Skipped — no real response";
            let citationsJson = "[]";
            let citationCount = 0;
            let brandCited = false;

            if (!isSkipped && result.rawResponse.length > 50) {
              send("audit:enriching", {
                message: `Analyzing citations & sentiment for ${sku.name} on ${result.engine}`,
                skuName: sku.name,
                engine: result.engine,
              });

              try {
                const [citationAnalysis, sentimentResult] = await Promise.all([
                  extractCitations(result.rawResponse, brandDomain, competitorDomains),
                  analyzeSentiment(result.rawResponse, brandDomain, sku.name),
                ]);
                sentimentLabel = sentimentResult.label;
                sentimentScore = sentimentResult.score;
                sentimentReasoning = sentimentResult.reasoning;
                citationsJson = JSON.stringify(citationAnalysis.citations);
                citationCount = citationAnalysis.totalCitations;
                brandCited = citationAnalysis.brandCitations > 0;
              } catch (enrichErr) {
                console.error(`[audit] Enrichment failed for ${sku.name}/${result.engine}:`, enrichErr);
              }
            }

            // Store scan result in PocketBase
            await pb.collection("scan_results").create({
              sku: sku.id,
              engine: result.engine,
              query: result.query,
              brandVisible: result.brandVisible,
              competitorDomain: result.competitorDomain,
              rawResponse: result.rawResponse.slice(0, 10000),
              sentimentLabel,
              sentimentScore,
              sentimentReasoning,
              citations: citationsJson,
              citationCount,
              brandCited,
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

            send("audit:scan-result", {
              auditId,
              message: `${scanner.name}: ${result.brandVisible ? "✓ Brand visible" : "✗ Brand NOT visible"}`,
              skuName: sku.name,
              engine: result.engine,
              progress: Math.round((completedSteps / totalSteps) * 100),
            });
          } catch (err) {
            console.error(
              `[audit] ${scanner.name} scan failed for ${sku.name}:`,
              err
            );
          }

          completedSteps++;

          // Rate limit: 2s delay between engine calls
          await new Promise((r) => setTimeout(r, 2000));
        }
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
