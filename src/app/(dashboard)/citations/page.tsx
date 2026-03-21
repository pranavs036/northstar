import { createServerClient } from "@/lib/pocketbase/server";
import { redirect } from "next/navigation";
import { Link2, AlertTriangle } from "lucide-react";
import { CitationTable } from "@/components/citations/CitationTable";
import type { CitationRow } from "@/components/citations/CitationTable";
import type { SkuRecord, ScanResultRecord } from "@/types/pocketbase";

interface RawCitation {
  url: string;
  domain: string;
  context?: string;
  isBrandCitation: boolean;
  isCompetitorCitation: boolean;
}

export default async function CitationsPage() {
  const pb = await createServerClient();

  if (!pb.authStore.isValid || !pb.authStore.record) {
    redirect("/login");
  }

  const userId = pb.authStore.record.id;

  // Fetch all SKUs for the user
  let skus: SkuRecord[] = [];
  try {
    skus = await pb.collection("skus").getFullList<SkuRecord>({
      filter: `user="${userId}"`,
    });
  } catch (err) {
    console.error("[citations] Failed to fetch SKUs:", err);
  }

  // Fetch all scan results for those SKUs
  let scanResults: ScanResultRecord[] = [];
  if (skus.length > 0) {
    const skuIds = skus.map((s) => s.id);
    const skuFilter = skuIds.map((id) => `sku="${id}"`).join("||");
    try {
      scanResults = await pb
        .collection("scan_results")
        .getFullList<ScanResultRecord>({ filter: skuFilter });
    } catch (err) {
      console.error("[citations] Failed to fetch scan results:", err);
    }
  }

  // Aggregate citations across all scan results
  // Map: domain -> { count, engines (Set), isBrand, isCompetitor }
  const domainMap = new Map<
    string,
    { count: number; engines: Set<string>; isBrand: boolean; isCompetitor: boolean }
  >();

  for (const result of scanResults) {
    if (!result.citations) continue;

    let parsed: RawCitation[] = [];
    try {
      parsed = JSON.parse(result.citations) as RawCitation[];
    } catch {
      continue;
    }

    if (!Array.isArray(parsed)) continue;

    for (const citation of parsed) {
      const domain = citation.domain?.trim().toLowerCase();
      if (!domain) continue;

      const existing = domainMap.get(domain);
      if (existing) {
        existing.count += 1;
        existing.engines.add(result.engine);
        if (citation.isBrandCitation) existing.isBrand = true;
        if (citation.isCompetitorCitation) existing.isCompetitor = true;
      } else {
        domainMap.set(domain, {
          count: 1,
          engines: new Set([result.engine]),
          isBrand: citation.isBrandCitation,
          isCompetitor: citation.isCompetitorCitation,
        });
      }
    }
  }

  // Convert map to sorted array
  const aggregatedCitations: CitationRow[] = Array.from(domainMap.entries())
    .map(([domain, data]) => ({
      domain,
      count: data.count,
      engines: Array.from(data.engines),
      isBrand: data.isBrand,
      isCompetitor: data.isCompetitor,
    }))
    .sort((a, b) => b.count - a.count);

  // Count citation gaps: competitor-only domains (competitor cited, brand not cited there)
  const citationGapCount = aggregatedCitations.filter(
    (c) => c.isCompetitor && !c.isBrand
  ).length;

  const totalDomains = aggregatedCitations.length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-text-primary mb-2">
          Citation Analysis
        </h1>
        <p className="text-text-tertiary">
          Track which domains AI engines cite when answering queries about your products and competitors.
        </p>
      </div>

      {/* Citation Gaps Summary Card */}
      {totalDomains > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-bg-secondary border border-border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <Link2 className="w-5 h-5 text-accent-primary" />
              <span className="text-sm font-medium text-text-tertiary">Total Cited Domains</span>
            </div>
            <p className="text-3xl font-bold text-text-primary">{totalDomains}</p>
            <p className="text-xs text-text-tertiary mt-1">Across all scanned queries</p>
          </div>

          <div
            className={`rounded-lg p-6 border ${
              citationGapCount > 0
                ? "bg-error/10 border-error/30"
                : "bg-bg-secondary border-border"
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <AlertTriangle
                className={`w-5 h-5 ${citationGapCount > 0 ? "text-error" : "text-text-tertiary"}`}
              />
              <span className="text-sm font-medium text-text-tertiary">Citation Gaps</span>
            </div>
            <p
              className={`text-3xl font-bold ${
                citationGapCount > 0 ? "text-error" : "text-text-primary"
              }`}
            >
              {citationGapCount}
            </p>
            <p className="text-xs text-text-tertiary mt-1">
              Competitor-only sources — your brand isn&apos;t cited there
            </p>
          </div>

          <div className="bg-bg-secondary border border-border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <Link2 className="w-5 h-5 text-success" />
              <span className="text-sm font-medium text-text-tertiary">Brand Citations</span>
            </div>
            <p className="text-3xl font-bold text-text-primary">
              {aggregatedCitations.filter((c) => c.isBrand).length}
            </p>
            <p className="text-xs text-text-tertiary mt-1">Domains that cite your brand</p>
          </div>
        </div>
      )}

      {/* Citation Gap Alert */}
      {citationGapCount > 0 && (
        <div className="bg-error/10 border border-error/30 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-error mb-1">
              {citationGapCount} citation {citationGapCount === 1 ? "gap" : "gaps"} detected
            </p>
            <p className="text-sm text-text-secondary">
              These are sources where AI engines cite your competitors but not your brand.
              Highlighted in red below — focus on getting cited on these domains to close the gap.
            </p>
          </div>
        </div>
      )}

      {/* Table or empty state */}
      {totalDomains > 0 ? (
        <div>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-text-primary mb-2">All Cited Domains</h2>
            <p className="text-text-tertiary">
              Rows highlighted in red are citation gaps — competitors cited there, your brand is not.
            </p>
          </div>
          <CitationTable citations={aggregatedCitations} />
        </div>
      ) : (
        <div className="bg-bg-secondary border border-dashed border-border rounded-lg p-12 text-center">
          <Link2 className="w-12 h-12 text-text-tertiary mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-semibold text-text-primary mb-2">No citation data yet</h3>
          <p className="text-text-tertiary mb-6">
            Run an audit to start collecting citation data from AI engines.
          </p>
          <a
            href="/audit/new"
            className="inline-block px-6 py-2 bg-accent-primary text-white rounded-lg hover:bg-accent-secondary transition-colors font-medium"
          >
            Start an Audit
          </a>
        </div>
      )}
    </div>
  );
}
