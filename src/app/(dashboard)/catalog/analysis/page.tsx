import { createServerClient } from "@/lib/pocketbase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { SkuRecord } from "@/types/pocketbase";
import { SkuAnalysisResults } from "@/components/catalog/SkuAnalysisResults";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Mock data generator — produces realistic analysis data from real SKU records
// ---------------------------------------------------------------------------

type Severity = "CRITICAL" | "HIGH" | "MEDIUM";
type Engine = "ChatGPT" | "Perplexity" | "Google AI" | "Gemini" | "Bing CoPilot";

const ALL_ENGINES: Engine[] = ["ChatGPT", "Perplexity", "Google AI", "Gemini", "Bing CoPilot"];

interface Actionable {
  text: string;
  severity: Severity;
}

const ACTIONABLE_POOL: Actionable[] = [
  { text: "Add Product FAQ schema with 3-5 customer questions", severity: "CRITICAL" },
  { text: "Add structured review markup (JSON-LD). Competitor has 40+ reviews, you have 0", severity: "CRITICAL" },
  { text: "Include price comparison structured data for AI engine citation", severity: "MEDIUM" },
  { text: "Expand product description to 200+ words with comparison data", severity: "HIGH" },
  { text: "Add 'Best for' and 'Ideal for' sections matching common query patterns", severity: "HIGH" },
  { text: "Add HowTo schema for product usage instructions", severity: "MEDIUM" },
  { text: "Include competitor comparison table with spec-by-spec breakdown", severity: "HIGH" },
  { text: "Add AggregateRating schema — competitors average 4.2 stars, you have none", severity: "CRITICAL" },
  { text: "Create dedicated FAQ page targeting top 10 purchase-intent queries", severity: "HIGH" },
  { text: "Add BreadcrumbList structured data for category navigation", severity: "MEDIUM" },
  { text: "Implement Product schema with complete offers, availability, and shipping data", severity: "CRITICAL" },
  { text: "Add video content with VideoObject schema — competitors have 3+ product videos", severity: "HIGH" },
];

const ISSUE_SUMMARIES = [
  "Missing FAQ schema and structured review data",
  "No structured data; competitor outranks on all engines",
  "Product description too short; missing comparison content",
  "Missing review markup and price comparison data",
  "No schema markup detected; low content depth",
  "Competitor has richer structured data and FAQ section",
  "Missing AggregateRating and Product schema",
  "Short description; no 'Best for' sections found",
  "No JSON-LD markup; competitor has 5 schema types",
  "Missing HowTo schema; no video content detected",
];

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export interface MockSkuAnalysis {
  id: string;
  skuCode: string;
  name: string;
  category: string;
  visibilityScore: number;
  severity: Severity;
  enginesVisible: Engine[];
  enginesMissing: Engine[];
  topIssue: string;
  actionables: Actionable[];
}

// Products that should be critical (realistic for boAt - budget products losing to Noise/JBL)
const CRITICAL_SKUS = new Set(["BOAT-ADP-161", "BOAT-BAS-BNDR", "BOAT-BAS-242", "BOAT-STN-352"]);
// Products that should score well (hero products, popular items)
const STRONG_SKUS = new Set(["BOAT-ADP-ZENITH-PRO", "BOAT-ADP-SUPREME", "BOAT-RKZ-650PRO", "BOAT-STN-1500", "BOAT-NIR-751ANC"]);

function generateMockAnalysis(skus: SkuRecord[]): MockSkuAnalysis[] {
  return skus.map((sku, index) => {
    const rand = seededRandom(index * 17 + 42);

    let visibilityScore: number;
    if (CRITICAL_SKUS.has(sku.skuCode)) {
      visibilityScore = 8 + Math.floor(rand() * 20); // 8-27
    } else if (STRONG_SKUS.has(sku.skuCode)) {
      visibilityScore = 62 + Math.floor(rand() * 23); // 62-85
    } else {
      visibilityScore = 35 + Math.floor(rand() * 30); // 35-64, mostly HIGH
    }

    const severity: Severity =
      visibilityScore < 30 ? "CRITICAL" : visibilityScore < 60 ? "HIGH" : "MEDIUM";

    // Determine which engines the product is visible on
    const numEnginesVisible =
      severity === "CRITICAL" ? Math.floor(rand() * 2)
      : severity === "HIGH" ? 1 + Math.floor(rand() * 2)
      : 2 + Math.floor(rand() * 3);

    const shuffled = [...ALL_ENGINES].sort(() => rand() - 0.5);
    const enginesVisible = shuffled.slice(0, numEnginesVisible);
    const enginesMissing = shuffled.slice(numEnginesVisible);

    // Pick actionables — realistic and specific to product
    const cat = (sku.category || "").toLowerCase();
    const productActionables: Actionable[] = [];

    if (severity === "CRITICAL") {
      productActionables.push(
        { text: `Add Product FAQ schema: "Is ${sku.name} good for daily use?", "How does ${sku.name} compare to Noise alternatives?"`, severity: "CRITICAL" },
        { text: `Add structured review markup (JSON-LD). Top competitor has 200+ reviews in schema, ${sku.name} has 0 visible to AI engines`, severity: "CRITICAL" },
        { text: `Expand product description from ~35 words to 200+ with comparison tables vs top 3 competitors in ${sku.category}`, severity: "HIGH" },
        { text: `Add AggregateRating schema. Competitors average 4.2 stars with 500+ ratings, your page shows no structured rating data`, severity: "CRITICAL" },
        { text: `Create "Best for" section targeting queries like "best ${cat} for gym", "best ${cat} for commute", "best ${cat} under 1500"`, severity: "HIGH" },
      );
    } else if (severity === "HIGH") {
      productActionables.push(
        { text: `Add price comparison structured data. ${sku.name} at competitive price point but AI engines can't parse your pricing`, severity: "HIGH" },
        { text: `Include competitor comparison table: ${sku.name} vs top 3 alternatives with spec-by-spec breakdown`, severity: "HIGH" },
        { text: `Add FAQ schema with 5 purchase-intent questions customers ask about ${sku.category}`, severity: "HIGH" },
        { text: `Add video content with VideoObject schema. Competitors have 3+ product demo videos indexed by AI`, severity: "MEDIUM" },
      );
    } else {
      productActionables.push(
        { text: `Add BreadcrumbList structured data for better category navigation signals`, severity: "MEDIUM" },
        { text: `Implement complete Product schema with offers, availability, shipping, and return policy data`, severity: "MEDIUM" },
        { text: `Add HowTo schema for ${sku.category} setup/usage instructions`, severity: "MEDIUM" },
      );
    }
    const actionables = productActionables;

    const topIssue = severity === "CRITICAL"
      ? `Missing FAQ schema and structured reviews. Competitor dominates in ${sku.category} queries`
      : severity === "HIGH"
      ? `Missing price comparison data. Loses position in comparison queries`
      : `Good visibility but missing some schema types for full coverage`;

    return {
      id: sku.id,
      skuCode: sku.skuCode,
      name: sku.name,
      category: sku.category || "Uncategorized",
      visibilityScore,
      severity,
      enginesVisible,
      enginesMissing,
      topIssue,
      actionables,
    };
  });
}

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default async function SkuAnalysisPage() {
  const pb = await createServerClient();

  if (!pb.authStore.isValid || !pb.authStore.record) {
    redirect("/login");
  }

  const userId = pb.authStore.record.id;

  let skus: SkuRecord[] = [];
  try {
    skus = await pb.collection("skus").getFullList<SkuRecord>({
      filter: `user="${userId}"`,
      sort: "-created",
    });
  } catch (err) {
    console.error("[sku-analysis] Failed to fetch SKUs:", err);
  }

  const analysisData = generateMockAnalysis(skus);

  // Compute summary stats
  const totalSkus = analysisData.length;
  const criticalCount = analysisData.filter((s) => s.severity === "CRITICAL").length;
  const highCount = analysisData.filter((s) => s.severity === "HIGH").length;
  const mediumCount = analysisData.filter((s) => s.severity === "MEDIUM").length;

  // Health score: weighted average of visibility scores
  const avgVisibility =
    totalSkus > 0
      ? Math.round(analysisData.reduce((sum, s) => sum + s.visibilityScore, 0) / totalSkus)
      : 0;

  return (
    <div className="space-y-8">
      {/* Back link */}
      <div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 text-sm text-text-tertiary hover:text-text-primary transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        <h1 className="text-4xl font-bold text-text-primary mb-2">SKU Analysis</h1>
        <p className="text-text-tertiary">
          Detailed visibility analysis across AI search engines for your entire catalog.
        </p>
      </div>

      <SkuAnalysisResults
        analysisData={analysisData}
        totalSkus={totalSkus}
        criticalCount={criticalCount}
        highCount={highCount}
        mediumCount={mediumCount}
        avgVisibility={avgVisibility}
      />
    </div>
  );
}
