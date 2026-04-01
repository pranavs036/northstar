import { getClaudeClient } from "./claude";
import { SchemaAuditResult } from "@/types/schema-audit";

export async function generateSchemaFix(
  auditResult: SchemaAuditResult,
  productName: string,
  productDescription: string,
  productCategory: string
): Promise<{ fixedJsonLd: string; changes: string[] }> {
  const claude = getClaudeClient();

  const message = await claude.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: `Generate a complete, corrected Product JSON-LD schema for this product page.

Current schema found: ${JSON.stringify(auditResult.schemasFound[0]?.rawJsonLd || "none")}
Missing required properties: ${auditResult.missingRequired.join(", ")}
Missing optional properties: ${auditResult.missingOptional.join(", ")}

Product details:
- Name: ${productName}
- Description: ${productDescription}
- Category: ${productCategory}
- URL: ${auditResult.url}

Return JSON with two fields:
{
  "fixedJsonLd": "<complete JSON-LD script tag content ready to paste>",
  "changes": ["list of changes made"]
}

The JSON-LD must:
1. Include all required schema.org/Product properties
2. Include offers with price placeholder and availability
3. Include brand
4. Include aggregateRating placeholder
5. Be valid JSON-LD that passes Google's Rich Results Test
6. Use realistic placeholder values where real data is missing (mark with TODO comments)`,
      },
    ],
  });

  try {
    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return { fixedJsonLd: "", changes: [] };
    return JSON.parse(jsonMatch[0]);
  } catch {
    return { fixedJsonLd: "", changes: [] };
  }
}
