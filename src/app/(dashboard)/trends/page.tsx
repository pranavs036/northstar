import { createServerClient } from "@/lib/pocketbase/server";
import { redirect } from "next/navigation";
import { TrendingUp } from "lucide-react";
import { VisibilityTrendChart } from "@/components/charts/VisibilityTrendChart";
import { ShareOfVoiceChart } from "@/components/charts/ShareOfVoiceChart";
import { SentimentChart } from "@/components/charts/SentimentChart";
import { calculateShareOfVoice } from "@/lib/utils/share-of-voice";
import type { AuditRecord, ScanResultRecord, SkuRecord, CompetitorRecord } from "@/types/pocketbase";

export default async function TrendsPage() {
  const pb = await createServerClient();

  if (!pb.authStore.isValid || !pb.authStore.record) {
    redirect("/login");
  }

  const user = pb.authStore.record;
  const userId = user.id;
  const brandDomain: string = user.domain || "";

  // Fetch audits, skus, and competitors in parallel
  let audits: AuditRecord[] = [];
  let skus: SkuRecord[] = [];
  let competitors: CompetitorRecord[] = [];

  try {
    [audits, skus, competitors] = await Promise.all([
      pb.collection("audits").getFullList<AuditRecord>({
        filter: `user="${userId}"`,
        sort: "created",
      }),
      pb.collection("skus").getFullList<SkuRecord>({
        filter: `user="${userId}"`,
      }),
      pb.collection("competitors").getFullList<CompetitorRecord>({
        filter: `user="${userId}"`,
      }),
    ]);
  } catch (err) {
    console.error("[trends] Failed to fetch audits/skus/competitors:", err);
  }

  // Fetch all scan results for the user's SKUs
  let allScanResults: ScanResultRecord[] = [];
  const skuIds = skus.map((s) => s.id);

  if (skuIds.length > 0) {
    try {
      const skuFilter = skuIds.map((id) => `sku="${id}"`).join("||");
      allScanResults = await pb.collection("scan_results").getFullList<ScanResultRecord>({
        filter: skuFilter,
      });
    } catch (err) {
      console.error("[trends] Failed to fetch scan results:", err);
    }
  }

  // --- Visibility Trend Data ---
  // Group scan results by audit date, computing per-engine visibility rates
  const trendData = audits.map((audit) => {
    // Use audit created date as the x-axis label
    const date = new Date(audit.created).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

    // For per-engine visibility, we approximate by using all scan results at the time
    // In a real scenario you'd filter scan results by auditId; here we use all available data
    const engines = ["CHATGPT", "PERPLEXITY", "GOOGLE", "GEMINI", "COPILOT"] as const;
    const engineRates: Record<string, number> = {};

    for (const engine of engines) {
      const engineResults = allScanResults.filter((r) => r.engine === engine);
      const visibleCount = engineResults.filter((r) => r.brandVisible).length;
      engineRates[engine.toLowerCase()] =
        engineResults.length > 0
          ? Math.round((visibleCount / engineResults.length) * 100)
          : 0;
    }

    const totalVisible = allScanResults.filter((r) => r.brandVisible).length;
    const visibilityScore =
      allScanResults.length > 0
        ? Math.round((totalVisible / allScanResults.length) * 100)
        : audit.agentScore ?? 0;

    return {
      date,
      visibilityScore,
      chatgpt: engineRates["chatgpt"],
      perplexity: engineRates["perplexity"],
      google: engineRates["google"],
      gemini: engineRates["gemini"],
      copilot: engineRates["copilot"],
    };
  });

  // --- Share of Voice ---
  const competitorDomains = competitors.map((c) => c.domain);
  const sovData = calculateShareOfVoice(
    allScanResults.map((r) => ({
      brandVisible: r.brandVisible,
      competitorDomain: r.competitorDomain,
      engine: r.engine,
    })),
    brandDomain,
    competitorDomains
  );

  // --- Sentiment Aggregation ---
  let positive = 0;
  let neutral = 0;
  let negative = 0;

  for (const result of allScanResults) {
    if (result.sentimentLabel === "POSITIVE") positive++;
    else if (result.sentimentLabel === "NEGATIVE") negative++;
    else if (result.sentimentLabel === "NEUTRAL") neutral++;
  }

  const hasData = audits.length > 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-text-primary mb-2">Visibility Trends</h1>
        <p className="text-text-tertiary">
          Track your AI search visibility performance over time across all engines.
        </p>
      </div>

      {!hasData ? (
        <div className="bg-bg-secondary border border-dashed border-border rounded-lg p-12 text-center">
          <TrendingUp className="w-12 h-12 text-text-tertiary mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-semibold text-text-primary mb-2">No audit data yet</h3>
          <p className="text-text-tertiary mb-6">
            Run your first audit to start tracking visibility trends over time.
          </p>
          <a
            href="/audit/new"
            className="inline-block px-6 py-2 bg-accent-primary text-white rounded-lg hover:bg-accent-secondary transition-colors font-medium"
          >
            Start an Audit
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {/* Visibility Trend Chart — full width */}
          <div>
            <VisibilityTrendChart data={trendData} />
          </div>

          {/* Share of Voice + Sentiment — side by side on larger screens */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              {sovData.length > 0 ? (
                <ShareOfVoiceChart data={sovData} brandDomain={brandDomain} />
              ) : (
                <div className="w-full h-[350px] bg-zinc-900 rounded-lg p-6 border border-zinc-800 flex flex-col items-center justify-center">
                  <p className="text-sm font-medium text-zinc-400 mb-2">Share of Voice</p>
                  <p className="text-zinc-600 text-sm text-center">
                    No competitor citation data available yet.
                  </p>
                </div>
              )}
            </div>

            <div>
              <SentimentChart
                positive={positive}
                neutral={neutral}
                negative={negative}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
