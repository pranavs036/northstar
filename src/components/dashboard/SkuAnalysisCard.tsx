"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Loader2,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle2,
  Play,
  ChevronRight,
} from "lucide-react";

interface SkuScanProgress {
  skuId: string;
  skuName: string;
  engine: string;
  visible: boolean;
}

interface AuditData {
  id: string;
  status: "PENDING" | "SCANNING" | "ANALYZING" | "COMPLETE" | "FAILED";
  agentScore: number | null;
  completedAt: string | null;
  created: string;
  scanCount: number;
  visibleCount: number;
  skuProgress: SkuScanProgress[];
  totalSkus: number;
}

interface AuditStatusResponse {
  exists: boolean;
  audit: AuditData | null;
}

interface SkuAnalysisCardProps {
  totalSkus: number;
  linkTo?: string;
}

export function SkuAnalysisCard({ totalSkus, linkTo = "/catalog/analysis" }: SkuAnalysisCardProps) {
  const [auditStatus, setAuditStatus] = useState<AuditStatusResponse | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/audit/status");
      if (res.ok) {
        const data: AuditStatusResponse = await res.json();
        setAuditStatus(data);
        setLoaded(true);
        return data;
      }
    } catch (err) {
      console.error("[SkuAnalysisCard] fetch error:", err);
    }
    setLoaded(true);
    return null;
  }, []);

  // Poll when audit is in progress
  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  useEffect(() => {
    if (!auditStatus?.audit) return;
    const s = auditStatus.audit.status;
    if (s !== "SCANNING" && s !== "ANALYZING" && s !== "PENDING") return;

    const interval = setInterval(async () => {
      const data = await fetchStatus();
      if (!data?.audit) return;
      if (data.audit.status === "COMPLETE" || data.audit.status === "FAILED") {
        clearInterval(interval);
        setIsStarting(false);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [auditStatus?.audit?.status, fetchStatus]);

  const startAudit = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isStarting) return;
    setIsStarting(true);

    try {
      const res = await fetch("/api/audit/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to start audit");
      }
      // Re-fetch to pick up the new audit
      await fetchStatus();
    } catch (err) {
      console.error("[SkuAnalysisCard] start failed:", err);
      setIsStarting(false);
    }
  };

  const audit = auditStatus?.audit;
  const isRunning =
    isStarting ||
    audit?.status === "SCANNING" ||
    audit?.status === "ANALYZING" ||
    audit?.status === "PENDING";
  const isComplete = audit?.status === "COMPLETE";

  // Compute summary stats from skuProgress when complete
  const notFoundCount = audit
    ? audit.scanCount - audit.visibleCount
    : 0;

  // Deduplicate skuProgress to get unique alarming SKUs (not visible)
  const alarmingSkus = audit?.skuProgress
    ? Array.from(
        new Map(
          audit.skuProgress
            .filter((s) => !s.visible)
            .map((s) => [s.skuId, s])
        ).values()
      ).slice(0, 3)
    : [];

  // --- No SKUs at all ---
  if (totalSkus === 0) {
    return (
      <div className="p-4">
        <p className="text-sm text-text-tertiary">
          Upload your catalog to start scanning.
        </p>
      </div>
    );
  }

  // --- Loading state ---
  if (!loaded) {
    return (
      <div className="p-4 flex items-center gap-2">
        <Loader2 className="w-4 h-4 text-text-tertiary animate-spin" />
        <span className="text-sm text-text-tertiary">Checking audit status...</span>
      </div>
    );
  }

  // --- No audit has run yet ---
  if (!audit || (!isRunning && !isComplete && audit.status === "FAILED")) {
    return (
      <div className="p-4 space-y-3">
        <p className="text-sm text-text-secondary">
          {totalSkus} SKU{totalSkus !== 1 ? "s" : ""} ready. Start an audit to scan visibility.
        </p>
        <button
          onClick={startAudit}
          disabled={isStarting}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg text-sm font-medium hover:from-green-500 hover:to-emerald-500 transition-all disabled:opacity-50"
        >
          {isStarting ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Play className="w-3.5 h-3.5" />
          )}
          Run Audit
        </button>
      </div>
    );
  }

  // --- Audit is running ---
  if (isRunning) {
    const skuCount = audit?.totalSkus || totalSkus;
    // Estimate unique SKUs scanned from progress
    const uniqueScanned = audit?.skuProgress
      ? new Set(audit.skuProgress.map((s) => s.skuId)).size
      : 0;
    const latestResult = audit?.skuProgress?.[0];

    return (
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 text-accent-primary animate-spin" />
            <span className="text-sm text-text-secondary font-medium">
              Scanning {uniqueScanned}/{skuCount} SKUs...
            </span>
          </div>
          <span className="text-xs text-text-tertiary font-mono">
            {audit?.scanCount || 0} scans
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-bg-tertiary rounded-full h-1.5">
          <div
            className="bg-gradient-to-r from-green-500 to-emerald-500 h-1.5 rounded-full transition-all duration-500"
            style={{
              width: `${skuCount > 0 ? Math.min(Math.round((uniqueScanned / skuCount) * 100), 95) : 10}%`,
            }}
          />
        </div>

        {/* Latest scan result */}
        {latestResult && (
          <Link
            href={`/catalog/${latestResult.skuId}`}
            className="flex items-center gap-2 text-sm px-2.5 py-1.5 bg-bg-tertiary/30 rounded-lg hover:bg-bg-tertiary/50 transition-colors"
          >
            {latestResult.visible ? (
              <Eye className="w-3.5 h-3.5 text-success flex-shrink-0" />
            ) : (
              <EyeOff className="w-3.5 h-3.5 text-error flex-shrink-0" />
            )}
            <span className="text-text-primary truncate text-xs">{latestResult.skuName}</span>
            <span className="text-xs text-text-tertiary flex-shrink-0 ml-auto">
              {latestResult.visible ? "visible" : "not found"} on {latestResult.engine}
            </span>
          </Link>
        )}
      </div>
    );
  }

  // --- Audit complete ---
  if (isComplete && audit) {
    const allGood = alarmingSkus.length === 0 && audit.visibleCount > 0;

    return (
      <div className="p-4 space-y-3">
        {/* Mini summary row */}
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1 text-success">
            <Eye className="w-3.5 h-3.5" />
            {audit.visibleCount} visible
          </span>
          {notFoundCount > 0 && (
            <span className="flex items-center gap-1 text-error">
              <EyeOff className="w-3.5 h-3.5" />
              {notFoundCount} not found
            </span>
          )}
          {alarmingSkus.length > 0 && (
            <span className="flex items-center gap-1 text-warning">
              <AlertTriangle className="w-3.5 h-3.5" />
              {alarmingSkus.length} critical
            </span>
          )}
        </div>

        {/* Alarming SKUs or all-good message */}
        {allGood ? (
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
            <span className="text-text-secondary">
              All {audit.totalSkus || totalSkus} SKUs performing well
            </span>
          </div>
        ) : (
          <div className="space-y-1.5">
            {alarmingSkus.map((s) => (
              <Link
                key={s.skuId}
                href={`/catalog/${s.skuId}`}
                className="flex items-center gap-2 text-sm hover:bg-bg-tertiary/30 rounded px-1 -mx-1 py-0.5 transition-colors"
              >
                <EyeOff className="w-3.5 h-3.5 text-error flex-shrink-0" />
                <span className="text-text-primary truncate">{s.skuName}</span>
                <span className="text-xs text-error flex-shrink-0 ml-auto">
                  not visible
                </span>
                <ChevronRight className="w-3 h-3 text-text-tertiary flex-shrink-0" />
              </Link>
            ))}
          </div>
        )}

        {/* Action row */}
        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={startAudit}
            disabled={isStarting}
            className="text-xs text-accent-primary hover:text-accent-secondary font-medium disabled:opacity-50"
          >
            {isStarting ? "Starting..." : "Run Audit"}
          </button>
          <Link
            href={linkTo}
            className="text-xs text-text-tertiary hover:text-text-secondary"
          >
            View Analysis
          </Link>
        </div>
      </div>
    );
  }

  // --- Fallback: no audit exists at all ---
  return (
    <div className="p-4 space-y-3">
      <p className="text-sm text-text-secondary">
        {totalSkus} SKU{totalSkus !== 1 ? "s" : ""} ready. Start an audit to scan visibility.
      </p>
      <button
        onClick={startAudit}
        disabled={isStarting}
        className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg text-sm font-medium hover:from-green-500 hover:to-emerald-500 transition-all disabled:opacity-50"
      >
        {isStarting ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Play className="w-3.5 h-3.5" />
        )}
        Run Audit
      </button>
    </div>
  );
}
