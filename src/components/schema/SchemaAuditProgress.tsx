"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2, XCircle, Globe, Wrench, Zap } from "lucide-react";

export interface SchemaSkuResult {
  skuId: string;
  skuName: string;
  url: string;
  score: number;
  missingRequired: string[];
  missingOptional: string[];
  fixedJsonLd: string;
  changes: string[];
}

export interface SchemaAuditSummary {
  averageScore: number;
  totalAudited: number;
  skusWithFixes: number;
  results: SchemaSkuResult[];
  completedAt: string;
}

interface SchemaEvent {
  type: string;
  data: {
    message: string;
    progress?: number;
    skuName?: string;
    url?: string;
    score?: number;
    averageScore?: number;
    totalAudited?: number;
    skusWithFixes?: number;
    results?: SchemaSkuResult[];
  };
}

interface SchemaAuditProgressProps {
  skuCount: number;
}

export function SchemaAuditProgress({ skuCount }: SchemaAuditProgressProps) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "running" | "complete" | "error">("idle");
  const [events, setEvents] = useState<SchemaEvent[]>([]);
  const [progress, setProgress] = useState(0);
  const [summary, setSummary] = useState<{
    averageScore: number;
    totalAudited: number;
    skusWithFixes: number;
  } | null>(null);

  const startAudit = useCallback(async () => {
    setStatus("running");
    setEvents([]);
    setProgress(0);
    setSummary(null);

    try {
      const response = await fetch("/api/schema-audit/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to start schema audit");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        let currentEvent = "";
        for (const line of lines) {
          if (line.startsWith("event: ")) {
            currentEvent = line.slice(7);
          } else if (line.startsWith("data: ") && currentEvent) {
            try {
              const data = JSON.parse(line.slice(6));
              const event: SchemaEvent = { type: currentEvent, data };

              setEvents((prev) => [...prev, event]);

              if (data.progress !== undefined) {
                setProgress(data.progress);
              }

              if (currentEvent === "schema:complete") {
                setStatus("complete");
                const completeSummary: SchemaAuditSummary = {
                  averageScore: data.averageScore ?? 0,
                  totalAudited: data.totalAudited ?? 0,
                  skusWithFixes: data.skusWithFixes ?? 0,
                  results: data.results ?? [],
                  completedAt: new Date().toISOString(),
                };
                setSummary({
                  averageScore: completeSummary.averageScore,
                  totalAudited: completeSummary.totalAudited,
                  skusWithFixes: completeSummary.skusWithFixes,
                });
                try {
                  localStorage.setItem("schema_audit_latest", JSON.stringify(completeSummary));
                } catch {
                  // ignore storage errors
                }
              } else if (currentEvent === "schema:error") {
                setStatus("error");
              }
            } catch {
              // skip malformed events
            }
            currentEvent = "";
          }
        }
      }
    } catch (err) {
      setStatus("error");
      setEvents((prev) => [
        ...prev,
        {
          type: "schema:error",
          data: {
            message: err instanceof Error ? err.message : "Unknown error",
          },
        },
      ]);
    }
  }, []);

  useEffect(() => {
    startAudit();
  }, [startAudit]);

  const getEventIcon = (type: string) => {
    if (type === "schema:crawling") return <Globe className="w-4 h-4" />;
    if (type === "schema:fixing") return <Wrench className="w-4 h-4" />;
    if (type === "schema:complete") return <CheckCircle2 className="w-4 h-4 text-success" />;
    if (type === "schema:error") return <XCircle className="w-4 h-4 text-error" />;
    if (type === "schema:started") return <Zap className="w-4 h-4" />;
    return <Loader2 className="w-4 h-4 animate-spin" />;
  };

  return (
    <div className="space-y-6">
      {/* Progress bar */}
      <div className="bg-bg-secondary border border-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-text-primary">
            {status === "idle" && "Preparing schema audit..."}
            {status === "running" && `Auditing ${skuCount} product pages...`}
            {status === "complete" && "Schema audit complete!"}
            {status === "error" && "Schema audit failed"}
          </h2>
          <span className="text-sm text-text-tertiary font-mono">{progress}%</span>
        </div>
        <div className="w-full bg-bg-tertiary rounded-full h-3 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              status === "error"
                ? "bg-error"
                : status === "complete"
                  ? "bg-success"
                  : "bg-accent-primary"
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Summary on complete */}
      {status === "complete" && summary && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-bg-secondary border border-border rounded-lg p-5 text-center">
            <p className="text-3xl font-bold text-text-primary">{summary.totalAudited}</p>
            <p className="text-sm text-text-tertiary mt-1">SKUs audited</p>
          </div>
          <div className="bg-bg-secondary border border-border rounded-lg p-5 text-center">
            <p className="text-3xl font-bold text-text-primary">{summary.averageScore}</p>
            <p className="text-sm text-text-tertiary mt-1">Avg. completeness</p>
          </div>
          <div className="bg-bg-secondary border border-border rounded-lg p-5 text-center">
            <p className="text-3xl font-bold text-text-primary">{summary.skusWithFixes}</p>
            <p className="text-sm text-text-tertiary mt-1">Fixes available</p>
          </div>
        </div>
      )}

      {/* Event log */}
      <div className="bg-bg-secondary border border-border rounded-lg p-6">
        <h3 className="text-sm font-semibold text-text-secondary mb-4 uppercase tracking-wider">
          Activity Log
        </h3>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {events.map((event, i) => (
            <div key={i} className="flex items-start gap-3 text-sm">
              <span className="mt-0.5 flex-shrink-0 text-text-tertiary">
                {getEventIcon(event.type)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-text-primary">{event.data.message}</p>
                {event.data.score !== undefined && (
                  <p className="text-xs text-text-tertiary mt-0.5">
                    Score: {event.data.score}/100
                  </p>
                )}
              </div>
            </div>
          ))}
          {status === "running" && (
            <div className="flex items-center gap-3 text-sm text-text-tertiary">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Processing...</span>
            </div>
          )}
        </div>
      </div>

      {/* Action buttons */}
      {status === "complete" && (
        <div className="flex gap-4">
          <button
            onClick={() => router.push("/schema-audit")}
            className="px-6 py-3 bg-accent-primary text-white rounded-lg hover:bg-accent-secondary transition-colors font-medium"
          >
            View Results
          </button>
        </div>
      )}

      {status === "error" && (
        <div className="flex gap-4">
          <button
            onClick={() => {
              setStatus("idle");
              startAudit();
            }}
            className="px-6 py-3 bg-accent-primary text-white rounded-lg hover:bg-accent-secondary transition-colors font-medium"
          >
            Retry Audit
          </button>
          <button
            onClick={() => router.push("/schema-audit")}
            className="px-6 py-3 bg-bg-tertiary text-text-secondary rounded-lg hover:bg-bg-secondary transition-colors font-medium"
          >
            Back
          </button>
        </div>
      )}
    </div>
  );
}
