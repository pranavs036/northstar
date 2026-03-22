import OpenAI from "openai";

const GEMINI_API_KEY = process.env.GOOGLE_GEMINI_API_KEY;

export async function scanGemini({
  query,
  brandDomain,
  competitorDomains,
}: {
  query: string;
  brandDomain: string;
  competitorDomains: string[];
}) {
  if (!GEMINI_API_KEY) {
    return {
      engine: "GEMINI" as const,
      query,
      brandVisible: false,
      competitorDomain: "",
      rawResponse: "[STUB] GOOGLE_GEMINI_API_KEY not set",
    };
  }

  try {
    const client = new OpenAI({
      apiKey: GEMINI_API_KEY,
      baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
    });

    const response = await client.chat.completions.create({
      model: "gemini-2.0-flash",
      messages: [{ role: "user", content: query }],
    });

    const content = response.choices[0]?.message?.content || "";
    const normalizedBrand = brandDomain.replace(/^www\./, "").toLowerCase();
    const brandVisible = content.toLowerCase().includes(normalizedBrand);

    let competitorDomain = "";
    for (const comp of competitorDomains) {
      const normalizedComp = comp.replace(/^www\./, "").toLowerCase();
      if (content.toLowerCase().includes(normalizedComp)) {
        competitorDomain = comp;
        break;
      }
    }

    return {
      engine: "GEMINI" as const,
      query,
      brandVisible,
      competitorDomain,
      rawResponse: content.slice(0, 10000),
    };
  } catch (error) {
    return {
      engine: "GEMINI" as const,
      query,
      brandVisible: false,
      competitorDomain: "",
      rawResponse: `[ERROR] Gemini API failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}
