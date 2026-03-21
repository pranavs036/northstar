"use client";

import { useState, useMemo } from "react";
import { Search, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface CitationRow {
  domain: string;
  count: number;
  engines: string[];
  isBrand: boolean;
  isCompetitor: boolean;
}

type SortKey = "domain" | "count" | "engines" | "type";
type SortDirection = "asc" | "desc";

interface CitationTableProps {
  citations: CitationRow[];
}

export function CitationTable({ citations }: CitationTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("count");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const getTypeLabel = (row: CitationRow): string => {
    if (row.isBrand) return "Brand";
    if (row.isCompetitor) return "Competitor";
    return "Third-party";
  };

  const getTypeOrder = (row: CitationRow): number => {
    if (row.isBrand) return 0;
    if (row.isCompetitor) return 1;
    return 2;
  };

  const filteredAndSorted = useMemo(() => {
    const query = searchQuery.toLowerCase();
    const filtered = citations.filter((row) =>
      row.domain.toLowerCase().includes(query)
    );

    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortKey) {
        case "domain":
          comparison = a.domain.localeCompare(b.domain);
          break;
        case "count":
          comparison = a.count - b.count;
          break;
        case "engines":
          comparison = a.engines.length - b.engines.length;
          break;
        case "type":
          comparison = getTypeOrder(a) - getTypeOrder(b);
          break;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [citations, searchQuery, sortKey, sortDirection]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDirection(key === "count" ? "desc" : "asc");
    }
  };

  const SortHeader = ({ label, sk }: { label: string; sk: SortKey }) => (
    <button
      onClick={() => handleSort(sk)}
      className="flex items-center gap-1 hover:text-accent-primary transition-colors"
    >
      {label}
      <ArrowUpDown className="w-4 h-4 opacity-50" />
    </button>
  );

  const TypeBadge = ({ row }: { row: CitationRow }) => {
    if (row.isBrand) {
      return (
        <span className="text-xs font-semibold px-2 py-1 rounded bg-accent-primary/20 text-accent-primary border border-accent-primary/30">
          Brand
        </span>
      );
    }
    if (row.isCompetitor) {
      return (
        <span className="text-xs font-semibold px-2 py-1 rounded bg-error/20 text-error border border-error/30">
          Competitor
        </span>
      );
    }
    return (
      <span className="text-xs font-semibold px-2 py-1 rounded bg-bg-tertiary text-text-secondary border border-border">
        Third-party
      </span>
    );
  };

  const isGapRow = (row: CitationRow) => row.isCompetitor && !row.isBrand;

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
        <input
          type="text"
          placeholder="Search by domain..."
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
      {filteredAndSorted.length > 0 ? (
        <div className="bg-bg-secondary border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-bg-tertiary/50">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-text-tertiary">
                    <SortHeader label="Domain" sk="domain" />
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-text-tertiary">
                    <SortHeader label="Times Cited" sk="count" />
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-text-tertiary">
                    <SortHeader label="Engines" sk="engines" />
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-text-tertiary">
                    <SortHeader label="Type" sk="type" />
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredAndSorted.map((row) => (
                  <tr
                    key={row.domain}
                    className={cn(
                      "transition-colors",
                      isGapRow(row)
                        ? "bg-error/5 hover:bg-error/10"
                        : "hover:bg-bg-tertiary/30"
                    )}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-text-primary">
                          {row.domain}
                        </span>
                        {isGapRow(row) && (
                          <span className="text-xs text-error font-medium">
                            Citation Gap
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-text-primary">
                        {row.count}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {row.engines.map((engine) => (
                          <span
                            key={engine}
                            className="text-xs px-2 py-0.5 rounded bg-bg-tertiary text-text-secondary border border-border"
                          >
                            {engine}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <TypeBadge row={row} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-bg-secondary border border-border rounded-lg p-12 text-center">
          <p className="text-text-tertiary">No citations found matching your search.</p>
        </div>
      )}

      {/* Summary */}
      <div className="text-sm text-text-tertiary">
        Showing {filteredAndSorted.length} of {citations.length} domains
      </div>
    </div>
  );
}
