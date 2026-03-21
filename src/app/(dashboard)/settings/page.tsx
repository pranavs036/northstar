import { createServerClient } from "@/lib/pocketbase/server";
import { redirect } from "next/navigation";
import { AlertConfig } from "@/components/alerts/AlertConfig";

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

  let existingAlerts: AlertConfigRecord[] = [];
  let existingSchedule: { frequency: "daily" | "weekly" | "off" } | null =
    null;

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

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-text-primary mb-2">Settings</h1>
        <p className="text-text-tertiary">
          Configure alerts and automated scan schedules for your brand.
        </p>
      </div>

      <AlertConfig
        existingAlerts={existingAlerts}
        existingSchedule={existingSchedule}
      />
    </div>
  );
}
