import { createServerClient } from "@/lib/pocketbase/server";
import { redirect } from "next/navigation";
import { Users, Globe, Trash2 } from "lucide-react";
import { CompetitorSetup } from "@/components/onboarding/CompetitorSetup";
import PocketBase from "pocketbase";
import { cookies } from "next/headers";
import type { CompetitorRecord } from "@/types/pocketbase";

export default async function CompetitorsPage() {
  const pb = await createServerClient();

  if (!pb.authStore.isValid || !pb.authStore.record) {
    redirect("/login");
  }

  const userId = pb.authStore.record.id;

  let competitors: CompetitorRecord[] = [];
  try {
    competitors = await pb.collection("competitors").getFullList<CompetitorRecord>({
      filter: `user="${userId}"`,
      sort: "-created",
    });
  } catch (err) {
    console.error("[competitors] Failed to fetch data:", err);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-text-primary mb-2">Competitors</h1>
        <p className="text-text-tertiary">
          Manage your top competitors. We&apos;ll analyze their AI search visibility
          and compare against your products.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-bg-secondary border border-border rounded-lg p-6 sticky top-8">
            <h2 className="text-lg font-semibold text-text-primary mb-4">Add Competitor</h2>
            <CompetitorSetup brandId={userId} />
          </div>
        </div>

        <div className="lg:col-span-2">
          <h2 className="text-lg font-semibold text-text-primary mb-4">
            Your Competitors ({competitors.length})
          </h2>

          {competitors.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {competitors.map((competitor) => (
                <CompetitorCard key={competitor.id} competitor={competitor} />
              ))}
            </div>
          ) : (
            <div className="bg-bg-secondary border border-dashed border-border rounded-lg p-12 text-center">
              <Users className="w-12 h-12 text-text-tertiary mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold text-text-primary mb-2">No competitors yet</h3>
              <p className="text-text-tertiary">
                Add your top competitors to compare your products and understand
                their optimization strategies.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CompetitorCard({ competitor }: { competitor: CompetitorRecord }) {
  async function handleDelete() {
    "use server";
    const pbUrl = process.env.NEXT_PUBLIC_POCKETBASE_URL || "http://127.0.0.1:8090";
    const pb = new PocketBase(pbUrl);
    const cookieStore = await cookies();
    const pbCookie = cookieStore.get("pb_auth");
    if (pbCookie) {
      pb.authStore.loadFromCookie(`pb_auth=${pbCookie.value}`);
    }
    await pb.collection("competitors").delete(competitor.id);
  }

  return (
    <div className="bg-bg-secondary border border-border rounded-lg p-6 flex items-start justify-between hover:border-accent-primary transition-colors">
      <div className="flex items-start gap-4 flex-1">
        <div className="w-10 h-10 bg-accent-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
          <Globe className="w-5 h-5 text-accent-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-text-primary">
            {competitor.name || competitor.domain}
          </h3>
          <p className="text-sm text-text-tertiary truncate">{competitor.domain}</p>
          <p className="text-xs text-text-tertiary mt-2">Tracking competitor domain</p>
        </div>
      </div>

      <form action={handleDelete} className="flex-shrink-0">
        <button type="submit" className="p-2 text-text-tertiary hover:text-error hover:bg-error/10 rounded-lg transition-colors" title="Delete competitor">
          <Trash2 className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
