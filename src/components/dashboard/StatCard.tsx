import { ReactNode } from "react";
import { ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  description?: string;
  trend?: {
    direction: "up" | "down";
    percentage: number;
  };
}

export function StatCard({
  title,
  value,
  icon,
  description,
  trend,
}: StatCardProps) {
  return (
    <div className="bg-bg-secondary border border-border rounded-lg p-6 hover:border-accent-primary transition-colors">
      {/* Header with Icon */}
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-sm font-medium text-text-secondary">{title}</h3>
        <div className="p-2 bg-bg-tertiary rounded-lg text-accent-primary">
          {icon}
        </div>
      </div>

      {/* Value */}
      <div className="mb-4">
        <p className="text-3xl font-bold text-text-primary mb-1">{value}</p>
        {description && (
          <p className="text-xs text-text-tertiary">{description}</p>
        )}
      </div>

      {/* Trend */}
      {trend && (
        <div className="flex items-center gap-1">
          {trend.direction === "up" ? (
            <ArrowUp className="w-4 h-4 text-success" />
          ) : (
            <ArrowDown className="w-4 h-4 text-error" />
          )}
          <span
            className={cn(
              "text-xs font-semibold",
              trend.direction === "up" ? "text-success" : "text-error"
            )}
          >
            {trend.percentage}%
          </span>
          <span className="text-xs text-text-tertiary">from last month</span>
        </div>
      )}
    </div>
  );
}
