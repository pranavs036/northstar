"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useInView } from "framer-motion";

/* ────────────────────────────────────────────────────────────
   TYPES
   ──────────────────────────────────────────────────────────── */

type Step = "form" | "scanning" | "results";

interface EngineResult {
  engine: string;
  icon: string;
  mentioned: boolean;
  position: number;
  competitor: string;
  competitorPosition: number;
}

interface TierScore {
  tier: string;
  label: string;
  score: number;
  total: number;
  visible: number;
}

interface SkuAudit {
  sku: string;
  name: string;
  category: string;
  visibilityScore: number;
  enginesVisible: number;
  totalEngines: number;
  topIssue: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM";
}

interface DemoResults {
  brandName: string;
  domain: string;
  visibilityScore: number;
  engines: EngineResult[];
  tiers: TierScore[];
  topGaps: { gap: string; severity: string; fix: string }[];
  competitorLeaders: { name: string; score: number }[];
  skuCatalog: SkuAudit[];
}

/* ────────────────────────────────────────────────────────────
   MOCK DATA GENERATOR
   ──────────────────────────────────────────────────────────── */

function generateMockResults(brandName: string, domain: string): DemoResults {
  const visibilityScore = Math.floor(Math.random() * 25) + 12; // 12-36 range (most brands score low)

  const engines: EngineResult[] = [
    {
      engine: "ChatGPT",
      icon: "GPT",
      mentioned: Math.random() > 0.6,
      position: Math.random() > 0.5 ? Math.floor(Math.random() * 4) + 3 : 0,
      competitor: "Competitor A",
      competitorPosition: 1,
    },
    {
      engine: "Perplexity",
      icon: "PPX",
      mentioned: Math.random() > 0.5,
      position: Math.random() > 0.4 ? Math.floor(Math.random() * 3) + 2 : 0,
      competitor: "Competitor B",
      competitorPosition: 1,
    },
    {
      engine: "Gemini",
      icon: "GEM",
      mentioned: Math.random() > 0.7,
      position: Math.random() > 0.6 ? Math.floor(Math.random() * 5) + 2 : 0,
      competitor: "Competitor A",
      competitorPosition: 2,
    },
    {
      engine: "Google AI",
      icon: "GAI",
      mentioned: Math.random() > 0.55,
      position: Math.random() > 0.5 ? Math.floor(Math.random() * 4) + 3 : 0,
      competitor: "Competitor C",
      competitorPosition: 1,
    },
    {
      engine: "Copilot",
      icon: "COP",
      mentioned: Math.random() > 0.65,
      position: Math.random() > 0.5 ? Math.floor(Math.random() * 5) + 2 : 0,
      competitor: "Competitor B",
      competitorPosition: 1,
    },
  ];

  const tiers: TierScore[] = [
    { tier: "awareness", label: "Brand Awareness", score: Math.floor(Math.random() * 30) + 10, total: 5, visible: Math.floor(Math.random() * 2) + 1 },
    { tier: "category", label: "Category Queries", score: Math.floor(Math.random() * 25) + 5, total: 8, visible: Math.floor(Math.random() * 3) },
    { tier: "intent", label: "Purchase Intent", score: Math.floor(Math.random() * 20) + 5, total: 6, visible: Math.floor(Math.random() * 2) },
    { tier: "competitor", label: "Competitor Queries", score: Math.floor(Math.random() * 15) + 5, total: 5, visible: Math.floor(Math.random() * 2) },
    { tier: "thought_leadership", label: "Thought Leadership", score: Math.floor(Math.random() * 35) + 15, total: 4, visible: Math.floor(Math.random() * 2) + 1 },
  ];

  const topGaps = [
    {
      gap: "Missing JSON-LD Product schema on all product pages",
      severity: "CRITICAL",
      fix: "Add Product schema markup with price, availability, reviews, and aggregate rating to every PDP.",
    },
    {
      gap: "Product descriptions under 200 words average",
      severity: "CRITICAL",
      fix: "Expand product descriptions to 500+ words with use cases, specifications, comparisons, and FAQ content.",
    },
    {
      gap: "No FAQ markup detected on category pages",
      severity: "HIGH",
      fix: "Add FAQPage schema with 5-8 real customer questions per category. AI engines heavily cite FAQ content.",
    },
    {
      gap: "Review schema missing or incomplete",
      severity: "HIGH",
      fix: "Implement AggregateRating and Review schema on all products with 10+ reviews. Include review text snippets.",
    },
    {
      gap: `Brand name "${brandName}" not mentioned in meta descriptions`,
      severity: "MEDIUM",
      fix: "Include brand name in first 60 characters of meta descriptions. AI engines use this for brand attribution.",
    },
  ];

  const competitorLeaders = [
    { name: "Competitor A", score: Math.floor(Math.random() * 20) + 55 },
    { name: "Competitor B", score: Math.floor(Math.random() * 20) + 45 },
    { name: "Competitor C", score: Math.floor(Math.random() * 20) + 35 },
  ];

  // Generate realistic SKU catalog based on brand name
  const skuTemplates = [
    { prefix: "Classic", categories: ["Essentials", "Core Range"] },
    { prefix: "Premium", categories: ["Luxury", "Premium Range"] },
    { prefix: "Ultra", categories: ["Performance", "Pro Range"] },
    { prefix: "Essential", categories: ["Daily Use", "Basics"] },
    { prefix: "Pro", categories: ["Professional", "Advanced"] },
    { prefix: "Signature", categories: ["Exclusive", "Signature Line"] },
    { prefix: "Original", categories: ["Heritage", "Classic"] },
    { prefix: "Advanced", categories: ["Innovation", "Tech"] },
    { prefix: "Natural", categories: ["Organic", "Clean"] },
    { prefix: "Elite", categories: ["Premium", "Select"] },
    { prefix: "Max", categories: ["Performance", "Sport"] },
    { prefix: "Comfort", categories: ["Everyday", "Home"] },
    { prefix: "Fresh", categories: ["New Arrivals", "Seasonal"] },
    { prefix: "Active", categories: ["Sports", "Fitness"] },
    { prefix: "Slim", categories: ["Compact", "Travel"] },
    { prefix: "Power", categories: ["Heavy Duty", "Industrial"] },
    { prefix: "Smart", categories: ["Connected", "Tech"] },
    { prefix: "Eco", categories: ["Sustainable", "Green"] },
    { prefix: "Lite", categories: ["Budget", "Value"] },
    { prefix: "Rapid", categories: ["Fast", "Express"] },
  ];

  const skuIssues = [
    { issue: "Missing JSON-LD Product schema", severity: "CRITICAL" as const },
    { issue: "No FAQ markup on product page", severity: "HIGH" as const },
    { issue: "Thin product description (<150 words)", severity: "CRITICAL" as const },
    { issue: "Missing AggregateRating schema", severity: "HIGH" as const },
    { issue: "No review markup detected", severity: "HIGH" as const },
    { issue: "Brand name absent from meta description", severity: "MEDIUM" as const },
    { issue: "Missing product image alt text", severity: "MEDIUM" as const },
    { issue: "No BreadcrumbList schema", severity: "MEDIUM" as const },
    { issue: "Incomplete product attributes", severity: "HIGH" as const },
    { issue: "Missing comparison content", severity: "MEDIUM" as const },
  ];

  const skuCatalog: SkuAudit[] = skuTemplates.map((tmpl, i) => {
    const issueIdx = i % skuIssues.length;
    const enginesVis = Math.floor(Math.random() * 3);
    return {
      sku: `${brandName.substring(0, 3).toUpperCase()}-${String(1001 + i)}`,
      name: `${brandName} ${tmpl.prefix} ${["Series", "Edition", "Collection", "Range", "Line"][i % 5]}`,
      category: tmpl.categories[Math.floor(Math.random() * tmpl.categories.length)],
      visibilityScore: Math.floor(Math.random() * 40) + 5,
      enginesVisible: enginesVis,
      totalEngines: 5,
      topIssue: skuIssues[issueIdx].issue,
      severity: skuIssues[issueIdx].severity,
    };
  });

  return {
    brandName,
    domain,
    visibilityScore,
    engines,
    tiers,
    topGaps,
    competitorLeaders,
    skuCatalog,
  };
}

/* ────────────────────────────────────────────────────────────
   ANIMATED SCORE RING
   ──────────────────────────────────────────────────────────── */

function ScoreRing({ score, size = 180, label }: { score: number; size?: number; label?: string }) {
  const r = (size - 16) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;

  const color =
    score >= 50 ? "#34D399" : score >= 25 ? "#FBBF24" : "#F06B6B";

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="8"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, delay: 0.3, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="text-4xl font-bold text-white"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
        >
          {score}
        </motion.span>
        <span className="text-xs text-white/40 mt-1">{label || "/ 100"}</span>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   SCANNING ANIMATION
   ──────────────────────────────────────────────────────────── */

function ScanningView({ brandName, progress, statusText }: { brandName: string; progress: number; statusText: string }) {
  return (
    <div className="min-h-screen bg-[#1A1A2E] flex items-center justify-center px-6">
      <motion.div
        className="max-w-lg w-full text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Pulse ring */}
        <div className="relative mx-auto w-32 h-32 mb-12">
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-[#4F7DF3]/30"
            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <motion.div
            className="absolute inset-2 rounded-full border-2 border-[#4F7DF3]/50"
            animate={{ scale: [1, 1.3, 1], opacity: [0.7, 0, 0.7] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
          />
          <div className="absolute inset-4 rounded-full bg-[#4F7DF3]/10 flex items-center justify-center">
            <motion.div
              className="w-3 h-3 rounded-full bg-[#4F7DF3]"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-white mb-3">
          Scanning {brandName}
        </h2>
        <p className="text-sm text-white/50 mb-8">{statusText}</p>

        {/* Progress bar */}
        <div className="w-full bg-white/5 rounded-full h-2 mb-3 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-[#4F7DF3] to-[#34D399]"
            initial={{ width: "0%" }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <p className="text-xs text-white/30">{progress}% complete</p>
      </motion.div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   RESULTS VIEW
   ──────────────────────────────────────────────────────────── */

function ResultsView({ results, onReset }: { results: DemoResults; onReset: () => void }) {
  const headerRef = useRef<HTMLDivElement>(null);
  const headerInView = useInView(headerRef, { once: true });

  return (
    <div className="min-h-screen bg-[#1A1A2E] text-white">
      {/* Nav */}
      <header className="border-b border-white/5">
        <nav className="max-w-[1200px] mx-auto px-6 md:px-12 h-16 flex items-center justify-between">
          <Link href="/" className="text-[13px] font-bold tracking-[0.05em] uppercase text-white/70 hover:text-white transition-colors">
            NorthStar
          </Link>
          <div className="flex items-center gap-4">
            <button
              onClick={onReset}
              className="text-[13px] text-white/50 hover:text-white transition-colors"
            >
              New Audit
            </button>
            <a
              href="mailto:pranavs036@gmail.com"
              className="text-[13px] font-bold px-5 py-2 rounded-full bg-[#4F7DF3] text-white hover:bg-[#4F7DF3]/90 transition-colors"
            >
              Get Full Audit
            </a>
          </div>
        </nav>
      </header>

      {/* Score Header */}
      <section ref={headerRef} className="py-16 md:py-24 border-b border-white/5">
        <div className="max-w-[1200px] mx-auto px-6 md:px-12">
          <motion.div
            className="flex flex-col md:flex-row items-center gap-12 md:gap-20"
            initial={{ opacity: 0, y: 30 }}
            animate={headerInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <ScoreRing score={results.visibilityScore} size={200} label="Visibility Score" />

            <div className="flex-1 text-center md:text-left">
              <p className="text-[13px] tracking-[0.1em] uppercase text-white/30 mb-3">
                Free Audit Preview
              </p>
              <h1 className="text-[clamp(28px,4vw,48px)] font-bold leading-tight mb-4">
                {results.brandName}
              </h1>
              <p className="text-white/40 text-sm mb-2">{results.domain}</p>
              <p className="text-white/60 text-[15px] leading-relaxed max-w-lg">
                {results.visibilityScore < 30
                  ? "Your brand has significant gaps in AI search visibility. Competitors are being recommended over you in most queries."
                  : results.visibilityScore < 50
                  ? "Your brand appears in some AI responses, but there are clear gaps where competitors outrank you."
                  : "Good baseline visibility, but there are optimization opportunities to increase your AI recommendation rate."}
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <span className="text-xs px-3 py-1.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                  {results.topGaps.filter((g) => g.severity === "CRITICAL").length} Critical Gaps
                </span>
                <span className="text-xs px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  {results.topGaps.filter((g) => g.severity === "HIGH").length} High Priority
                </span>
                <span className="text-xs px-3 py-1.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  5 AI Engines Scanned
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Engine Breakdown */}
      <section className="py-16 border-b border-white/5">
        <div className="max-w-[1200px] mx-auto px-6 md:px-12">
          <h2 className="text-xl font-bold mb-8">Engine-by-Engine Visibility</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {results.engines.map((e, i) => (
              <motion.div
                key={e.engine}
                className="rounded-xl border border-white/5 bg-white/[0.02] p-5"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i, duration: 0.4 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold tracking-wider uppercase text-white/50">
                    {e.engine}
                  </span>
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      e.mentioned ? "bg-green-400" : "bg-red-400"
                    }`}
                  />
                </div>
                <div className="mb-3">
                  {e.mentioned ? (
                    <p className="text-2xl font-bold text-green-400">
                      #{e.position}
                    </p>
                  ) : (
                    <p className="text-2xl font-bold text-red-400/70">
                      Not Found
                    </p>
                  )}
                  <p className="text-[11px] text-white/30 mt-1">
                    {e.mentioned ? "position in response" : "not mentioned in AI response"}
                  </p>
                </div>
                <div className="pt-3 border-t border-white/5">
                  <p className="text-[11px] text-white/30">Top result</p>
                  <p className="text-xs text-white/60 font-medium">
                    {e.competitor} (#{e.competitorPosition})
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* SKU Catalog Audit */}
      <section className="py-16 border-b border-white/5">
        <div className="max-w-[1200px] mx-auto px-6 md:px-12">
          <div className="flex items-baseline justify-between mb-2">
            <h2 className="text-xl font-bold">Catalog SKU Audit</h2>
            <span className="text-xs text-white/30">{results.skuCatalog.length} SKUs scanned</span>
          </div>
          <p className="text-sm text-white/40 mb-8">
            Per-SKU visibility scores and top issues across all AI engines.
          </p>

          {/* Table header */}
          <div className="hidden md:grid grid-cols-12 gap-3 px-5 py-3 text-[11px] uppercase tracking-wider text-white/30 border-b border-white/5">
            <div className="col-span-1">SKU</div>
            <div className="col-span-3">Product Name</div>
            <div className="col-span-2">Category</div>
            <div className="col-span-1 text-center">Score</div>
            <div className="col-span-1 text-center">Engines</div>
            <div className="col-span-3">Top Issue</div>
            <div className="col-span-1 text-center">Severity</div>
          </div>

          {/* SKU rows */}
          <div className="space-y-1 max-h-[600px] overflow-y-auto">
            {results.skuCatalog.map((sku, i) => (
              <motion.div
                key={sku.sku}
                className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-3 px-5 py-4 rounded-lg bg-white/[0.02] border border-white/[0.03] hover:bg-white/[0.04] transition-colors"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(0.03 * i, 0.6), duration: 0.3 }}
              >
                <div className="md:col-span-1 text-xs font-mono text-white/40">{sku.sku}</div>
                <div className="md:col-span-3 text-sm font-medium text-white/80 truncate">{sku.name}</div>
                <div className="md:col-span-2 text-xs text-white/40">{sku.category}</div>
                <div className="md:col-span-1 text-center">
                  <span
                    className={`text-sm font-bold ${
                      sku.visibilityScore >= 40
                        ? "text-green-400"
                        : sku.visibilityScore >= 20
                        ? "text-amber-400"
                        : "text-red-400"
                    }`}
                  >
                    {sku.visibilityScore}
                  </span>
                </div>
                <div className="md:col-span-1 text-center text-xs text-white/50">
                  {sku.enginesVisible}/{sku.totalEngines}
                </div>
                <div className="md:col-span-3 text-xs text-white/40 truncate">{sku.topIssue}</div>
                <div className="md:col-span-1 text-center">
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      sku.severity === "CRITICAL"
                        ? "bg-red-500/10 text-red-400 border border-red-500/20"
                        : sku.severity === "HIGH"
                        ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                    }`}
                  >
                    {sku.severity}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Tier Breakdown */}
      <section className="py-16 border-b border-white/5">
        <div className="max-w-[1200px] mx-auto px-6 md:px-12">
          <h2 className="text-xl font-bold mb-8">Visibility by Query Tier</h2>
          <div className="space-y-4">
            {results.tiers.map((t, i) => (
              <motion.div
                key={t.tier}
                className="rounded-xl border border-white/5 bg-white/[0.02] p-5 flex flex-col sm:flex-row sm:items-center gap-4"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.08 * i, duration: 0.4 }}
              >
                <div className="sm:w-48 flex-shrink-0">
                  <p className="text-sm font-semibold text-white/80">{t.label}</p>
                  <p className="text-[11px] text-white/30">
                    {t.visible}/{t.total} queries visible
                  </p>
                </div>
                <div className="flex-1">
                  <div className="w-full bg-white/5 rounded-full h-3 overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${
                        t.score >= 50
                          ? "bg-green-400"
                          : t.score >= 25
                          ? "bg-amber-400"
                          : "bg-red-400"
                      }`}
                      initial={{ width: "0%" }}
                      animate={{ width: `${t.score}%` }}
                      transition={{ delay: 0.3 + 0.1 * i, duration: 0.8, ease: "easeOut" }}
                    />
                  </div>
                </div>
                <div className="sm:w-20 text-right flex-shrink-0">
                  <span
                    className={`text-lg font-bold ${
                      t.score >= 50
                        ? "text-green-400"
                        : t.score >= 25
                        ? "text-amber-400"
                        : "text-red-400"
                    }`}
                  >
                    {t.score}
                  </span>
                  <span className="text-xs text-white/30">/100</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Top Gaps */}
      <section className="py-16 border-b border-white/5">
        <div className="max-w-[1200px] mx-auto px-6 md:px-12">
          <h2 className="text-xl font-bold mb-2">Top Visibility Gaps</h2>
          <p className="text-sm text-white/40 mb-8">
            These are the specific issues preventing AI engines from recommending your brand.
          </p>
          <div className="space-y-4">
            {results.topGaps.map((g, i) => (
              <motion.div
                key={i}
                className="rounded-xl border border-white/5 bg-white/[0.02] p-6"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i, duration: 0.4 }}
              >
                <div className="flex items-start gap-4">
                  <span
                    className={`flex-shrink-0 text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full mt-0.5 ${
                      g.severity === "CRITICAL"
                        ? "bg-red-500/10 text-red-400 border border-red-500/20"
                        : g.severity === "HIGH"
                        ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                    }`}
                  >
                    {g.severity}
                  </span>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-white/90 mb-2">{g.gap}</h3>
                    <p className="text-[13px] text-white/40 leading-relaxed">{g.fix}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Competitor Comparison */}
      <section className="py-16 border-b border-white/5">
        <div className="max-w-[1200px] mx-auto px-6 md:px-12">
          <h2 className="text-xl font-bold mb-8">vs. Top Competitors</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Brand card */}
            <motion.div
              className="rounded-xl border-2 border-[#4F7DF3]/30 bg-[#4F7DF3]/5 p-6"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.4 }}
            >
              <p className="text-[11px] uppercase tracking-wider text-[#4F7DF3]/60 mb-2">
                Your Brand
              </p>
              <p className="text-lg font-bold text-white mb-3">{results.brandName}</p>
              <p className="text-3xl font-bold text-[#4F7DF3]">
                {results.visibilityScore}
                <span className="text-sm font-normal text-white/30">/100</span>
              </p>
            </motion.div>

            {results.competitorLeaders.map((c, i) => (
              <motion.div
                key={c.name}
                className="rounded-xl border border-white/5 bg-white/[0.02] p-6"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15 + 0.1 * i, duration: 0.4 }}
              >
                <p className="text-[11px] uppercase tracking-wider text-white/30 mb-2">
                  Competitor
                </p>
                <p className="text-lg font-bold text-white/70 mb-3">{c.name}</p>
                <p className="text-3xl font-bold text-green-400">
                  {c.score}
                  <span className="text-sm font-normal text-white/30">/100</span>
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-[1200px] mx-auto px-6 md:px-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <p className="text-[13px] uppercase tracking-[0.1em] text-white/30 mb-4">
              This is a preview. The full audit goes deeper.
            </p>
            <h2 className="text-[clamp(24px,4vw,42px)] font-bold leading-tight mb-6">
              Get SKU-level diagnosis with<br />exact fixes for every gap
            </h2>
            <p className="text-white/40 max-w-md mx-auto mb-10 text-[15px] leading-relaxed">
              The full NorthStar audit scans every SKU in your catalog, diagnoses competitor advantages, and delivers actionable fixes per product per engine.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="mailto:pranavs036@gmail.com"
                className="inline-flex items-center gap-2 text-[14px] font-bold px-8 py-4 rounded-full bg-gradient-to-r from-[#4F7DF3] to-[#34D399] text-white hover:opacity-90 transition-opacity"
              >
                Start Full Audit <span aria-hidden="true">&rarr;</span>
              </a>
              <button
                onClick={onReset}
                className="inline-flex items-center gap-2 text-[14px] font-bold px-8 py-4 rounded-full border border-white/10 text-white/60 hover:text-white hover:border-white/20 transition-all"
              >
                Try Another Brand
              </button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   FORM VIEW
   ──────────────────────────────────────────────────────────── */

function FormView({ onSubmit }: { onSubmit: (data: { brandName: string; websiteUrl: string; email: string; csvFile: File | null }) => void }) {
  const [brandName, setBrandName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [email, setEmail] = useState("");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [uploadMode, setUploadMode] = useState<"url" | "csv">("url");
  const [dragOver, setDragOver] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const canSubmit = brandName.trim().length > 0 && (websiteUrl.trim().length > 0 || csvFile !== null);
  const brandError = attempted && brandName.trim().length === 0;
  const catalogError = attempted && websiteUrl.trim().length === 0 && csvFile === null;

  function handleFileChange(files: FileList | null) {
    if (files && files.length > 0) {
      setCsvFile(files[0]);
    }
  }

  return (
    <div className="min-h-screen bg-[#1A1A2E] flex flex-col">
      {/* Nav */}
      <header className="border-b border-white/5">
        <nav className="max-w-[1200px] mx-auto px-6 md:px-12 h-16 flex items-center justify-between">
          <Link href="/" className="text-[13px] font-bold tracking-[0.05em] uppercase text-white/70 hover:text-white transition-colors">
            NorthStar
          </Link>
          <a
            href="mailto:pranavs036@gmail.com"
            className="text-[13px] text-white/50 hover:text-white transition-colors"
          >
            Contact Us
          </a>
        </nav>
      </header>

      {/* Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-16">
        <motion.div
          className="max-w-xl w-full"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Badge */}
          <motion.div
            className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.1em] text-[#4F7DF3] bg-[#4F7DF3]/10 border border-[#4F7DF3]/20 rounded-full px-4 py-1.5 mb-8"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#4F7DF3] animate-pulse" />
            Free Audit - No signup required
          </motion.div>

          <h1 className="text-[clamp(28px,5vw,48px)] font-bold text-white leading-tight mb-4">
            See how AI search<br />engines see your brand
          </h1>
          <p className="text-white/40 text-[15px] leading-relaxed mb-12 max-w-md">
            We&apos;ll scan ChatGPT, Perplexity, Gemini, Google AI, and Copilot to show you where your brand appears &mdash; and where competitors are beating you.
          </p>

          <div className="space-y-6">
            {/* Brand name */}
            <div>
              <label className="block text-[13px] font-semibold text-white/60 mb-2">
                Brand Name *
              </label>
              <input
                type="text"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="e.g. Furlenco"
                aria-required="true"
                aria-invalid={brandError}
                className={`w-full px-4 py-3.5 rounded-xl bg-white/[0.04] border text-white placeholder:text-white/20 focus:outline-none focus:border-[#4F7DF3]/50 focus:ring-1 focus:ring-[#4F7DF3]/30 transition-all text-[15px] ${
                  brandError ? "border-red-500/50" : "border-white/10"
                }`}
              />
              {brandError && (
                <p className="text-[11px] text-red-400 mt-1.5">Brand name is required</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-[13px] font-semibold text-white/60 mb-2">
                Email <span className="text-white/30 font-normal">(we&apos;ll send results here too)</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full px-4 py-3.5 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder:text-white/20 focus:outline-none focus:border-[#4F7DF3]/50 focus:ring-1 focus:ring-[#4F7DF3]/30 transition-all text-[15px]"
              />
            </div>

            {/* Mode toggle */}
            <div>
              <label className="block text-[13px] font-semibold text-white/60 mb-3">
                Product Catalog *
              </label>
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setUploadMode("url")}
                  className={`text-[13px] px-4 py-2 rounded-lg transition-all ${
                    uploadMode === "url"
                      ? "bg-[#4F7DF3]/10 text-[#4F7DF3] border border-[#4F7DF3]/30"
                      : "bg-white/[0.02] text-white/40 border border-white/5 hover:border-white/10"
                  }`}
                >
                  Enter Website URL
                </button>
                <button
                  onClick={() => setUploadMode("csv")}
                  className={`text-[13px] px-4 py-2 rounded-lg transition-all ${
                    uploadMode === "csv"
                      ? "bg-[#4F7DF3]/10 text-[#4F7DF3] border border-[#4F7DF3]/30"
                      : "bg-white/[0.02] text-white/40 border border-white/5 hover:border-white/10"
                  }`}
                >
                  Upload CSV
                </button>
              </div>

              <AnimatePresence mode="wait">
                {uploadMode === "url" ? (
                  <motion.div
                    key="url"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <input
                      type="url"
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                      placeholder="https://www.yourbrand.com"
                      className="w-full px-4 py-3.5 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder:text-white/20 focus:outline-none focus:border-[#4F7DF3]/50 focus:ring-1 focus:ring-[#4F7DF3]/30 transition-all text-[15px]"
                    />
                    <p className="text-[11px] text-white/25 mt-2">
                      We&apos;ll find up to 20 products on your site and analyze them.
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="csv"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div
                      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setDragOver(false);
                        handleFileChange(e.dataTransfer.files);
                      }}
                      onClick={() => fileRef.current?.click()}
                      className={`w-full p-8 rounded-xl border-2 border-dashed text-center cursor-pointer transition-all ${
                        dragOver
                          ? "border-[#4F7DF3] bg-[#4F7DF3]/5"
                          : csvFile
                          ? "border-green-500/30 bg-green-500/5"
                          : "border-white/10 bg-white/[0.02] hover:border-white/20"
                      }`}
                    >
                      <input
                        ref={fileRef}
                        type="file"
                        accept=".csv"
                        onChange={(e) => handleFileChange(e.target.files)}
                        className="hidden"
                      />
                      {csvFile ? (
                        <div>
                          <p className="text-sm text-green-400 font-medium">{csvFile.name}</p>
                          <p className="text-[11px] text-white/30 mt-1">
                            Click to change file
                          </p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-sm text-white/50 mb-1">
                            Drop your CSV here, or click to browse
                          </p>
                          <p className="text-[11px] text-white/25">
                            Max 20 SKUs. Format: sku, product_name, category, url
                          </p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {catalogError && (
              <p className="text-[11px] text-red-400 -mt-2">Please provide a website URL or upload a CSV file</p>
            )}

            {/* Submit */}
            <motion.button
              onClick={() => {
                setAttempted(true);
                if (canSubmit) onSubmit({ brandName, websiteUrl, email, csvFile });
              }}
              className="w-full py-4 rounded-xl text-[15px] font-bold transition-all relative overflow-hidden bg-gradient-to-r from-[#4F7DF3] to-[#34D399] text-white hover:opacity-90"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              Run Free Audit
            </motion.button>

            <p className="text-[11px] text-white/20 text-center">
              No credit card required. Results in under 60 seconds.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   MAIN DEMO PAGE
   ──────────────────────────────────────────────────────────── */

const SCAN_STEPS = [
  "Connecting to AI engines...",
  "Querying ChatGPT for brand visibility...",
  "Scanning Perplexity search results...",
  "Analyzing Gemini responses...",
  "Checking Google AI Overviews...",
  "Scanning Microsoft Copilot...",
  "Identifying competitor positions...",
  "Analyzing schema markup gaps...",
  "Calculating visibility scores...",
  "Generating diagnosis report...",
];

export default function DemoPage() {
  const [step, setStep] = useState<Step>("form");
  const [progress, setProgress] = useState(0);
  const [scanStatus, setScanStatus] = useState(SCAN_STEPS[0]);
  const [results, setResults] = useState<DemoResults | null>(null);
  const [brandName, setBrandName] = useState("");

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  function handleSubmit(data: { brandName: string; websiteUrl: string; email: string; csvFile: File | null }) {
    const domain = data.websiteUrl
      ? data.websiteUrl.replace(/^https?:\/\//, "").replace(/\/.*$/, "")
      : `${data.brandName.toLowerCase().replace(/\s+/g, "")}.com`;

    setBrandName(data.brandName);
    setStep("scanning");
    setProgress(0);
    setScanStatus(SCAN_STEPS[0]);

    // Simulate scanning with progressive updates
    let currentProgress = 0;
    intervalRef.current = setInterval(() => {
      currentProgress += Math.floor(Math.random() * 8) + 5;
      if (currentProgress >= 100) {
        currentProgress = 100;
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = null;

        // Generate results and switch view
        const mockResults = generateMockResults(data.brandName, domain);
        setResults(mockResults);

        setTimeout(() => {
          setStep("results");
          window.scrollTo({ top: 0, behavior: "smooth" });
        }, 600);
      }

      setProgress(currentProgress);

      // Update status text based on progress
      const stepIdx = Math.min(
        Math.floor((currentProgress / 100) * SCAN_STEPS.length),
        SCAN_STEPS.length - 1
      );
      setScanStatus(SCAN_STEPS[stepIdx]);
    }, 800);
  }

  function handleReset() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    setStep("form");
    setProgress(0);
    setScanStatus(SCAN_STEPS[0]);
    setResults(null);
    setBrandName("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <AnimatePresence mode="wait">
      {step === "form" && (
        <motion.div
          key="form"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <FormView onSubmit={handleSubmit} />
        </motion.div>
      )}

      {step === "scanning" && (
        <motion.div
          key="scanning"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <ScanningView
            brandName={brandName}
            progress={progress}
            statusText={scanStatus}
          />
        </motion.div>
      )}

      {step === "results" && results && (
        <motion.div
          key="results"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <ResultsView results={results} onReset={handleReset} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
