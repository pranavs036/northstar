"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2, XCircle, Search, Brain, Zap } from "lucide-react";

interface AuditEvent {
  type: string;
  data: {
    auditId: string;
    message: string;
    progress?: number;
    skuName?: string;
    engine?: string;
    severity?: string;
  };
}

export function AuditProgress() {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "running" | "complete" | "error">("idle");
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [progress, setProgress] = useState(0);
  const [auditId, setAuditId] = useState<string | null>(null);

  const startAudit = useCallback(async () => {
    setStatus("running");
    setEvents([]);
    setProgress(0);

    try {
      const response = await fetch("/api/audit/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to start audit");
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
              const event: AuditEvent = { type: currentEvent, data };

              setEvents((prev) => [...prev, event]);

              if (data.progress !== undefined) {
                setProgress(data.progress);
              }

              if (data.auditId) {
                setAuditId(data.auditId);
              }

              if (currentEvent === "audit:complete") {
                setStatus("complete");
              } else if (currentEvent === "audit:error") {
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
          type: "audit:error",
          data: {
            auditId: "",
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
    if (type.includes("query")) return <Search className="w-4 h-4" />;
    if (type.includes("scan")) return <Search className="w-4 h-4" />;
    if (type.includes("diagnos")) return <Brain className="w-4 h-4" />;
    if (type.includes("scor")) return <Zap className="w-4 h-4" />;
    if (type.includes("complete")) return <CheckCircle2 className="w-4 h-4 text-success" />;
    if (type.includes("error")) return <XCircle className="w-4 h-4 text-error" />;
    return <Loader2 className="w-4 h-4 animate-spin" />;
  };

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case "CRITICAL": return "text-error";
      case "HIGH": return "text-warning";
      case "MEDIUM": return "text-info";
      case "LOW": return "text-text-tertiary";
      default: return "";
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress bar */}
      <div className="bg-bg-secondary border border-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-text-primary">
            {status === "idle" && "Preparing audit..."}
            {status === "running" && "Audit in progress..."}
            {status === "complete" && "Audit complete!"}
            {status === "error" && "Audit failed"}
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

      {/* Event log */}
      <div className="bg-bg-secondary border border-border rounded-lg p-6">
        <h3 className="text-sm font-semibold text-text-secondary mb-4 uppercase tracking-wider">
          Activity Log
        </h3>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {events.map((event, i) => (
            <div key={i} className="flex items-start gap-3 text-sm">
              <span className="mt-0.5 flex-shrink-0">{getEventIcon(event.type)}</span>
              <div className="min-w-0 flex-1">
                <p className="text-text-primary">{event.data.message}</p>
                {event.data.severity && (
                  <span className={`text-xs font-medium ${getSeverityColor(event.data.severity)}`}>
                    {event.data.severity}
                  </span>
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
      {status === "complete" && auditId && (
        <div className="flex gap-4">
          <button
            onClick={() => router.push(`/audit/${auditId}`)}
            className="px-6 py-3 bg-accent-primary text-white rounded-lg hover:bg-accent-secondary transition-colors font-medium"
          >
            View Results
          </button>
          <button
            onClick={() => router.push("/audit")}
            className="px-6 py-3 bg-bg-tertiary text-text-secondary rounded-lg hover:bg-bg-secondary transition-colors font-medium"
          >
            All Audits
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
            onClick={() => router.push("/audit")}
            className="px-6 py-3 bg-bg-tertiary text-text-secondary rounded-lg hover:bg-bg-secondary transition-colors font-medium"
          >
            Back to Audits
          </button>
        </div>
      )}
    </div>
  );
}
