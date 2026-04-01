import { getClaudeClient } from "./claude";

interface SkuInput {
  name: string;
  category: string;
  description: string;
}

export async function generateQueries(sku: SkuInput): Promise<string[]> {
  const claude = getClaudeClient();

  const response = await claude.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `You are generating search queries that REAL PEOPLE would type into ChatGPT or Perplexity when looking for a product like this:

Product: ${sku.name}
Category: ${sku.category}
Description: ${sku.description}

Generate 5 natural search queries. These must sound like real human questions — NOT SEO keywords.

Rules:
- DO NOT use the product name or brand name in queries (we're testing if AI recommends this product organically)
- Focus on what the product DOES, not what it IS
- Include price-conscious queries (under X rupees)
- Include use-case queries (for gym, for office, for kids)
- Include comparison queries (vs competitor type)

Examples of GOOD queries for "boAt Stone 358 Pro" (speaker):
- "bluetooth speaker with good bass for house parties under 3000"
- "portable speaker that works in the shower"
- "small speaker for travel with long battery life"
- "best speaker for playing music at picnics"
- "loud wireless speaker under 2000 rupees India"

Examples of BAD queries (don't do this):
- "boAt Stone 358 Pro review" (uses brand name)
- "best speakers online India" (too generic)
- "buy bluetooth speaker" (no intent/context)

Return ONLY a JSON array of 5 strings, no other text.`,
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  try {
    const parsed = JSON.parse(text.trim());
    if (Array.isArray(parsed)) {
      return parsed.filter((q): q is string => typeof q === "string").slice(0, 5);
    }
  } catch {
    const match = text.match(/\[[\s\S]*\]/);
    if (match) {
      const arr = JSON.parse(match[0]);
      return arr.filter((q: unknown): q is string => typeof q === "string").slice(0, 5);
    }
  }

  // Fallback — generate based on product attributes, not brand name
  return generateFallbackQueries(sku);
}

/**
 * Smart fallback queries based on product category and description.
 * No brand names, no generic "best X" garbage.
 */
function generateFallbackQueries(sku: SkuInput): string[] {
  const cat = (sku.category || "").toLowerCase();
  const desc = (sku.description || "").toLowerCase();
  const name = (sku.name || "").toLowerCase();

  // Extract key attributes from description
  const hasANC = desc.includes("anc") || desc.includes("noise cancel");
  const hasBass = desc.includes("bass");
  const hasBattery = desc.includes("battery") || desc.includes("hour");
  const hasWaterproof = desc.includes("ipx") || desc.includes("waterproof") || desc.includes("water resistant");
  const hasWireless = desc.includes("wireless") || desc.includes("bluetooth") || desc.includes("tws");

  // Category-specific query templates
  const templates: Record<string, string[]> = {
    earbuds: [
      hasANC ? "earbuds with noise cancellation under 3000 for office" : "wireless earbuds under 2000 with good sound quality",
      hasBass ? "earbuds with heavy bass for workout" : "comfortable earbuds for long listening sessions",
      hasWaterproof ? "sweatproof earbuds for running and gym" : "earbuds that don't fall out during exercise",
      "best TWS earbuds for phone calls under 2500 India",
      "earbuds with long battery life for travel",
    ],
    headphones: [
      hasANC ? "headphones with ANC for noisy office under 5000" : "over ear headphones comfortable for long hours",
      "wireless headphones for music production under 5000",
      hasBass ? "headphones with deep bass for EDM and hip hop" : "headphones with balanced sound for all genres",
      "bluetooth headphones that work with laptop and phone",
      "best headphones for video calls work from home",
    ],
    speakers: [
      hasWaterproof ? "waterproof speaker for pool and beach" : "bluetooth speaker for home use under 3000",
      hasBass ? "speaker with loud bass for house parties" : "portable speaker with clear sound for room",
      "small travel speaker with long battery life",
      "outdoor speaker that can handle rain",
      "wireless speaker under 2000 with good volume",
    ],
    smartwatches: [
      "fitness watch with heart rate monitor under 3000",
      "smartwatch for tracking running and cycling India",
      "best watch for step counting and sleep tracking",
      "smartwatch that works with android under 5000",
      "affordable fitness band with SpO2 sensor",
    ],
    soundbars: [
      "soundbar for TV under 10000 with good dialogue clarity",
      "compact soundbar for small bedroom TV",
      "soundbar with subwoofer for movies at home",
      "best soundbar for Samsung TV under 8000",
      "wireless soundbar with bluetooth for music and TV",
    ],
    mattresses: [
      "mattress for back pain relief medium firm",
      "memory foam mattress under 15000 queen size",
      "best mattress for hot sleepers India",
      "orthopedic mattress that doesn't sag after 2 years",
      "mattress for couple with different firmness preference",
    ],
    furniture: [
      "study table for small room with storage under 5000",
      "office chair comfortable for 8 hours work from home",
      "sofa set for 1BHK apartment under 15000",
      "bed with storage underneath for small bedroom",
      "bookshelf that fits in corner of room",
    ],
    pillows: [
      "pillow for neck pain side sleeper",
      "memory foam pillow that stays cool at night",
      "best pillow for cervical pain India",
      "soft pillow that doesn't go flat",
      "pillow for someone who sleeps on their stomach",
    ],
    "t-shirts": [
      "oversized t-shirt for men under 500 cotton",
      "graphic tees with cool designs India",
      "plain t-shirt that doesn't shrink after washing",
      "comfortable t-shirt for gym and casual wear",
      "t-shirt brands with good fabric quality under 600",
    ],
    "casual wear": [
      "affordable streetwear brands in India",
      "trendy casual clothes for college under 1000",
      "comfortable everyday wear for men online",
      "casual outfit ideas for men India budget",
      "good quality basics t-shirts and joggers online",
    ],
    joggers: [
      "comfortable joggers for work from home under 800",
      "joggers that look good for going out not just gym",
      "track pants with zipper pockets for men",
      "slim fit joggers for casual wear India",
      "cotton joggers that don't pill after washing",
    ],
  };

  // Try exact category match first, then partial match
  const matched = templates[cat] ||
    Object.entries(templates).find(([key]) => cat.includes(key) || key.includes(cat))?.[1];

  if (matched) return matched;

  // Generic product-type queries
  return [
    `best ${cat || "product"} under 5000 India`,
    `${cat || "product"} with good quality and durability`,
    `affordable ${cat || "product"} for everyday use`,
    `${cat || "product"} recommendation for someone on a budget`,
    `which ${cat || "product"} to buy in 2026 India`,
  ];
}
