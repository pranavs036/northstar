import { createServerClient } from "@/lib/pocketbase/server";
import { redirect } from "next/navigation";
import { BarChart3, Plus, Clock, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import type { AuditRecord } from "@/types/pocketbase";

const statusConfig = {
  PENDING: { icon: Clock, color: "text-text-tertiary", bg: "bg-text-tertiary/10", label: "Pending" },
  SCANNING: { icon: Loader2, color: "text-info", bg: "bg-info/10", label: "Scanning" },
  ANALYZING: { icon: Loader2, color: "text-warning", bg: "bg-warning/10", label: "Analyzing" },
  COMPLETE: { icon: CheckCircle2, color: "text-success", bg: "bg-success/10", label: "Complete" },
  FAILED: { icon: XCircle, color: "text-error", bg: "bg-error/10", label: "Failed" },
};

export default async function AuditsPage() {
  const pb = await createServerClient();

  if (!pb.authStore.isValid || !pb.authStore.record) {
    redirect("/login");
  }

  const userId = pb.authStore.record.id;

  let audits: AuditRecord[] = [];
  try {
    audits = await pb.collection("audits").getFullList<AuditRecord>({
      filter: `user="${userId}"`,
      sort: "-created",
    });
  } catch (err) {
    console.error("[audits] Failed to fetch:", err);
  }

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-bold text-text-primary mb-2">Audits</h1>
          <p className="text-text-tertiary">
            Run AI visibility audits to discover how your products appear in ChatGPT, Perplexity, and Google AI.
          </p>
        </div>
        <Link
          href="/audit/new"
          className="flex items-center gap-2 px-6 py-3 bg-accent-primary text-white rounded-lg hover:bg-accent-secondary transition-colors font-medium"
        >
          <Plus className="w-4 h-4" />
          New Audit
        </Link>
      </div>

      {audits.length > 0 ? (
        <div className="space-y-4">
          {audits.map((audit) => {
            const config = statusConfig[audit.status] || statusConfig.PENDING;
            const Icon = config.icon;
            return (
              <Link
                key={audit.id}
                href={audit.status === "COMPLETE" ? `/audit/${audit.id}` : "#"}
                className="block bg-bg-secondary border border-border rounded-lg p-6 hover:border-accent-primary transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 ${config.bg} rounded-lg flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${config.color} ${config.label === "Scanning" || config.label === "Analyzing" ? "animate-spin" : ""}`} />
                    </div>
                    <div>
                      <p className="font-semibold text-text-primary">
                        Audit {audit.id.slice(0, 8)}
                      </p>
                      <p className="text-sm text-text-tertiary">
                        Started {new Date(audit.created).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    {audit.agentScore !== null && (
                      <div className="text-right">
                        <p className="text-2xl font-bold text-text-primary">{audit.agentScore}</p>
                        <p className="text-xs text-text-tertiary">Agent Score</p>
                      </div>
                    )}
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.color} ${config.bg}`}>
                      {config.label}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="bg-bg-secondary border border-dashed border-border rounded-lg p-12 text-center">
          <BarChart3 className="w-12 h-12 text-text-tertiary mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-semibold text-text-primary mb-2">No audits yet</h3>
          <p className="text-text-tertiary mb-6">
            Run your first AI visibility audit to see how your products appear across AI search engines.
          </p>
          <Link
            href="/audit/new"
            className="inline-block px-6 py-3 bg-accent-primary text-white rounded-lg hover:bg-accent-secondary transition-colors font-medium"
          >
            Start First Audit
          </Link>
        </div>
      )}
    </div>
  );
}
