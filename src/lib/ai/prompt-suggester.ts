import { getClaudeClient } from "./claude";

export async function suggestPrompts(
  brandDomain: string,
  productCategories: string[],
  existingPrompts: string[]
): Promise<Array<{ text: string; category: string }>> {
  const claude = getClaudeClient();

  const categoriesText =
    productCategories.length > 0
      ? productCategories.join(", ")
      : "general products";

  const existingText =
    existingPrompts.length > 0
      ? `\n\nAvoid duplicating these existing prompts:\n${existingPrompts.map((p) => `- ${p}`).join("\n")}`
      : "";

  const response = await claude.messages.create({
    model: "claude-sonnet-4-5-20241022",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `You are an AI search optimization expert helping an ecommerce brand improve their visibility in AI-powered search engines like ChatGPT, Perplexity, and Google AI Overviews.

Brand domain: ${brandDomain}
Product categories: ${categoriesText}${existingText}

Generate 10-15 diverse prompts that a customer might type into an AI search engine when looking for products in these categories. Cover a range of intents:
- discovery: general awareness queries ("what are the best X for Y")
- comparison: comparing products or brands ("X vs Y", "best alternatives to Z")
- purchase: high-intent buying queries ("where to buy X", "best X under $Y")

Return ONLY a JSON array of objects, no other text. Each object must have:
- "text": the prompt string
- "category": one of "discovery", "comparison", or "purchase"

Example format: [{"text": "what are the best running shoes for flat feet", "category": "discovery"}, ...]`,
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  try {
    const parsed = JSON.parse(text.trim());
    if (Array.isArray(parsed)) {
      return parsed.filter(
        (item): item is { text: string; category: string } =>
          typeof item === "object" &&
          item !== null &&
          typeof item.text === "string" &&
          typeof item.category === "string"
      );
    }
  } catch {
    // Try to extract JSON array from the response
    const match = text.match(/\[[\s\S]*\]/);
    if (match) {
      const arr = JSON.parse(match[0]);
      return arr.filter(
        (item: unknown): item is { text: string; category: string } =>
          typeof item === "object" &&
          item !== null &&
          typeof (item as Record<string, unknown>).text === "string" &&
          typeof (item as Record<string, unknown>).category === "string"
      );
    }
  }

  throw new Error("Failed to parse prompt suggestion response");
}
