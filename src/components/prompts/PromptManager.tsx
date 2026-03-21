"use client";

import { useState, useTransition } from "react";
import { Trash2, Plus, Search, X, Tag } from "lucide-react";
import type { Prompt } from "@/types/prompt";

const CATEGORIES = ["all", "discovery", "comparison", "purchase", "custom"] as const;
type Category = (typeof CATEGORIES)[number];

const CATEGORY_COLORS: Record<string, string> = {
  discovery: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  comparison: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  purchase: "bg-green-500/10 text-green-400 border-green-500/20",
  custom: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
};

interface PromptManagerProps {
  initialPrompts: Prompt[];
  onPromptsChange?: (prompts: Prompt[]) => void;
}

export function PromptManager({ initialPrompts, onPromptsChange }: PromptManagerProps) {
  const [prompts, setPrompts] = useState<Prompt[]>(initialPrompts);

  function updatePrompts(updater: (prev: Prompt[]) => Prompt[]) {
    setPrompts((prev) => {
      const next = updater(prev);
      onPromptsChange?.(next);
      return next;
    });
  }
  const [filterCategory, setFilterCategory] = useState<Category>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  // Add form state
  const [addText, setAddText] = useState("");
  const [addCategory, setAddCategory] = useState<"discovery" | "comparison" | "purchase" | "custom">("discovery");
  const [addTagsInput, setAddTagsInput] = useState("");
  const [addError, setAddError] = useState("");

  const filtered = prompts.filter((p) => {
    const matchesCategory = filterCategory === "all" || p.category === filterCategory;
    const matchesSearch =
      searchQuery === "" ||
      p.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === filtered.length && filtered.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((p) => p.id)));
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setAddError("");

    if (!addText.trim()) {
      setAddError("Prompt text is required.");
      return;
    }

    const tags = addTagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    startTransition(async () => {
      try {
        const res = await fetch("/api/prompts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: addText.trim(), category: addCategory, tags }),
        });

        if (!res.ok) {
          const data = await res.json();
          setAddError(data.message || "Failed to create prompt.");
          return;
        }

        const newPrompt = await res.json();
        updatePrompts((prev) => [newPrompt, ...prev]);
        setAddText("");
        setAddTagsInput("");
      } catch {
        setAddError("Network error. Please try again.");
      }
    });
  }

  async function handleDelete(id: string) {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/prompts?id=${id}`, { method: "DELETE" });
        if (res.ok) {
          updatePrompts((prev) => prev.filter((p) => p.id !== id));
          setSelectedIds((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
        }
      } catch {
        console.error("Failed to delete prompt");
      }
    });
  }

  async function handleBulkDelete() {
    if (selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);

    startTransition(async () => {
      try {
        await Promise.all(
          ids.map((id) => fetch(`/api/prompts?id=${id}`, { method: "DELETE" }))
        );
        updatePrompts((prev) => prev.filter((p) => !ids.includes(p.id)));
        setSelectedIds(new Set());
      } catch {
        console.error("Failed to bulk delete prompts");
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Add prompt form */}
      <div className="bg-bg-secondary border border-border rounded-lg p-6">
        <h2 className="text-lg font-semibold text-text-primary mb-4">Add Prompt</h2>
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <textarea
              value={addText}
              onChange={(e) => setAddText(e.target.value)}
              placeholder="e.g. What are the best wireless headphones for commuting?"
              rows={2}
              className="w-full bg-bg-tertiary border border-border rounded-lg px-4 py-3 text-text-primary placeholder-text-tertiary focus:outline-none focus:border-accent-primary resize-none text-sm"
            />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <select
                value={addCategory}
                onChange={(e) => setAddCategory(e.target.value as typeof addCategory)}
                className="w-full bg-bg-tertiary border border-border rounded-lg px-4 py-2.5 text-text-primary focus:outline-none focus:border-accent-primary text-sm"
              >
                <option value="discovery">Discovery</option>
                <option value="comparison">Comparison</option>
                <option value="purchase">Purchase</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            <div className="flex-1">
              <input
                type="text"
                value={addTagsInput}
                onChange={(e) => setAddTagsInput(e.target.value)}
                placeholder="Tags (comma-separated)"
                className="w-full bg-bg-tertiary border border-border rounded-lg px-4 py-2.5 text-text-primary placeholder-text-tertiary focus:outline-none focus:border-accent-primary text-sm"
              />
            </div>
          </div>
          {addError && <p className="text-error text-sm">{addError}</p>}
          <button
            type="submit"
            disabled={isPending}
            className="flex items-center gap-2 px-4 py-2.5 bg-accent-primary hover:bg-accent-primary/90 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            Add Prompt
          </button>
        </form>
      </div>

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search prompts or tags..."
            className="w-full bg-bg-secondary border border-border rounded-lg pl-10 pr-4 py-2.5 text-text-primary placeholder-text-tertiary focus:outline-none focus:border-accent-primary text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                filterCategory === cat
                  ? "bg-accent-primary text-white"
                  : "bg-bg-secondary border border-border text-text-secondary hover:text-text-primary hover:border-accent-primary"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Bulk actions */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 bg-accent-primary/10 border border-accent-primary/20 rounded-lg px-4 py-3">
          <span className="text-sm text-text-primary">
            {selectedIds.size} selected
          </span>
          <button
            onClick={handleBulkDelete}
            disabled={isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-error/10 hover:bg-error/20 text-error rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete Selected
          </button>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="text-sm text-text-tertiary hover:text-text-primary ml-auto"
          >
            Clear selection
          </button>
        </div>
      )}

      {/* Prompts table */}
      <div className="bg-bg-secondary border border-border rounded-lg overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-bg-tertiary/50">
          <input
            type="checkbox"
            checked={selectedIds.size === filtered.length && filtered.length > 0}
            onChange={toggleSelectAll}
            className="rounded border-border"
          />
          <span className="text-sm text-text-tertiary">
            {filtered.length} prompt{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <Search className="w-10 h-10 text-text-tertiary mx-auto mb-3 opacity-40" />
            <p className="text-text-primary font-medium">No prompts found</p>
            <p className="text-text-tertiary text-sm mt-1">
              {prompts.length === 0
                ? "Add your first prompt above."
                : "Try adjusting your search or filter."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((prompt) => (
              <PromptRow
                key={prompt.id}
                prompt={prompt}
                isSelected={selectedIds.has(prompt.id)}
                onToggleSelect={() => toggleSelect(prompt.id)}
                onDelete={() => handleDelete(prompt.id)}
                isPending={isPending}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PromptRow({
  prompt,
  isSelected,
  onToggleSelect,
  onDelete,
  isPending,
}: {
  prompt: Prompt;
  isSelected: boolean;
  onToggleSelect: () => void;
  onDelete: () => void;
  isPending: boolean;
}) {
  return (
    <div
      className={`flex items-start gap-3 px-4 py-4 hover:bg-bg-tertiary/30 transition-colors ${
        isSelected ? "bg-accent-primary/5" : ""
      }`}
    >
      <input
        type="checkbox"
        checked={isSelected}
        onChange={onToggleSelect}
        className="mt-1 rounded border-border flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-text-primary">{prompt.text}</p>
        {prompt.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {prompt.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-bg-tertiary border border-border rounded text-xs text-text-tertiary"
              >
                <Tag className="w-2.5 h-2.5" />
                {tag}
              </span>
            ))}
          </div>
        )}
        {prompt.isAutoGenerated && (
          <span className="inline-block mt-1.5 text-xs text-accent-primary">AI generated</span>
        )}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span
          className={`inline-block px-2 py-1 rounded border text-xs font-medium capitalize ${
            CATEGORY_COLORS[prompt.category] ?? CATEGORY_COLORS.custom
          }`}
        >
          {prompt.category}
        </span>
        <button
          onClick={onDelete}
          disabled={isPending}
          className="p-1.5 text-text-tertiary hover:text-error hover:bg-error/10 rounded-lg transition-colors disabled:opacity-40"
          title="Delete prompt"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
