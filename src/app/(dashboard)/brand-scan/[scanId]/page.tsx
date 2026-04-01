import { createServerClient } from "@/lib/pocketbase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Trophy, Target, TrendingDown, Eye, EyeOff, ChevronDown } from "lucide-react";
import type { BrandScanResult, CompetitorPosition } from "@/types/brand-scan";

export const dynamic = "force-dynamic";

// Position to score
function positionScore(pos: number): number {
  if (pos === 0) return 0;
  if (pos === 1) return 100;
  if (pos === 2) return 80;
  if (pos === 3) return 60;
  if (pos <= 5) return 40;
  return 20;
}

function positionLabel(pos: number): string {
  if (pos === 0) return "Not found";
  if (pos === 1) return "#1";
  if (pos === 2) return "#2";
  if (pos === 3) return "#3";
  return `#${pos}`;
}

function positionColor(pos: number): string {
  if (pos === 0) return "text-error";
  if (pos === 1) return "text-success";
  if (pos === 2) return "text-green-400";
  if (pos === 3) return "text-yellow-400";
  return "text-warning";
}

export default async function BrandScanDetailPage({
  params,
}: {
  params: Promise<{ scanId: string }>;
}) {
  const { scanId } = await params;
  const pb = await createServerClient();

  if (!pb.authStore.isValid || !pb.authStore.record) {
    redirect("/login");
  }

  const userId = pb.authStore.record.id;
  const brandName = pb.authStore.record.brandName || "Your Brand";

  let scan;
  try {
    scan = await pb.collection("brand_scans").getOne(scanId);
    if (scan.user !== userId) redirect("/dashboard");
  } catch {
    redirect("/dashboard");
  }

  const results: BrandScanResult[] = scan.results ? JSON.parse(scan.results as string) : [];
  const tierScores = scan.tierScores ? JSON.parse(scan.tierScores as string) : {};

  // Aggregate competitor data across all results
  const competitorStats: Record<string, { appearances: number; avgPosition: number; positions: number[]; winsOverBrand: number }> = {};

  for (const r of results) {
    if (!r.competitorPositions) continue;
    for (const cp of r.competitorPositions) {
      if (!competitorStats[cp.domain]) {
        competitorStats[cp.domain] = { appearances: 0, avgPosition: 0, positions: [], winsOverBrand: 0 };
      }
      competitorStats[cp.domain].appearances++;
      competitorStats[cp.domain].positions.push(cp.position);
      if (r.brandPosition === 0 || cp.position < r.brandPosition) {
        competitorStats[cp.domain].winsOverBrand++;
      }
    }
  }

  // Calculate averages
  for (const domain of Object.keys(competitorStats)) {
    const positions = competitorStats[domain].positions;
    competitorStats[domain].avgPosition = Math.round((positions.reduce((a, b) => a + b, 0) / positions.length) * 10) / 10;
  }

  // Sort competitors by appearances (most frequent first)
  const sortedCompetitors = Object.entries(competitorStats)
    .sort(([, a], [, b]) => b.appearances - a.appearances);

  const totalQueries = results.filter((r) => !r.rawResponse.startsWith("[ERROR]") && !r.rawResponse.startsWith("[SKIPPED]")).length;
  const brandAppearances = results.filter((r) => r.brandVisible).length;
  const brandAvgPosition = results.filter((r) => r.brandPosition > 0).length > 0
    ? Math.round((results.filter((r) => r.brandPosition > 0).reduce((a, r) => a + r.brandPosition, 0) / results.filter((r) => r.brandPosition > 0).length) * 10) / 10
    : 0;

  const TIER_LABELS: Record<string, string> = {
    awareness: "Brand Awareness",
    category: "Category Discovery",
    intent: "Purchase Intent",
    competitor: "Competitive",
    thought_leadership: "Thought Leadership",
  };

  return (
    <div className="max-w-6xl space-y-8">
      {/* Back link */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 text-sm text-text-tertiary hover:text-text-primary transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            Brand Scan Results
          </h1>
          <p className="text-text-tertiary">
            {brandName} &bull; Scanned {new Date(scan.completedAt || scan.created).toLocaleDateString()} &bull; {totalQueries} queries
          </p>
        </div>
        <div className="text-center">
          <div className={`text-5xl font-bold ${scan.visibilityScore >= 50 ? "text-success" : scan.visibilityScore >= 25 ? "text-warning" : "text-error"}`}>
            {scan.visibilityScore}
          </div>
          <p className="text-xs text-text-tertiary mt-1">Visibility Score</p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-bg-secondary border border-border rounded-lg p-5">
          <div className="flex items-center gap-2 mb-2">
            <Eye className="w-5 h-5 text-success" />
            <span className="text-sm text-text-tertiary">Found In</span>
          </div>
          <p className="text-3xl font-bold text-text-primary">
            {brandAppearances}<span className="text-lg text-text-tertiary">/{totalQueries}</span>
          </p>
          <p className="text-xs text-text-tertiary mt-1">queries mentioned your brand</p>
        </div>

        <div className="bg-bg-secondary border border-border rounded-lg p-5">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-5 h-5 text-warning" />
            <span className="text-sm text-text-tertiary">Avg Position</span>
          </div>
          <p className="text-3xl font-bold text-text-primary">
            {brandAvgPosition > 0 ? `#${brandAvgPosition}` : "—"}
          </p>
          <p className="text-xs text-text-tertiary mt-1">when mentioned</p>
        </div>

        <div className="bg-bg-secondary border border-border rounded-lg p-5">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-5 h-5 text-accent-primary" />
            <span className="text-sm text-text-tertiary">Competitors Tracked</span>
          </div>
          <p className="text-3xl font-bold text-text-primary">{sortedCompetitors.length}</p>
          <p className="text-xs text-text-tertiary mt-1">appeared in results</p>
        </div>

        <div className="bg-bg-secondary border border-border rounded-lg p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-5 h-5 text-error" />
            <span className="text-sm text-text-tertiary">Lost To Competitors</span>
          </div>
          <p className="text-3xl font-bold text-text-primary">
            {results.filter((r) => !r.brandVisible && r.competitorPositions && r.competitorPositions.length > 0).length}
          </p>
          <p className="text-xs text-text-tertiary mt-1">queries where competitors ranked but you didn&apos;t</p>
        </div>
      </div>

      {/* Competitor Leaderboard */}
      {sortedCompetitors.length > 0 && (
        <div className="bg-bg-secondary border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Competitor Leaderboard</h2>
          <div className="space-y-3">
            {/* Your brand first */}
            <div className="flex items-center justify-between px-4 py-3 bg-accent-primary/10 border border-accent-primary/20 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-accent-primary bg-accent-primary/20 px-2 py-1 rounded">YOU</span>
                <span className="text-sm font-medium text-text-primary">{brandName}</span>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <span className="text-text-tertiary">Appeared in <span className="text-text-primary font-semibold">{brandAppearances}/{totalQueries}</span></span>
                <span className="text-text-tertiary">Avg pos: <span className="text-text-primary font-semibold">{brandAvgPosition > 0 ? `#${brandAvgPosition}` : "—"}</span></span>
              </div>
            </div>

            {/* Competitors */}
            {sortedCompetitors.map(([domain, stats]) => (
              <div key={domain} className="flex items-center justify-between px-4 py-3 bg-bg-tertiary/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-text-tertiary bg-bg-tertiary px-2 py-1 rounded">{domain.split(".")[0]}</span>
                  <span className="text-sm text-text-primary">{domain}</span>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <span className="text-text-tertiary">Appeared in <span className="text-text-primary font-semibold">{stats.appearances}/{totalQueries}</span></span>
                  <span className="text-text-tertiary">Avg pos: <span className="text-text-primary font-semibold">#{stats.avgPosition}</span></span>
                  <span className="text-error text-xs">{stats.winsOverBrand}x ranked above you</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Score Methodology */}
      <div className="bg-bg-tertiary/30 border border-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-text-secondary mb-2">How the Visibility Score Works</h3>
        <p className="text-xs text-text-tertiary leading-relaxed">
          Each query is scored based on where your brand appears in the AI response:
          <span className="text-success font-medium"> #1 = 100pts</span>,
          <span className="text-green-400 font-medium"> #2 = 80pts</span>,
          <span className="text-yellow-400 font-medium"> #3 = 60pts</span>,
          <span className="text-warning font-medium"> #4-5 = 40pts</span>,
          <span className="text-text-tertiary font-medium"> #6+ = 20pts</span>,
          <span className="text-error font-medium"> Not found = 0pts</span>.
          Category scores are averaged, then weighted: Category Discovery (30%), Purchase Intent (25%),
          Brand Awareness (15%), Competitive (15%), Thought Leadership (15%).
        </p>
      </div>

      {/* Tier Breakdown */}
      <div className="bg-bg-secondary border border-border rounded-xl p-6">
        <h2 className="text-lg font-semibold text-text-primary mb-4">Score by Category</h2>
        <div className="space-y-4">
          {Object.entries(tierScores).map(([tier, rawScores]) => {
            const scores = rawScores as { total: number; visible: number; score: number; avgPosition?: number };
            return (
            <div key={tier} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-secondary">{TIER_LABELS[tier] || tier}</span>
                <div className="flex items-center gap-3">
                  {scores.avgPosition ? (
                    <span className="text-xs text-text-tertiary">avg position #{scores.avgPosition}</span>
                  ) : null}
                  <span className={`font-bold ${scores.score >= 60 ? "text-success" : scores.score >= 30 ? "text-warning" : "text-error"}`}>
                    {scores.score}/100
                  </span>
                </div>
              </div>
              <div className="w-full bg-bg-tertiary rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${scores.score >= 60 ? "bg-success" : scores.score >= 30 ? "bg-warning" : "bg-error"}`}
                  style={{ width: `${scores.score}%` }}
                />
              </div>
              <p className="text-xs text-text-tertiary">
                {scores.visible}/{scores.total} queries &bull; {scores.score >= 60 ? "Strong" : scores.score >= 30 ? "Needs work" : "Weak"}
              </p>
            </div>
          );
          })}
        </div>
      </div>

      {/* Per-Query Results */}
      <div className="bg-bg-secondary border border-border rounded-xl p-6">
        <h2 className="text-lg font-semibold text-text-primary mb-4">Query-Level Results</h2>
        <div className="space-y-2">
          {results.filter((r) => !r.rawResponse.startsWith("[ERROR]") && !r.rawResponse.startsWith("[SKIPPED]")).map((result, i) => (
            <details key={i} className="group bg-bg-tertiary/30 rounded-lg overflow-hidden">
              <summary className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-bg-tertiary/50 transition-colors">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {result.brandVisible ? (
                    <Eye className="w-4 h-4 text-success flex-shrink-0" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-error flex-shrink-0" />
                  )}
                  <span className="text-sm text-text-primary truncate">&ldquo;{result.query}&rdquo;</span>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                  <span className="text-xs px-2 py-0.5 rounded bg-bg-tertiary text-text-tertiary">{result.tier}</span>
                  <span className={`text-sm font-bold ${positionColor(result.brandPosition || 0)}`}>
                    {positionLabel(result.brandPosition || 0)}
                  </span>
                  <ChevronDown className="w-4 h-4 text-text-tertiary group-open:rotate-180 transition-transform" />
                </div>
              </summary>
              <div className="px-4 pb-4 space-y-3">
                {/* Competitor positions for this query */}
                {result.competitorPositions && result.competitorPositions.length > 0 && (
                  <div>
                    <p className="text-xs text-text-tertiary uppercase tracking-wider mb-2">Rankings in this response</p>
                    <div className="flex flex-wrap gap-2">
                      {result.brandPosition > 0 && (
                        <span className="text-xs px-2 py-1 rounded-full bg-accent-primary/10 text-accent-primary border border-accent-primary/20">
                          #{result.brandPosition} {brandName}
                        </span>
                      )}
                      {result.competitorPositions.map((cp, j) => (
                        <span key={j} className="text-xs px-2 py-1 rounded-full bg-bg-tertiary text-text-secondary">
                          #{cp.position} {cp.name}
                        </span>
                      ))}
                      {result.brandPosition === 0 && (
                        <span className="text-xs px-2 py-1 rounded-full bg-error/10 text-error border border-error/20">
                          {brandName} not mentioned
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Raw response preview */}
                <div>
                  <p className="text-xs text-text-tertiary uppercase tracking-wider mb-1">AI Response</p>
                  <p className="text-xs text-text-secondary whitespace-pre-wrap line-clamp-6">
                    {result.rawResponse.slice(0, 500)}
                    {result.rawResponse.length > 500 ? "..." : ""}
                  </p>
                </div>
              </div>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}
