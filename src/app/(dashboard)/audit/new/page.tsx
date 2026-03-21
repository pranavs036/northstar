import { createServerClient } from "@/lib/pocketbase/server";
import { redirect } from "next/navigation";
import { AuditProgress } from "@/components/audit/AuditProgress";
import type { SkuRecord, CompetitorRecord } from "@/types/pocketbase";

export default async function NewAuditPage() {
  const pb = await createServerClient();

  if (!pb.authStore.isValid || !pb.authStore.record) {
    redirect("/login");
  }

  const userId = pb.authStore.record.id;

  let skuCount = 0;
  let competitorCount = 0;
  try {
    const [skus, competitors] = await Promise.all([
      pb.collection("skus").getFullList<SkuRecord>({ filter: `user="${userId}"`, fields: "id" }),
      pb.collection("competitors").getFullList<CompetitorRecord>({ filter: `user="${userId}"`, fields: "id" }),
    ]);
    skuCount = skus.length;
    competitorCount = competitors.length;
  } catch (err) {
    console.error("[audit/new] Failed to fetch counts:", err);
  }

  if (skuCount === 0) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-text-primary mb-2">New Audit</h1>
          <p className="text-text-tertiary">You need products in your catalog before running an audit.</p>
        </div>
        <div className="bg-bg-secondary border border-dashed border-border rounded-lg p-12 text-center">
          <p className="text-text-tertiary mb-6">Upload your product catalog first, then come back to run an audit.</p>
          <a href="/catalog/upload" className="inline-block px-6 py-3 bg-accent-primary text-white rounded-lg hover:bg-accent-secondary transition-colors font-medium">
            Upload Catalog
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-text-primary mb-2">Running Audit</h1>
        <p className="text-text-tertiary">
          Scanning {skuCount} SKUs across AI engines{competitorCount > 0 ? ` against ${competitorCount} competitors` : ""}.
        </p>
      </div>

      <AuditProgress />
    </div>
  );
}
