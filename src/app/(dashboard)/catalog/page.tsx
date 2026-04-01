import { createServerClient } from "@/lib/pocketbase/server";
import { redirect } from "next/navigation";
import { Upload, Package } from "lucide-react";

export const dynamic = "force-dynamic";
import Link from "next/link";
import { SkuTable } from "@/components/dashboard/SkuTable";
import type { SkuWithStatus } from "@/types/catalog";
import type { SkuRecord, ScanResultRecord, DiagnosisRecord } from "@/types/pocketbase";

export default async function CatalogPage() {
  const pb = await createServerClient();

  if (!pb.authStore.isValid || !pb.authStore.record) {
    redirect("/login");
  }

  const userId = pb.authStore.record.id;

  let skus: SkuRecord[] = [];
  try {
    skus = await pb.collection("skus").getFullList<SkuRecord>({
      filter: `user="${userId}"`,
      sort: "-created",
    });
  } catch (err) {
    console.error("[catalog] Failed to fetch SKUs:", err);
  }

  // Fetch scan results and diagnoses for all SKUs
  const skuIds = skus.map((s) => s.id);
  let scanResults: ScanResultRecord[] = [];
  let diagnoses: DiagnosisRecord[] = [];

  if (skuIds.length > 0) {
    // Batch SKU IDs to avoid PocketBase filter length limits with large catalogs
    const BATCH_SIZE = 50;
    const batches: string[][] = [];
    for (let i = 0; i < skuIds.length; i += BATCH_SIZE) {
      batches.push(skuIds.slice(i, i + BATCH_SIZE));
    }

    const scanBatches = await Promise.all(
      batches.map((batch) => {
        const skuFilter = batch.map((id) => `sku="${id}"`).join("||");
        return pb.collection("scan_results").getFullList<ScanResultRecord>({ filter: skuFilter });
      })
    );
    scanResults = scanBatches.flat();

    const diagBatches = await Promise.all(
      batches.map((batch) => {
        const skuFilter = batch.map((id) => `sku="${id}"`).join("||");
        return pb.collection("diagnoses").getFullList<DiagnosisRecord>({ filter: skuFilter });
      })
    );
    diagnoses = diagBatches.flat();
  }

  const skusWithStatus: SkuWithStatus[] = skus.map((sku) => {
    const skuScans = scanResults.filter((r) => r.sku === sku.id);
    const skuDiags = diagnoses.filter((d) => d.sku === sku.id);
    const scanCount = skuScans.length;
    const visibleCount = skuScans.filter((r) => r.brandVisible).length;
    const visibilityRate = scanCount > 0 ? visibleCount / scanCount : null;

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
      visibilityRate,
      worstSeverity,
    };
  });

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-bold text-text-primary mb-2">Product Catalog</h1>
          <p className="text-text-tertiary">Manage your SKUs and track their AI search visibility.</p>
        </div>
        <Link href="/catalog/upload" className="flex items-center gap-2 px-6 py-3 bg-accent-primary text-white rounded-lg hover:bg-accent-secondary transition-colors font-medium">
          <Upload className="w-4 h-4" />
          Upload Catalog
        </Link>
      </div>

      {skusWithStatus.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Your Products ({skusWithStatus.length})</h2>
          <SkuTable skus={skusWithStatus} />
        </div>
      ) : (
        <div className="bg-bg-secondary border border-dashed border-border rounded-lg p-12 text-center">
          <Package className="w-12 h-12 text-text-tertiary mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-semibold text-text-primary mb-2">No products yet</h3>
          <p className="text-text-tertiary mb-6">Upload your product catalog via CSV to get started with AI visibility optimization.</p>
          <Link href="/catalog/upload" className="inline-block px-6 py-3 bg-accent-primary text-white rounded-lg hover:bg-accent-secondary transition-colors font-medium">Upload Catalog</Link>
        </div>
      )}
    </div>
  );
}
