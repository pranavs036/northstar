"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { SkuWithStatus } from "@/types/catalog";

type SortKey = keyof SkuWithStatus;
type SortDirection = "asc" | "desc";

interface SkuTableProps {
  skus: SkuWithStatus[];
}

export function SkuTable({ skus }: SkuTableProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  // Filter and sort SKUs
  const filteredAndSortedSkus = useMemo(() => {
    let filtered = skus.filter((sku) => {
      const query = searchQuery.toLowerCase();
      return (
        sku.skuCode.toLowerCase().includes(query) ||
        sku.name.toLowerCase().includes(query) ||
        (sku.category?.toLowerCase().includes(query) ?? false)
      );
    });

    // Sort
    filtered.sort((a, b) => {
      const aValue = a[sortKey];
      const bValue = b[sortKey];

      // Handle null values
      if (aValue === null || aValue === undefined)
        return sortDirection === "asc" ? 1 : -1;
      if (bValue === null || bValue === undefined)
        return sortDirection === "asc" ? -1 : 1;

      // Compare values
      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortDirection === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
      }

      return 0;
    });

    return filtered;
  }, [skus, searchQuery, sortKey, sortDirection]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const getSeverityBadge = (
    severity: SkuWithStatus["worstSeverity"]
  ) => {
    if (!severity) return null;

    const severityStyles: Record<
      NonNullable<SkuWithStatus["worstSeverity"]>,
      string
    > = {
      CRITICAL: "bg-error/20 text-error border border-error/30",
      HIGH: "bg-warning/20 text-warning border border-warning/30",
      MEDIUM: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
      LOW: "bg-success/20 text-success border border-success/30",
    };

    return (
      <span className={cn("text-xs font-semibold px-2 py-1 rounded", severityStyles[severity])}>
        {severity}
      </span>
    );
  };

  const VisibilityBar = ({
    rate,
  }: {
    rate: SkuWithStatus["visibilityRate"];
  }) => {
    if (rate === null) return <span className="text-text-tertiary">—</span>;

    const percentage = Math.round(rate * 100);
    const color = percentage >= 75 ? "bg-success" :
                  percentage >= 50 ? "bg-info" :
                  percentage >= 25 ? "bg-warning" :
                  "bg-error";

    return (
      <div className="flex items-center gap-2">
        <div className="w-24 h-2 bg-bg-tertiary rounded-full overflow-hidden">
          <div className={cn("h-full", color)} style={{ width: `${percentage}%` }} />
        </div>
        <span className="text-sm text-text-secondary min-w-10">{percentage}%</span>
      </div>
    );
  };

  const SortHeader = ({ label, sortKey: key }: { label: string; sortKey: SortKey }) => (
    <button
      onClick={() => handleSort(key)}
      className="flex items-center gap-1 hover:text-accent-primary transition-colors"
    >
      {label}
      <ArrowUpDown className="w-4 h-4 opacity-50" />
    </button>
  );

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-tertiary" />
        <input
          type="text"
          placeholder="Search by SKU code, product name, or category..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={cn(
            "w-full pl-10 pr-4 py-2 rounded-lg",
            "bg-bg-tertiary border border-border text-text-primary",
            "placeholder:text-text-tertiary",
            "focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/20"
          )}
        />
      </div>

      {/* Table */}
      {filteredAndSortedSkus.length > 0 ? (
        <div className="bg-bg-secondary border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-bg-tertiary/50">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-text-tertiary">
                    <SortHeader label="SKU Code" sortKey="skuCode" />
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-text-tertiary">
                    <SortHeader label="Product Name" sortKey="name" />
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-text-tertiary">
                    <SortHeader label="Category" sortKey="category" />
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-text-tertiary">
                    <SortHeader label="Visibility" sortKey="visibilityRate" />
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-text-tertiary">
                    <SortHeader label="Severity" sortKey="worstSeverity" />
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-text-tertiary">
                    Fixes
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredAndSortedSkus.map((sku) => (
                  <tr
                    key={sku.id}
                    onClick={() => router.push(`/catalog/${sku.id}`)}
                    className="hover:bg-bg-tertiary/30 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-text-primary">
                        {sku.skuCode}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm text-text-primary">{sku.name}</p>
                        {sku.url && (
                          <p className="text-xs text-text-tertiary truncate">
                            {sku.url}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-text-secondary">
                        {sku.category || "—"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <VisibilityBar rate={sku.visibilityRate} />
                    </td>
                    <td className="px-6 py-4">
                      {getSeverityBadge(sku.worstSeverity)}
                    </td>
                    <td className="px-6 py-4">
                      {sku.actionablesCount > 0 ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full bg-accent-primary/15 text-accent-primary border border-accent-primary/30">
                          {sku.actionablesCount} fixes
                        </span>
                      ) : (
                        <span className="text-text-tertiary text-sm">--</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-bg-secondary border border-border rounded-lg p-12 text-center">
          <p className="text-text-tertiary">No SKUs found matching your search.</p>
        </div>
      )}

      {/* Summary */}
      <div className="text-sm text-text-tertiary">
        Showing {filteredAndSortedSkus.length} of {skus.length} SKUs
      </div>
    </div>
  );
}
