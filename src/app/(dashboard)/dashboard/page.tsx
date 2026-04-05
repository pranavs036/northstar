import { createServerClient } from "@/lib/pocketbase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Globe,
  Package,
  Zap,
  TrendingUp,
  AlertTriangle,
  ChevronRight,
  Eye,
  EyeOff,
} from "lucide-react";
import { BrandScanWidget } from "@/components/dashboard/BrandScanWidget";
import { SkuAnalysisCard } from "@/components/dashboard/SkuAnalysisCard";
import type { SkuRecord, ScanResultRecord, DiagnosisRecord } from "@/types/pocketbase";
import { calculateSkuVisibilityRate } from "@/lib/utils/scoring";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const pb = await createServerClient();

  if (!pb.authStore.isValid || !pb.authStore.record) {
    redirect("/login");
  }

  const user = pb.authStore.record;
  const userId = user.id;

  // Fetch data
  let skus: SkuRecord[] = [];
  try {
    skus = await pb.collection("skus").getFullList<SkuRecord>({ filter: `user="${userId}"` });
  } catch {
    // no skus
  }

  // Fetch scan results for SKU analysis
  const skuIds = skus.map((s) => s.id);
  let scanResults: ScanResultRecord[] = [];
  let diagnoses: DiagnosisRecord[] = [];

  if (skuIds.length > 0) {
    try {
      // Batch SKU IDs to avoid PocketBase filter length limits with large catalogs
      const BATCH_SIZE = 50;
      const batches: string[][] = [];
      for (let i = 0; i < skuIds.length; i += BATCH_SIZE) {
        batches.push(skuIds.slice(i, i + BATCH_SIZE));
      }

      const [scanBatches, diagBatches] = await Promise.all([
        Promise.all(batches.map((batch) => {
          const skuFilter = batch.map((id) => `sku="${id}"`).join("||");
          return pb.collection("scan_results").getFullList<ScanResultRecord>({ filter: skuFilter });
        })),
        Promise.all(batches.map((batch) => {
          const skuFilter = batch.map((id) => `sku="${id}"`).join("||");
          return pb.collection("diagnoses").getFullList<DiagnosisRecord>({ filter: skuFilter });
        })),
      ]);
      scanResults = scanBatches.flat();
      diagnoses = diagBatches.flat();
    } catch {
      // no results yet
    }
  }

  // Find alarming SKUs (0% visibility with scan data, or critical diagnoses)
  const alarmingSkus = skus
    .map((sku) => {
      const skuScans = scanResults.filter((r) => r.sku === sku.id);
      const skuDiags = diagnoses.filter((d) => d.sku === sku.id);
      const visRate = calculateSkuVisibilityRate(skuScans);
      const criticalCount = skuDiags.filter((d) => d.severity === "CRITICAL").length;
      return { sku, scanCount: skuScans.length, visRate, criticalCount };
    })
    .filter((s) => s.scanCount > 0 && (s.visRate === 0 || s.criticalCount > 0))
    .sort((a, b) => b.criticalCount - a.criticalCount)
    .slice(0, 3);

  // SKU stats
  const totalSkus = skus.length;
  const scannedSkus = skus.filter((s) => scanResults.some((r) => r.sku === s.id)).length;
  const categories = Array.from(new Set(skus.map((s) => s.category).filter(Boolean)));

  // Agent readiness: check how many SKUs have URLs (can be crawled for schema)
  const skusWithUrls = skus.filter((s) => s.url && s.url.startsWith("http")).length;
  const agentReadinessEstimate = totalSkus > 0 ? Math.round((skusWithUrls / totalSkus) * 100) : 0;

  // Latest brand scan
  let latestBrandScan: { id: string; visibilityScore: number; completedAt: string } | null = null;
  try {
    const result = await pb.collection("brand_scans").getList(1, 1, {
      filter: `user="${userId}" && status="COMPLETE"`,
      sort: "-created",
      fields: "id,visibilityScore,completedAt",
    });
    if (result.totalItems > 0) {
      const s = result.items[0];
      latestBrandScan = {
        id: s.id,
        visibilityScore: s.visibilityScore as number,
        completedAt: s.completedAt as string,
      };
    }
  } catch {
    // no scans
  }

  return (
    <div className="space-y-5">
      {/* Header — compact */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            {user.brandName || user.name || "Dashboard"}
          </h1>
          <p className="text-sm text-text-tertiary">AI search visibility overview</p>
        </div>
        <span className="text-xs text-text-tertiary">{user.domain}</span>
      </div>

      {/* 4 Cards — 2 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Card 1: Brand Analysis */}
        <div className="bg-bg-secondary border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-indigo-400" />
              <h3 className="font-semibold text-text-primary text-sm">Brand Analysis</h3>
            </div>
            {latestBrandScan && (
              <Link href={`/brand-scan/${latestBrandScan.id}`} className="text-xs text-accent-primary hover:text-accent-secondary flex items-center gap-1">
                Details <ChevronRight className="w-3 h-3" />
              </Link>
            )}
          </div>
          <div className="p-4">
            <BrandScanWidget
              brandName={user.brandName || "Your Brand"}
              brandDomain={user.domain || ""}
              categories={categories}
            />
          </div>
        </div>

        {/* Card 2: SKU Analysis */}
        <div className="bg-bg-secondary border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-green-400" />
              <h3 className="font-semibold text-text-primary text-sm">SKU Analysis</h3>
              <span className="text-xs text-text-tertiary">{totalSkus} products</span>
            </div>
            <Link href="/catalog/analysis" className="text-xs text-accent-primary hover:text-accent-secondary flex items-center gap-1">
              Analysis <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <SkuAnalysisCard totalSkus={totalSkus} linkTo="/catalog/analysis" />
        </div>

        {/* Card 3: Agent Readiness */}
        <div className="bg-bg-secondary border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <h3 className="font-semibold text-text-primary text-sm">Agent Readiness</h3>
            </div>
            <Link href="/catalog" className="text-xs text-accent-primary hover:text-accent-secondary flex items-center gap-1">
              Audit <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="p-4">
            {totalSkus === 0 ? (
              <p className="text-sm text-text-tertiary">Upload catalog first.</p>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-bold text-text-primary">{agentReadinessEstimate}%</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${agentReadinessEstimate >= 70 ? "bg-green-500/10 text-green-400" : agentReadinessEstimate >= 40 ? "bg-amber-500/10 text-amber-400" : "bg-red-500/10 text-red-400"}`}>
                    {agentReadinessEstimate >= 70 ? "Good" : agentReadinessEstimate >= 40 ? "Needs work" : "Poor"}
                  </span>
                </div>
                <div className="w-full bg-bg-tertiary rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full ${agentReadinessEstimate >= 70 ? "bg-green-500" : agentReadinessEstimate >= 40 ? "bg-amber-500" : "bg-red-500"}`}
                    style={{ width: `${agentReadinessEstimate}%` }}
                  />
                </div>
                <div className="text-xs text-text-tertiary space-y-1">
                  <div className="flex justify-between">
                    <span>Product URLs configured</span>
                    <span className="text-text-secondary">{skusWithUrls}/{totalSkus}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Schema markup detected</span>
                    <span className="text-text-secondary">Run schema audit →</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Card 4: Trend Analysis */}
        <Link href="/trends" className="block bg-bg-secondary border border-border rounded-xl overflow-hidden hover:border-accent-primary transition-colors">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-violet-400" />
              <h3 className="font-semibold text-text-primary text-sm">Trend Analysis</h3>
            </div>
            <ChevronRight className="w-4 h-4 text-text-tertiary" />
          </div>
          <div className="p-4">
            {latestBrandScan ? (
              <div className="space-y-3">
                {/* Mini sparkline placeholder */}
                <div className="flex items-end gap-1 h-12">
                  {[20, 35, 25, 45, 40, 55, latestBrandScan.visibilityScore].map((v, i) => (
                    <div
                      key={i}
                      className={`flex-1 rounded-sm ${i === 6 ? "bg-violet-500" : "bg-bg-tertiary"}`}
                      style={{ height: `${Math.max(v, 5)}%` }}
                    />
                  ))}
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-tertiary">Current score</span>
                  <span className={`font-bold ${latestBrandScan.visibilityScore >= 50 ? "text-success" : latestBrandScan.visibilityScore >= 25 ? "text-warning" : "text-error"}`}>
                    {latestBrandScan.visibilityScore}/100
                  </span>
                </div>
                <p className="text-xs text-text-tertiary">
                  Last scan: {new Date(latestBrandScan.completedAt).toLocaleDateString()}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-end gap-1 h-12">
                  {[10, 15, 10, 20, 15, 10, 12].map((v, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-sm bg-bg-tertiary"
                      style={{ height: `${v}%` }}
                    />
                  ))}
                </div>
                <p className="text-sm text-text-tertiary">Run a brand scan to start tracking trends.</p>
              </div>
            )}
          </div>
        </Link>
      </div>

      {/* Products Table */}
      {totalSkus > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-text-primary">Your Products ({totalSkus})</h2>
            <Link href="/catalog" className="text-sm text-accent-primary hover:text-accent-secondary">
              View all →
            </Link>
          </div>

          {/* Quick product list — first 5 */}
          <div className="bg-bg-secondary border border-border rounded-xl divide-y divide-border">
            {skus.slice(0, 5).map((sku) => {
              const skuScans = scanResults.filter((r) => r.sku === sku.id);
              const visRate = calculateSkuVisibilityRate(skuScans);
              return (
                <Link
                  key={sku.id}
                  href={`/catalog/${sku.id}`}
                  className="flex items-center justify-between px-5 py-3 hover:bg-bg-tertiary/30 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-mono text-text-tertiary bg-bg-tertiary px-1.5 py-0.5 rounded">{sku.skuCode}</span>
                    <span className="text-sm text-text-primary truncate">{sku.name}</span>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-xs text-text-tertiary">{sku.category}</span>
                    {visRate !== null ? (
                      <span className={`text-sm font-semibold ${visRate > 0 ? "text-success" : "text-error"}`}>
                        {Math.round(visRate * 100)}%
                      </span>
                    ) : (
                      <span className="text-xs text-text-tertiary">—</span>
                    )}
                    <ChevronRight className="w-4 h-4 text-text-tertiary" />
                  </div>
                </Link>
              );
            })}
          </div>

          {totalSkus > 5 && (
            <Link href="/catalog" className="block text-center text-sm text-accent-primary hover:text-accent-secondary mt-3">
              View all {totalSkus} products →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
