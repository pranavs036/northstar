"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Globe,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Eye,
  EyeOff,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { TierScores, BrandScanResult } from "@/types/brand-scan";

interface BrandScanWidgetProps {
  brandName: string;
  brandDomain: string;
  brandDescription?: string;
  categories?: string[];
}

interface ScanStatus {
  exists: boolean;
  scan: {
    id: string;
    status: "PENDING" | "SCANNING" | "COMPLETE" | "FAILED";
    visibilityScore: number;
    totalQueries: number;
    completedQueries: number;
    brandVisibleCount: number;
    tierScores: TierScores | null;
    results: BrandScanResult[];
    completedAt: string | null;
    created: string;
  } | null;
}

const TIER_LABELS: Record<string, string> = {
  awareness: "Brand Awareness",
  category: "Category Ownership",
  intent: "Intent Matching",
  competitor: "Competitive Battle",
  thought_leadership: "Thought Leadership",
};

const TIER_DESCRIPTIONS: Record<string, string> = {
  awareness: "Do AI engines know your brand?",
  category: "Do you own your category in AI search?",
  intent: "Are you recommended for customer needs?",
  competitor: "How do you compare vs competitors?",
  thought_leadership: "Do you appear in industry conversations?",
};

// Category-to-buyer-queries mapping
// These are what REAL PEOPLE type when they want to buy something in this category
const CATEGORY_BUYER_QUERIES: Record<string, string[]> = {
  // Audio / Electronics
  audio: ["best earbuds under 2000", "wireless headphones for gym", "noise cancelling earbuds India", "earbuds with best bass", "headphones under 5000"],
  earbuds: ["best TWS earbuds under 1500", "earbuds for running", "best earbuds under 2000 India", "wireless earbuds with ANC"],
  headphones: ["best over ear headphones under 3000", "headphones for music production", "wireless headphones under 5000", "bluetooth headphones long battery"],
  speakers: ["best portable bluetooth speaker", "party speaker under 5000", "waterproof speaker for travel", "soundbar for TV under 10000"],
  smartwatches: ["best smartwatch under 3000 India", "fitness tracker with heart rate", "smartwatch for android under 5000"],
  // Furniture / Home
  mattresses: ["best mattress for back pain India", "memory foam mattress under 15000", "orthopedic mattress online", "best mattress brand India 2026"],
  furniture: ["study table under 5000", "office chair for work from home", "sofa set under 20000", "bed with storage online India"],
  pillows: ["best pillow for neck pain", "memory foam pillow India", "sleeping pillow under 1000"],
  // Fashion
  "t-shirts": ["oversized t-shirts for men", "graphic tees under 500", "best t-shirt brands India", "cotton t-shirts online"],
  "casual wear": ["streetwear brands India", "affordable casual clothing online", "trendy clothes under 1000"],
  hoodies: ["best hoodies under 1000 India", "oversized hoodies for men", "winter hoodies online"],
  joggers: ["joggers for men under 800", "track pants online India", "comfortable joggers for gym"],
  // Refurbished / Used
  electronics: ["refurbished phones under 15000", "second hand laptop India", "used electronics with warranty"],
  "living room": ["second hand sofa online", "used furniture Delhi NCR", "affordable sofa under 10000"],
  bedroom: ["used bed with mattress", "second hand furniture near me", "affordable bed frames online"],
  kitchen: ["refurbished kitchen appliances", "used mixer grinder online", "second hand OTG oven"],
  accessories: ["phone case under 500", "affordable accessories online India"],
};

function getSuggestedKeywords(brandName: string, brandDomain: string, categories?: string[]): string[] {
  const name = brandName.toLowerCase();
  const keywords: string[] = [];

  // 1. BUYER INTENT QUERIES — the main chunk (what people actually search)
  if (categories && categories.length > 0) {
    for (const cat of categories) {
      const catLower = cat.toLowerCase();
      // Try exact match first, then partial match
      const queries = CATEGORY_BUYER_QUERIES[catLower] ||
        Object.entries(CATEGORY_BUYER_QUERIES).find(([key]) => catLower.includes(key) || key.includes(catLower))?.[1] ||
        [`best ${catLower} online India`, `top ${catLower} under 5000`, `${catLower} recommendations 2026`];
      keywords.push(...queries.slice(0, 3));
    }
  }

  // 2. AWARENESS — just 2, not the whole list
  keywords.push(`${name} reviews India`);
  keywords.push(`is ${name} worth buying`);

  // Deduplicate and limit
  return Array.from(new Set(keywords)).slice(0, 10);
}

export function BrandScanWidget({ brandName, brandDomain, brandDescription, categories }: BrandScanWidgetProps) {
  const [status, setStatus] = useState<ScanStatus | null>(null);
  const [statusLoaded, setStatusLoaded] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanMessage, setScanMessage] = useState("");
  const [showDetails, setShowDetails] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const suggestedKeywords = getSuggestedKeywords(brandName, brandDomain, categories);

  // Fetch existing scan status
  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/brand-scan/status");
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
        setStatusLoaded(true);
        return data;
      }
    } catch (err) {
      console.error("[BrandScanWidget] Failed to fetch status:", err);
    }
    setStatusLoaded(true);
    return null;
  }, []);

  // On mount: fetch status. If a scan is running, resume polling.
  useEffect(() => {
    fetchStatus().then((data) => {
      if (data?.scan?.status === "SCANNING") {
        setIsScanning(true);
        setScanMessage("Scan in progress...");
        setScanProgress(data.scan.completedQueries && data.scan.totalQueries
          ? Math.round((data.scan.completedQueries / data.scan.totalQueries) * 100)
          : 10);
        pollStatus();
      }
    });
  }, [fetchStatus]);

  const pollStatus = useCallback(() => {
    const interval = setInterval(async () => {
      const data = await fetchStatus();
      if (!data?.scan) return;

      if (data.scan.status === "SCANNING") {
        const progress = data.scan.completedQueries && data.scan.totalQueries
          ? Math.round((data.scan.completedQueries / data.scan.totalQueries) * 100)
          : 10;
        setScanProgress(progress);
        setScanMessage(`Scanning... ${data.scan.completedQueries || 0}/${data.scan.totalQueries || 20} queries`);
      }

      if (data.scan.status === "COMPLETE" || data.scan.status === "FAILED") {
        clearInterval(interval);
        setIsScanning(false);
        if (data.scan.status === "COMPLETE") {
          setNotification(
            `Brand scan complete! Score: ${data.scan.visibilityScore}/100`
          );
          setTimeout(() => setNotification(null), 8000);
        }
      }
    }, 5000);

    // Cleanup on unmount
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const startScan = async () => {
    if (isScanning) return;
    setIsScanning(true);
    setScanProgress(0);
    setScanMessage("Starting brand scan...");

    try {
      // Fire-and-forget: start the scan, then poll for status
      // This way navigating away doesn't kill the scan
      const res = await fetch("/api/brand-scan/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandDescription: brandDescription || `${brandName} is an online platform at ${brandDomain}`,
          categories: categories && categories.length > 0 ? categories : ["general products"],
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        if (res.status === 409) {
          setScanMessage("Scan already in progress...");
        } else {
          throw new Error(err.error || "Failed to start scan");
        }
      }

      // Don't read the SSE stream — just poll for status
      // The server continues scanning in the background
      setScanMessage("Scan started! Polling for progress...");
      pollStatus();

    } catch (err) {
      console.error("[BrandScanWidget] Scan failed:", err);
      setScanMessage("Scan failed. Try again.");
      setIsScanning(false);
    }
  };

  const scan = status?.scan;
  const isComplete = scan?.status === "COMPLETE";
  const tierScores = scan?.tierScores;

  return (
    <>
      {/* Notification Banner */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-in slide-in-from-top duration-300">
          <Sparkles className="w-5 h-5" />
          <span className="font-medium">{notification}</span>
          <button
            onClick={() => setNotification(null)}
            className="ml-2 text-white/70 hover:text-white"
          >
            ×
          </button>
        </div>
      )}

      {/* Widget — renders inline, parent provides chrome */}
      <div>
          {/* Loading state — waiting for status check */}
          {!statusLoaded && !isScanning && (
            <div className="py-8 text-center">
              <Loader2 className="w-6 h-6 text-text-tertiary animate-spin mx-auto" />
              <p className="text-sm text-text-tertiary mt-2">Checking scan status...</p>
            </div>
          )}

          {/* Scanning State */}
          {isScanning && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-accent-primary animate-spin" />
                <span className="text-sm text-text-secondary">{scanMessage}</span>
              </div>
              <div className="w-full bg-bg-tertiary rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-indigo-500 to-violet-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${scanProgress}%` }}
                />
              </div>
              <p className="text-xs text-text-tertiary text-center">
                Scanning runs in the background — feel free to explore the platform
              </p>
            </div>
          )}

          {/* Stuck scan — exists but not complete and not actively scanning */}
          {statusLoaded && !isScanning && status?.exists && status.scan?.status === "SCANNING" && (
            <div className="py-4 space-y-4 text-center">
              <AlertTriangle className="w-8 h-8 text-warning mx-auto" />
              <p className="text-text-secondary">A previous scan didn&apos;t finish. Start a fresh one.</p>
              <button
                onClick={startScan}
                className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-lg font-medium hover:from-indigo-500 hover:to-violet-500 transition-all"
              >
                Restart Brand Scan
              </button>
            </div>
          )}

          {/* No Scan Yet */}
          {statusLoaded && !isScanning && !isComplete && (!status?.exists || status?.scan?.status === "FAILED") && (
            <div className="py-4 space-y-4">
              <p className="text-text-tertiary text-center">
                Run a brand visibility scan to see how AI engines perceive {brandName}
              </p>

              {/* Suggested Keywords */}
              {suggestedKeywords.length > 0 && (
                <div className="bg-bg-tertiary/30 rounded-lg p-4">
                  <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                    Suggested search queries we&apos;ll test
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {suggestedKeywords.slice(0, 8).map((kw, i) => (
                      <span
                        key={i}
                        className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20"
                      >
                        {kw}
                      </span>
                    ))}
                    {suggestedKeywords.length > 8 && (
                      <span className="text-xs px-2.5 py-1 text-text-tertiary">
                        +{suggestedKeywords.length - 8} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className="text-center">
                <button
                  onClick={startScan}
                  className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-lg font-medium hover:from-indigo-500 hover:to-violet-500 transition-all"
                >
                  Start Brand Scan
                </button>
              </div>
            </div>
          )}

          {/* Completed Scan */}
          {isComplete && tierScores && (
            <div className="space-y-4">
              {/* Compact score row */}
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16 flex-shrink-0">
                  <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                    <circle cx="32" cy="32" r="26" fill="none" stroke="currentColor" strokeWidth="6" className="text-bg-tertiary" />
                    <circle cx="32" cy="32" r="26" fill="none" stroke="url(#scoreGradient)" strokeWidth="6" strokeLinecap="round"
                      strokeDasharray={`${(scan.visibilityScore / 100) * 163.4} 163.4`} />
                    <defs><linearGradient id="scoreGradient"><stop offset="0%" stopColor="#6366f1" /><stop offset="100%" stopColor="#8b5cf6" /></linearGradient></defs>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg font-bold text-text-primary">{scan.visibilityScore}</span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-primary">
                    {scan.visibilityScore >= 70 ? "Strong" : scan.visibilityScore >= 40 ? "Moderate" : "Low"} Visibility
                  </p>
                  <p className="text-xs text-text-tertiary">
                    {scan.brandVisibleCount}/{scan.results?.length || 0} queries &bull;
                    <button onClick={() => startScan()} disabled={isScanning} className="text-accent-primary hover:text-accent-secondary ml-1">Re-scan</button>
                  </p>
                </div>
              </div>

              {/* Compact Tier Breakdown — skip thought_leadership */}
              <div className="space-y-2">
                {Object.entries(tierScores)
                  .filter(([tier]) => tier !== "thought_leadership")
                  .map(([tier, scores]) => (
                  <div key={tier} className="flex items-center gap-2 text-xs">
                    <span className="text-text-tertiary w-24 flex-shrink-0 truncate">
                      {TIER_LABELS[tier] || tier}
                    </span>
                    <div className="flex-1 bg-bg-tertiary rounded-full h-1">
                      <div
                        className={cn(
                          "h-1 rounded-full",
                          scores.score >= 70 ? "bg-green-500" : scores.score >= 40 ? "bg-yellow-500" : "bg-red-500"
                        )}
                        style={{ width: `${scores.score}%` }}
                      />
                    </div>
                    <span className={cn("w-10 text-right font-medium", scores.score >= 70 ? "text-green-400" : scores.score >= 40 ? "text-yellow-400" : "text-red-400")}>
                      {scores.score}/100
                    </span>
                  </div>
                ))}
              </div>

              {/* Last scanned */}
              {scan.completedAt && (
                <p className="text-xs text-text-tertiary mt-2">
                  Scanned {new Date(scan.completedAt).toLocaleDateString()}
                </p>
              )}
            </div>
          )}

          {/* Failed State */}
          {scan?.status === "FAILED" && (
            <div className="text-center py-4 space-y-3">
              <AlertTriangle className="w-8 h-8 text-red-400 mx-auto" />
              <p className="text-text-secondary">Brand scan failed</p>
              <button
                onClick={startScan}
                disabled={isScanning}
                className="px-4 py-2 bg-accent-primary text-white rounded-lg text-sm hover:bg-accent-secondary transition-colors"
              >
                Retry
              </button>
            </div>
          )}
      </div>
    </>
  );
}
