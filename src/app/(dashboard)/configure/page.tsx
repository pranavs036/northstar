import { createServerClient } from "@/lib/pocketbase/server";
import { redirect } from "next/navigation";
import { CompetitorSetup } from "@/components/onboarding/CompetitorSetup";
import { CatalogUpload } from "@/components/onboarding/CatalogUpload";
import type { CompetitorRecord } from "@/types/pocketbase";

export const dynamic = "force-dynamic";

export default async function ConfigurePage() {
  const pb = await createServerClient();

  if (!pb.authStore.isValid || !pb.authStore.record) {
    redirect("/login");
  }

  const userId = pb.authStore.record.id;
  const brandName = pb.authStore.record.brandName || "";
  const domain = pb.authStore.record.domain || "";

  // Fetch competitors
  let competitors: CompetitorRecord[] = [];
  try {
    const result = await pb.collection("competitors").getFullList({
      filter: `user="${userId}"`,
      sort: "-created",
    });
    competitors = result as unknown as CompetitorRecord[];
  } catch {
    // collection may not exist yet
  }

  // Fetch prompts
  let prompts: Array<{ id: string; text: string; category: string; tags: string[] }> = [];
  try {
    const result = await pb.collection("prompts").getFullList({
      filter: `user="${userId}"`,
      sort: "-created",
    });
    prompts = result as unknown as Array<{ id: string; text: string; category: string; tags: string[] }>;
  } catch {
    // collection may not exist yet
  }

  return (
    <div className="max-w-4xl space-y-10">
      <div>
        <h1 className="text-4xl font-bold text-text-primary mb-2">Configure</h1>
        <p className="text-text-tertiary">
          Set up your brand, competitors, and search queries.
        </p>
      </div>

      {/* Brand Info */}
      <section className="bg-bg-secondary border border-border rounded-xl p-6">
        <h2 className="text-lg font-semibold text-text-primary mb-4">Brand Profile</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-text-tertiary uppercase tracking-wider mb-1">Brand Name</p>
            <p className="text-text-primary font-medium">{brandName || "Not set"}</p>
          </div>
          <div>
            <p className="text-xs text-text-tertiary uppercase tracking-wider mb-1">Domain</p>
            <p className="text-text-primary font-medium">{domain || "Not set"}</p>
          </div>
        </div>
      </section>

      {/* Competitors */}
      <section className="bg-bg-secondary border border-border rounded-xl p-6">
        <h2 className="text-lg font-semibold text-text-primary mb-4">
          Competitors ({competitors.length})
        </h2>
        <CompetitorSetup brandId={userId} />
        {competitors.length > 0 && (
          <div className="mt-4 space-y-2">
            {competitors.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between px-4 py-3 bg-bg-tertiary/30 rounded-lg"
              >
                <div>
                  <p className="text-sm text-text-primary font-medium">{c.name || c.domain}</p>
                  <p className="text-xs text-text-tertiary">{c.domain}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Prompts */}
      <section className="bg-bg-secondary border border-border rounded-xl p-6">
        <h2 className="text-lg font-semibold text-text-primary mb-4">
          Search Queries ({prompts.length})
        </h2>
        <p className="text-sm text-text-tertiary mb-4">
          Custom queries used in brand scans alongside auto-generated ones.
        </p>
        {prompts.length > 0 ? (
          <div className="space-y-2">
            {prompts.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between px-4 py-3 bg-bg-tertiary/30 rounded-lg"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-primary truncate">&ldquo;{p.text}&rdquo;</p>
                </div>
                <span className="text-xs px-2 py-0.5 rounded bg-bg-tertiary text-text-tertiary ml-3">
                  {p.category}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-text-tertiary italic">
            No custom queries yet. They&apos;ll be auto-generated during your first scan.
          </p>
        )}
      </section>

      {/* Catalog Upload */}
      <section className="bg-bg-secondary border border-border rounded-xl p-6">
        <h2 className="text-lg font-semibold text-text-primary mb-4">Upload Catalog</h2>
        <CatalogUpload brandId={userId} />
      </section>
    </div>
  );
}
