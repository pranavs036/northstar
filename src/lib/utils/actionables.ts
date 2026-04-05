import type { Actionable } from "@/types/catalog";

interface SkuData {
  name: string;
  description: string | null;
  url: string | null;
  category: string | null;
}

interface DiagnosisData {
  severity: string;
  reason: string;
  fix: string;
  engine: string;
}

/**
 * Generate actionable recommendations for a SKU based on its data and diagnoses.
 * These are concrete, specific fixes that improve AI search visibility.
 */
export function generateActionables(sku: SkuData, diagnoses: DiagnosisData[]): Actionable[] {
  const actionables: Actionable[] = [];
  const descLen = (sku.description || "").length;
  const hasUrl = !!sku.url;
  const hasCritical = diagnoses.some((d) => d.severity === "CRITICAL");
  const hasHigh = diagnoses.some((d) => d.severity === "HIGH");

  // 1. Product FAQ Schema — almost always needed
  actionables.push({
    id: "faq-schema",
    title: "Add Product FAQ Schema (JSON-LD)",
    description:
      "Add FAQ structured data with 3-5 real customer questions about this product. AI engines heavily weight FAQ schema when generating answers. Include questions like 'Is this product worth the price?', 'How does it compare to [competitor]?', and feature-specific questions.",
    severity: "CRITICAL",
    category: "schema",
  });

  // 2. Description length check
  if (descLen < 200) {
    actionables.push({
      id: "expand-description",
      title: `Expand product description from ~${descLen > 0 ? Math.round(descLen / 5) : 0} words to 200+`,
      description:
        "Short descriptions get ignored by AI engines. Add comparison tables, use-case scenarios, and 'Best for' sections. Include specific specs, dimensions, and feature callouts that match common query patterns.",
      severity: "CRITICAL",
      category: "content",
    });
  }

  // 3. Review markup
  actionables.push({
    id: "review-markup",
    title: "Add structured review markup (JSON-LD AggregateRating)",
    description:
      "Competitors typically have 40+ reviews in their schema markup. Add AggregateRating schema with real review data — AI engines use star ratings and review counts as trust signals when choosing which products to recommend.",
    severity: "HIGH",
    category: "reviews",
  });

  // 4. Price comparison structured data
  actionables.push({
    id: "price-schema",
    title: "Add price comparison structured data (Offer schema)",
    description:
      "Include Product schema with Offer data showing price, currency, availability, and price range. AI engines surface products with clear pricing more frequently, especially for 'under X' queries.",
    severity: "HIGH",
    category: "structured_data",
  });

  // 5. Best For / Ideal For sections
  actionables.push({
    id: "best-for-sections",
    title: "Add 'Best For' and 'Ideal For' content sections",
    description:
      "Create sections that match common AI query patterns: 'Best for gym workouts', 'Ideal for daily commute', 'Perfect for online classes'. These directly map to how users phrase questions to AI assistants.",
    severity: "HIGH",
    category: "content",
  });

  // 6. Competitor comparison content
  if (hasCritical || hasHigh) {
    actionables.push({
      id: "comparison-content",
      title: "Add head-to-head comparison content vs top competitors",
      description:
        "Create a comparison section or table that directly addresses '[Brand] vs [Competitor]' queries. Include specs, pricing, pros/cons. AI engines frequently cite pages that contain structured comparisons.",
      severity: "HIGH",
      category: "comparison",
    });
  }

  // 7. Product schema breadcrumb
  if (hasUrl) {
    actionables.push({
      id: "breadcrumb-schema",
      title: "Add BreadcrumbList schema to product page",
      description:
        "Add structured breadcrumb data (Category > Subcategory > Product) to help AI engines understand product taxonomy and surface it for category-level queries.",
      severity: "MEDIUM",
      category: "schema",
    });
  }

  // 8. Specs table with structured data
  actionables.push({
    id: "specs-structured",
    title: "Add detailed specs table with additionalProperty schema",
    description:
      "Include a machine-readable specs table using Product schema's additionalProperty field. Cover battery life, weight, connectivity, compatibility — the specific attributes users ask AI about.",
    severity: "MEDIUM",
    category: "structured_data",
  });

  // 9. Use-case content blocks
  actionables.push({
    id: "use-case-content",
    title: "Add use-case specific content blocks",
    description:
      "Create 3-4 content blocks targeting specific scenarios: 'For Work From Home', 'For Travel', 'For Fitness'. Each block should have 50-100 words addressing that use case with relevant product features.",
    severity: "MEDIUM",
    category: "content",
  });

  return actionables;
}
