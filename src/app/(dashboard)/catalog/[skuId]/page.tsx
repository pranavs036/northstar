import { createServerClient } from "@/lib/pocketbase/server";
import { redirect } from "next/navigation";
import { ArrowLeft, ExternalLink, Tag, Globe, AlertTriangle, CheckCircle2, XCircle, Minus } from "lucide-react";
import Link from "next/link";
import { DiagnosisCard } from "@/components/audit/DiagnosisCard";
import type { SkuRecord, ScanResultRecord, DiagnosisRecord } from "@/types/pocketbase";

export const dynamic = "force-dynamic";

const engineLabels: Record<string, string> = {
  CHATGPT: "ChatGPT",
  CLAUDE: "Claude",
  GOOGLE: "Google AI",
  PERPLEXITY: "Perplexity",
  BING: "Bing CoPilot",
  GEMINI: "Gemini",
  COPILOT: "CoPilot",
};

const sentimentConfig = {
  POSITIVE: { label: "Positive", className: "text-success bg-success/10" },
  NEUTRAL: { label: "Neutral", className: "text-text-tertiary bg-bg-tertiary" },
  NEGATIVE: { label: "Negative", className: "text-error bg-error/10" },
};

export default async function SkuDeepDivePage({
  params,
}: {
  params: Promise<{ skuId: string }>;
}) {
  const { skuId } = await params;
  const pb = await createServerClient();

  if (!pb.authStore.isValid || !pb.authStore.record) {
    redirect("/login");
  }

  const userId = pb.authStore.record.id;

  // Fetch the SKU record
  let sku: SkuRecord;
  try {
    sku = await pb.collection("skus").getOne<SkuRecord>(skuId);
    if (sku.user !== userId) {
      redirect("/catalog");
    }
  } catch {
    redirect("/catalog");
  }

  // Fetch scan results and diagnoses for this SKU
  let scanResults: ScanResultRecord[] = [];
  let diagnoses: DiagnosisRecord[] = [];

  try {
    [scanResults, diagnoses] = await Promise.all([
      pb.collection("scan_results").getFullList<ScanResultRecord>({
        filter: `sku="${skuId}"`,
        sort: "-created",
      }),
      pb.collection("diagnoses").getFullList<DiagnosisRecord>({
        filter: `sku="${skuId}"`,
        sort: "-created",
      }),
    ]);
  } catch (e) {
    console.error("[sku-detail] Error fetching data:", e);
  }

  // Compute per-engine visibility stats
  const engines = Array.from(new Set(scanResults.map((r) => r.engine)));
  const engineStats = engines.map((engine) => {
    const engineScans = scanResults.filter((r) => r.engine === engine);
    const visible = engineScans.filter((r) => r.brandVisible).length;
    const total = engineScans.length;
    const rate = total > 0 ? Math.round((visible / total) * 100) : 0;
    return { engine, visible, total, rate };
  });

  // Overall stats
  const totalScans = scanResults.length;
  const visibleScans = scanResults.filter((r) => r.brandVisible).length;
  const overallRate = totalScans > 0 ? Math.round((visibleScans / totalScans) * 100) : null;

  const criticalCount = diagnoses.filter((d) => d.severity === "CRITICAL").length;
  const highCount = diagnoses.filter((d) => d.severity === "HIGH").length;

  return (
    <div className="space-y-8">
      {/* Back link + Header */}
      <div>
        <Link
          href="/catalog"
          className="inline-flex items-center gap-1 text-sm text-text-tertiary hover:text-text-primary transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Catalog
        </Link>

        <div className="bg-bg-secondary border border-border rounded-lg p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xs font-mono text-text-tertiary px-2 py-1 bg-bg-tertiary rounded border border-border">
                  {sku.skuCode}
                </span>
                {sku.category && (
                  <span className="inline-flex items-center gap-1 text-xs text-text-tertiary px-2 py-1 bg-bg-tertiary rounded border border-border">
                    <Tag className="w-3 h-3" />
                    {sku.category}
                  </span>
                )}
              </div>
              <h1 className="text-3xl font-bold text-text-primary mb-2">
                {sku.name}
              </h1>
              {sku.description && (
                <p className="text-text-secondary text-sm mb-3 max-w-2xl">
                  {sku.description}
                </p>
              )}
              {sku.url && (
                <a
                  href={sku.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-accent-primary hover:text-accent-primary/80 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  {sku.url}
                </a>
              )}
            </div>

            {/* Overall visibility score */}
            {overallRate !== null && (
              <div className="text-center shrink-0">
                <div
                  className={`text-4xl font-bold ${
                    overallRate >= 75
                      ? "text-success"
                      : overallRate >= 50
                        ? "text-warning"
                        : "text-error"
                  }`}
                >
                  {overallRate}%
                </div>
                <p className="text-xs text-text-tertiary mt-1">Visibility</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Not yet scanned CTA */}
      {scanResults.length === 0 && (
        <div className="bg-gradient-to-r from-indigo-500/10 to-violet-500/10 border border-indigo-500/20 rounded-lg p-6 flex items-center justify-between">
          <div>
            <p className="text-text-primary font-semibold">This SKU hasn&apos;t been scanned yet</p>
            <p className="text-text-tertiary text-sm mt-1">Run an audit to see how this product ranks across AI engines.</p>
          </div>
          <Link
            href="/audit/new"
            className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-lg font-medium hover:from-indigo-500 hover:to-violet-500 transition-all shrink-0"
          >
            Start Audit
          </Link>
        </div>
      )}

      {/* Stats row — only show when there's data */}
      {scanResults.length > 0 && (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-bg-secondary border border-border rounded-lg p-5">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="w-5 h-5 text-accent-primary" />
            <span className="text-sm text-text-tertiary">Engines Scanned</span>
          </div>
          <p className="text-3xl font-bold text-text-primary">{engines.length}</p>
        </div>

        <div className="bg-bg-secondary border border-border rounded-lg p-5">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-5 h-5 text-success" />
            <span className="text-sm text-text-tertiary">Visible</span>
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
          <p className="text-3xl font-bold text-text-primary">{diagnoses.length}</p>
          <div className="flex gap-2 mt-1 text-xs">
            {criticalCount > 0 && <span className="text-error">{criticalCount} critical</span>}
            {highCount > 0 && <span className="text-warning">{highCount} high</span>}
          </div>
        </div>

        <div className="bg-bg-secondary border border-border rounded-lg p-5">
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="w-5 h-5 text-warning" />
            <span className="text-sm text-text-tertiary">Queries Tested</span>
          </div>
          <p className="text-3xl font-bold text-text-primary">
            {Array.from(new Set(scanResults.map((r) => r.query))).length}
          </p>
        </div>
      </div>
      )}

      {/* Engine visibility breakdown */}
      {engineStats.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-text-primary mb-4">
            Visibility by Engine
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {engineStats.map(({ engine, visible, total, rate }) => (
              <div
                key={engine}
                className="bg-bg-secondary border border-border rounded-lg p-5"
              >
                <h3 className="font-semibold text-text-primary mb-3">
                  {engineLabels[engine] || engine}
                </h3>
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
                      rate >= 70
                        ? "bg-success"
                        : rate >= 40
                          ? "bg-warning"
                          : "bg-error"
                    }`}
                    style={{ width: `${rate}%` }}
                  />
                </div>
                <p className="text-sm text-text-tertiary mt-2">{rate}% visibility</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Query Results Table */}
      {scanResults.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-text-primary mb-4">
            Query Results ({scanResults.length})
          </h2>
          <div className="bg-bg-secondary border border-border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-bg-tertiary/50">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                      Query
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                      Engine
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                      Visible
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                      Sentiment
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                      Competitor Cited
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {scanResults.map((result) => (
                    <tr
                      key={result.id}
                      className="hover:bg-bg-tertiary/30 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <p className="text-sm text-text-primary max-w-md">
                          {result.query}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-text-secondary px-2 py-0.5 bg-bg-tertiary rounded">
                          {engineLabels[result.engine] || result.engine}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {result.brandVisible ? (
                          <span className="inline-flex items-center gap-1 text-sm text-success">
                            <CheckCircle2 className="w-4 h-4" />
                            Yes
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-sm text-error">
                            <XCircle className="w-4 h-4" />
                            No
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {result.sentimentLabel ? (
                          <span
                            className={`text-xs font-medium px-2 py-0.5 rounded ${
                              sentimentConfig[result.sentimentLabel].className
                            }`}
                          >
                            {sentimentConfig[result.sentimentLabel].label}
                          </span>
                        ) : (
                          <Minus className="w-4 h-4 text-text-tertiary" />
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {result.competitorDomain ? (
                          <span className="text-sm text-text-secondary px-2 py-0.5 bg-bg-tertiary border border-border rounded">
                            {result.competitorDomain}
                          </span>
                        ) : (
                          <span className="text-sm text-text-tertiary">--</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Diagnoses */}
      <div>
        <h2 className="text-2xl font-bold text-text-primary mb-4">
          Diagnoses ({diagnoses.length})
        </h2>

        {diagnoses.length > 0 ? (
          <div className="space-y-3">
            {diagnoses.map((d) => (
              <DiagnosisCard
                key={d.id}
                skuCode={sku.skuCode}
                skuName={sku.name}
                engine={d.engine}
                severity={d.severity}
                reason={d.reason}
                fix={d.fix}
                competitorData={d.competitorData}
              />
            ))}
          </div>
        ) : (
          <div className="bg-bg-secondary border border-dashed border-border rounded-lg p-8 text-center">
            <CheckCircle2 className="w-10 h-10 text-success mx-auto mb-3" />
            <p className="text-text-primary font-medium">No issues found</p>
            <p className="text-text-tertiary text-sm mt-1">
              No diagnoses have been generated for this SKU yet.
            </p>
          </div>
        )}
      </div>

      {/* Empty state for no scan data at all */}
      {scanResults.length === 0 && diagnoses.length === 0 && (
        <div className="bg-bg-secondary border border-dashed border-border rounded-lg p-12 text-center">
          <Globe className="w-12 h-12 text-text-tertiary mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-semibold text-text-primary mb-2">No scan data yet</h3>
          <p className="text-text-tertiary mb-6">
            This SKU has not been scanned yet. Start an audit to analyze its AI search visibility.
          </p>
          <Link
            href="/audit"
            className="inline-block px-6 py-3 bg-accent-primary text-white rounded-lg hover:bg-accent-secondary transition-colors font-medium"
          >
            Go to Audits
          </Link>
        </div>
      )}
    </div>
  );
}
