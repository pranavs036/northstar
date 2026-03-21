import { getClaudeClient } from "./claude";
import { CitationAnalysis } from "@/types/citation";

export async function extractCitations(
  rawResponse: string,
  brandDomain: string,
  competitorDomains: string[]
): Promise<CitationAnalysis> {
  const claude = getClaudeClient();

  const message = await claude.messages.create({
    model: "claude-sonnet-4-5-20241022",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `Extract ALL URLs, domains, website references, and source citations from this AI-generated response. Return JSON only.

Response to analyze:
${rawResponse.slice(0, 5000)}

Brand domain: ${brandDomain}
Competitor domains: ${competitorDomains.join(", ")}

Also determine the brand's mention position in the response (1 = first brand/product mentioned, 2 = second, etc.). If the brand is not mentioned, return 0.

Return this exact JSON structure:
{
  "citations": [
    {
      "url": "full URL or domain reference found",
      "domain": "extracted domain",
      "context": "10-word snippet around the citation",
      "isBrandCitation": true/false,
      "isCompetitorCitation": true/false
    }
  ],
  "brandPosition": <number>
}

If no citations found, return {"citations": [], "brandPosition": 0}.`,
      },
    ],
  });

  try {
    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return { citations: [], totalCitations: 0, brandCitations: 0, competitorCitations: 0, uniqueDomains: [] };

    const parsed = JSON.parse(jsonMatch[0]);
    const citations = parsed.citations || [];

    return {
      citations,
      totalCitations: citations.length,
      brandCitations: citations.filter((c: any) => c.isBrandCitation).length,
      competitorCitations: citations.filter((c: any) => c.isCompetitorCitation).length,
      uniqueDomains: [...new Set(citations.map((c: any) => c.domain))] as string[],
      brandPosition: parsed.brandPosition || 0,
    };
  } catch {
    return { citations: [], totalCitations: 0, brandCitations: 0, competitorCitations: 0, uniqueDomains: [], brandPosition: 0 };
  }
}
