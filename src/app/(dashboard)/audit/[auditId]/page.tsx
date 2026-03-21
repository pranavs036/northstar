import { createServerClient } from "@/lib/pocketbase/server";
import { redirect } from "next/navigation";
import { Zap, Search, AlertTriangle, CheckCircle2, ArrowLeft, Download, EyeOff } from "lucide-react";
import Link from "next/link";
import { DiagnosisCard } from "@/components/audit/DiagnosisCard";
import { EngineComparisonChart } from "@/components/charts/EngineComparisonChart";
import type { AuditRecord, DiagnosisRecord, ScanResultRecord, SkuRecord } from "@/types/pocketbase";

export default async function AuditResultsPage({
  params,
}: {
  params: Promise<{ auditId: string }>;
}) {
  const { auditId } = await params;
  const pb = await createServerClient();

  if (!pb.authStore.isValid || !pb.authStore.record) {
    redirect("/login");
  }

  const userId = pb.authStore.record.id;

  let audit: AuditRecord;
  try {
    audit = await pb.collection("audits").getOne<AuditRecord>(auditId);
    if (audit.user !== userId) {
      redirect("/audit");
    }
  } catch {
    redirect("/audit");
  }

  const [diagnoses, scanResults, skus] = await Promise.all([
    pb.collection("diagnoses").getFullList<DiagnosisRecord>({
      filter: `audit="${auditId}"`,
      sort: "-created",
    }),
    pb.collection("scan_results").getFullList<ScanResultRecord>(),
    pb.collection("skus").getFullList<SkuRecord>({
      filter: `user="${userId}"`,
    }),
  ]);

  const skuMap = new Map(skus.map((s) => [s.id, s]));

  // Compute stats
  const totalScans = scanResults.filter((r) =>
    skus.some((s) => s.id === r.sku)
  ).length;
  const visibleScans = scanResults.filter(
    (r) => r.brandVisible && skus.some((s) => s.id === r.sku)
  ).length;

  const criticalCount = diagnoses.filter((d) => d.severity === "CRITICAL").length;
  const highCount = diagnoses.filter((d) => d.severity === "HIGH").length;
  const mediumCount = diagnoses.filter((d) => d.severity === "MEDIUM").length;
  const lowCount = diagnoses.filter((d) => d.severity === "LOW").length;

  const scoreColor =
    (audit.agentScore ?? 0) >= 75
      ? "text-success"
      : (audit.agentScore ?? 0) >= 50
        ? "text-warning"
        : "text-error";

  const engineChartData = (["CHATGPT", "PERPLEXITY", "GOOGLE"] as const).map((engine) => {
    const engineLabel =
      engine === "CHATGPT" ? "ChatGPT" : engine === "PERPLEXITY" ? "Perplexity" : "Google AI";
    const engineScans = scanResults.filter(
      (r) => r.engine === engine && skus.some((s) => s.id === r.sku)
    );
    const visible = engineScans.filter((r) => r.brandVisible).length;
    const total = engineScans.length;
    return {
      engine: engineLabel,
      visibilityRate: total > 0 ? Math.round((visible / total) * 100) : 0,
    };
  });

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/audit"
          className="inline-flex items-center gap-1 text-sm text-text-tertiary hover:text-text-primary transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          All Audits
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-text-primary mb-2">
              Audit Results
            </h1>
            <p className="text-text-tertiary">
              Completed {new Date(audit.created).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
          <div className="flex gap-2 shrink-0 mt-1">
            <a
              href={`/api/export?type=csv&scope=diagnoses&auditId=${auditId}`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-text-secondary text-sm font-medium hover:border-accent-primary/50 hover:text-text-primary transition-colors"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </a>
            <a
              href={`/api/export?type=json&scope=diagnoses&auditId=${auditId}`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-text-secondary text-sm font-medium hover:border-accent-primary/50 hover:text-text-primary transition-colors"
            >
              <Download className="w-4 h-4" />
              Export JSON
            </a>
            <a
              href={`/api/reports/${auditId}`}
              download
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-primary text-white text-sm font-medium hover:bg-accent-primary/90 transition-colors"
            >
              <Download className="w-4 h-4" />
              Download PDF Report
            </a>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-bg-secondary border border-border rounded-lg p-5">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-5 h-5 text-accent-primary" />
            <span className="text-sm text-text-tertiary">Agent Score</span>
          </div>
          <p className={`text-3xl font-bold ${scoreColor}`}>
            {audit.agentScore ?? "—"}
            <span className="text-lg text-text-tertiary">/100</span>
          </p>
        </div>

        <div className="bg-bg-secondary border border-border rounded-lg p-5">
          <div className="flex items-center gap-2 mb-2">
            <Search className="w-5 h-5 text-accent-primary" />
            <span className="text-sm text-text-tertiary">Visibility</span>
          </div>
          <p className="text-3xl font-bold text-text-primary">
            {visibleScans}
            <span className="text-lg text-text-tertiary">/{totalScans}</span>
          </p>
        </div>

        <div className="bg-bg-secondary border border-border rounded-lg p-5">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-error" />
            <span className="text-sm text-text-tertiary">Issues</span>
          </div>
          <p className="text-3xl font-bold text-text-primary">
            {diagnoses.length}
          </p>
          <div className="flex gap-2 mt-1 text-xs">
            {criticalCount > 0 && <span className="text-error">{criticalCount} critical</span>}
            {highCount > 0 && <span className="text-warning">{highCount} high</span>}
          </div>
        </div>

        <div className="bg-bg-secondary border border-border rounded-lg p-5">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-5 h-5 text-success" />
            <span className="text-sm text-text-tertiary">SKUs Scanned</span>
          </div>
          <p className="text-3xl font-bold text-text-primary">{skus.length}</p>
        </div>
      </div>

      {/* Engine Comparison Chart */}
      <EngineComparisonChart data={engineChartData} />

      {/* Diagnoses */}
      <div>
        <h2 className="text-2xl font-bold text-text-primary mb-4">
          Findings ({diagnoses.length})
        </h2>

        {diagnoses.length > 0 ? (
          <div className="space-y-3">
            {diagnoses.map((d) => {
              const sku = skuMap.get(d.sku);
              return (
                <DiagnosisCard
                  key={d.id}
                  skuCode={sku?.skuCode || "Unknown"}
                  skuName={sku?.name || "Unknown"}
                  engine={d.engine}
                  severity={d.severity}
                  reason={d.reason}
                  fix={d.fix}
                  competitorData={d.competitorData}
                />
              );
            })}
          </div>
        ) : (
          <div className="bg-bg-secondary border border-dashed border-border rounded-lg p-8 text-center">
            <CheckCircle2 className="w-10 h-10 text-success mx-auto mb-3" />
            <p className="text-text-primary font-medium">No issues found</p>
            <p className="text-text-tertiary text-sm mt-1">
              Your products are visible across all scanned AI engines.
            </p>
          </div>
        )}
      </div>

      {/* Missing Prompts */}
      <MissingPromptsSection scanResults={scanResults} skuIds={new Set(skus.map((s) => s.id))} />

      {/* Scan breakdown */}
      <div>
        <h2 className="text-2xl font-bold text-text-primary mb-4">
          Scan Results by Engine
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(["CHATGPT", "PERPLEXITY", "GOOGLE"] as const).map((engine) => {
            const engineScans = scanResults.filter(
              (r) => r.engine === engine && skus.some((s) => s.id === r.sku)
            );
            const visible = engineScans.filter((r) => r.brandVisible).length;
            const total = engineScans.length;
            const label =
              engine === "CHATGPT"
                ? "ChatGPT"
                : engine === "PERPLEXITY"
                  ? "Perplexity"
                  : "Google AI";

            return (
              <div
                key={engine}
                className="bg-bg-secondary border border-border rounded-lg p-5"
              >
                <h3 className="font-semibold text-text-primary mb-3">
                  {label}
                </h3>
                {total > 0 ? (
                  <>
                    <div className="flex items-end gap-1 mb-2">
                      <span className="text-2xl font-bold text-text-primary">
                        {visible}
                      </span>
                      <span className="text-text-tertiary mb-0.5">
                        / {total} visible
                      </span>
                    </div>
                    <div className="w-full bg-bg-tertiary rounded-full h-2">
                      <div
                        className={`h-full rounded-full ${
                          visible / total >= 0.7
                            ? "bg-success"
                            : visible / total >= 0.4
                              ? "bg-warning"
                              : "bg-error"
                        }`}
                        style={{
                          width: `${total > 0 ? (visible / total) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-text-tertiary">Not scanned</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function MissingPromptsSection({
  scanResults,
  skuIds,
}: {
  scanResults: ScanResultRecord[];
  skuIds: Set<string>;
}) {
  // Find scan results where our brand was NOT visible but a competitor was cited,
  // filtered to only scans for this user's SKUs
  const missedResults = scanResults.filter(
    (r) => !r.brandVisible && r.competitorDomain && r.competitorDomain !== "" && skuIds.has(r.sku)
  );

  // Group by query text → count of appearances
  const queryMap = new Map<string, { count: number; competitors: Set<string> }>();
  for (const r of missedResults) {
    if (!r.query) continue;
    const existing = queryMap.get(r.query);
    if (existing) {
      existing.count += 1;
      existing.competitors.add(r.competitorDomain);
    } else {
      queryMap.set(r.query, { count: 1, competitors: new Set([r.competitorDomain]) });
    }
  }

  // Sort by count descending, take top 20
  const missingPrompts = Array.from(queryMap.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 20);

  if (missingPrompts.length === 0) return null;

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <EyeOff className="w-6 h-6 text-warning" />
        <h2 className="text-2xl font-bold text-text-primary">
          Missing Prompts ({missingPrompts.length})
        </h2>
      </div>
      <p className="text-text-tertiary text-sm mb-4">
        These are queries where competitors were cited but your brand was not visible.
        Consider adding them to your prompt library and optimizing for these searches.
      </p>
      <div className="bg-bg-secondary border border-border rounded-lg overflow-hidden">
        <div className="grid grid-cols-[1fr_auto_auto] gap-0">
          <div className="px-4 py-3 bg-bg-tertiary/50 border-b border-border text-xs font-semibold text-text-tertiary uppercase tracking-wider">
            Query
          </div>
          <div className="px-4 py-3 bg-bg-tertiary/50 border-b border-border text-xs font-semibold text-text-tertiary uppercase tracking-wider text-right">
            Misses
          </div>
          <div className="px-4 py-3 bg-bg-tertiary/50 border-b border-border text-xs font-semibold text-text-tertiary uppercase tracking-wider">
            Competitors Cited
          </div>
        </div>
        <div className="divide-y divide-border">
          {missingPrompts.map(([query, data]) => (
            <div
              key={query}
              className="grid grid-cols-[1fr_auto_auto] gap-0 hover:bg-bg-tertiary/30 transition-colors"
            >
              <div className="px-4 py-3">
                <p className="text-sm text-text-primary">{query}</p>
              </div>
              <div className="px-4 py-3 text-right">
                <span className="inline-block px-2 py-0.5 bg-warning/10 text-warning border border-warning/20 rounded text-xs font-medium">
                  {data.count}
                </span>
              </div>
              <div className="px-4 py-3">
                <div className="flex flex-wrap gap-1">
                  {Array.from(data.competitors).map((domain) => (
                    <span
                      key={domain}
                      className="inline-block px-2 py-0.5 bg-bg-tertiary border border-border rounded text-xs text-text-tertiary"
                    >
                      {domain}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-3 flex justify-end">
        <Link
          href="/prompts"
          className="text-sm text-accent-primary hover:text-accent-primary/80 transition-colors"
        >
          Manage your prompt library →
        </Link>
      </div>
    </div>
  );
}
