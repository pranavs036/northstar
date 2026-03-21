"use client";

import { useState } from "react";
import { PromptManager } from "./PromptManager";
import { PromptSuggestions } from "./PromptSuggestions";
import type { Prompt } from "@/types/prompt";

interface PromptsPageClientProps {
  initialPrompts: Prompt[];
  brandDomain: string;
  productCategories: string[];
}

export function PromptsPageClient({
  initialPrompts,
  brandDomain,
  productCategories,
}: PromptsPageClientProps) {
  const [prompts, setPrompts] = useState<Prompt[]>(initialPrompts);

  function handlePromptAdded(prompt: Prompt) {
    setPrompts((prev) => {
      // Avoid duplicates
      if (prev.some((p) => p.id === prompt.id)) return prev;
      return [prompt, ...prev];
    });
  }

  const existingTexts = prompts.map((p) => p.text);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        <PromptManager initialPrompts={prompts} onPromptsChange={setPrompts} />
      </div>
      <div className="lg:col-span-1">
        <PromptSuggestions
          brandDomain={brandDomain}
          productCategories={productCategories}
          existingPromptTexts={existingTexts}
          onPromptAdded={handlePromptAdded}
        />
      </div>
    </div>
  );
}
