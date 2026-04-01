import { getClaudeClient } from "./claude";

interface DiagnosisInput {
  query: string;
  engine: string;
  brandDomain: string;
  brandProductName: string;
  brandProductDescription: string;
  competitorDomain: string;
  rawResponse: string;
}

interface DiagnosisOutput {
  reason: string;
  fix: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  missingElements: string[];
}

export async function generateDiagnosis(
  input: DiagnosisInput
): Promise<DiagnosisOutput> {
  const claude = getClaudeClient();

  const response = await claude.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `You are an AI ecommerce visibility expert.

A customer searched for: "${input.query}"
The AI engine (${input.engine}) cited ${input.competitorDomain || "other results"} but NOT our client's product.

Our client's product:
- Domain: ${input.brandDomain}
- Product: ${input.brandProductName}
- Description: ${input.brandProductDescription}

${input.competitorDomain ? `Competitor domain cited: ${input.competitorDomain}` : "No specific competitor was cited."}

AI engine's response:
${input.rawResponse.slice(0, 2000)}

Diagnose exactly why our client's product is not being cited for this query on ${input.engine}.
Be specific — reference actual missing schema types, content gaps, attribute differences, or structural issues.
Then provide a concrete, actionable fix.

Return ONLY valid JSON (no markdown, no code blocks):
{
  "reason": "specific explanation of why the brand is not cited",
  "fix": "specific actionable steps to fix this",
  "severity": "CRITICAL|HIGH|MEDIUM|LOW",
  "missingElements": ["list", "of", "specific", "missing", "elements"]
}`,
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  try {
    const parsed = JSON.parse(text.trim());
    return {
      reason: parsed.reason || "Unable to determine reason",
      fix: parsed.fix || "Review product data and structured markup",
      severity: ["CRITICAL", "HIGH", "MEDIUM", "LOW"].includes(parsed.severity)
        ? parsed.severity
        : "MEDIUM",
      missingElements: Array.isArray(parsed.missingElements)
        ? parsed.missingElements
        : [],
    };
  } catch {
    // Try to extract JSON from response
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      return {
        reason: parsed.reason || "Unable to determine reason",
        fix: parsed.fix || "Review product data and structured markup",
        severity: ["CRITICAL", "HIGH", "MEDIUM", "LOW"].includes(
          parsed.severity
        )
          ? parsed.severity
          : "MEDIUM",
        missingElements: Array.isArray(parsed.missingElements)
          ? parsed.missingElements
          : [],
      };
    }
    return {
      reason: "Analysis could not be parsed — raw response stored",
      fix: "Manual review recommended",
      severity: "MEDIUM",
      missingElements: [],
    };
  }
}
