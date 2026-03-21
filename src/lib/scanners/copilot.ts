export async function scanCopilot({
  query,
  brandDomain,
  competitorDomains,
}: {
  query: string;
  brandDomain: string;
  competitorDomains: string[];
}) {
  const apiKey = process.env.AZURE_OPENAI_API_KEY;

  if (!apiKey) {
    return {
      engine: "COPILOT" as const,
      query,
      brandVisible: false,
      competitorDomain: "",
      rawResponse: "[STUB] AZURE_OPENAI_API_KEY not set",
    };
  }

  const endpoint = process.env.AZURE_OPENAI_ENDPOINT || "";
  const response = await fetch(
    `${endpoint}/openai/deployments/gpt-4o/chat/completions?api-version=2024-12-01-preview`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify({
        messages: [{ role: "user", content: query }],
        data_sources: [
          {
            type: "bing_grounding",
            parameters: { connection_id: process.env.BING_CONNECTION_ID },
          },
        ],
      }),
    }
  );

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || "";
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
    engine: "COPILOT" as const,
    query,
    brandVisible,
    competitorDomain,
    rawResponse: content.slice(0, 10000),
  };
}
