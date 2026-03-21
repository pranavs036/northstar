"use client";

import { useState } from "react";
import { Copy, Check, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";

interface SchemaFixCardProps {
  skuName: string;
  url: string;
  score: number;
  missingRequired: string[];
  missingOptional: string[];
  fixedJsonLd: string;
  changes: string[];
}

function getScoreBadgeClasses(score: number): string {
  if (score <= 30) return "text-error bg-error/10";
  if (score <= 60) return "text-warning bg-warning/10";
  if (score <= 80) return "text-info bg-info/10";
  return "text-success bg-success/10";
}

function getScoreLabel(score: number): string {
  if (score <= 30) return "Poor";
  if (score <= 60) return "Needs Work";
  if (score <= 80) return "Good";
  return "Excellent";
}

export function SchemaFixCard({
  skuName,
  url,
  score,
  missingRequired,
  missingOptional,
  fixedJsonLd,
  changes,
}: SchemaFixCardProps) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleCopy = async () => {
    if (!fixedJsonLd) return;
    try {
      await navigator.clipboard.writeText(fixedJsonLd);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = fixedJsonLd;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const badgeClasses = getScoreBadgeClasses(score);
  const scoreLabel = getScoreLabel(score);

  return (
    <div className="bg-bg-secondary border border-border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-border">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-text-primary truncate">{skuName}</h3>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-text-tertiary hover:text-accent-primary transition-colors mt-0.5 truncate"
            >
              <ExternalLink className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{url}</span>
            </a>
          </div>
          <span
            className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-semibold ${badgeClasses}`}
          >
            {score}/100 · {scoreLabel}
          </span>
        </div>
      </div>

      {/* Missing properties */}
      {(missingRequired.length > 0 || missingOptional.length > 0) && (
        <div className="p-5 border-b border-border space-y-3">
          {missingRequired.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-error uppercase tracking-wider mb-2">
                Missing Required ({missingRequired.length})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {missingRequired.map((prop) => (
                  <span
                    key={prop}
                    className="px-2 py-0.5 rounded text-xs font-mono bg-error/10 text-error border border-error/20"
                  >
                    {prop}
                  </span>
                ))}
              </div>
            </div>
          )}
          {missingOptional.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2">
                Missing Optional ({missingOptional.length})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {missingOptional.map((prop) => (
                  <span
                    key={prop}
                    className="px-2 py-0.5 rounded text-xs font-mono bg-bg-tertiary text-text-tertiary border border-border"
                  >
                    {prop}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Changes summary */}
      {changes.length > 0 && (
        <div className="px-5 py-3 border-b border-border">
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
            Suggested Changes
          </p>
          <ul className="space-y-1">
            {changes.map((change, i) => (
              <li key={i} className="text-xs text-text-secondary flex items-start gap-1.5">
                <span className="text-success mt-0.5">+</span>
                <span>{change}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* JSON-LD actions */}
      {fixedJsonLd && (
        <div className="p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Fixed JSON-LD
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-accent-primary text-white rounded text-xs font-medium hover:bg-accent-secondary transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    Copy JSON-LD
                  </>
                )}
              </button>
              <button
                onClick={() => setExpanded((v) => !v)}
                className="flex items-center gap-1 px-3 py-1.5 bg-bg-tertiary text-text-secondary rounded text-xs font-medium hover:bg-border transition-colors"
              >
                {expanded ? (
                  <>
                    <ChevronUp className="w-3 h-3" />
                    Hide
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3 h-3" />
                    Preview
                  </>
                )}
              </button>
            </div>
          </div>
          {expanded && (
            <pre className="bg-bg-tertiary border border-border rounded p-4 text-xs text-text-secondary overflow-x-auto whitespace-pre-wrap break-words max-h-64 overflow-y-auto font-mono">
              {fixedJsonLd}
            </pre>
          )}
        </div>
      )}

      {/* No fix available */}
      {!fixedJsonLd && score >= 60 && (
        <div className="px-5 py-4">
          <p className="text-xs text-text-tertiary">No fix required — schema completeness is acceptable.</p>
        </div>
      )}
    </div>
  );
}
