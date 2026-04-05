"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Search,
  Circle,
  Eye,
  EyeOff,
  Activity,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

// ---------------------------------------------------------------------------
// Types (mirrors the mock data shape from the page)
// ---------------------------------------------------------------------------

type Severity = "CRITICAL" | "HIGH" | "MEDIUM";
type Engine = "ChatGPT" | "Perplexity" | "Google AI" | "Gemini" | "Bing CoPilot";

interface Actionable {
  text: string;
  severity: Severity;
}

interface MockSkuAnalysis {
  id: string;
  skuCode: string;
  name: string;
  category: string;
  visibilityScore: number;
  severity: Severity;
  enginesVisible: Engine[];
  enginesMissing: Engine[];
  topIssue: string;
  actionables: Actionable[];
}

interface SkuAnalysisResultsProps {
  analysisData: MockSkuAnalysis[];
  totalSkus: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  avgVisibility: number;
}

// ---------------------------------------------------------------------------
// Severity / score styling helpers
// ---------------------------------------------------------------------------

const severityConfig = {
  CRITICAL: {
    label: "Critical",
    bg: "bg-red-500/10",
    text: "text-red-400",
    border: "border-red-500/30",
    dot: "bg-red-500",
  },
  HIGH: {
    label: "High",
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    border: "border-amber-500/30",
    dot: "bg-amber-500",
  },
  MEDIUM: {
    label: "Medium",
    bg: "bg-yellow-500/10",
    text: "text-yellow-400",
    border: "border-yellow-500/30",
    dot: "bg-yellow-500",
  },
};

function scoreColor(score: number): string {
  if (score < 30) return "text-red-400";
  if (score < 60) return "text-amber-400";
  return "text-green-400";
}

function scoreBarColor(score: number): string {
  if (score < 30) return "bg-red-500";
  if (score < 60) return "bg-amber-500";
  return "bg-green-500";
}

function healthLabel(score: number): { label: string; className: string } {
  if (score >= 70) return { label: "Healthy", className: "bg-green-500/10 text-green-400" };
  if (score >= 50) return { label: "Needs Work", className: "bg-amber-500/10 text-amber-400" };
  if (score >= 30) return { label: "At Risk", className: "bg-orange-500/10 text-orange-400" };
  return { label: "Critical", className: "bg-red-500/10 text-red-400" };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SkuAnalysisResults({
  analysisData,
  totalSkus,
  criticalCount,
  highCount,
  mediumCount,
  avgVisibility,
}: SkuAnalysisResultsProps) {
  const [expandedSkuId, setExpandedSkuId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSeverity, setFilterSeverity] = useState<Severity | "ALL">("ALL");

  const criticalSkus = useMemo(
    () => analysisData.filter((s) => s.severity === "CRITICAL"),
    [analysisData]
  );

  const filteredSkus = useMemo(() => {
    let result = analysisData;
    if (filterSeverity !== "ALL") {
      result = result.filter((s) => s.severity === filterSeverity);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.skuCode.toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q)
      );
    }
    return result;
  }, [analysisData, filterSeverity, searchQuery]);

  const health = healthLabel(avgVisibility);

  return (
    <div className="space-y-8">
      {/* ------------------------------------------------------------------ */}
      {/* 1. Summary Header                                                   */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total SKUs */}
        <div className="bg-bg-secondary border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-indigo-400" />
            <span className="text-xs text-text-tertiary uppercase tracking-wider font-semibold">
              SKUs Analyzed
            </span>
          </div>
          <p className="text-3xl font-bold text-text-primary">{totalSkus}</p>
        </div>

        {/* Critical */}
        <div className="bg-bg-secondary border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <span className="text-xs text-text-tertiary uppercase tracking-wider font-semibold">
              Critical
            </span>
          </div>
          <p className="text-3xl font-bold text-red-400">{criticalCount}</p>
        </div>

        {/* High */}
        <div className="bg-bg-secondary border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="text-xs text-text-tertiary uppercase tracking-wider font-semibold">
              High
            </span>
          </div>
          <p className="text-3xl font-bold text-amber-400">{highCount}</p>
        </div>

        {/* Medium */}
        <div className="bg-bg-secondary border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
            <span className="text-xs text-text-tertiary uppercase tracking-wider font-semibold">
              Medium
            </span>
          </div>
          <p className="text-3xl font-bold text-yellow-400">{mediumCount}</p>
        </div>

        {/* Catalog Health */}
        <div className="bg-bg-secondary border border-border rounded-xl p-5 col-span-2 lg:col-span-1">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-violet-400" />
            <span className="text-xs text-text-tertiary uppercase tracking-wider font-semibold">
              Health Score
            </span>
          </div>
          <div className="flex items-center gap-3">
            <p className={cn("text-3xl font-bold", scoreColor(avgVisibility))}>
              {avgVisibility}
            </p>
            <span
              className={cn("text-xs font-medium px-2 py-0.5 rounded-full", health.className)}
            >
              {health.label}
            </span>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 2. Critical SKUs Highlighted                                        */}
      {/* ------------------------------------------------------------------ */}
      {criticalSkus.length > 0 && (
        <div className="border-2 border-red-500/40 bg-red-500/5 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-red-500/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <h2 className="text-lg font-bold text-text-primary">
                Critical SKUs
              </h2>
              <span className="text-xs font-semibold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">
                {criticalSkus.length} products
              </span>
            </div>
            <span className="text-sm font-bold text-red-400">
              Fix these first
            </span>
          </div>

          <div className="divide-y divide-red-500/10">
            {criticalSkus.map((sku) => (
              <div
                key={sku.id}
                className="px-6 py-4 hover:bg-red-500/5 transition-colors"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <Link
                        href={`/catalog/${sku.id}`}
                        className="font-semibold text-text-primary hover:text-accent-primary transition-colors"
                      >
                        {sku.name}
                      </Link>
                      <span className="text-xs font-mono text-text-tertiary bg-bg-tertiary px-1.5 py-0.5 rounded">
                        {sku.skuCode}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-text-tertiary">
                      <span>{sku.category}</span>
                      <span className="flex items-center gap-1">
                        <EyeOff className="w-3 h-3 text-red-400" />
                        Missing from:{" "}
                        <span className="text-red-400 font-medium">
                          {sku.enginesMissing.join(", ")}
                        </span>
                      </span>
                    </div>
                  </div>
                  <div className="text-center shrink-0">
                    <p className={cn("text-2xl font-bold", scoreColor(sku.visibilityScore))}>
                      {sku.visibilityScore}
                    </p>
                    <p className="text-[10px] text-text-tertiary uppercase">/ 100</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 3. Full SKU Table with filters                                      */}
      {/* ------------------------------------------------------------------ */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-text-primary">All SKUs</h2>
          <Link
            href="/catalog"
            className="text-sm text-accent-primary hover:text-accent-secondary transition-colors"
          >
            View Catalog
          </Link>
        </div>

        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
            <input
              type="text"
              placeholder="Search by product name, SKU, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-bg-tertiary border border-border text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/20"
            />
          </div>
          <div className="flex gap-2">
            {(["ALL", "CRITICAL", "HIGH", "MEDIUM"] as const).map((sev) => {
              const active = filterSeverity === sev;
              return (
                <button
                  key={sev}
                  onClick={() => setFilterSeverity(sev)}
                  className={cn(
                    "px-3 py-2 rounded-lg text-xs font-semibold border transition-colors",
                    active
                      ? "bg-accent-primary/10 border-accent-primary text-accent-primary"
                      : "bg-bg-secondary border-border text-text-tertiary hover:text-text-primary hover:border-text-tertiary"
                  )}
                >
                  {sev === "ALL" ? "All" : sev}
                </button>
              );
            })}
          </div>
        </div>

        {/* Results */}
        <div className="space-y-2">
          {filteredSkus.length === 0 && (
            <div className="bg-bg-secondary border border-border rounded-lg p-12 text-center">
              <p className="text-text-tertiary">No SKUs match your filters.</p>
            </div>
          )}

          {filteredSkus.map((sku) => {
            const isExpanded = expandedSkuId === sku.id;
            const sevCfg = severityConfig[sku.severity];

            return (
              <div
                key={sku.id}
                className={cn(
                  "bg-bg-secondary border rounded-xl overflow-hidden transition-all",
                  sku.severity === "CRITICAL"
                    ? "border-red-500/20"
                    : "border-border"
                )}
              >
                {/* Row */}
                <button
                  onClick={() => setExpandedSkuId(isExpanded ? null : sku.id)}
                  className="w-full text-left px-5 py-4 flex items-center gap-4 hover:bg-bg-tertiary/20 transition-colors"
                >
                  {/* Expand icon */}
                  <div className="shrink-0">
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-text-tertiary" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-text-tertiary" />
                    )}
                  </div>

                  {/* Product info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-text-primary truncate">
                        {sku.name}
                      </span>
                      <span className="text-xs font-mono text-text-tertiary bg-bg-tertiary px-1.5 py-0.5 rounded shrink-0">
                        {sku.skuCode}
                      </span>
                    </div>
                    <p className="text-xs text-text-tertiary mt-0.5 truncate">
                      {sku.topIssue}
                    </p>
                  </div>

                  {/* Category */}
                  <span className="text-xs text-text-tertiary shrink-0 hidden md:block w-28 text-right">
                    {sku.category}
                  </span>

                  {/* Visibility score */}
                  <div className="shrink-0 w-20 flex items-center gap-2">
                    <div className="w-10 h-2 bg-bg-tertiary rounded-full overflow-hidden">
                      <div
                        className={cn("h-full rounded-full", scoreBarColor(sku.visibilityScore))}
                        style={{ width: `${sku.visibilityScore}%` }}
                      />
                    </div>
                    <span className={cn("text-sm font-bold tabular-nums", scoreColor(sku.visibilityScore))}>
                      {sku.visibilityScore}
                    </span>
                  </div>

                  {/* Severity badge */}
                  <span
                    className={cn(
                      "shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full border",
                      sevCfg.bg,
                      sevCfg.text,
                      sevCfg.border
                    )}
                  >
                    {sevCfg.label}
                  </span>

                  {/* Engines */}
                  <span className="shrink-0 text-xs text-text-tertiary w-24 text-right hidden lg:block">
                    <span className={sku.enginesVisible.length <= 1 ? "text-red-400" : sku.enginesVisible.length <= 3 ? "text-amber-400" : "text-green-400"}>
                      {sku.enginesVisible.length}
                    </span>
                    /5 engines
                  </span>
                </button>

                {/* -------------------------------------------------------- */}
                {/* 4. Expanded Actionables                                   */}
                {/* -------------------------------------------------------- */}
                {isExpanded && (
                  <div className="border-t border-border bg-bg-tertiary/20 px-5 py-5">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Left: Engine Visibility */}
                      <div>
                        <h4 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-3">
                          Engine Visibility
                        </h4>
                        <div className="space-y-2">
                          {(["ChatGPT", "Perplexity", "Google AI", "Gemini", "Bing CoPilot"] as Engine[]).map(
                            (engine) => {
                              const visible = sku.enginesVisible.includes(engine);
                              return (
                                <div
                                  key={engine}
                                  className="flex items-center gap-2 text-sm"
                                >
                                  {visible ? (
                                    <Eye className="w-3.5 h-3.5 text-green-400" />
                                  ) : (
                                    <EyeOff className="w-3.5 h-3.5 text-red-400" />
                                  )}
                                  <span
                                    className={
                                      visible ? "text-text-secondary" : "text-red-400"
                                    }
                                  >
                                    {engine}
                                  </span>
                                  {!visible && (
                                    <span className="ml-auto text-[10px] text-red-400/70 font-medium uppercase">
                                      Not found
                                    </span>
                                  )}
                                </div>
                              );
                            }
                          )}
                        </div>
                      </div>

                      {/* Right: Actionable Checklist */}
                      <div className="lg:col-span-2">
                        <h4 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-3">
                          Recommended Actions
                        </h4>
                        <div className="space-y-2">
                          {sku.actionables.map((action, i) => {
                            const aCfg = severityConfig[action.severity];
                            return (
                              <div
                                key={i}
                                className={cn(
                                  "flex items-start gap-3 p-3 rounded-lg border",
                                  aCfg.bg,
                                  aCfg.border
                                )}
                              >
                                <Circle
                                  className={cn("w-4 h-4 mt-0.5 shrink-0", aCfg.text)}
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm text-text-primary">
                                    {action.text}
                                  </p>
                                </div>
                                <span
                                  className={cn(
                                    "text-[10px] font-bold uppercase shrink-0 mt-0.5",
                                    aCfg.text
                                  )}
                                >
                                  {action.severity}
                                </span>
                              </div>
                            );
                          })}
                        </div>

                        {/* Link to detailed SKU page */}
                        <Link
                          href={`/catalog/${sku.id}`}
                          className="inline-flex items-center gap-1 mt-4 text-sm text-accent-primary hover:text-accent-secondary transition-colors font-medium"
                        >
                          View full SKU details
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="text-sm text-text-tertiary mt-3">
          Showing {filteredSkus.length} of {totalSkus} SKUs
        </div>
      </div>
    </div>
  );
}
