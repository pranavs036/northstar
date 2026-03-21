"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, FileCode2 } from "lucide-react";
import { SchemaScoreCard } from "@/components/schema/SchemaScoreCard";
import { SchemaFixCard } from "@/components/schema/SchemaFixCard";
import type { SchemaAuditSummary, SchemaSkuResult } from "@/components/schema/SchemaAuditProgress";

const SCORE_FILTERS = [
  { label: "All", min: 0, max: 100 },
  { label: "Poor (0–30)", min: 0, max: 30 },
  { label: "Needs Work (31–60)", min: 31, max: 60 },
  { label: "Good (61–80)", min: 61, max: 80 },
  { label: "Excellent (81–100)", min: 81, max: 100 },
];

export default function SchemaAuditPage() {
  const [summary, setSummary] = useState<SchemaAuditSummary | null>(null);
  const [activeFilter, setActiveFilter] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("schema_audit_latest");
      if (raw) {
        setSummary(JSON.parse(raw) as SchemaAuditSummary);
      }
    } catch {
      // ignore
    }
    setLoaded(true);
  }, []);

  const filteredResults: SchemaSkuResult[] = summary
    ? summary.results.filter((r) => {
        const f = SCORE_FILTERS[activeFilter];
        return r.score >= f.min && r.score <= f.max;
      })
    : [];

  const skusWithFixes = summary
    ? summary.results.filter((r) => r.fixedJsonLd !== "").length
    : 0;

  if (!loaded) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-text-primary mb-2">Schema Audit</h1>
        </div>
        <div className="bg-bg-secondary border border-border rounded-lg p-12 text-center">
          <p className="text-text-tertiary">Loading...</p>
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="space-y-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold text-text-primary mb-2">Schema Audit</h1>
            <p className="text-text-tertiary">
              Analyze product structured data completeness across your catalog.
            </p>
          </div>
          <Link
            href="/schema-audit/new"
            className="flex items-center gap-2 px-6 py-3 bg-accent-primary text-white rounded-lg hover:bg-accent-secondary transition-colors font-medium"
          >
            <Plus className="w-4 h-4" />
            Run Schema Audit
          </Link>
        </div>
        <div className="bg-bg-secondary border border-dashed border-border rounded-lg p-12 text-center">
          <FileCode2 className="w-12 h-12 text-text-tertiary mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-semibold text-text-primary mb-2">No schema audit yet</h3>
          <p className="text-text-tertiary mb-6">
            Run a schema audit to see how complete your product structured data is and get AI-generated fixes.
          </p>
          <Link
            href="/schema-audit/new"
            className="inline-block px-6 py-3 bg-accent-primary text-white rounded-lg hover:bg-accent-secondary transition-colors font-medium"
          >
            Start Schema Audit
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-bold text-text-primary mb-2">Schema Audit Results</h1>
          <p className="text-text-tertiary">
            Completed {new Date(summary.completedAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
        <Link
          href="/schema-audit/new"
          className="flex items-center gap-2 px-6 py-3 bg-accent-primary text-white rounded-lg hover:bg-accent-secondary transition-colors font-medium"
        >
          <Plus className="w-4 h-4" />
          Re-run Audit
        </Link>
      </div>

      {/* Average score */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <SchemaScoreCard score={summary.averageScore} label="Average Completeness" />
        </div>
        <div className="md:col-span-2 grid grid-cols-2 gap-4 content-start">
          <div className="bg-bg-secondary border border-border rounded-lg p-6 text-center">
            <p className="text-4xl font-bold text-text-primary">{summary.totalAudited}</p>
            <p className="text-sm text-text-tertiary mt-1">SKUs audited</p>
          </div>
          <div className="bg-bg-secondary border border-border rounded-lg p-6 text-center">
            <p className="text-4xl font-bold text-text-primary">{skusWithFixes}</p>
            <p className="text-sm text-text-tertiary mt-1">
              {skusWithFixes === 1 ? "Fix" : "Fixes"} available
            </p>
          </div>
          <div className="bg-bg-secondary border border-border rounded-lg p-6 text-center">
            <p className="text-4xl font-bold text-error">
              {summary.results.filter((r) => r.missingRequired.length > 0).length}
            </p>
            <p className="text-sm text-text-tertiary mt-1">Missing required props</p>
          </div>
          <div className="bg-bg-secondary border border-border rounded-lg p-6 text-center">
            <p className="text-4xl font-bold text-success">
              {summary.results.filter((r) => r.score >= 80).length}
            </p>
            <p className="text-sm text-text-tertiary mt-1">Excellent schemas</p>
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div>
        <div className="flex items-center gap-2 flex-wrap mb-6">
          {SCORE_FILTERS.map((filter, i) => (
            <button
              key={i}
              onClick={() => setActiveFilter(i)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeFilter === i
                  ? "bg-accent-primary text-white"
                  : "bg-bg-secondary border border-border text-text-secondary hover:bg-bg-tertiary"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Results grid */}
        {filteredResults.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredResults.map((result) => (
              <SchemaFixCard
                key={result.skuId}
                skuName={result.skuName}
                url={result.url}
                score={result.score}
                missingRequired={result.missingRequired}
                missingOptional={result.missingOptional}
                fixedJsonLd={result.fixedJsonLd}
                changes={result.changes}
              />
            ))}
          </div>
        ) : (
          <div className="bg-bg-secondary border border-dashed border-border rounded-lg p-12 text-center">
            <p className="text-text-tertiary">No SKUs match this filter.</p>
          </div>
        )}
      </div>
    </div>
  );
}
