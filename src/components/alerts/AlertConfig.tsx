"use client";

import { useState } from "react";

type AlertType = "visibility_drop" | "competitor_gain" | "score_threshold";
type ScanFrequency = "daily" | "weekly" | "off";

interface AlertConfigState {
  visibilityDropEnabled: boolean;
  visibilityDropThreshold: number;
  competitorGainEnabled: boolean;
  scoreThresholdEnabled: boolean;
  scoreThresholdValue: number;
  emailNotify: boolean;
  scanFrequency: ScanFrequency;
}

interface ExistingAlertConfig {
  id: string;
  type: AlertType;
  threshold: number | null;
  emailNotify: boolean;
  enabled: boolean;
}

interface ExistingScanSchedule {
  frequency: ScanFrequency;
}

interface AlertConfigProps {
  existingAlerts?: ExistingAlertConfig[];
  existingSchedule?: ExistingScanSchedule | null;
}

export function AlertConfig({
  existingAlerts = [],
  existingSchedule = null,
}: AlertConfigProps) {
  const visibilityAlert = existingAlerts.find(
    (a) => a.type === "visibility_drop"
  );
  const competitorAlert = existingAlerts.find(
    (a) => a.type === "competitor_gain"
  );
  const scoreAlert = existingAlerts.find((a) => a.type === "score_threshold");

  const [config, setConfig] = useState<AlertConfigState>({
    visibilityDropEnabled: visibilityAlert?.enabled ?? false,
    visibilityDropThreshold: visibilityAlert?.threshold ?? 10,
    competitorGainEnabled: competitorAlert?.enabled ?? false,
    scoreThresholdEnabled: scoreAlert?.enabled ?? false,
    scoreThresholdValue: scoreAlert?.threshold ?? 50,
    emailNotify:
      visibilityAlert?.emailNotify ??
      competitorAlert?.emailNotify ??
      scoreAlert?.emailNotify ??
      true,
    scanFrequency: existingSchedule?.frequency ?? "off",
  });

  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">(
    "idle"
  );
  const [errorMessage, setErrorMessage] = useState("");

  function updateConfig<K extends keyof AlertConfigState>(
    key: K,
    value: AlertConfigState[K]
  ) {
    setConfig((prev) => ({ ...prev, [key]: value }));
    setSaveStatus("idle");
  }

  async function handleSave() {
    setSaving(true);
    setSaveStatus("idle");
    setErrorMessage("");

    try {
      // Build the list of alert upsert calls
      const alertPayloads: Array<{
        type: AlertType;
        enabled: boolean;
        threshold?: number;
        emailNotify: boolean;
      }> = [
        {
          type: "visibility_drop",
          enabled: config.visibilityDropEnabled,
          threshold: config.visibilityDropThreshold,
          emailNotify: config.emailNotify,
        },
        {
          type: "competitor_gain",
          enabled: config.competitorGainEnabled,
          emailNotify: config.emailNotify,
        },
        {
          type: "score_threshold",
          enabled: config.scoreThresholdEnabled,
          threshold: config.scoreThresholdValue,
          emailNotify: config.emailNotify,
        },
      ];

      // Upsert each alert config (PATCH if exists, POST if new)
      for (const payload of alertPayloads) {
        const existingForType = existingAlerts.find(
          (a) => a.type === payload.type
        );

        if (existingForType) {
          const res = await fetch("/api/alerts", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: existingForType.id,
              enabled: payload.enabled,
              threshold: payload.threshold,
              emailNotify: payload.emailNotify,
            }),
          });
          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.message || "Failed to update alert");
          }
        } else {
          const res = await fetch("/api/alerts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: payload.type,
              threshold: payload.threshold,
              emailNotify: payload.emailNotify,
            }),
          });
          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.message || "Failed to create alert");
          }
        }
      }

      // Save scan schedule preference
      const scheduleRes = await fetch("/api/audit/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ frequency: config.scanFrequency }),
      });
      if (!scheduleRes.ok) {
        const data = await scheduleRes.json();
        throw new Error(data.message || "Failed to save schedule");
      }

      setSaveStatus("success");
    } catch (err) {
      setSaveStatus("error");
      setErrorMessage(
        err instanceof Error ? err.message : "Something went wrong"
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Visibility Drop Alert */}
      <div className="bg-bg-secondary border border-border rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-text-primary">
              Visibility Drop Alert
            </h3>
            <p className="text-sm text-text-tertiary mt-1">
              Get notified when your brand visibility drops below a threshold.
            </p>
          </div>
          <Toggle
            checked={config.visibilityDropEnabled}
            onChange={(val) => updateConfig("visibilityDropEnabled", val)}
          />
        </div>

        {config.visibilityDropEnabled && (
          <div className="pt-2 space-y-2">
            <label className="text-sm font-medium text-text-secondary">
              Alert when visibility drops below (%)
            </label>
            <input
              type="number"
              min={0}
              max={100}
              value={config.visibilityDropThreshold}
              onChange={(e) =>
                updateConfig(
                  "visibilityDropThreshold",
                  Math.min(100, Math.max(0, Number(e.target.value)))
                )
              }
              className="w-32 px-3 py-2 bg-bg-tertiary border border-border rounded-lg text-text-primary text-sm focus:outline-none focus:border-accent-primary"
            />
          </div>
        )}
      </div>

      {/* Competitor Gain Alert */}
      <div className="bg-bg-secondary border border-border rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-text-primary">
              Competitor Movement Alert
            </h3>
            <p className="text-sm text-text-tertiary mt-1">
              Get notified when a competitor gains visibility over your brand.
            </p>
          </div>
          <Toggle
            checked={config.competitorGainEnabled}
            onChange={(val) => updateConfig("competitorGainEnabled", val)}
          />
        </div>
      </div>

      {/* Score Threshold Alert */}
      <div className="bg-bg-secondary border border-border rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-text-primary">
              Agent-Readiness Score Alert
            </h3>
            <p className="text-sm text-text-tertiary mt-1">
              Get notified when your score drops below a minimum value.
            </p>
          </div>
          <Toggle
            checked={config.scoreThresholdEnabled}
            onChange={(val) => updateConfig("scoreThresholdEnabled", val)}
          />
        </div>

        {config.scoreThresholdEnabled && (
          <div className="pt-2 space-y-2">
            <label className="text-sm font-medium text-text-secondary">
              Alert when score drops below
            </label>
            <input
              type="number"
              min={0}
              max={100}
              value={config.scoreThresholdValue}
              onChange={(e) =>
                updateConfig(
                  "scoreThresholdValue",
                  Math.min(100, Math.max(0, Number(e.target.value)))
                )
              }
              className="w-32 px-3 py-2 bg-bg-tertiary border border-border rounded-lg text-text-primary text-sm focus:outline-none focus:border-accent-primary"
            />
          </div>
        )}
      </div>

      {/* Email Notifications */}
      <div className="bg-bg-secondary border border-border rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-text-primary">
              Email Notifications
            </h3>
            <p className="text-sm text-text-tertiary mt-1">
              Receive alert notifications via email.
            </p>
          </div>
          <Toggle
            checked={config.emailNotify}
            onChange={(val) => updateConfig("emailNotify", val)}
          />
        </div>
      </div>

      {/* Scan Frequency */}
      <div className="bg-bg-secondary border border-border rounded-xl p-6 space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-text-primary">
            Scheduled Scans
          </h3>
          <p className="text-sm text-text-tertiary mt-1">
            Automatically run audits on a recurring schedule.
          </p>
        </div>

        <div className="flex gap-3">
          {(["daily", "weekly", "off"] as ScanFrequency[]).map((freq) => (
            <button
              key={freq}
              onClick={() => updateConfig("scanFrequency", freq)}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors capitalize ${
                config.scanFrequency === freq
                  ? "bg-accent-primary text-white border-accent-primary"
                  : "bg-bg-tertiary text-text-secondary border-border hover:border-accent-primary hover:text-text-primary"
              }`}
            >
              {freq}
            </button>
          ))}
        </div>

        {config.scanFrequency !== "off" && (
          <p className="text-xs text-text-tertiary">
            {config.scanFrequency === "daily"
              ? "Audits will run every day at 6:00 AM UTC."
              : "Audits will run every Monday at 6:00 AM UTC."}
          </p>
        )}
      </div>

      {/* Save Button */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 bg-accent-primary text-white rounded-lg font-medium text-sm hover:bg-accent-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Saving..." : "Save Settings"}
        </button>

        {saveStatus === "success" && (
          <span className="text-sm text-green-400 font-medium">
            Settings saved successfully.
          </span>
        )}
        {saveStatus === "error" && (
          <span className="text-sm text-red-400 font-medium">
            {errorMessage}
          </span>
        )}
      </div>
    </div>
  );
}

// Internal toggle component
function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-accent-primary focus:ring-offset-2 focus:ring-offset-bg-primary ${
        checked ? "bg-accent-primary" : "bg-bg-tertiary"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}
