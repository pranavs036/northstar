import { createServerClient } from "@/lib/pocketbase/server";
import { redirect } from "next/navigation";
import {
  BarChart3,
  TrendingUp,
  Package,
  Zap,
} from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { SkuTable } from "@/components/dashboard/SkuTable";
import type { SkuWithStatus } from "@/types/catalog";
import type { SkuRecord, ScanResultRecord, DiagnosisRecord, AuditRecord } from "@/types/pocketbase";

export default async function DashboardPage() {
  const pb = await createServerClient();

  if (!pb.authStore.isValid || !pb.authStore.record) {
    redirect("/login");
  }

  const user = pb.authStore.record;
  const userId = user.id;

  // Fetch data in parallel
  let skus: SkuRecord[] = [];
  let audits: AuditRecord[] = [];
  try {
    [skus, audits] = await Promise.all([
      pb.collection("skus").getFullList<SkuRecord>({ filter: `user="${userId}"` }),
      pb.collection("audits").getFullList<AuditRecord>({ filter: `user="${userId}"`, sort: "-created" }),
    ]);
  } catch (err) {
    console.error("[dashboard] Failed to fetch data:", err);
  }

  // Fetch scan results and diagnoses for all SKUs
  const skuIds = skus.map((s) => s.id);
  let scanResults: ScanResultRecord[] = [];
  let diagnoses: DiagnosisRecord[] = [];

  if (skuIds.length > 0) {
    const skuFilter = skuIds.map((id) => `sku="${id}"`).join("||");
    [scanResults, diagnoses] = await Promise.all([
      pb.collection("scan_results").getFullList<ScanResultRecord>({ filter: skuFilter }),
      pb.collection("diagnoses").getFullList<DiagnosisRecord>({ filter: skuFilter }),
    ]);
  }

  // Calculate stats
  const totalSkus = skus.length;

  let visibilityRate = 0;
  if (totalSkus > 0) {
    const visibleSkus = skus.filter((sku) =>
      scanResults.some((r) => r.sku === sku.id && r.brandVisible)
    ).length;
    visibilityRate = (visibleSkus / totalSkus) * 100;
  }

  let agentScore = 0;
  if (audits.length > 0 && audits[0].agentScore) {
    agentScore = audits[0].agentScore;
  }

  const skusWithStatus: SkuWithStatus[] = skus.map((sku) => {
    const skuScans = scanResults.filter((r) => r.sku === sku.id);
    const skuDiags = diagnoses.filter((d) => d.sku === sku.id);
    const scanCount = skuScans.length;
    const visibleCount = skuScans.filter((r) => r.brandVisible).length;
    const visRate = scanCount > 0 ? visibleCount / scanCount : null;

    const severityOrder = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
    const worstSeverity =
      skuDiags.length > 0
        ? skuDiags.reduce((worst, current) =>
            (severityOrder[current.severity] || 0) > (severityOrder[worst.severity] || 0)
              ? current
              : worst
          ).severity
        : null;

    return {
      id: sku.id,
      skuCode: sku.skuCode,
      name: sku.name,
      category: sku.category,
      url: sku.url,
      description: sku.description,
      scanCount,
      visibilityRate: visRate,
      worstSeverity,
    };
  });

  const auditCount = audits.length;
  const recentAudits = audits.slice(0, 5);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-text-primary mb-2">
          Welcome back, {user.brandName || user.name || "there"}
        </h1>
        <p className="text-text-tertiary">
          Monitor your AI search visibility and track optimization progress across your product catalog.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total SKUs" value={totalSkus} icon={<Package className="w-6 h-6" />} description="Products in your catalog" />
        <StatCard title="Audits Run" value={auditCount} icon={<BarChart3 className="w-6 h-6" />} description="Completed optimization audits" trend={auditCount > 0 ? { direction: "up" as const, percentage: 12 } : undefined} />
        <StatCard title="Agent-Readiness Score" value={agentScore} icon={<Zap className="w-6 h-6" />} description={agentScore >= 75 ? "Excellent optimization" : agentScore >= 50 ? "Room for improvement" : "Needs optimization"} />
        <StatCard title="Visibility Rate" value={`${Math.round(visibilityRate)}%`} icon={<TrendingUp className="w-6 h-6" />} description="Products cited in AI engines" trend={visibilityRate > 0 ? { direction: "up" as const, percentage: 8 } : undefined} />
      </div>

      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-text-primary mb-2">Your Products</h2>
          <p className="text-text-tertiary">Manage and track visibility for each SKU across AI search engines.</p>
        </div>

        {totalSkus > 0 ? (
          <SkuTable skus={skusWithStatus} />
        ) : (
          <div className="bg-bg-secondary border border-dashed border-border rounded-lg p-12 text-center">
            <Package className="w-12 h-12 text-text-tertiary mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold text-text-primary mb-2">No products yet</h3>
            <p className="text-text-tertiary mb-6">Upload your product catalog to get started with AI visibility optimization.</p>
            <a href="/catalog" className="inline-block px-6 py-2 bg-accent-primary text-white rounded-lg hover:bg-accent-secondary transition-colors font-medium">Upload Catalog</a>
          </div>
        )}
      </div>

      {recentAudits.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-text-primary mb-4">Recent Audits</h2>
          <div className="space-y-3">
            {recentAudits.map((audit) => (
              <div key={audit.id} className="bg-bg-secondary border border-border rounded-lg p-4 flex items-center justify-between hover:border-accent-primary transition-colors">
                <div>
                  <p className="text-sm font-medium text-text-primary">Audit {audit.id.slice(0, 8)}</p>
                  <p className="text-xs text-text-tertiary">Started {new Date(audit.created).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-4">
                  <p className={`text-sm font-semibold ${audit.status === "COMPLETE" ? "text-success" : audit.status === "FAILED" ? "text-error" : "text-info"}`}>{audit.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
