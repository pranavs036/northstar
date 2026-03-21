import { createServerClient } from "@/lib/pocketbase/server";
import { redirect } from "next/navigation";
import { CatalogUpload } from "@/components/onboarding/CatalogUpload";

export default async function CatalogUploadPage() {
  const pb = await createServerClient();

  if (!pb.authStore.isValid || !pb.authStore.record) {
    redirect("/login");
  }

  // In PocketBase, user ID IS the brand ID (user = brand)
  const brandId = pb.authStore.record.id;

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-text-primary mb-2">
          Upload Product Catalog
        </h1>
        <p className="text-text-tertiary">
          Import your product data via CSV. Use this format:
        </p>
        <div className="mt-4 bg-bg-secondary border border-border rounded-lg p-4">
          <p className="text-sm font-mono text-text-secondary">
            sku, product_name, category, url, description
          </p>
          <p className="text-xs text-text-tertiary mt-2">
            Required: sku, product_name | Optional: category, url, description
          </p>
        </div>
      </div>

      <CatalogUpload brandId={brandId} />
    </div>
  );
}
