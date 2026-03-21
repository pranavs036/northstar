"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle, Loader } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface CompetitorSetupProps {
  brandId: string;
  onSuccess?: () => void;
}

export function CompetitorSetup({ brandId, onSuccess }: CompetitorSetupProps) {
  const [domain, setDomain] = useState("");
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const validateDomain = (value: string): boolean => {
    try {
      new URL(`https://${value}`);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!domain.trim()) {
      setError("Domain is required");
      return;
    }

    if (!validateDomain(domain)) {
      setError("Invalid domain format (e.g., example.com)");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/competitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandId,
          domain: domain.trim(),
          name: name.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to add competitor");
      }

      setSuccess(true);
      setDomain("");
      setName("");

      setTimeout(() => {
        setSuccess(false);
        onSuccess?.();
      }, 2000);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to add competitor"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Domain Input */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">
          Competitor Domain *
        </label>
        <input
          type="text"
          placeholder="example.com"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          disabled={isSubmitting}
          className={cn(
            "w-full px-4 py-2 rounded-lg border",
            "bg-bg-tertiary text-text-primary placeholder:text-text-tertiary",
            "focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/20",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            error ? "border-error" : "border-border"
          )}
        />
        <p className="text-xs text-text-tertiary mt-1">
          Enter domain without https://
        </p>
      </div>

      {/* Name Input */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">
          Competitor Name (optional)
        </label>
        <input
          type="text"
          placeholder="e.g., Acme Corp"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isSubmitting}
          className={cn(
            "w-full px-4 py-2 rounded-lg border border-border",
            "bg-bg-tertiary text-text-primary placeholder:text-text-tertiary",
            "focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/20",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-error/10 border border-error/30 rounded-lg p-3 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-error mt-0.5 flex-shrink-0" />
          <p className="text-sm text-error">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="bg-success/10 border border-success/30 rounded-lg p-3 flex items-start gap-2">
          <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
          <p className="text-sm text-success">Competitor added successfully</p>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className={cn(
          "w-full px-4 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2",
          isSubmitting
            ? "bg-bg-tertiary text-text-tertiary cursor-not-allowed"
            : "bg-accent-primary text-white hover:bg-accent-secondary"
        )}
      >
        {isSubmitting ? (
          <>
            <Loader className="w-4 h-4 animate-spin" />
            Adding...
          </>
        ) : (
          "Add Competitor"
        )}
      </button>
    </form>
  );
}
