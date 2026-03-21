import { createServerClient } from "@/lib/pocketbase/server";
import { redirect } from "next/navigation";
import { SchemaAuditProgress } from "@/components/schema/SchemaAuditProgress";
import type { SkuRecord } from "@/types/pocketbase";

export default async function NewSchemaAuditPage() {
  const pb = await createServerClient();

  if (!pb.authStore.isValid || !pb.authStore.record) {
    redirect("/login");
  }

  const userId = pb.authStore.record.id;

  let skuCount = 0;
  let skusWithUrlCount = 0;
  try {
    const skus = await pb.collection("skus").getFullList<SkuRecord>({
      filter: `user="${userId}"`,
      fields: "id,url",
    });
    skuCount = skus.length;
    skusWithUrlCount = skus.filter((s) => s.url && s.url.trim() !== "").length;
  } catch (err) {
    console.error("[schema-audit/new] Failed to fetch SKU counts:", err);
  }

  if (skuCount === 0) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-text-primary mb-2">Schema Audit</h1>
          <p className="text-text-tertiary">
            You need products in your catalog before running a schema audit.
          </p>
        </div>
        <div className="bg-bg-secondary border border-dashed border-border rounded-lg p-12 text-center">
          <p className="text-text-tertiary mb-6">
            Upload your product catalog first, then come back to audit your schema markup.
          </p>
          <a
            href="/catalog/upload"
            className="inline-block px-6 py-3 bg-accent-primary text-white rounded-lg hover:bg-accent-secondary transition-colors font-medium"
          >
            Upload Catalog
          </a>
        </div>
      </div>
    );
  }

  if (skusWithUrlCount === 0) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-text-primary mb-2">Schema Audit</h1>
          <p className="text-text-tertiary">
            Schema audits require product URLs to crawl your live product pages.
          </p>
        </div>
        <div className="bg-bg-secondary border border-dashed border-border rounded-lg p-12 text-center">
          <p className="text-text-tertiary mb-2">
            You have {skuCount} SKU{skuCount !== 1 ? "s" : ""} in your catalog, but none have product URLs.
          </p>
          <p className="text-text-tertiary mb-6">
            Add URLs to your products (via CSV re-upload or the catalog editor) to enable schema auditing.
          </p>
          <a
            href="/catalog"
            className="inline-block px-6 py-3 bg-accent-primary text-white rounded-lg hover:bg-accent-secondary transition-colors font-medium"
          >
            Go to Catalog
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-text-primary mb-2">Running Schema Audit</h1>
        <p className="text-text-tertiary">
          Crawling structured data on {skusWithUrlCount} product page{skusWithUrlCount !== 1 ? "s" : ""} and generating fixes.
        </p>
      </div>

      <SchemaAuditProgress skuCount={skusWithUrlCount} />
    </div>
  );
}
