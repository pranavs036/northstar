# Query Generation v2 — "Brand Owner's Confidence Model"

**Date:** 2026-03-22
**Status:** Approved
**Scope:** Redesign brand-scan and SKU-audit query generation to produce queries real humans actually type into AI engines.

---

## Problem

Current query generation produces generic, useless queries:
- Brand scan: `"best place to buy general products online India"` — no one searches this
- SKU audit: `"best Chargers like PowerHub USB-C Charger"` — not natural language
- No awareness of hero products, pricing, geography, or market context
- Queries don't reflect how actual buyers search AI engines in the Indian refurbished/used market

## Design Principle

Brand owners know which products they should rank for. A refurbished electronics seller knows "used iPhone under 25k" is their money query. The system should identify these high-confidence products from catalog data and generate queries that real humans would type — price-anchored, geo-aware, and intent-varied.

---

## Part 0: Data Model Changes

The current `skus` PocketBase collection only has: `skuCode`, `name`, `category`, `url`, `description`. Hero SKU selection needs `price` and `condition` data. Two approaches:

**v1 (no schema change):** Extract price, condition, and product brand from the `description` field using a lightweight Claude call or regex heuristics. GiveEasy's descriptions already contain this info (e.g., "64GB iPhone 12 in black, battery health 87%"). The hero SKU selector sends descriptions to Claude with: "Extract price (number), condition (excellent/good/fair), and product brand (if any) from each description. Return JSON."

**v2 (future):** Add `price` (Number), `condition` (Text), `productBrand` (Text) fields to the `skus` collection and populate during catalog upload.

**For this implementation, use v1.** No schema migration needed.

---

## Part 1: Hero SKU Identification

Before generating queries, automatically identify up to 8 hero SKUs from the brand's catalog. These are products the brand owner would be *confident* they should rank for.

### Selection Factors (scored & ranked)

| Factor | Signal | Weight | Source |
|---|---|---|---|
| Price tier | Top 30% by price in catalog | 0.4 | Extracted from description via Claude |
| Category leadership | Most populated categories in catalog | 0.3 | Category field (existing) |
| Brand recognition | Known brands mentioned in name/description | 0.2 | Regex match against common brand list |
| Condition quality | Quality keywords in description | 0.1 | Keyword match: "new", "excellent", "like new" |

**Brand recognition:** Match product name/description against a hardcoded list of ~50 common consumer brands (Apple, Samsung, IKEA, Sony, Bose, Nike, etc.). Score 1.0 if matched, 0.0 if not. This list lives in `hero-sku-selector.ts` and can be extended.

### Selection Algorithm

1. Filter catalog to in-stock items only (all items if availability data not available)
2. Extract price/condition/brand from descriptions via Claude (batch call, single prompt)
3. Score each SKU: `price_percentile * 0.4 + category_count_rank * 0.3 + brand_recognition * 0.2 + condition_rank * 0.1`
4. Take top 8 SKUs. Minimum 3 to proceed; if fewer than 3 in-stock, use all available
5. Ensure category diversity: replace lowest-scoring hero SKUs to guarantee at least 1 SKU per top-3 category (by count), keeping total at 8 max

### Geo Inference

The `geo` field is determined as follows for v1:
- If brand domain TLD is `.in` → "India"
- If brand description contains "India", "Delhi", "Mumbai", "Bangalore", etc. → "India"
- Otherwise → "India" (hardcoded default for v1, parameterize in v2)

This is intentionally India-scoped for v1. Non-Indian brands will need localization work in v2.

### Example Output (GiveEasy)

```json
[
  { "name": "iPhone 12 64GB", "category": "Electronics", "price": 23000, "brand": "Apple" },
  { "name": "MacBook Air M1", "category": "Electronics", "price": 32000, "brand": "Apple" },
  { "name": "L Shaped Sofa 5 Seater", "category": "Living Room", "price": 16000 },
  { "name": "IKEA HEMLINGBY 2-Seater Sofa", "category": "Living Room", "price": 8000, "brand": "IKEA" },
  { "name": "Sheesham Bed with Side Tables", "category": "Bedroom", "price": 35000 },
  { "name": "Kids Race Car Bed", "category": "Bedroom", "price": 8000 }
]
```

---

## Part 2: Query Tiers

20 queries across 5 tiers. Each tier has a distinct purpose in measuring brand visibility.

### Tier 1: Hero SKU Queries (6 queries)

**Purpose:** Test visibility for product types the brand should *definitely* rank for.

**Rules:**
- Generalize from the hero SKU — don't use exact product specs
- Anchor with price range (round to nearest 5k/10k)
- Include geo when relevant
- Never include brand name (we're testing organic discovery)

**Examples (GiveEasy):**

| Hero SKU inspires... | Generated Query |
|---|---|
| iPhone 12 (Rs 23k) | "used iPhones under 25000 India" |
| iPhone 12 (Rs 23k) | "refurbished iPhone with good battery life" |
| MacBook Air M1 | "second hand MacBook Air for students" |
| L-Shaped Sofa (Rs 16k) | "affordable L shaped sofa Delhi NCR" |
| Sheesham Bed (Rs 35k) | "solid wood bed with storage under 40000" |
| IKEA Sofa | "used IKEA furniture India" |

### Tier 2: Category + Geo Discovery (4 queries)

**Purpose:** Test whether the brand appears when someone is browsing a category, not looking for a specific product.

**Rules:**
- Use the brand's top categories (by SKU count)
- Geo-localize based on brand description/domain
- Mix "best place to buy" with "where to find" phrasing

**Examples:**
- "best place to buy second hand furniture in Gurgaon"
- "refurbished kitchen appliances online India"
- "where to buy used electronics with warranty"
- "pre-owned home furniture marketplace Delhi"

### Tier 3: Need/Problem Queries (4 queries)

**Purpose:** Test whether the brand appears when someone has a real-life need (not searching for a product category directly).

**Rules:**
- Frame as situations/problems, not product searches
- Budget-conscious framing (common for refurbished buyers)
- Life events that trigger purchases

**Examples:**
- "setting up home office on a budget"
- "cheap study table for kids online"
- "furnish 1BHK apartment under 50000"
- "good quality used appliances for new kitchen"

### Tier 4: Trust + Comparison (3 queries)

**Purpose:** Test brand reputation and competitive positioning.

**Rules:**
- Include brand name in these queries (only tier that does)
- Compare against actual competitors from the brand's competitor list
- Include trust/legitimacy queries (critical for refurbished/used market)

**Examples:**
- "is giveasy legit and safe"
- "giveasy vs OLX vs cashify for used furniture"
- "best alternative to OLX for buying refurbished products"

### Tier 5: Market/Trend (3 queries)

**Purpose:** Test thought leadership — does the brand appear in industry conversations?

**Rules:**
- No brand name
- Industry-level queries about the market/vertical
- Sustainability, value, and trend angles

**Examples:**
- "refurbished products market India 2026"
- "sustainable shopping platforms India"
- "why buy refurbished instead of new"

---

## Part 3: Input/Output Contract

### Input

```typescript
interface BrandQueryInput {
  brandName: string;           // "GiveEasy"
  brandDomain: string;         // "giveasy.in"
  brandDescription: string;    // "Pre-owned marketplace for..."
  categories: string[];        // ["Electronics", "Living Room", "Bedroom", "Kitchen"]
  competitors: string[];       // ["olx.in", "cashify.com", "quikr.com"]
  heroSkus: HeroSku[];         // Auto-selected from catalog (5-8 items)
  geo: string;                 // "India" — inferred from brand description/domain
}

interface HeroSku {
  name: string;                // "iPhone 12 64GB"
  category: string;            // "Electronics"
  price: number;               // 23000
  brand?: string;              // "Apple" (product brand, not the marketplace brand)
}
```

### Output

```typescript
interface BrandQuery {
  query: string;               // "used iPhones under 25000 India"
  tier: "hero_sku" | "category_geo" | "need_problem" | "trust_compare" | "market_trend";
  intent: string;              // "Price-anchored search for hero electronics product"
}
```

**Total output: 20 queries (6 + 4 + 4 + 3 + 3)**

---

## Part 4: Claude's Role

Claude receives the structured input (brand info + hero SKUs + competitors + geo) and generates natural-language queries. Claude does NOT decide what to query — that's determined by the tier structure and hero SKU selection.

### Claude's responsibilities:
1. **Phrase queries naturally** — like a real human typing into ChatGPT/Perplexity
2. **Vary phrasing within tiers** — don't make all 6 hero queries sound templated
3. **Localize** — pick up geo signals, use local phrasing ("Delhi NCR", "under 25k")
4. **Generalize hero SKUs** — "used iPhone under 25k" not "iPhone 12 64GB Black battery 87%"
5. **Never include brand name** in tiers 1-3, 5 — only in tier 4 (trust/compare)

### Claude prompt structure:

```
You are generating search queries that real customers would type into AI search engines
(ChatGPT, Perplexity, Google AI). These must sound like natural human queries, not
marketing copy or SEO keywords.

Brand: {brandName} ({brandDomain})
Description: {brandDescription}
Location: {geo}
Competitors: {competitors}

Hero Products (the brand's strongest items — generalize these, don't use exact specs):
{heroSkus formatted}

Generate exactly 20 queries organized as follows:
- 6 hero_sku queries: Generalized from hero products. Price-anchored, geo-aware.
  DO NOT use the brand name. Example: "used iPhones under 25000 India"
- 4 category_geo queries: Category browsing with location.
  DO NOT use the brand name. Example: "best place to buy second hand furniture Gurgaon"
- 4 need_problem queries: Real-life situations that lead to purchases.
  DO NOT use the brand name. Example: "furnish 1BHK apartment under 50000"
- 3 trust_compare queries: Brand reputation and competitor comparison.
  USE the brand name here. Example: "is giveasy legit"
- 3 market_trend queries: Industry-level queries.
  DO NOT use the brand name. Example: "refurbished products market India"

Return ONLY a JSON array: [{"query": "...", "tier": "...", "intent": "..."}]
```

### Fallback (when Claude fails)

Deterministic template-based generation using the same tier structure:

```typescript
// Hero SKU fallback: "used {heroSku.category} under {roundedPrice} {geo}"
// Category fallback: "best place to buy {category} in {geo}"
// Need fallback: "affordable {category} for {common_use_case}"
// Trust fallback: "is {brandName} legit", "{brandName} vs {competitor}"
// Market fallback: "{vertical} market {geo} {year}"
```

---

## Part 5: SKU-Level Audit Queries (Separate from Brand Scan)

The SKU audit (`/api/audit/start`) also needs better queries. Currently generates `"best {category} like {productName}"`.

### Redesigned SKU query generation:

For each SKU, generate 5 queries using the same natural-language principles:

1. **Category + price**: "used {category} under {price_rounded}"
2. **Specific product type**: "second hand {product_type} {key_attribute}"
3. **Brand + category** (if product has known brand): "refurbished {brand} {category}"
4. **Use-case**: "best {category} for {common_use_case}"
5. **Comparison/alternative**: "affordable alternative to new {product_type}"

**Example for "iPhone 12 64GB Black" (Rs 23,000):**
1. "used smartphones under 25000 India"
2. "second hand iPhone 12 good battery"
3. "refurbished Apple iPhone India"
4. "best phone for college student budget"
5. "affordable alternative to buying new iPhone"

### SKU Query Fallback (when Claude fails)

If Claude fails to generate SKU queries, use deterministic templates:

```typescript
function generateFallbackSkuQueries(sku: SkuInput, geo: string): string[] {
  return [
    `used ${sku.category.toLowerCase()} ${geo}`,
    `second hand ${sku.name.split(' ').slice(0, 3).join(' ')}`,
    `buy refurbished ${sku.category.toLowerCase()} online`,
    `affordable ${sku.category.toLowerCase()} on a budget`,
    `best deals on pre-owned ${sku.category.toLowerCase()}`
  ];
}
```

---

## Part 6: Scoring Weight Changes

Current brand scan tier weights:
```
awareness: 0.15, category: 0.30, intent: 0.25, competitor: 0.15, thought_leadership: 0.15
```

New weights reflecting business value:
```
hero_sku: 0.35       // These are money queries — highest weight
category_geo: 0.25   // Category discovery is second priority
need_problem: 0.20   // Problem-based discovery
trust_compare: 0.10  // Important but brand already known here
market_trend: 0.10   // Nice-to-have, not revenue-driving
```

---

## Part 7: Output Validation

After Claude returns queries, validate before using:

1. **Count check:** Must have exactly 20 queries. If fewer, pad with fallback templates for missing tiers.
2. **Dedup:** Remove exact duplicate queries. Replace with fallback if needed.
3. **Brand name leakage:** Check tiers 1-3 and 5 for brand name (case-insensitive). If found, strip it or regenerate.
4. **Length bounds:** Queries must be 5-200 characters. Drop and replace outliers.
5. **Tier distribution:** Verify correct counts per tier (6+4+4+3+3). Redistribute if needed.

---

## Part 8: Migration & Compatibility

### Tier name changes

Old tiers: `awareness | category | intent | competitor | thought_leadership`
New tiers: `hero_sku | category_geo | need_problem | trust_compare | market_trend`

**Affected downstream:**
- `BrandScanResult.tier` type in `src/types/brand-scan.ts`
- `TierScores` interface keys
- Weights object in `brand-scan/start/route.ts` (line ~284)
- Tier iteration array in `brand-scan/start/route.ts` (line ~261)
- Frontend components displaying tier names (dashboard brand scan widget, any tier filters)

**Strategy: Clean break.** Old scan records retain old tier names in the DB. The status endpoint and dashboard should handle both old and new tier names during transition. New scans use new tiers only. No backfill of old records.

### Brand scan route changes

The `brand-scan/start/route.ts` needs to:
1. Fetch competitors from `pb.collection("competitors")` (same pattern as audit route)
2. Fetch SKUs from `pb.collection("skus")` and run hero SKU selection
3. Pass `{ brandName, brandDomain, brandDescription, categories, competitors, heroSkus, geo }` to the new `generateBrandQueries()`

---

## Files to Modify

1. **`src/lib/ai/brand-query-gen.ts`** — New prompt, new tier names, hero SKU input, updated fallback
2. **`src/lib/ai/query-gen.ts`** — Better SKU-level query prompt with fallback
3. **`src/app/api/brand-scan/start/route.ts`** — Fetch competitors + SKUs, run hero selection, pass to generator, update tier weights
4. **`src/app/api/audit/start/route.ts`** — Use improved SKU query gen
5. **`src/types/brand-scan.ts`** — Update tier type union and TierScores interface to new names
6. **New: `src/lib/ai/hero-sku-selector.ts`** — Hero SKU selection logic with brand list and Claude extraction

---

## Success Criteria

1. Brand scan queries for GiveEasy should include queries like "used iPhone under 25k" and "second hand furniture Delhi" — not "best place to buy general products online India"
2. Every query should sound like something a real human would type into ChatGPT
3. Hero SKU selection should surface the brand's strongest 5-8 products automatically
4. Fallback queries should still be useful (not generic placeholder text)
5. No brand name leakage in discovery queries (tiers 1-3, 5)
6. Old brand scans with legacy tier names should not break the dashboard
