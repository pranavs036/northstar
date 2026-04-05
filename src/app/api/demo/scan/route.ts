import { NextRequest, NextResponse } from "next/server";
import { scanClaude } from "@/lib/scanners/claude";
import { generateFallbackBrandQueries } from "@/lib/ai/brand-query-gen";
import type { BrandScanResult, TierScores } from "@/types/brand-scan";

/**
 * Demo brand scan endpoint — no auth required.
 * Uses the Claude scanner to run ~12-15 queries about the brand
 * and returns real visibility results.
 */
export async function POST(request: NextRequest) {
  let brandName: string;
  let websiteUrl: string | undefined;

  try {
    const body = await request.json();
    brandName = body.brandName;
    websiteUrl = body.websiteUrl;
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  if (!brandName || typeof brandName !== "string" || brandName.trim().length === 0) {
    return NextResponse.json(
      { error: "brandName is required" },
      { status: 400 }
    );
  }

  brandName = brandName.trim();

  // Derive domain from websiteUrl or brand name
  let brandDomain = "";
  if (websiteUrl) {
    brandDomain = websiteUrl
      .replace(/^https?:\/\//, "")
      .replace(/\/.*$/, "")
      .toLowerCase();
  } else {
    brandDomain = `${brandName.toLowerCase().replace(/\s+/g, "")}.com`;
  }

  // Generate queries using the fallback generator (fast, no API call needed)
  // We use fallback to keep the demo fast — the query gen itself would cost another API call
  const brandDescription = `${brandName} is an online brand at ${brandDomain}`;
  const categories = inferCategories(brandName, brandDomain);

  const brandQueries = generateFallbackBrandQueries({
    brandName,
    domain: brandDomain,
    brandDescription,
    categories,
  });

  // Limit to ~12 queries for demo (keep it fast, save API costs)
  const selectedQueries = brandQueries.slice(0, 12);

  // Run Claude scanner on each query
  const scanResults: BrandScanResult[] = [];

  for (const bq of selectedQueries) {
    try {
      const result = await scanClaude({
        query: bq.query,
        brandDomain,
        competitorDomains: [],
      });

      const isSkipped =
        result.rawResponse.startsWith("[SKIPPED]") ||
        result.rawResponse.startsWith("[STUB]") ||
        result.rawResponse.startsWith("[ERROR]");

      // Check if brand name (not just domain) is mentioned
      const responseLower = result.rawResponse.toLowerCase();
      const brandNameVisible =
        responseLower.includes(brandName.toLowerCase()) ||
        result.brandVisible;

      const scanResult: BrandScanResult = {
        query: bq.query,
        tier: bq.tier,
        intent: bq.intent,
        engine: result.engine,
        brandVisible: isSkipped ? false : brandNameVisible,
        brandPosition: isSkipped
          ? 0
          : result.brandPosition || (brandNameVisible ? 1 : 0),
        competitorMentioned: result.competitorDomain,
        competitorPositions: result.competitorPositions || [],
        totalBrandsMentioned: result.totalBrandsMentioned || 0,
        rawResponse: result.rawResponse.slice(0, 3000),
      };

      scanResults.push(scanResult);
    } catch (err) {
      console.error(
        `[demo-scan] Claude failed for "${bq.query}":`,
        err
      );
    }

    // Rate limit: 1s between calls (demo can be a bit faster)
    await new Promise((r) => setTimeout(r, 1000));
  }

  // Calculate tier scores (same logic as brand-scan/start)
  const tiers: Array<
    "hero_sku" | "category" | "purchase_intent" | "competitor"
  > = ["hero_sku", "category", "purchase_intent", "competitor"];

  const tierScores: TierScores = {} as TierScores;
  for (const tier of tiers) {
    const tierResults = scanResults.filter(
      (r) =>
        r.tier === tier &&
        !r.rawResponse.startsWith("[SKIPPED]") &&
        !r.rawResponse.startsWith("[STUB]") &&
        !r.rawResponse.startsWith("[ERROR]")
    );
    const visible = tierResults.filter((r) => r.brandVisible).length;
    const total = tierResults.length;

    const positions = tierResults
      .filter((r) => r.brandPosition > 0)
      .map((r) => r.brandPosition);
    const avgPosition =
      positions.length > 0
        ? Math.round(
            (positions.reduce((a, b) => a + b, 0) / positions.length) * 10
          ) / 10
        : 0;

    let tierScore = 0;
    if (total > 0) {
      const positionScores: number[] = tierResults.map((r): number => {
        if (r.brandPosition === 0) return 0;
        if (r.brandPosition === 1) return 100;
        if (r.brandPosition === 2) return 80;
        if (r.brandPosition === 3) return 60;
        if (r.brandPosition <= 5) return 40;
        return 20;
      });
      tierScore = Math.round(
        positionScores.reduce((a: number, b: number) => a + b, 0) / total
      );
    }

    tierScores[tier] = {
      total,
      visible,
      score: tierScore,
      avgPosition,
    };
  }

  // Overall weighted score
  const weights = {
    hero_sku: 0.25,
    category: 0.25,
    purchase_intent: 0.25,
    competitor: 0.25,
  };

  let visibilityScore = 0;
  for (const tier of tiers) {
    visibilityScore += tierScores[tier].score * weights[tier];
  }
  visibilityScore = Math.round(visibilityScore);

  const brandVisibleCount = scanResults.filter((r) => r.brandVisible).length;

  return NextResponse.json({
    brandName,
    brandDomain,
    visibilityScore,
    totalResults: scanResults.length,
    brandVisibleCount,
    tierScores,
    results: scanResults,
  });
}

/**
 * Infer product categories from brand name/domain for smarter query generation.
 */
function inferCategories(brandName: string, domain: string): string[] {
  const name = brandName.toLowerCase();
  const dom = domain.toLowerCase();

  // Known brand -> category mappings
  const brandCategoryMap: Record<string, string[]> = {
    wakefit: ["mattresses", "pillows", "furniture", "bed frames"],
    furlenco: ["furniture rental", "sofas", "beds", "home decor"],
    pepperfry: ["furniture", "home decor", "sofas", "beds"],
    ikea: ["furniture", "home furnishing", "storage", "kitchen"],
    sleepyhead: ["mattresses", "pillows", "bed accessories"],
    boat: ["earbuds", "headphones", "speakers", "smartwatches"],
    noise: ["smartwatches", "earbuds", "headphones"],
    bewakoof: ["t-shirts", "casual wear", "hoodies", "joggers"],
    myntra: ["fashion", "clothing", "footwear", "accessories"],
    ajio: ["fashion", "clothing", "footwear", "accessories"],
    nykaa: ["beauty", "skincare", "makeup", "haircare"],
    mamaearth: ["skincare", "haircare", "baby care", "beauty"],
    lenskart: ["eyeglasses", "sunglasses", "contact lenses"],
    cred: ["credit cards", "financial services", "rewards"],
    zomato: ["food delivery", "restaurant", "dining"],
    swiggy: ["food delivery", "grocery", "restaurant"],
    flipkart: ["electronics", "fashion", "home", "mobile phones"],
    amazon: ["electronics", "fashion", "home", "books"],
    urbanladder: ["furniture", "home decor", "lighting", "rugs"],
    giveasy: ["refurbished furniture", "used electronics", "second hand goods"],
    cashify: ["refurbished phones", "used electronics", "gadgets"],
    olx: ["used goods", "second hand furniture", "used electronics"],
    quikr: ["used goods", "classifieds", "services"],
    croma: ["electronics", "appliances", "laptops", "mobile phones"],
    oneplus: ["smartphones", "earbuds", "smartwatches", "accessories"],
    realme: ["smartphones", "earbuds", "smartwatches"],
    samsung: ["smartphones", "TVs", "appliances", "tablets"],
    apple: ["iPhones", "MacBooks", "iPads", "AirPods"],
    sugar: ["makeup", "lipstick", "foundation", "beauty"],
    plum: ["skincare", "haircare", "beauty", "organic products"],
    bombay: ["shaving", "grooming", "beard care"],
    manyavar: ["ethnic wear", "wedding wear", "kurtas"],
    fabindia: ["ethnic wear", "home decor", "organic food"],
    tanishq: ["jewellery", "gold", "diamonds", "wedding jewellery"],
    titan: ["watches", "eyewear", "jewellery"],
    godrej: ["home appliances", "furniture", "interiors", "security"],
    asian: ["paints", "wall colours", "home painting"],
    pidilite: ["adhesives", "waterproofing", "construction chemicals"],
    havells: ["electrical", "lighting", "fans", "water purifiers"],
    bajaj: ["appliances", "fans", "lighting", "kitchen"],
    crompton: ["fans", "lighting", "pumps", "appliances"],
  };

  // Check brand name against known brands
  for (const [key, cats] of Object.entries(brandCategoryMap)) {
    if (name.includes(key) || dom.includes(key)) {
      return cats;
    }
  }

  // Generic fallback — try to infer from domain hints
  if (dom.includes("furniture") || dom.includes("decor") || dom.includes("home")) {
    return ["furniture", "home decor", "interiors"];
  }
  if (dom.includes("fashion") || dom.includes("wear") || dom.includes("cloth")) {
    return ["clothing", "fashion", "accessories"];
  }
  if (dom.includes("tech") || dom.includes("electronics") || dom.includes("gadget")) {
    return ["electronics", "gadgets", "accessories"];
  }
  if (dom.includes("beauty") || dom.includes("skin") || dom.includes("cosmetic")) {
    return ["beauty", "skincare", "cosmetics"];
  }
  if (dom.includes("food") || dom.includes("grocery")) {
    return ["food", "grocery", "kitchen"];
  }

  return ["general products"];
}
