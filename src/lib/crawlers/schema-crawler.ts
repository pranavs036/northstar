import { chromium } from "playwright";
import type { SchemaAuditResult, ProductSchema, SchemaProperty } from "@/types/schema-audit";

const REQUIRED_PROPS = ["name", "description", "image", "offers", "brand", "sku"];
const OPTIONAL_PROPS = [
  "aggregateRating",
  "review",
  "gtin",
  "mpn",
  "color",
  "material",
  "weight",
  "width",
  "height",
  "depth",
  "category",
];

function isProductSchema(obj: Record<string, unknown>): boolean {
  const type = obj["@type"];
  if (!type) return false;
  if (typeof type === "string") {
    return (
      type === "Product" ||
      type === "http://schema.org/Product" ||
      type === "https://schema.org/Product"
    );
  }
  if (Array.isArray(type)) {
    return type.some(
      (t) =>
        t === "Product" ||
        t === "http://schema.org/Product" ||
        t === "https://schema.org/Product"
    );
  }
  return false;
}

function extractProductSchemas(parsed: unknown): Record<string, unknown>[] {
  const results: Record<string, unknown>[] = [];

  if (!parsed || typeof parsed !== "object") return results;

  const obj = parsed as Record<string, unknown>;

  // Direct Product schema
  if (isProductSchema(obj)) {
    results.push(obj);
    return results;
  }

  // @graph array containing Product schemas
  if (Array.isArray(obj["@graph"])) {
    for (const item of obj["@graph"] as unknown[]) {
      if (item && typeof item === "object" && isProductSchema(item as Record<string, unknown>)) {
        results.push(item as Record<string, unknown>);
      }
    }
  }

  return results;
}

function getStringValue(obj: Record<string, unknown>, key: string): string | null {
  const val = obj[key];
  if (val === undefined || val === null) return null;
  if (typeof val === "string") return val;
  if (typeof val === "object") return JSON.stringify(val);
  return String(val);
}

function buildProductSchema(raw: Record<string, unknown>): ProductSchema {
  const allProps = [...REQUIRED_PROPS, ...OPTIONAL_PROPS];
  const properties: SchemaProperty[] = allProps.map((name) => {
    const value = getStringValue(raw, name);
    return {
      name,
      value,
      required: REQUIRED_PROPS.includes(name),
      present: value !== null,
    };
  });

  return {
    type: typeof raw["@type"] === "string" ? raw["@type"] : "Product",
    properties,
    rawJsonLd: JSON.stringify(raw),
  };
}

function scoreSchema(schemas: ProductSchema[]): {
  completenessScore: number;
  missingRequired: string[];
  missingOptional: string[];
} {
  if (schemas.length === 0) {
    return {
      completenessScore: 0,
      missingRequired: [...REQUIRED_PROPS],
      missingOptional: [...OPTIONAL_PROPS],
    };
  }

  // Aggregate presence across all found schemas
  const presentProps = new Set<string>();
  for (const schema of schemas) {
    for (const prop of schema.properties) {
      if (prop.present) presentProps.add(prop.name);
    }
  }

  const missingRequired = REQUIRED_PROPS.filter((p) => !presentProps.has(p));
  const missingOptional = OPTIONAL_PROPS.filter((p) => !presentProps.has(p));

  const totalProps = REQUIRED_PROPS.length + OPTIONAL_PROPS.length;
  const presentCount = presentProps.size;
  const completenessScore = Math.round((presentCount / totalProps) * 100);

  return { completenessScore, missingRequired, missingOptional };
}

function buildFallback(url: string, skuId: string): SchemaAuditResult {
  return {
    url,
    skuId,
    schemasFound: [],
    completenessScore: 0,
    missingRequired: [...REQUIRED_PROPS],
    missingOptional: [...OPTIONAL_PROPS],
    hasPrice: false,
    hasAvailability: false,
    hasReviews: false,
    hasRatings: false,
    hasImages: false,
    hasBrand: false,
  };
}

export async function crawlProductSchema({
  url,
  skuId,
}: {
  url: string;
  skuId: string;
}): Promise<SchemaAuditResult> {
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.setExtraHTTPHeaders({
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    });

    await page.goto(url, { waitUntil: "networkidle", timeout: 20000 });

    // Extract all JSON-LD script blocks
    const jsonLdTexts: string[] = await page.$$eval(
      'script[type="application/ld+json"]',
      (elements) => elements.map((el) => el.textContent ?? "")
    );

    // Extract microdata product elements as a supplementary signal
    const hasMicrodata = await page.$('[itemtype*="schema.org/Product"]').then((el) => el !== null);

    // Parse JSON-LD and collect Product schemas
    const allProductRaws: Record<string, unknown>[] = [];
    for (const text of jsonLdTexts) {
      const trimmed = text.trim();
      if (!trimmed) continue;
      try {
        const parsed: unknown = JSON.parse(trimmed);
        // Handle both single objects and arrays at the top level
        const items = Array.isArray(parsed) ? parsed : [parsed];
        for (const item of items) {
          const products = extractProductSchemas(item);
          allProductRaws.push(...products);
        }
      } catch {
        // Skip malformed JSON-LD blocks
      }
    }

    const schemasFound: ProductSchema[] = allProductRaws.map(buildProductSchema);
    const { completenessScore, missingRequired, missingOptional } = scoreSchema(schemasFound);

    // Derive boolean feature flags from aggregated schema data
    const presentProps = new Set<string>(
      schemasFound.flatMap((s) =>
        s.properties.filter((p) => p.present).map((p) => p.name)
      )
    );

    // Check price inside offers
    let hasPrice = false;
    let hasAvailability = false;
    if (presentProps.has("offers")) {
      try {
        for (const raw of allProductRaws) {
          const offers = raw["offers"];
          if (!offers) continue;
          const offersObj =
            typeof offers === "string" ? (JSON.parse(offers) as Record<string, unknown>) : (offers as Record<string, unknown>);
          if (offersObj["price"] !== undefined || offersObj["lowPrice"] !== undefined) {
            hasPrice = true;
          }
          if (offersObj["availability"] !== undefined) {
            hasAvailability = true;
          }
        }
      } catch {
        // Ignore parse errors on nested offers
      }
    }

    const hasReviews = presentProps.has("review");
    const hasRatings = presentProps.has("aggregateRating");
    const hasImages = presentProps.has("image");
    const hasBrand = presentProps.has("brand");

    return {
      url,
      skuId,
      schemasFound,
      completenessScore: hasMicrodata && completenessScore === 0 ? 5 : completenessScore,
      missingRequired,
      missingOptional,
      hasPrice,
      hasAvailability,
      hasReviews,
      hasRatings,
      hasImages,
      hasBrand,
    };
  } catch (error) {
    console.error(
      `[schema-crawler] Error crawling ${url}:`,
      error instanceof Error ? error.message : "Unknown error"
    );
    return buildFallback(url, skuId);
  } finally {
    if (browser) await browser.close();
  }
}
