import { getClaudeClient } from "./claude";

interface BrandInput {
  brandName: string;
  domain: string;
  brandDescription: string;
  categories: string[];
}

export interface BrandQuery {
  query: string;
  tier: "awareness" | "category" | "intent" | "competitor" | "thought_leadership";
  intent: string;
}

export async function generateBrandQueries(brand: BrandInput): Promise<BrandQuery[]> {
  const claude = getClaudeClient();

  const response = await claude.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: `You are generating search queries that REAL CUSTOMERS would type into ChatGPT, Perplexity, or Google AI when looking for products. These must sound natural — not like SEO keywords or marketing copy.

Brand: ${brand.brandName} (${brand.domain})
Description: ${brand.brandDescription}
Categories they sell: ${brand.categories.join(", ")}

Generate 20 queries organized as follows. IMPORTANT: Make queries specific to what this brand actually sells. Use real price ranges, real product types, and real locations.

1. **awareness** (4 queries): Brand recognition + trust.
   - 2 queries WITH brand name: "is [brand] legit", "[brand] reviews India"
   - 2 queries about their domain/niche WITHOUT brand name: "best sites to buy [their actual product type]"

2. **category** (5 queries): Category discovery with geo. Someone browsing, not searching for a specific product.
   - Use the brand's ACTUAL categories (${brand.categories.join(", ")})
   - Include location (India, Delhi, Mumbai etc.)
   - Example: "second hand furniture online Delhi" NOT "best place to buy general products online India"

3. **intent** (5 queries): Real-life situations that lead to purchases in their categories.
   - Think: "setting up a home office on budget", "my kid needs a study table"
   - Budget-conscious framing (common for their market)
   - NO brand name in these

4. **competitor** (3 queries): Brand vs competitors + alternatives.
   - Use brand name here
   - Compare to well-known competitors in their space

5. **thought_leadership** (3 queries): Industry/market queries.
   - NO brand name
   - Trends in their specific vertical, not generic "sustainable shopping"

Return ONLY a JSON array: [{"query": "...", "tier": "...", "intent": "..."}]`,
      },
    ],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";

  try {
    const parsed = JSON.parse(text.trim());
    if (Array.isArray(parsed)) {
      return parsed.filter(
        (q): q is BrandQuery =>
          typeof q === "object" &&
          typeof q.query === "string" &&
          typeof q.tier === "string" &&
          typeof q.intent === "string"
      );
    }
  } catch {
    const match = text.match(/\[[\s\S]*\]/);
    if (match) {
      const arr = JSON.parse(match[0]);
      return arr.filter(
        (q: unknown): q is BrandQuery => {
          const obj = q as Record<string, unknown>;
          return (
            typeof obj === "object" &&
            obj !== null &&
            typeof obj.query === "string" &&
            typeof obj.tier === "string"
          );
        }
      );
    }
  }

  throw new Error("Failed to parse brand query generation response");
}

/**
 * Fallback brand queries when Claude API fails.
 * Uses actual brand data to generate useful queries — not generic garbage.
 */
export function generateFallbackBrandQueries(brand: BrandInput): BrandQuery[] {
  const { brandName, domain, categories } = brand;

  // Build category-specific queries instead of "general products"
  const cat1 = categories[0] || "products";
  const cat2 = categories[1] || cat1;
  const cat3 = categories[2] || cat2;

  // Detect if it's a refurbished/used goods marketplace
  const desc = (brand.brandDescription || "").toLowerCase();
  const isRefurbished = desc.includes("refurbish") || desc.includes("second hand") ||
    desc.includes("pre-owned") || desc.includes("used") || domain.includes("giveasy");

  const prefix = isRefurbished ? "second hand" : "buy";
  const modifier = isRefurbished ? "used" : "best";

  return [
    // Awareness — 2 with brand name, 2 without
    { query: `is ${brandName} safe to buy from`, tier: "awareness", intent: "Brand trust check" },
    { query: `${brandName} reviews India`, tier: "awareness", intent: "Social proof search" },
    { query: `${modifier} ${cat1} online India with warranty`, tier: "awareness", intent: "Category + trust discovery" },
    { query: `reliable websites to buy ${prefix} ${cat2} India`, tier: "awareness", intent: "Platform discovery" },

    // Category — specific to what they sell, with geo
    { query: `${prefix} ${cat1} online Delhi NCR`, tier: "category", intent: `Local ${cat1} search` },
    { query: `affordable ${cat2} under 20000 India`, tier: "category", intent: `Price-anchored ${cat2} search` },
    { query: `where to buy ${modifier} ${cat3} in India`, tier: "category", intent: `${cat3} marketplace search` },
    { query: `${prefix} ${cat1} with good condition online`, tier: "category", intent: `Quality-focused ${cat1} search` },
    { query: `cheap ${cat2} for home India 2026`, tier: "category", intent: `Budget ${cat2} search` },

    // Intent — real situations, no brand name
    { query: `setting up home office on a budget India`, tier: "intent", intent: "Life event: home office setup" },
    { query: `furnish 1BHK apartment under 50000`, tier: "intent", intent: "Life event: new apartment" },
    { query: `my kid needs a study table where to find cheap ones`, tier: "intent", intent: "Parenting need" },
    { query: `good quality ${cat1} without paying full price`, tier: "intent", intent: "Value-seeking intent" },
    { query: `moving to new city need ${cat2} quickly`, tier: "intent", intent: "Urgency-driven purchase" },

    // Competitor — with brand name
    { query: `${brandName} vs OLX which is better`, tier: "competitor", intent: "Direct competitor comparison" },
    { query: `${brandName} vs Cashify for ${cat1}`, tier: "competitor", intent: "Category-specific competitor" },
    { query: `alternatives to OLX for buying ${cat2}`, tier: "competitor", intent: "Competitor alternative" },

    // Thought Leadership — industry specific, no brand name
    { query: `${isRefurbished ? "refurbished" : cat1} market India 2026`, tier: "thought_leadership", intent: "Industry trend" },
    { query: `why buy ${isRefurbished ? "refurbished" : "pre-owned"} instead of new`, tier: "thought_leadership", intent: "Category education" },
    { query: `${isRefurbished ? "circular economy" : cat1 + " industry"} trends India`, tier: "thought_leadership", intent: "Market insight" },
  ];
}
