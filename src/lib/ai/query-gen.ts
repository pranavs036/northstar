import { getClaudeClient } from "./claude";

interface SkuInput {
  name: string;
  category: string;
  description: string;
}

export async function generateQueries(sku: SkuInput): Promise<string[]> {
  const claude = getClaudeClient();

  const response = await claude.messages.create({
    model: "claude-sonnet-4-5-20241022",
    max_tokens: 512,
    messages: [
      {
        role: "user",
        content: `Given this ecommerce product:
- Name: ${sku.name}
- Category: ${sku.category}
- Description: ${sku.description}

Generate 5 natural language queries a customer might type into ChatGPT, Google, or Perplexity when searching for this type of product. Vary intent: discovery, comparison, purchase-ready.

Return ONLY a JSON array of strings, no other text. Example: ["query 1", "query 2", ...]`,
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  try {
    const parsed = JSON.parse(text.trim());
    if (Array.isArray(parsed)) {
      return parsed.filter((q): q is string => typeof q === "string");
    }
  } catch {
    // Try to extract JSON array from the response
    const match = text.match(/\[[\s\S]*\]/);
    if (match) {
      const arr = JSON.parse(match[0]);
      return arr.filter((q: unknown): q is string => typeof q === "string");
    }
  }

  throw new Error("Failed to parse query generation response");
}
