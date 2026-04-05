import { getClaudeClient } from "./claude";

interface BrandInput {
  brandName: string;
  domain: string;
  brandDescription: string;
  categories: string[];
}

export interface BrandQuery {
  query: string;
  tier: "hero_sku" | "category" | "purchase_intent" | "competitor";
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
        content: `You are generating search queries that REAL CUSTOMERS would type into ChatGPT, Perplexity, or Google AI when shopping for products. These must sound natural and conversational — like how a real person in India would ask an AI assistant for product recommendations.

Brand: ${brand.brandName} (${brand.domain})
Description: ${brand.brandDescription}
Categories they sell: ${brand.categories.join(", ")}

Generate exactly 20 queries (5 per tier) organized as follows. CRITICAL: Use REAL price points in INR (e.g. "under 1000", "under 2000", "under 5000"), REAL product subcategories, and India-specific phrasing.

1. **hero_sku** (5 queries): Queries about the brand's TOP SELLING product types.
   - These are specific product searches where the brand likely dominates
   - Use real price ranges in INR: "best earbuds under 2000", "wireless neckband for gym under 1000"
   - Mix with and without brand name (3 without, 2 with brand name)
   - Think about what this brand's best-selling products actually are

2. **category** (5 queries): General category browsing — someone exploring options, not a specific product.
   - Use the brand's ACTUAL categories: ${brand.categories.join(", ")}
   - Include "India", "2024", "2025" for freshness signals
   - Examples: "best bluetooth speakers India 2025", "TWS earbuds comparison"
   - NO brand name in these queries

3. **purchase_intent** (5 queries): High-intent buying queries — someone ready to purchase.
   - Budget-conscious, feature-specific queries: "earbuds with good bass under 1500", "which headphones for daily commute"
   - Use-case driven: "best earphones for online classes", "portable speaker for house party"
   - NO brand name — these are category queries where the brand SHOULD appear

4. **competitor** (5 queries): Direct brand comparisons and "vs" queries.
   - Use brand name here: "${brand.brandName} vs [competitor]", "is ${brand.brandName} better than [competitor]"
   - Compare to REAL well-known competitors in their space
   - Include "which should I buy", "comparison", "better value"

Return ONLY a JSON array: [{"query": "...", "tier": "hero_sku|category|purchase_intent|competitor", "intent": "brief description"}]`,
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
  const { brandName, categories } = brand;

  const cat1 = categories[0] || "products";
  const cat2 = categories[1] || cat1;
  const cat3 = categories[2] || cat2;

  return [
    // Hero SKU — queries about brand's top product types
    { query: `best ${cat1} under 2000`, tier: "hero_sku", intent: "Price-anchored hero product search" },
    { query: `${brandName} best selling ${cat1} 2025`, tier: "hero_sku", intent: "Brand hero product discovery" },
    { query: `top rated ${cat2} under 1500 India`, tier: "hero_sku", intent: "Budget hero product search" },
    { query: `${brandName} ${cat1} worth buying`, tier: "hero_sku", intent: "Brand product validation" },
    { query: `best ${cat3} for gym and workout`, tier: "hero_sku", intent: "Use-case hero product" },

    // Category — general category browsing
    { query: `best ${cat1} India 2025`, tier: "category", intent: `${cat1} category discovery` },
    { query: `top 10 ${cat2} brands in India`, tier: "category", intent: `${cat2} brand comparison` },
    { query: `${cat1} buying guide India`, tier: "category", intent: "Category education" },
    { query: `affordable ${cat3} comparison 2025`, tier: "category", intent: `${cat3} category comparison` },
    { query: `which ${cat2} are trending in India right now`, tier: "category", intent: "Trending category search" },

    // Purchase Intent — ready to buy queries
    { query: `${cat1} with good bass under 1500`, tier: "purchase_intent", intent: "Feature-specific purchase" },
    { query: `which ${cat2} to buy for daily commute`, tier: "purchase_intent", intent: "Use-case purchase intent" },
    { query: `best ${cat1} for online classes and meetings`, tier: "purchase_intent", intent: "WFH purchase intent" },
    { query: `long battery life ${cat2} under 3000`, tier: "purchase_intent", intent: "Spec-driven purchase" },
    { query: `durable ${cat3} for outdoor use India`, tier: "purchase_intent", intent: "Durability-focused purchase" },

    // Competitor — brand vs brand
    { query: `${brandName} vs JBL which is better`, tier: "competitor", intent: "Direct competitor comparison" },
    { query: `${brandName} vs Noise comparison 2025`, tier: "competitor", intent: "Competitor comparison" },
    { query: `is ${brandName} better than Sony for ${cat1}`, tier: "competitor", intent: "Premium competitor comparison" },
    { query: `${brandName} vs Samsung ${cat2} value for money`, tier: "competitor", intent: "Value comparison" },
    { query: `alternatives to ${brandName} in India`, tier: "competitor", intent: "Alternative search" },
  ];
}
