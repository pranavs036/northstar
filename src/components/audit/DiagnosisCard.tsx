"use client";

import { AlertTriangle, AlertCircle, Info, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface DiagnosisProps {
  skuCode: string;
  skuName: string;
  engine: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  reason: string;
  fix: string;
  competitorData: Record<string, unknown> | null;
  sentimentLabel?: "POSITIVE" | "NEUTRAL" | "NEGATIVE";
  citationCount?: number;
}

const sentimentConfig = {
  POSITIVE: { label: "Positive", className: "text-emerald-400 bg-emerald-400/10" },
  NEUTRAL: { label: "Neutral", className: "text-zinc-400 bg-zinc-400/10" },
  NEGATIVE: { label: "Negative", className: "text-red-400 bg-red-400/10" },
};

const severityConfig = {
  CRITICAL: {
    icon: AlertTriangle,
    color: "text-error",
    bg: "bg-error/10",
    border: "border-error/30",
    label: "Critical",
  },
  HIGH: {
    icon: AlertTriangle,
    color: "text-warning",
    bg: "bg-warning/10",
    border: "border-warning/30",
    label: "High",
  },
  MEDIUM: {
    icon: AlertCircle,
    color: "text-info",
    bg: "bg-info/10",
    border: "border-info/30",
    label: "Medium",
  },
  LOW: {
    icon: Info,
    color: "text-text-tertiary",
    bg: "bg-text-tertiary/10",
    border: "border-text-tertiary/30",
    label: "Low",
  },
};

const engineLabels: Record<string, string> = {
  CHATGPT: "ChatGPT",
  GOOGLE: "Google AI",
  PERPLEXITY: "Perplexity",
  BING: "Bing CoPilot",
};

export function DiagnosisCard({
  skuCode,
  skuName,
  engine,
  severity,
  reason,
  fix,
  competitorData,
  sentimentLabel,
  citationCount,
}: DiagnosisProps) {
  const [expanded, setExpanded] = useState(false);
  const config = severityConfig[severity];
  const Icon = config.icon;

  const missingElements =
    competitorData && Array.isArray(competitorData.missingElements)
      ? (competitorData.missingElements as string[])
      : [];

  return (
    <div className={`bg-bg-secondary border ${config.border} rounded-lg overflow-hidden`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-5 flex items-start justify-between text-left hover:bg-bg-tertiary/30 transition-colors cursor-pointer"
      >
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <div className={`w-9 h-9 ${config.bg} rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5`}>
            <Icon className={`w-4 h-4 ${config.color}`} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${config.color} ${config.bg}`}>
                {config.label}
              </span>
              {sentimentLabel && (
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${sentimentConfig[sentimentLabel].className}`}>
                  {sentimentConfig[sentimentLabel].label}
                </span>
              )}
              <span className="text-xs text-text-tertiary font-mono">{skuCode}</span>
              <span className="text-xs text-text-tertiary px-2 py-0.5 bg-bg-tertiary rounded">
                {engineLabels[engine] || engine}
              </span>
              {citationCount !== undefined && (
                <span className="text-xs text-text-tertiary">
                  {citationCount} {citationCount === 1 ? "citation" : "citations"}
                </span>
              )}
            </div>
            <p className="font-medium text-text-primary truncate">{skuName}</p>
            <p className="text-sm text-text-secondary mt-1 line-clamp-2">{reason}</p>
          </div>
        </div>
        <span className="flex-shrink-0 ml-4 mt-1 text-text-tertiary">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </span>
      </button>

      {expanded && (
        <div className="px-5 pb-5 border-t border-border/50 pt-4 space-y-4">
          <div>
            <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
              Diagnosis
            </h4>
            <p className="text-sm text-text-primary leading-relaxed">{reason}</p>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
              Recommended Fix
            </h4>
            <p className="text-sm text-text-primary leading-relaxed">{fix}</p>
          </div>

          {missingElements.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                Missing Elements
              </h4>
              <div className="flex flex-wrap gap-2">
                {missingElements.map((el, i) => (
                  <span
                    key={i}
                    className="px-2 py-1 bg-bg-tertiary text-text-secondary text-xs rounded"
                  >
                    {el}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
