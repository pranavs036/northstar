# NorthStar Product Roadmap

**Last updated:** 2026-03-23
**Authors:** Pranav & Priya
**Status:** Living document — update as phases ship

---

## Current State (What's Built)

NorthStar has a functional MVP with the core audit loop working end-to-end. The demo on 2026-03-22 validated the pipeline but exposed several bugs that need fixing before any paid customer touches the product.

### Working Features

| Feature | Status | Notes |
|---------|--------|-------|
| User signup & auth (PocketBase) | **Working** | Email/password via PocketBase. Cookie auth is non-standard (URL-encoded JSON) but functional. |
| Catalog upload (CSV) | **Working** | Zod-validated. Creates SKU records individually (no batch insert in PocketBase). |
| Competitor management | **Working** | Add/list competitors per brand. |
| Prompt library (CRUD) | **Working** | Create, list, categorize custom prompts. Not yet connected to scans. |
| Alert configuration | **Working** | Visibility drop + competitor gain alerts configurable. Email delivery not implemented. |
| Team invites | **Working** | Invite token generation, role assignment. Invite acceptance flow untested. |
| Brand Scan (SSE) | **Working** | 20 queries x 3 engines (~3 min). Real-time SSE progress. Visibility score + tier breakdown. |
| SKU Audit (SSE) | **Working** | Per-SKU scanning across 5 engines. Agent-Readiness Score calculated. |
| Brand Scan Status | **Working** | Returns latest scan with full results + tier scores. |
| Audit Details API | **Working** | Returns audit summary, diagnoses, scan results. |
| Export (CSV + JSON) | **Working** | Export scan results as CSV, diagnoses as JSON. |
| PDF Report Generation | **Working** | 5-page audit report with executive summary, engine breakdown, SKU findings. |
| Scan Scheduling (DB) | **Partial** | `scan_schedules` collection exists. Vercel Cron trigger is incomplete. No automated runs. |

### Buggy / Broken Features

| Issue | Severity | Detail |
|-------|----------|--------|
| Brand name empty in brand scan | **HIGH** | `brandName` not populated from user record via cookie auth. Queries generate as `"what is "` (empty). |
| OpenAI API key not picked up | **HIGH** | ChatGPT scans show SKIPPED. Only Gemini engine active during demo. |
| Perplexity API key not picked up | **HIGH** | Same issue — scans marked SKIPPED. |
| Gemini 429 rate limits | **MEDIUM** | No retry/backoff logic. Fails silently with error in rawResponse. |
| Prompt suggestions fail (500) | **MEDIUM** | `/api/prompts/suggest` — Claude API call fails. Likely API key or prompt format issue. |
| Query gen uses fallback format | **MEDIUM** | Audit generates `"best {category} like {name}"` instead of Claude-generated natural queries. |
| Duplicate scan records | **LOW** | 19 records created for 3 SKUs x 5 engines (expected 15). Previous audit data leaking. |

### Not Yet Built

- Brand Profile page (edit brand config from UI)
- Daily automated monitoring (cron)
- Visibility trend charts (historical data)
- Share of Voice calculation
- Per-engine breakdown dashboard widget
- Prompt-scan linking
- Landing page
- Free audit / signup flow
- Stripe payment integration
- Email notifications
- Competitor PDP scraping + gap analysis
- Shopify integration

---

## Phase 1: Foundation Fixes (Week 1-2)

**Goal:** Make the existing product reliable enough to demo to a real brand without embarrassment. Every scan should return real data from real engines.

### 1.1 Critical Bug Fixes (Week 1)

**Brand name empty in scans**
- Root cause: Cookie auth doesn't populate `brandName` from the PocketBase user record.
- Fix: In `/api/brand-scan/start/route.ts`, fetch the full user record from PocketBase after auth, not just the cookie payload.
- Acceptance: Brand scan SSE events show the actual brand name in all messages and queries.

**API key configuration**
- OpenAI and Perplexity keys exist in `.env.local` but aren't being read by the scanner modules.
- Audit each scanner (`chatgpt.ts`, `perplexity.ts`, `google.ts`, `gemini.ts`, `copilot.ts`) for env var naming mismatches.
- Acceptance: All 5 engines return real responses (not SKIPPED) in both brand scan and SKU audit.

**Gemini rate limiting**
- Add exponential backoff with jitter to the Gemini scanner.
- Max 3 retries, 2s/4s/8s delays.
- Log rate limit events for monitoring.

**Duplicate scan cleanup**
- Audit the scan pipeline for duplicate record creation. Likely caused by missing deduplication on `(skuId, engine, query, auditId)`.
- Add unique constraint or check-before-insert logic.

### 1.2 Query Generation v2 (Week 1-2)

Reference: [`docs/superpowers/specs/2026-03-22-query-generation-v2-design.md`](superpowers/specs/2026-03-22-query-generation-v2-design.md)

**Hero SKU Identification**
- New file: `src/lib/ai/hero-sku-selector.ts`
- Auto-select top 8 SKUs from catalog using weighted scoring: price tier (0.4), category leadership (0.3), brand recognition (0.2), condition quality (0.1).
- Extract price/condition/brand from SKU descriptions via lightweight Claude call (v1 approach — no schema migration).
- Hardcoded brand recognition list (~50 common consumer brands).
- Ensure category diversity: at least 1 SKU per top-3 category.

**Brand Scan Query Redesign**
- Replace current 5 tiers (`awareness | category | intent | competitor | thought_leadership`) with new 5 tiers: `hero_sku | category_geo | need_problem | trust_compare | market_trend`.
- 20 queries total: 6 + 4 + 4 + 3 + 3.
- Hero SKU queries: price-anchored, geo-aware, no brand name. Example: `"used iPhones under 25000 India"`.
- Trust/compare queries: only tier that includes brand name.
- Update scoring weights: hero_sku 0.35, category_geo 0.25, need_problem 0.20, trust_compare 0.10, market_trend 0.10.
- Deterministic fallback templates for every tier if Claude fails.

**SKU Audit Query Redesign**
- Replace `"best {category} like {name}"` with 5 natural-language queries per SKU.
- Templates: category+price, specific product type, brand+category, use-case, comparison/alternative.
- Example for "iPhone 12 64GB": `"used smartphones under 25000 India"`, `"second hand iPhone 12 good battery"`.

**Output Validation**
- Count check (exactly 20 queries for brand scan, 5 per SKU for audit).
- Deduplication.
- Brand name leakage check (tiers 1-3, 5).
- Length bounds (5-200 chars).

**Migration**
- Clean break: old scans keep old tier names in DB. Dashboard handles both old and new tier names.

### 1.3 Fix Prompt Suggestions (Week 1)

- Debug `/api/prompts/suggest` — likely Anthropic API key env var mismatch or malformed prompt.
- Test with real brand data.

### Deliverables — End of Week 2
- [ ] All 5 AI engines returning real data
- [ ] Brand name correctly populated in all scans
- [ ] Query gen v2 producing natural, price-anchored queries
- [ ] Hero SKU selection working for catalogs with 10+ SKUs
- [ ] Prompt suggestions endpoint functional
- [ ] No duplicate scan records

---

## Phase 2: Table Stakes (Week 3-4)

**Goal:** Build the 6 features every GEO competitor already has. Without these, no prospect will take NorthStar seriously. Otterly, Peec, and Profound all ship these out of the box.

Reference: [`docs/superpowers/specs/2026-03-22-table-stakes-features-design.md`](superpowers/specs/2026-03-22-table-stakes-features-design.md)

### 2.1 Brand Profile Tab (Week 3)

**New page:** `/brand-profile`
- Edit brand name, domain, description from UI (no more PocketBase admin).
- Brand positioning: industry, target geo, top categories.
- Scan configuration: select which engines to scan, set frequency.
- Quick actions: "Run Brand Scan" and "Run SKU Audit" buttons with last scan timestamp.
- PocketBase schema changes: add `industry`, `targetGeo`, `enabledEngines` fields to `users` collection.
- New API: `PATCH /api/brand/profile`.

### 2.2 Daily Automated Monitoring (Week 3)

**Extract brand scan pipeline** into `src/lib/scanners/brand-scan-pipeline.ts`.
- Current scan logic is embedded inside the SSE route handler closure. Extract to a reusable function with optional `onProgress` callback.
- SSE route calls it with progress callback. Cron calls it silently.

**Vercel Cron setup**
- Extend `/api/audit/schedule` or create `/api/cron/brand-scan` endpoint.
- Cron runs daily at 6am UTC. Processes max 5 users per invocation (batch to avoid Vercel timeout).
- Users with `scan_schedules.frequency = "daily"` and `active = true` get scanned.

**History API:** `GET /api/brand-scan/history`
- Returns all historical brand scans for the authenticated user.
- Params: `?period=30d|90d|all`.
- Uses PocketBase `getList` (not `getFullList` — known bug with limit param).

### 2.3 Visibility Trend Charts (Week 3-4)

**Enhance `/trends` page** to use brand scan history as primary data source.
- Overall visibility score line chart (X = date, Y = score).
- Per-tier breakdown multi-line chart.
- Score changes table with deltas and direction arrows.
- Period selector: 30d / 90d / All time.
- Use Recharts (already in project). Enhance existing `VisibilityTrendChart` component.

### 2.4 Share of Voice (Week 4)

**Formula:** `SoV = brand_mentions / (brand_mentions + all_competitor_mentions) * 100`

**New API:** `GET /api/analytics/share-of-voice`
- Reads from both `brand_scans` and `scan_results` collections.
- Returns brand SoV percentage + per-competitor breakdown.
- Donut chart on dashboard showing brand vs each competitor.
- Enhance existing `ShareOfVoiceChart` component.

### 2.5 Per-Engine Breakdown (Week 4)

**New API:** `GET /api/analytics/engine-breakdown`
- Group scan results by engine. Count `brandVisible == true` / total per engine.
- Horizontal bar chart: ChatGPT 67%, Perplexity 50%, Google 33%, etc.
- Show on dashboard (latest scan) and audit detail page (per-audit).
- Enhance existing `EngineComparisonChart` component.

### 2.6 Prompt-Scan Linking (Week 4)

- When running a brand scan, fetch user's prompts from `prompts` collection.
- Append up to 10 user prompts as a 6th tier: `custom`.
- Tag results with `tier: "custom"`. Don't count in weighted visibility score — supplementary only.
- Add `"custom"` to tier union type in `src/types/brand-scan.ts`.

### Deliverables — End of Week 4
- [ ] Brand profile editable from UI
- [ ] Daily cron running brand scans automatically
- [ ] Visibility trend charts with at least 2 data points
- [ ] Share of Voice donut chart on dashboard
- [ ] Per-engine visibility bar chart on dashboard + audit page
- [ ] Custom prompts included in brand scans

---

## Phase 3: Landing Page + Growth (Week 5-6)

**Goal:** Get the first organic signups. Build a landing page that converts visitors into free audit users, then convert free users to paid.

Reference: [`docs/superpowers/specs/2026-03-23-landing-page-design.md`](superpowers/specs/2026-03-23-landing-page-design.md)

### 3.1 Landing Page Build (Week 5)

**Design language:** Inspired by OFF+BRAND (itsoffbrand.com) — warm neutrals (cream `#E5E4E0` + dark `#1A1A2E`), single typeface (Satoshi), generous whitespace, pill CTAs.

**Signature visual:** Pulsing radar/scanner ring with brand dots on concentric orbits. CSS animation only (no WebGL).

**Page sections (9 total):**
1. **Hero** — `"PRODUCTS DON'T GET SEARCHED ANYMORE. THEY GET RECOMMENDED."` + radar animation + `[Run Free Audit]` CTA.
2. **The Shift** — Dark bg. `"SEO GOT YOU TO PAGE ONE. GEO GETS YOU INTO THE ANSWER."` Explains the paradigm shift.
3. **How It Works** — 3 cards: Scan, Diagnose, Fix. Clean grid layout.
4. **The Diagnosis** — Showstopper section. Real diagnosis card with critical severity, specific fix, typewriter reveal animation.
5. **The Engines** — 5 engine logos in orbital pattern. Hover tooltips showing what each engine prioritizes.
6. **Results / Social Proof** — Before/after case study cards (will use placeholder data initially, real case studies once available).
7. **Metrics That Matter** — Numbered rows: Agent-Readiness Score, Share of Voice, Citation Rate, Engine Breakdown, Severity Diagnosis.
8. **Brand Statement** — Gradient bg callback to hero. `"MAKE SURE AI RECOMMENDS YOURS."` + CTA.
9. **Footer** — CTA + sitemap + social links.

**Key animations:**
- Character-level scatter/reassemble on hero headline (Framer Motion).
- Custom cursor with `mix-blend-mode: difference`.
- Scroll-triggered section reveals with staggered fade-up.
- Diagnosis card blur-to-focus reveal with typewriter fix text.
- Engine orbit with hover tooltips.
- Cream/dark section background transitions via `clip-path` curtain.

**Tech:** Next.js static page at `/`, Framer Motion, CSS animations, Satoshi font. No component library — custom CSS with design tokens.

### 3.2 Free Audit Flow (Week 5-6)

The conversion funnel:

```
Landing page CTA → Signup (email only) → Enter brand URL → Auto-scan begins
→ Results teaser (blurred full results, 3 findings shown free) → Paywall
→ Pay → Full results unlocked
```

**Implementation:**
1. **Minimal signup:** Email + password only. Auto-create brand record from domain.
2. **URL-only onboarding:** User enters their brand URL. We auto-scrape the homepage to extract brand name, categories, and sample product URLs (Playwright).
3. **Auto-scan:** Immediately trigger a brand scan with 10 queries (half the full 20 — faster, cheaper). Show SSE progress on a clean results-loading page.
4. **Results teaser:** Display 3 findings ungated (enough to show value). Remaining findings blurred with a `[Unlock Full Report — $X]` overlay.
5. **Paywall gate:** Stripe Checkout session. On payment success, mark user plan as `AUDIT` and unhide full results.

### 3.3 Stripe Payment Integration (Week 6)

- Stripe Checkout for one-time audit payments.
- Webhook at `/api/webhooks/stripe` to handle `checkout.session.completed`.
- Update user plan from `FREE` to `AUDIT` on successful payment.
- Product/price objects in Stripe Dashboard (not hardcoded).
- Receipt emails via Stripe (no custom email needed initially).

### 3.4 Email Notifications (Week 6)

- **Audit complete:** Send email when background audit finishes with score + link to results.
- **Alert triggers:** Send email when visibility drop or competitor gain alerts fire.
- Use Resend or Postmark (transactional email service). Avoid SendGrid complexity.
- Simple HTML email template with NorthStar branding. Link to dashboard.

### Deliverables — End of Week 6
- [ ] Landing page live at northstar domain
- [ ] Free audit flow: URL input to results teaser in under 5 minutes
- [ ] Stripe checkout working for audit payment
- [ ] Email notification on scan/audit complete
- [ ] Mobile-responsive landing page (60fps animations on mid-range devices)

---

## Phase 4: Differentiation (Week 7-10)

**Goal:** Build the features that make brands switch FROM Otterly/Peec/Profound TO NorthStar. The core differentiator is clear: NorthStar doesn't just track visibility — it tells you exactly what to fix and (eventually) fixes it for you.

### Competitive Gap Analysis

| Feature | Otterly ($29-989/mo) | Peec (EUR 90-499/mo) | Profound ($499/mo+) | NorthStar |
|---------|---------------------|---------------------|--------------------|----|
| Multi-engine monitoring | Yes (6 engines) | Yes (6 engines) | Yes (10+ engines) | Yes (5 engines) |
| Visibility score | Yes (Brand Visibility Index) | Yes | Yes | Yes (Agent-Readiness Score) |
| Share of Voice | Yes | Yes (competitor benchmarking) | Yes | Phase 2 |
| Trend tracking | Yes (daily historical) | Yes | Yes | Phase 2 |
| Sentiment analysis | Basic | Yes | Yes | Partial |
| **Actionable fixes per SKU** | No | No | Limited (content suggestions) | **Yes — core differentiator** |
| **Competitor PDP gap analysis** | No (URL analytics only) | No | No | **Phase 4** |
| **Schema auto-fix** | No | No | No | **Phase 4** |
| **SKU-level diagnosis** | No | No | No | **Yes — built** |
| Shopify integration | No | No | No | Phase 4 |
| Content optimization | No | No | Yes (one-click AI content) | Phase 4 |
| Looker/BI integration | No | Yes (Advanced+) | No | Not planned |

**What makes a brand switch:** Otterly and Peec tell you WHERE you're invisible. NorthStar tells you WHY and gives you the specific fix for each gap. That's the difference between a monitoring tool and a growth tool.

### 4.1 Competitor PDP Scraping + Gap Analysis (Week 7-8)

**The killer feature.** When a competitor gets cited over you for a query, NorthStar scrapes both PDPs and generates a specific delta.

- **Playwright PDP scraper** (`src/lib/scrapers/pdp-scraper.ts`): Scrape competitor product pages when they appear in AI engine responses.
- **Schema extractor** (`src/lib/scrapers/schema-extractor.ts`): Extract JSON-LD structured data, Open Graph tags, meta descriptions, FAQ sections, review counts, content length, attribute depth.
- **Delta computation:** Compare brand PDP vs competitor PDP. Generate structured gap report.
- **Claude-powered diagnosis:** Given brand PDP + competitor PDP + AI response + query, generate: reason (why competitor wins), fix (what to change), severity (CRITICAL/HIGH/MEDIUM/LOW), missing elements list.
- **UI:** `CompetitorDelta` card on audit results page showing side-by-side comparison.

**Scraping rules:** Respect robots.txt. Human-like delays (2-5s between requests). Rotate user agents. Only scrape publicly visible pages. Cache scraped data for 7 days.

### 4.2 AI-Powered Content Suggestions (Week 8-9)

Go beyond "add FAQ schema" and generate the actual content.

- **Product description rewriter:** Given current PDP content + competitor content + gap analysis, Claude generates an optimized product description (500+ words, conversational, AI-readable).
- **FAQ generator:** Auto-generate 5-8 FAQs per product based on common customer queries in the category. Output as copy-paste HTML with FAQ schema markup.
- **Meta tag suggestions:** Generate optimized title tags, meta descriptions, and Open Graph tags per product.
- **UI:** "Content Suggestions" tab on each SKU detail page. One-click copy for each suggestion.

This is a direct response to Profound's "one-click AI content" feature, but scoped to ecommerce PDPs specifically (more focused, more useful).

### 4.3 Schema Auto-Fix Generator (Week 9)

- Analyze existing JSON-LD on brand's PDPs.
- Generate corrected/enhanced JSON-LD with: Product schema, AggregateRating, Review, FAQ, BreadcrumbList, Organization.
- Output as copy-paste code blocks or downloadable `.json` files.
- For Shopify stores (Phase 4.5): detect theme and generate theme-compatible Liquid snippets.
- **UI:** "Schema Fix" button on each SKU diagnosis card. Shows before/after JSON-LD diff.

### 4.4 Fix Priority Queue (Week 9-10)

- Aggregate all diagnoses across SKUs into a single prioritized task list.
- Sort by: severity (CRITICAL first), revenue impact (price x estimated search volume proxy), effort (schema fix = easy, content rewrite = medium, structural change = hard).
- **UI:** `/fixes` page — kanban-style board or prioritized list. Columns: To Do, In Progress, Done.
- Track which fixes have been implemented (manual checkbox for now; auto-detection in Phase 5).

### 4.5 Shopify Integration (Week 10)

- **Shopify URL auto-ingestion:** Enter Shopify store URL. Playwright scrapes product listings, extracts SKU data (name, price, category, URL, description), populates catalog automatically.
- **Schema detection:** Check which Shopify theme is in use. Detect existing JSON-LD (most Shopify themes have basic Product schema). Identify gaps.
- **Shopify-specific fixes:** Generate Liquid template snippets for missing schema. Provide instructions for theme editor installation.
- **Future (not this phase):** Shopify app with OAuth for direct metafield writes and automated schema injection.

### Deliverables — End of Week 10
- [ ] Competitor PDP scraping + side-by-side gap analysis working
- [ ] Claude-generated content suggestions (descriptions, FAQs, meta tags) per SKU
- [ ] Schema auto-fix with copy-paste JSON-LD per SKU
- [ ] Fix priority queue with severity + effort scoring
- [ ] Shopify URL import + theme-aware schema suggestions
- [ ] At least 3 paying customers using the fix recommendations

---

## Phase 5: Scale (Month 3-4)

**Goal:** Move from founder-led sales to self-serve growth. Support agencies and multi-brand operations. Build infrastructure for 100+ concurrent users.

### 5.1 Multi-Brand / Agency Support (Month 3)

- **Workspaces:** One account manages multiple brands. Each workspace has its own catalog, competitors, scans, reports.
- **Agency dashboard:** Overview of all client brands with aggregate visibility scores. Alert roll-up across brands.
- **Role-based access:** Owner, Admin, Viewer. Viewers can see reports but not trigger scans or edit config.
- **Client-facing reports:** Branded report PDFs with agency logo + client brand.

### 5.2 API Access for Enterprise (Month 3)

- **REST API with API key auth:** Allow enterprise customers and agencies to trigger scans, fetch results, and pull reports programmatically.
- **Endpoints:** `/api/v1/scan/brand`, `/api/v1/scan/sku`, `/api/v1/reports/{auditId}`, `/api/v1/analytics/sov`, `/api/v1/analytics/trends`.
- **Rate limits:** Tier-based (Starter: 100 req/day, Pro: 1000 req/day, Enterprise: 10000 req/day).
- **Webhooks:** Push notifications to customer endpoints on scan complete, alert trigger, score change.

### 5.3 White-Label Reports (Month 3-4)

- **Customizable PDF reports:** Agency logo, custom colors, client branding.
- **Report templates:** Executive summary (for CMOs), technical detail (for dev teams), competitor benchmark (for strategy).
- **Scheduled reports:** Weekly/monthly auto-generated reports emailed to stakeholders.
- **Shareable links:** Public report URLs with optional password protection (for sharing with clients without NorthStar accounts).

### 5.4 Advanced Analytics (Month 4)

- **AI Search Volume estimation:** Like Profound's "Prompt Volumes" — estimate how many people are searching for specific queries on AI engines. Start with proxy data (Google search volume as baseline, apply AI adoption multiplier).
- **Citation source analysis:** Which pages on your site get cited most? Which content types (blog, PDP, FAQ, about page) drive AI citations?
- **Fix impact tracking:** After a brand implements a fix, track whether visibility improves on the next scan. Show before/after per fix.
- **Competitive intelligence timeline:** Track competitor visibility over time. Alert when a competitor's score jumps (they probably fixed something — investigate what).
- **Geo segmentation:** Track visibility by geography (US, India, UK, EU). Different AI engines have different geo biases.

### 5.5 Infrastructure Scaling (Month 3-4)

- **Migrate from PocketBase to Supabase (PostgreSQL):** PocketBase is great for prototyping but will hit limits at scale. Migrate to Supabase for proper SQL, row-level security, realtime subscriptions, and managed hosting.
- **Background job queue:** Move from Vercel Cron (60s timeout) to proper BullMQ workers on Railway for long-running scans.
- **Caching layer:** Redis cache for frequently accessed analytics (SoV, engine breakdown, trend data). TTL-based invalidation on new scan completion.
- **CDN for reports:** Store generated PDFs on Supabase Storage or S3 with CDN distribution.

### Deliverables — End of Month 4
- [ ] Multi-brand workspace support with role-based access
- [ ] Public REST API with API key auth and webhook support
- [ ] White-label PDF reports with custom branding
- [ ] Fix impact tracking (before/after visibility per fix)
- [ ] Infrastructure supporting 100+ concurrent users
- [ ] Database migrated from PocketBase to Supabase (if needed based on load)

---

## Pricing Strategy

### Competitive Pricing Landscape (March 2026)

| Platform | Entry Price | Mid-Tier | Enterprise | Model |
|----------|-----------|----------|------------|-------|
| Otterly.AI | $29/mo (10 prompts) | $189/mo (100 prompts) | $989/mo | Monthly SaaS, prompt-based |
| Peec AI | EUR 90/mo | EUR 199/mo | EUR 499/mo | Monthly SaaS, prompt-based |
| Profound | $499/mo | — | Custom | Monthly SaaS, enterprise-focused |
| Semrush AI Visibility | $99/mo (add-on) | — | — | Add-on to existing Semrush plan |
| Ahrefs Brand Radar | Included in Ahrefs plan | — | — | Bundled feature |
| Geoptie | $49/mo | — | — | Monthly SaaS |
| Evertune | — | — | $3,000/mo | Enterprise only |

### Recommended NorthStar Pricing

**Model: Hybrid (one-time audit + optional monthly SaaS)**

This is NorthStar's strategic advantage. Every competitor charges monthly for monitoring. NorthStar can offer a one-time audit (lower commitment, higher perceived value) and upsell to monthly monitoring.

#### Tier 1: Free Audit (Lead Gen)
- **Price:** $0
- **What you get:** 10-query brand scan across 3 engines. Results teaser (3 findings shown, rest blurred). Agent-Readiness Score.
- **Purpose:** Get the brand hooked. Show them their gaps. Create urgency.

#### Tier 2: Full Audit — Starter ($499 one-time)
- **What you get:** Full 20-query brand scan across 5 engines. Up to 25 SKU audit. Competitor PDP gap analysis (vs 3 competitors). AI-generated fix recommendations per SKU. Downloadable PDF report. Schema fix code snippets.
- **Target:** Small DTC brands, Shopify stores with <100 SKUs.
- **Upsell path:** Monthly monitoring at $99/mo.

#### Tier 3: Full Audit — Growth ($1,999 one-time)
- **What you get:** Everything in Starter. Up to 200 SKUs. 5 competitor analysis. AI-generated content suggestions (descriptions, FAQs, meta tags). Fix priority queue. 2 follow-up re-scans (30-day and 60-day) to track fix impact.
- **Target:** Mid-market ecommerce brands doing $1M-$20M revenue.
- **Upsell path:** Monthly monitoring at $299/mo.

#### Tier 4: Full Audit — Enterprise ($5,000-$10,000 one-time)
- **What you get:** Everything in Growth. Unlimited SKUs. White-label report with client branding. Dedicated audit review call with founders. Shopify/WooCommerce schema implementation support. 4 re-scans over 90 days.
- **Target:** Enterprise ecommerce or agencies managing multiple brands.
- **Upsell path:** Monthly monitoring at $999/mo.

#### Monthly Monitoring Add-On

| Plan | Price | Includes |
|------|-------|----------|
| Monitor Starter | $99/mo | Daily brand scans, trend charts, SoV, email alerts, 25 SKUs |
| Monitor Growth | $299/mo | Everything in Starter + 200 SKUs, competitor tracking, monthly PDF report, API access |
| Monitor Enterprise | $999/mo | Everything in Growth + unlimited SKUs, multi-brand, white-label, webhooks, priority support |

**Pricing rationale:**
- The one-time audit at $499-$5,000 is significantly cheaper than hiring a GEO consultant ($5K-$20K) but more expensive than a monthly monitoring tool at $29-99/mo. This positions NorthStar as the "diagnostic + fix" tool rather than a passive dashboard.
- The monthly monitoring is priced competitively with Otterly ($29-189) and Peec (EUR 90-199) but includes actionable fixes (which they don't offer).
- The hybrid model avoids the "another monthly SaaS subscription" fatigue. Brands can buy one audit, implement fixes, and only subscribe if they want ongoing monitoring.

---

## Competitive Moat

### Where NorthStar Wins Today

1. **Actionable fixes, not just dashboards.** Otterly, Peec, and even Semrush tell you WHERE you're invisible. NorthStar tells you WHY and generates the specific fix. This is the only feature that actually changes a brand's outcome — everything else is reporting.

2. **SKU-level granularity.** Competitors track at the brand/domain level. NorthStar tracks at the individual product (SKU) level, which is what ecommerce brands actually care about. "Your iPhone 12 listing is invisible on ChatGPT because..." is infinitely more useful than "Your brand visibility score is 35%."

3. **Competitor PDP reverse-engineering.** No competitor does this. Scraping the competitor's actual product page, extracting their schema/content/review signals, and showing a side-by-side delta is unique to NorthStar.

4. **One-time audit model.** Lower commitment than monthly SaaS. Especially appealing to SMB ecommerce brands who want to "fix it once" rather than pay monthly to watch a dashboard.

### Moat-Building Investments (Where to Spend Engineering Time)

**1. Fix Intelligence Database (High Priority)**
Every diagnosis NorthStar generates is training data. Over time, build a pattern library: "When a brand is invisible on ChatGPT for [product type] queries, the fix is usually [specific schema + content change]." This becomes a proprietary knowledge base that gets better with every audit. No competitor has this because they don't generate fixes.

**2. Fix Verification Loop (High Priority)**
After a brand implements NorthStar's recommended fix, re-scan and measure the impact. "You added Product JSON-LD and your ChatGPT citation rate went from 0% to 45%." This creates a feedback loop that validates NorthStar's recommendations and generates case study data for marketing.

**3. Ecommerce Platform Integrations (Medium Priority)**
Deep Shopify integration (app with OAuth, direct metafield writes, automated schema injection) creates switching costs. Once a brand installs the NorthStar Shopify app and it's auto-fixing their schema, they won't switch to Otterly. Extend to WooCommerce, BigCommerce, and Magento.

**4. AI Search Volume Data (Medium Priority)**
Profound has "Prompt Volumes" — the first real attempt at estimating AI search volume. NorthStar should build its own version. Even rough estimates (based on Google search volume as proxy + AI adoption rates) are valuable. This data becomes a competitive asset if it's more accurate or covers more niches.

**5. Vertical Specialization (Long-term)**
GEO for "refurbished electronics in India" is a very different problem than GEO for "luxury fashion in the US." Build vertical-specific query templates, fix recommendations, and benchmarks. Start with: refurbished/used goods, electronics, furniture, fashion. Vertical expertise creates defensibility because generic tools can't match depth.

**6. Network Effects via Agency Channel (Long-term)**
Agencies managing 10-50 brands each create natural network effects. Build the best multi-brand management tools and agencies will standardize on NorthStar. Each agency brings 10-50 brands, each generating data that improves the fix intelligence database. Pricing for agencies should be aggressive — the LTV of an agency account is 10-50x a single brand.

### What Doesn't Create a Moat

- **Number of AI engines monitored:** Easy to add. Otterly already covers 6, Profound covers 10+. This is table stakes, not a differentiator.
- **Pretty dashboards:** Every SaaS has nice charts. Dashboards don't create switching costs.
- **Cheaper pricing:** Race to the bottom. Otterly is already at $29/mo. Competing on price is a losing strategy.

### Long-term Defensibility Summary

| Moat Component | Timeframe | Defensibility |
|---------------|-----------|---------------|
| Fix Intelligence Database | 6-12 months of audit data | High — proprietary dataset, improves with scale |
| Fix Verification Loop | 3-6 months to build, ongoing | High — creates case study flywheel |
| Shopify/WooCommerce App | 2-3 months to build | Medium — creates switching costs per customer |
| Vertical query/fix templates | 3-6 months per vertical | Medium — requires domain expertise + data |
| Agency network | 6-12 months to build | High — multi-sided network effect |
| AI Search Volume data | 6-12 months to have reliable data | Medium — Profound has a head start |

---

## Timeline Summary

```
Week 1-2   FOUNDATION FIXES
           ├── Bug fixes (brand name, API keys, rate limits, duplicates)
           ├── Query Generation v2 (hero SKUs, new tiers, natural queries)
           └── Prompt suggestions fix

Week 3-4   TABLE STAKES
           ├── Brand Profile tab
           ├── Daily automated monitoring (cron)
           ├── Visibility trend charts
           ├── Share of Voice
           ├── Per-engine breakdown
           └── Prompt-scan linking

Week 5-6   LANDING PAGE + GROWTH
           ├── Landing page (9 sections, animations)
           ├── Free audit flow (URL → scan → teaser → paywall)
           ├── Stripe payment integration
           └── Email notifications

Week 7-10  DIFFERENTIATION
           ├── Competitor PDP scraping + gap analysis
           ├── AI content suggestions (descriptions, FAQs, meta tags)
           ├── Schema auto-fix generator
           ├── Fix priority queue
           └── Shopify integration (URL import + schema suggestions)

Month 3-4  SCALE
           ├── Multi-brand / agency workspaces
           ├── REST API with key auth
           ├── White-label reports
           ├── Advanced analytics (search volume, fix impact tracking)
           └── Infrastructure scaling (PocketBase → Supabase, BullMQ workers)
```

---

## Key Metrics to Track

| Metric | Target (Month 1) | Target (Month 3) | Target (Month 6) |
|--------|------------------|-------------------|-------------------|
| Free audits run | 50 | 500 | 2,000 |
| Paid audits | 5 | 30 | 100 |
| Monthly monitoring subscribers | 0 | 10 | 50 |
| MRR | $0 | $5,000 | $25,000 |
| Fix implementation rate | N/A | 30% of recommendations | 50% of recommendations |
| Avg. visibility improvement post-fix | N/A | +15 points | +25 points |
| NPS | N/A | 40+ | 50+ |

---

## Open Questions

1. **PocketBase vs Supabase migration timing.** PocketBase works for now but has no batch insert, limited querying, and known `getFullList` bugs. When do we hit the wall? Likely at 50+ concurrent users. Plan the migration for Month 3 but monitor load earlier.

2. **Google AI Overviews scraping legality.** Playwright scraping of Google SERP features is a gray area. Consider using the Google Search API (Custom Search JSON API) if volume justifies the cost ($5 per 1,000 queries).

3. **Pricing validation.** The $499 one-time audit is an assumption. Need to validate with 5-10 prospect conversations before committing to public pricing. The free audit funnel will generate conversion data.

4. **India-first or global?** Query gen v2 is India-scoped (hardcoded geo). When do we parameterize for global markets? Likely Month 2-3, driven by customer demand.

5. **Shopify app vs URL scraping.** Building a proper Shopify app (OAuth, admin API) is 4-6 weeks of work. URL scraping with Playwright is 1 week. Start with scraping, build the app when enough Shopify brands are paying customers.

---

*This roadmap is a living document. Review and update at the end of each phase. Priorities may shift based on customer feedback, competitive moves, and resource availability.*
