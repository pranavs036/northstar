import OpenAI from "openai";

interface ScanInput {
  query: string;
  brandDomain: string;
  competitorDomains: string[];
}

interface ScanOutput {
  engine: "CHATGPT";
  query: string;
  brandVisible: boolean;
  competitorDomain: string;
  rawResponse: string;
}

function isPlaceholderKey(key: string | undefined): boolean {
  return !key || key === "your-openai-key" || key.startsWith("your-");
}

export async function scanChatGPT(input: ScanInput): Promise<ScanOutput> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (isPlaceholderKey(apiKey)) {
    return {
      engine: "CHATGPT",
      query: input.query,
      brandVisible: false,
      competitorDomain: "",
      rawResponse:
        "[SKIPPED] OpenAI API key not configured. Set OPENAI_API_KEY in .env.local to enable ChatGPT scanning.",
    };
  }

  const openai = new OpenAI({ apiKey });

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
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
    engine: "CHATGPT",
    query: input.query,
    brandVisible,
    competitorDomain,
    rawResponse,
  };
}
