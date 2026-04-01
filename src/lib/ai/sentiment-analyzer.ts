import { getClaudeClient } from "./claude";
import { SentimentResult } from "@/types/sentiment";

export async function analyzeSentiment(
  rawResponse: string,
  brandDomain: string,
  productName: string
): Promise<SentimentResult> {
  const claude = getClaudeClient();

  const message = await claude.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 256,
    messages: [
      {
        role: "user",
        content: `Analyze the sentiment toward the brand "${brandDomain}" and product "${productName}" in this AI-generated response. If the brand is not mentioned, analyze the general sentiment toward the product category.

Response: ${rawResponse.slice(0, 3000)}

Return JSON only:
{
  "label": "POSITIVE" | "NEUTRAL" | "NEGATIVE",
  "score": <number from -1.0 (very negative) to 1.0 (very positive)>,
  "reasoning": "<one sentence explaining the sentiment>"
}`,
      },
    ],
  });

  try {
    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return { label: "NEUTRAL", score: 0, reasoning: "Could not analyze" };
    return JSON.parse(jsonMatch[0]);
  } catch {
    return { label: "NEUTRAL", score: 0, reasoning: "Parse error" };
  }
}
