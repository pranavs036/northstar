import { createServerClient } from "@/lib/pocketbase/server";
import { redirect } from "next/navigation";
import { AlertConfig } from "@/components/alerts/AlertConfig";
import { TeamManagement } from "@/components/team/TeamManagement";
import type { TeamMemberRecord } from "@/types/pocketbase";

interface AlertConfigRecord {
  id: string;
  type: "visibility_drop" | "competitor_gain" | "score_threshold";
  threshold: number | null;
  emailNotify: boolean;
  enabled: boolean;
}

interface ScanScheduleRecord {
  id: string;
  frequency: "daily" | "weekly" | "off";
  active: boolean;
}

export default async function SettingsPage() {
  const pb = await createServerClient();

  if (!pb.authStore.isValid || !pb.authStore.record) {
    redirect("/login");
  }

  const userId = pb.authStore.record.id;
  const currentUserRole =
    (pb.authStore.record.role as
      | "owner"
      | "admin"
      | "editor"
      | "viewer"
      | undefined) ?? "owner";

  let existingAlerts: AlertConfigRecord[] = [];
  let existingSchedule: { frequency: "daily" | "weekly" | "off" } | null =
    null;
  let teamMembers: TeamMemberRecord[] = [];

  try {
    existingAlerts = await pb
      .collection("alert_configs")
      .getFullList<AlertConfigRecord>({
        filter: `user="${userId}"`,
        sort: "type",
      });
  } catch (err) {
    console.error("[settings] Failed to fetch alert configs:", err);
  }

  try {
    const schedules = await pb
      .collection("scan_schedules")
      .getFullList<ScanScheduleRecord>({
        filter: `user="${userId}"`,
      });
    if (schedules.length > 0) {
      existingSchedule = { frequency: schedules[0].frequency };
    }
  } catch (err) {
    console.error("[settings] Failed to fetch scan schedule:", err);
  }

  try {
    teamMembers = await pb
      .collection("team_members")
      .getFullList<TeamMemberRecord>({
        filter: `owner="${userId}"`,
        sort: "-created",
        expand: "member",
      });
  } catch (err) {
    console.error("[settings] Failed to fetch team members:", err);
  }

  return (
    <div className="max-w-2xl space-y-12">
      <div>
        <h1 className="text-4xl font-bold text-text-primary mb-2">Settings</h1>
        <p className="text-text-tertiary">
          Configure alerts, automated scan schedules, and manage your team.
        </p>
      </div>

      {/* Alerts & Schedule section */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-text-primary">
            Alerts &amp; Schedules
          </h2>
          <p className="text-sm text-text-tertiary mt-1">
            Set up notifications and automated audit runs.
          </p>
        </div>
        <AlertConfig
          existingAlerts={existingAlerts}
          existingSchedule={existingSchedule}
        />
      </section>

      {/* Team management section */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-text-primary">Team</h2>
          <p className="text-sm text-text-tertiary mt-1">
            Invite collaborators and manage their access to your brand
            workspace.
          </p>
        </div>
        <TeamManagement
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          initialMembers={teamMembers as any}
          currentUserRole={currentUserRole}
        />
      </section>
    </div>
  );
}
