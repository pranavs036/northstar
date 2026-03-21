import OpenAI from "openai";

interface ScanInput {
  query: string;
  brandDomain: string;
  competitorDomains: string[];
}

interface ScanOutput {
  engine: "PERPLEXITY";
  query: string;
  brandVisible: boolean;
  competitorDomain: string;
  rawResponse: string;
}

function isPlaceholderKey(key: string | undefined): boolean {
  return !key || key === "your-perplexity-key" || key.startsWith("your-");
}

export async function scanPerplexity(input: ScanInput): Promise<ScanOutput> {
  const apiKey = process.env.PERPLEXITY_API_KEY;

  if (isPlaceholderKey(apiKey)) {
    return {
      engine: "PERPLEXITY",
      query: input.query,
      brandVisible: false,
      competitorDomain: "",
      rawResponse:
        "[SKIPPED] Perplexity API key not configured. Set PERPLEXITY_API_KEY in .env.local to enable Perplexity scanning.",
    };
  }

  // Perplexity uses an OpenAI-compatible API
  const client = new OpenAI({
    apiKey,
    baseURL: "https://api.perplexity.ai",
  });

  const completion = await client.chat.completions.create({
    model: "llama-3.1-sonar-small-128k-online",
    messages: [
      {
        role: "user",
        content: input.query,
      },
    ],
    max_tokens: 1024,
  });

  const rawResponse = completion.choices[0]?.message?.content || "";
  const responseLower = rawResponse.toLowerCase();

  const brandVisible = responseLower.includes(
    input.brandDomain.toLowerCase().replace(/^www\./, "")
  );

  let competitorDomain = "";
  for (const domain of input.competitorDomains) {
    const cleanDomain = domain.toLowerCase().replace(/^www\./, "");
    if (responseLower.includes(cleanDomain)) {
      competitorDomain = domain;
      break;
    }
  }

  return {
    engine: "PERPLEXITY",
    query: input.query,
    brandVisible,
    competitorDomain,
    rawResponse,
  };
}
