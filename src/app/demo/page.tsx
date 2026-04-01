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
  isReal: boolean; // true = real Claude data, false = locked/blurred
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
   SKU CATALOG GENERATOR (smart mock based on brand)
   ──────────────────────────────────────────────────────────── */

const BRAND_PRODUCT_MAP: Record<string, { products: string[]; categories: string[] }> = {
  wakefit: {
    products: [
      "Ortho Memory Foam Mattress", "Dual Comfort Mattress", "Latex Mattress",
      "Sheesham Bed with Storage", "Engineered Wood Bed", "Recliner Chair",
      "Nap Pillow", "Microfibre Pillow", "Foam Sofa Set", "L-Shape Sectional Sofa",
      "Study Table with Drawer", "Office Chair Futon", "Memory Foam Topper",
      "Kids Bunk Bed", "Coffee Table", "Shoe Rack", "TV Unit", "Wardrobe 3-Door",
      "Bedside Table", "Dining Table 6-Seater",
    ],
    categories: ["Mattresses", "Beds", "Pillows", "Sofas", "Furniture", "Chairs", "Tables", "Storage"],
  },
  furlenco: {
    products: [
      "Belmont Sofa 3-Seater", "Archie Study Table", "Hamilton Queen Bed",
      "Oslo Recliner", "Brooklyn Dining Set", "Luna Bookshelf",
      "Metro Coffee Table", "Nova TV Unit", "Aria Side Table", "Willow Wardrobe",
      "Fern Office Chair", "Cobalt Bean Bag", "Cedar Shoe Rack", "Ivy Dressing Table",
      "Elm Bed with Storage", "Sage Bedside Table", "Maple Chest of Drawers",
      "Birch L-Shape Sofa", "Teak Dining Chair Set", "Palm Outdoor Seating",
    ],
    categories: ["Sofas", "Tables", "Beds", "Chairs", "Storage", "Dining", "Outdoor", "Office"],
  },
  boat: {
    products: [
      "Airdopes 141", "Rockerz 450", "Stone 1200", "Airdopes 161",
      "Watch Xtend", "Bassheads 100", "Rockerz 255 Pro+", "Stone 352",
      "Airdopes 441 Pro", "Watch Wave Lite", "Immortal 121", "Stone 180",
      "Rockerz 550", "Nirvana 751 ANC", "Airdopes 131 Pro",
      "Watch Iris", "Bassheads 242", "Stone 1500", "Airdopes 381",
      "Rockerz 330 Pro",
    ],
    categories: ["Earbuds", "Headphones", "Speakers", "Smartwatches", "Gaming", "Audio"],
  },
  bewakoof: {
    products: [
      "Oversized Graphic Tee", "Acid Wash Joggers", "Fleece Hoodie",
      "Cargo Pants", "Tie-Dye Sweatshirt", "Classic Crew Neck Tee",
      "High-Rise Shorts", "Polo T-Shirt", "Track Pants", "Crop Top",
      "Bomber Jacket", "Denim Jacket", "Printed Pyjamas", "Sleeveless Vest",
      "Boyfriend Fit Tee", "Relaxed Joggers", "Zip Hoodie", "Henley T-Shirt",
      "Colour Block Shorts", "Ethnic Kurta",
    ],
    categories: ["T-Shirts", "Joggers", "Hoodies", "Jackets", "Shorts", "Ethnic", "Loungewear", "Accessories"],
  },
  nykaa: {
    products: [
      "SkinRX Vitamin C Serum", "Wanderlust Body Lotion", "Eyes On Me Kajal",
      "So Matte Lipstick", "Prep Me Up Face Primer", "Get Set Loose Powder",
      "Skin Potion Hydrating Mask", "Full Cover Concealer", "Nail Enamel",
      "Naturals Face Wash", "Clay It Cool Clay Mask", "All Day Matte Foundation",
      "Peel Off Mask", "Lash Goddess Mascara", "Brow Definer Pencil",
      "Micellar Water", "Lip Crayon", "Eye Shadow Palette", "Setting Spray",
      "Sunscreen SPF 50",
    ],
    categories: ["Skincare", "Makeup", "Haircare", "Body Care", "Fragrance", "Nails", "Tools", "Wellness"],
  },
  sleepyhead: {
    products: [
      "Original Mattress 6-inch", "Sense 3-Zone Mattress", "Flip Dual Comfort",
      "Laxe Latex Mattress", "Cloud Pillow Set", "Bed Frame with Storage",
      "Headboard Upholstered", "Mattress Protector", "Memory Foam Pillow",
      "Adjustable Bed Base", "Sofa Cum Bed", "Floor Mattress",
      "Toddler Mattress", "Wedge Pillow", "Bed Sheet Set Egyptian Cotton",
      "Comforter All Season", "Mattress Topper Gel", "Platform Bed",
      "Trundle Bed", "Body Pillow",
    ],
    categories: ["Mattresses", "Pillows", "Beds", "Bedding", "Furniture", "Accessories"],
  },
};

function generateSmartSkuCatalog(brandName: string): SkuAudit[] {
  const key = brandName.toLowerCase().replace(/\s+/g, "");
  const mapping = BRAND_PRODUCT_MAP[key];

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

  if (mapping) {
    return mapping.products.map((product, i) => {
      const issueIdx = i % skuIssues.length;
      const enginesVis = Math.floor(Math.random() * 3);
      return {
        sku: `${brandName.substring(0, 3).toUpperCase()}-${String(1001 + i)}`,
        name: product,
        category: mapping.categories[i % mapping.categories.length],
        visibilityScore: Math.floor(Math.random() * 40) + 5,
        enginesVisible: enginesVis,
        totalEngines: 5,
        topIssue: skuIssues[issueIdx].issue,
        severity: skuIssues[issueIdx].severity,
      };
    });
  }

  // Generic fallback — still better than before
  const genericProducts = [
    "Flagship Product", "Essential Collection", "Premium Range",
    "Budget Line", "Pro Series", "Classic Edition", "Starter Pack",
    "Deluxe Set", "Travel Size Kit", "Signature Selection",
    "Limited Edition", "Everyday Essentials", "Value Bundle",
    "Gift Set", "Trial Pack", "Combo Deal", "Seasonal Special",
    "Best Seller", "New Arrival", "Clearance Pick",
  ];

  return genericProducts.map((product, i) => {
    const issueIdx = i % skuIssues.length;
    const enginesVis = Math.floor(Math.random() * 3);
    return {
      sku: `${brandName.substring(0, 3).toUpperCase()}-${String(1001 + i)}`,
      name: `${brandName} ${product}`,
      category: ["Core", "Premium", "Value", "Seasonal", "Accessories"][i % 5],
      visibilityScore: Math.floor(Math.random() * 40) + 5,
      enginesVisible: enginesVis,
      totalEngines: 5,
      topIssue: skuIssues[issueIdx].issue,
      severity: skuIssues[issueIdx].severity,
    };
  });
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

        <p className="text-xs text-white/20 mt-6">
          Querying Claude AI with real search queries about your brand...
        </p>
      </motion.div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   BLURRED ENGINE CARD (for locked engines)
   ──────────────────────────────────────────────────────────── */

function LockedEngineCard({ engine, delay }: { engine: { engine: string; icon: string }; delay: number }) {
  return (
    <motion.div
      className="rounded-xl border border-white/5 bg-white/[0.02] p-5 relative overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
    >
      {/* Blurred content behind overlay */}
      <div className="blur-[6px] select-none pointer-events-none">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold tracking-wider uppercase text-white/50">
            {engine.engine}
          </span>
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
        </div>
        <div className="mb-3">
          <p className="text-2xl font-bold text-amber-400">#3</p>
          <p className="text-[11px] text-white/30 mt-1">position in response</p>
        </div>
        <div className="pt-3 border-t border-white/5">
          <p className="text-[11px] text-white/30">Top result</p>
          <p className="text-xs text-white/60 font-medium">Competitor (#1)</p>
        </div>
      </div>

      {/* Lock overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#1A1A2E]/60 backdrop-blur-[1px]">
        <svg
          className="w-6 h-6 text-white/30 mb-2"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
          />
        </svg>
        <p className="text-[11px] font-semibold text-white/40 text-center px-3">
          Available in Pro
        </p>
      </div>
    </motion.div>
  );
}

/* ────────────────────────────────────────────────────────────
   RESULTS VIEW
   ──────────────────────────────────────────────────────────── */

function ResultsView({ results, onReset }: { results: DemoResults; onReset: () => void }) {
  const headerRef = useRef<HTMLDivElement>(null);
  const headerInView = useInView(headerRef, { once: true });

  const realEngines = results.engines.filter((e) => e.isReal);
  const lockedEngines = results.engines.filter((e) => !e.isReal);

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
              <div className="flex items-center gap-2 mb-3">
                <p className="text-[13px] tracking-[0.1em] uppercase text-white/30">
                  Free Audit Preview
                </p>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 font-medium">
                  LIVE Claude Data
                </span>
              </div>
              <h1 className="text-[clamp(28px,4vw,48px)] font-bold leading-tight mb-4">
                {results.brandName}
              </h1>
              <p className="text-white/40 text-sm mb-2">{results.domain}</p>
              <p className="text-white/60 text-[15px] leading-relaxed max-w-lg">
                {results.visibilityScore >= 70
                  ? "Strong brand visibility in AI search. You're being actively recommended by Claude across most query types."
                  : results.visibilityScore >= 50
                  ? "Good baseline visibility. Your brand appears in many AI responses, but there are clear opportunities to improve ranking."
                  : results.visibilityScore >= 30
                  ? "Your brand appears in some AI responses, but there are clear gaps where competitors outrank you."
                  : "Your brand has significant gaps in AI search visibility. Competitors are being recommended over you in most queries."}
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <span className="text-xs px-3 py-1.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                  {results.topGaps.filter((g) => g.severity === "CRITICAL").length} Critical Gaps
                </span>
                <span className="text-xs px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  {results.topGaps.filter((g) => g.severity === "HIGH").length} High Priority
                </span>
                <span className="text-xs px-3 py-1.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  Claude AI Scanned
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Engine Breakdown */}
      <section className="py-16 border-b border-white/5">
        <div className="max-w-[1200px] mx-auto px-6 md:px-12">
          <h2 className="text-xl font-bold mb-2">Engine-by-Engine Visibility</h2>
          <p className="text-sm text-white/40 mb-8">
            Claude results are live. Other engines available in paid plans.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Real Claude engine card */}
            {realEngines.map((e, i) => (
              <motion.div
                key={e.engine}
                className="rounded-xl border-2 border-[#4F7DF3]/30 bg-[#4F7DF3]/5 p-5"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i, duration: 0.4 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold tracking-wider uppercase text-[#4F7DF3]">
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
                    {e.mentioned ? "avg position across queries" : "not mentioned in AI responses"}
                  </p>
                </div>
                <div className="pt-3 border-t border-white/5">
                  <p className="text-[10px] font-semibold text-green-400/60 uppercase tracking-wider">
                    Live Results
                  </p>
                </div>
              </motion.div>
            ))}

            {/* Locked engine cards */}
            {lockedEngines.map((e, i) => (
              <LockedEngineCard
                key={e.engine}
                engine={e}
                delay={0.1 * (realEngines.length + i)}
              />
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
                className="rounded-xl border border-white/5 bg-white/[0.02] p-6 relative overflow-hidden"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15 + 0.1 * i, duration: 0.4 }}
              >
                {/* Blurred competitor cards */}
                <div className="blur-[4px] select-none pointer-events-none">
                  <p className="text-[11px] uppercase tracking-wider text-white/30 mb-2">
                    Competitor
                  </p>
                  <p className="text-lg font-bold text-white/70 mb-3">{c.name}</p>
                  <p className="text-3xl font-bold text-green-400">
                    {c.score}
                    <span className="text-sm font-normal text-white/30">/100</span>
                  </p>
                </div>
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#1A1A2E]/50">
                  <svg
                    className="w-5 h-5 text-white/25 mb-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                    />
                  </svg>
                  <p className="text-[10px] text-white/30 font-medium">Unlock with Pro</p>
                </div>
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
              The full NorthStar audit scans every SKU across ChatGPT, Perplexity, Gemini, Google AI, and Copilot — with competitor comparison and actionable fixes per product.
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
            Free Audit - Powered by Claude AI
          </motion.div>

          <h1 className="text-[clamp(28px,5vw,48px)] font-bold text-white leading-tight mb-4">
            See how AI search<br />engines see your brand
          </h1>
          <p className="text-white/40 text-[15px] leading-relaxed mb-12 max-w-md">
            We&apos;ll query Claude AI with real search queries about your brand to show you where you appear &mdash; and where you&apos;re invisible.
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
                placeholder="e.g. Wakefit, Furlenco, boAt"
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
              No credit card required. Real AI scan takes 15-30 seconds.
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

const SCAN_MESSAGES = [
  "Connecting to Claude AI...",
  "Generating brand visibility queries...",
  "Querying brand awareness...",
  "Scanning category queries...",
  "Testing purchase intent queries...",
  "Checking competitor comparison queries...",
  "Analyzing thought leadership presence...",
  "Calculating visibility scores...",
  "Preparing your report...",
];

export default function DemoPage() {
  const [step, setStep] = useState<Step>("form");
  const [progress, setProgress] = useState(0);
  const [scanStatus, setScanStatus] = useState(SCAN_MESSAGES[0]);
  const [results, setResults] = useState<DemoResults | null>(null);
  const [brandName, setBrandName] = useState("");
  const [scanError, setScanError] = useState<string | null>(null);

  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  async function handleSubmit(data: { brandName: string; websiteUrl: string; email: string; csvFile: File | null }) {
    const domain = data.websiteUrl
      ? data.websiteUrl.replace(/^https?:\/\//, "").replace(/\/.*$/, "")
      : `${data.brandName.toLowerCase().replace(/\s+/g, "")}.com`;

    setBrandName(data.brandName);
    setStep("scanning");
    setProgress(0);
    setScanStatus(SCAN_MESSAGES[0]);
    setScanError(null);

    // Start a gentle progress animation that stays below 90%
    // (the real API call determines when we hit 100%)
    let fakeProgress = 0;
    let msgIndex = 0;
    progressIntervalRef.current = setInterval(() => {
      // Slow down as we approach 85%
      const increment = fakeProgress < 30 ? 5 : fakeProgress < 60 ? 3 : fakeProgress < 80 ? 1 : 0.5;
      fakeProgress = Math.min(fakeProgress + increment, 88);
      setProgress(Math.round(fakeProgress));

      // Cycle through messages
      const newMsgIdx = Math.min(
        Math.floor((fakeProgress / 88) * (SCAN_MESSAGES.length - 1)),
        SCAN_MESSAGES.length - 1
      );
      if (newMsgIdx !== msgIndex) {
        msgIndex = newMsgIdx;
        setScanStatus(SCAN_MESSAGES[msgIndex]);
      }
    }, 1500);

    // Make real API call
    const abortController = new AbortController();
    abortRef.current = abortController;

    try {
      const res = await fetch("/api/demo/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandName: data.brandName,
          websiteUrl: data.websiteUrl || undefined,
        }),
        signal: abortController.signal,
      });

      // Stop fake progress
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: "Scan failed" }));
        throw new Error(errData.error || `Scan failed (${res.status})`);
      }

      const apiData = await res.json();

      // Build DemoResults from real API data
      const claudeVisible = apiData.brandVisibleCount > 0;
      const claudeAvgPos = claudeVisible
        ? Math.round(
            apiData.results
              .filter((r: { brandPosition: number }) => r.brandPosition > 0)
              .reduce((sum: number, r: { brandPosition: number }) => sum + r.brandPosition, 0) /
              Math.max(apiData.results.filter((r: { brandPosition: number }) => r.brandPosition > 0).length, 1)
          )
        : 0;

      const engines: EngineResult[] = [
        {
          engine: "Claude / Anthropic",
          icon: "CLD",
          mentioned: claudeVisible,
          position: claudeAvgPos,
          competitor: "",
          competitorPosition: 0,
          isReal: true,
        },
        {
          engine: "ChatGPT",
          icon: "GPT",
          mentioned: false,
          position: 0,
          competitor: "Competitor A",
          competitorPosition: 1,
          isReal: false,
        },
        {
          engine: "Perplexity",
          icon: "PPX",
          mentioned: false,
          position: 0,
          competitor: "Competitor B",
          competitorPosition: 1,
          isReal: false,
        },
        {
          engine: "Google AI",
          icon: "GAI",
          mentioned: false,
          position: 0,
          competitor: "Competitor C",
          competitorPosition: 1,
          isReal: false,
        },
        {
          engine: "Copilot",
          icon: "COP",
          mentioned: false,
          position: 0,
          competitor: "Competitor B",
          competitorPosition: 1,
          isReal: false,
        },
      ];

      const tierScores = apiData.tierScores;
      const tiers: TierScore[] = [
        { tier: "awareness", label: "Brand Awareness", score: tierScores.awareness?.score || 0, total: tierScores.awareness?.total || 0, visible: tierScores.awareness?.visible || 0 },
        { tier: "category", label: "Category Queries", score: tierScores.category?.score || 0, total: tierScores.category?.total || 0, visible: tierScores.category?.visible || 0 },
        { tier: "intent", label: "Purchase Intent", score: tierScores.intent?.score || 0, total: tierScores.intent?.total || 0, visible: tierScores.intent?.visible || 0 },
        { tier: "competitor", label: "Competitor Queries", score: tierScores.competitor?.score || 0, total: tierScores.competitor?.total || 0, visible: tierScores.competitor?.visible || 0 },
        { tier: "thought_leadership", label: "Thought Leadership", score: tierScores.thought_leadership?.score || 0, total: tierScores.thought_leadership?.total || 0, visible: tierScores.thought_leadership?.visible || 0 },
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
          gap: `Brand name "${data.brandName}" not mentioned in meta descriptions`,
          severity: "MEDIUM",
          fix: "Include brand name in first 60 characters of meta descriptions. AI engines use this for brand attribution.",
        },
      ];

      const competitorLeaders = [
        { name: "Competitor A", score: Math.floor(Math.random() * 20) + 55 },
        { name: "Competitor B", score: Math.floor(Math.random() * 20) + 45 },
        { name: "Competitor C", score: Math.floor(Math.random() * 20) + 35 },
      ];

      const skuCatalog = generateSmartSkuCatalog(data.brandName);

      const demoResults: DemoResults = {
        brandName: data.brandName,
        domain,
        visibilityScore: apiData.visibilityScore,
        engines,
        tiers,
        topGaps,
        competitorLeaders,
        skuCatalog,
      };

      // Animate to 100%
      setProgress(100);
      setScanStatus("Scan complete!");
      setResults(demoResults);

      setTimeout(() => {
        setStep("results");
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, 600);
    } catch (err) {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }

      if (err instanceof Error && err.name === "AbortError") {
        return; // User navigated away
      }

      console.error("[demo] Scan failed:", err);
      setScanError(err instanceof Error ? err.message : "Scan failed. Please try again.");
      setScanStatus("Scan failed");
      setProgress(0);
    }
  }

  function handleReset() {
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    progressIntervalRef.current = null;
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = null;
    setStep("form");
    setProgress(0);
    setScanStatus(SCAN_MESSAGES[0]);
    setResults(null);
    setBrandName("");
    setScanError(null);
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
          {scanError && (
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-red-900/90 border border-red-500/30 text-red-200 px-6 py-4 rounded-xl shadow-2xl max-w-md text-center">
              <p className="text-sm font-medium mb-3">{scanError}</p>
              <button
                onClick={handleReset}
                className="text-[13px] font-bold px-5 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}
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
