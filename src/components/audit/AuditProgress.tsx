"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, CheckCircle2, XCircle, AlertTriangle, Eye, EyeOff } from "lucide-react";

interface SkuScanProgress {
  skuId: string;
  skuName: string;
  engine: string;
  visible: boolean;
}

interface AuditStatus {
  exists: boolean;
  audit: {
    id: string;
    status: "PENDING" | "SCANNING" | "ANALYZING" | "COMPLETE" | "FAILED";
    agentScore: number | null;
    completedAt: string | null;
    created: string;
    scanCount: number;
    visibleCount: number;
    skuProgress: SkuScanProgress[];
  } | null;
}

export function AuditProgress() {
  const router = useRouter();
  const [auditStatus, setAuditStatus] = useState<AuditStatus | null>(null);
  const [statusLoaded, setStatusLoaded] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [message, setMessage] = useState("");

  const fetchAuditStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/audit/status");
      if (res.ok) {
        const data = await res.json();
        setAuditStatus(data);
        setStatusLoaded(true);
        return data;
      }
    } catch (err) {
      console.error("[AuditProgress] Failed to fetch status:", err);
    }
    setStatusLoaded(true);
    return null;
  }, []);

  const pollStatus = useCallback(() => {
    const interval = setInterval(async () => {
      const data = await fetchAuditStatus();
      if (!data?.audit) return;

      const s = data.audit.status;
      if (s === "SCANNING" || s === "ANALYZING") {
        setMessage(`Scanning... ${data.audit.scanCount} results so far`);
      }
      if (s === "COMPLETE" || s === "FAILED") {
        clearInterval(interval);
        setIsStarting(false);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchAuditStatus]);

  // On mount: check if an audit is already running
  useEffect(() => {
    fetchAuditStatus().then((data) => {
      if (data?.audit?.status === "SCANNING" || data?.audit?.status === "ANALYZING" || data?.audit?.status === "PENDING") {
        setIsStarting(true);
        setMessage("Audit in progress...");
        pollStatus();
      }
    });
  }, [fetchAuditStatus, pollStatus]);

  const startAudit = async () => {
    if (isStarting) return;

    // Check if an audit is already running
    const current = await fetchAuditStatus();
    if (current?.audit?.status === "SCANNING" || current?.audit?.status === "ANALYZING" || current?.audit?.status === "PENDING") {
      setIsStarting(true);
      setMessage("Audit already in progress...");
      pollStatus();
      return;
    }

    setIsStarting(true);
    setMessage("Starting audit...");

    try {
      // Fire-and-forget: start the audit, don't read the SSE stream
      const res = await fetch("/api/audit/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to start audit");
      }

      // Don't await the SSE stream — just poll
      setMessage("Audit started! Scanning SKUs across AI engines...");
      pollStatus();

    } catch (err) {
      console.error("[AuditProgress] Start failed:", err);
      setMessage(err instanceof Error ? err.message : "Failed to start audit");
      setIsStarting(false);
    }
  };

  const audit = auditStatus?.audit;
  const isRunning = isStarting || audit?.status === "SCANNING" || audit?.status === "ANALYZING" || audit?.status === "PENDING";
  const isComplete = audit?.status === "COMPLETE";
  const isFailed = audit?.status === "FAILED";

  return (
    <div className="space-y-6">
      {/* Status card */}
      <div className="bg-bg-secondary border border-border rounded-lg p-6">
        {/* Loading */}
        {!statusLoaded && (
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-text-tertiary animate-spin" />
            <span className="text-sm text-text-tertiary">Checking audit status...</span>
          </div>
        )}

        {/* No audit yet — show start button */}
        {statusLoaded && !isRunning && !isComplete && !isFailed && (
          <div className="text-center py-4">
            <p className="text-text-tertiary mb-4">
              Run an audit to scan your catalog across AI engines and diagnose visibility gaps.
            </p>
            <button
              onClick={startAudit}
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-lg font-medium hover:from-indigo-500 hover:to-violet-500 transition-all"
            >
              Start SKU Audit
            </button>
          </div>
        )}

        {/* Running */}
        {isRunning && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-accent-primary animate-spin" />
                <span className="text-sm text-text-secondary">{message}</span>
              </div>
              {audit && (
                <span className="text-xs text-text-tertiary font-mono">
                  {audit.scanCount} scans
                </span>
              )}
            </div>
            <div className="w-full bg-bg-tertiary rounded-full h-2">
              <div
                className="bg-gradient-to-r from-indigo-500 to-violet-500 h-2 rounded-full transition-all duration-500 animate-pulse"
                style={{ width: "60%" }}
              />
            </div>

            {/* Per-SKU live results */}
            {audit?.skuProgress && audit.skuProgress.length > 0 && (
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                <p className="text-xs text-text-tertiary uppercase tracking-wider font-semibold">Recent scans</p>
                {audit.skuProgress.slice(0, 10).map((s, i) => (
                  <Link
                    key={i}
                    href={`/catalog/${s.skuId}`}
                    className="flex items-center justify-between px-3 py-2 bg-bg-tertiary/30 rounded-lg hover:bg-bg-tertiary/50 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {s.visible ? (
                        <Eye className="w-3.5 h-3.5 text-success flex-shrink-0" />
                      ) : (
                        <EyeOff className="w-3.5 h-3.5 text-error flex-shrink-0" />
                      )}
                      <span className="text-xs text-text-primary truncate">{s.skuName}</span>
                    </div>
                    <span className="text-xs text-text-tertiary flex-shrink-0 ml-2">{s.engine}</span>
                  </Link>
                ))}
              </div>
            )}

            <p className="text-xs text-text-tertiary text-center">
              Navigate away freely — audit continues in background.
            </p>
          </div>
        )}

        {/* Complete */}
        {isComplete && audit && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-success" />
              <div>
                <p className="text-text-primary font-semibold">Audit Complete</p>
                <p className="text-sm text-text-tertiary">
                  Agent-Readiness Score: {audit.agentScore ?? 0}/100 &bull; {audit.visibleCount}/{audit.scanCount} visible
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => router.push(`/audit/${audit.id}`)}
                className="px-5 py-2 bg-accent-primary text-white rounded-lg text-sm hover:bg-accent-secondary transition-colors font-medium"
              >
                View Results
              </button>
              <button
                onClick={startAudit}
                className="px-5 py-2 bg-bg-tertiary text-text-secondary rounded-lg text-sm hover:bg-bg-secondary transition-colors font-medium"
              >
                Run New Audit
              </button>
            </div>
          </div>
        )}

        {/* Failed */}
        {isFailed && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-error" />
              <div>
                <p className="text-text-primary font-semibold">Audit Failed</p>
                <p className="text-sm text-text-tertiary">Something went wrong. Try again.</p>
              </div>
            </div>
            <button
              onClick={startAudit}
              className="px-5 py-2 bg-accent-primary text-white rounded-lg text-sm hover:bg-accent-secondary transition-colors font-medium"
            >
              Retry Audit
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
