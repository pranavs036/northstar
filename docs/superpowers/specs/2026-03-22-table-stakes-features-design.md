# Table Stakes Features — Brand Profile, Daily Monitoring, Trends, SoV, Engine Breakdown, Prompt-Scan Link

**Date:** 2026-03-22
**Status:** Approved
**Scope:** Build 6 table-stakes features that every AI visibility competitor has.

---

## Important Notes

### Tier Names
The current codebase uses tiers: `awareness | category | intent | competitor | thought_leadership`. The query-generation-v2 spec proposes new tiers: `hero_sku | category_geo | need_problem | trust_compare | market_trend`. **This spec uses the CURRENT tier names.** Tier renaming happens when query-gen-v2 is implemented separately. All chart components, APIs, and trend logic in this spec must work with the current tier names.

### Existing Components
The codebase already has chart components that should be **reused and enhanced**, not duplicated:
- `src/components/charts/ShareOfVoiceChart.tsx` — existing SoV chart (used on trends page)
- `src/components/charts/EngineComparisonChart.tsx` — existing engine comparison chart
- `src/components/charts/VisibilityTrendChart.tsx` — existing trend chart (audit-based)
- `src/components/charts/SentimentChart.tsx` — existing sentiment chart

The trends page (`/trends`) already renders these charts with audit-based data. This spec enhances them to also use `brand_scans` historical data.

### Data Sources
- **SKU Audit data:** Stored in `scan_results` collection (per-query, per-engine records)
- **Brand Scan data:** Stored in `brand_scans` collection (results as inline JSON blob)
- SoV and engine breakdown should work with BOTH data sources, preferring brand_scans when available.

---

## Feature 1: Brand Profile Tab

### What
New `/brand-profile` page in the sidebar between "Competitors" and "Audits". Lets users edit brand config and re-run visibility scans without touching PocketBase admin.

### UI Layout

```
┌─────────────────────────────────────────────────────┐
│  Brand Profile                                       │
├─────────────────────────────────────────────────────┤
│                                                       │
│  ┌── Brand Identity ──────────────────────────────┐  │
│  │  Brand Name:     [ GiveEasy           ]        │  │
│  │  Domain URL:     [ https://giveasy.in ]        │  │
│  │  Description:    [ Pre-owned marketplace... ]  │  │
│  │                                [Save Changes]  │  │
│  └────────────────────────────────────────────────┘  │
│                                                       │
│  ┌── Brand Positioning ───────────────────────────┐  │
│  │  Industry:       [ Refurbished / Pre-owned  ▼] │  │
│  │  Target Geo:     [ India                    ▼] │  │
│  │  Categories:     [ Electronics ] [ Furniture ] │  │
│  │                  [ Kitchen ] [+ Add]           │  │
│  └────────────────────────────────────────────────┘  │
│                                                       │
│  ┌── Scan Configuration ─────────────────────────┐  │
│  │  Engines:  ☑ ChatGPT  ☑ Perplexity  ☑ Gemini │  │
│  │            ☑ Google   ☑ Copilot               │  │
│  │  Frequency: [ Weekly ▼ ]                       │  │
│  └────────────────────────────────────────────────┘  │
│                                                       │
│  ┌── Quick Actions ──────────────────────────────┐  │
│  │  [▶ Run Brand Scan]    [▶ Run SKU Audit]      │  │
│  │  Last scan: 2026-03-22, Score: 45/100         │  │
│  └────────────────────────────────────────────────┘  │
│                                                       │
└─────────────────────────────────────────────────────┘
```

### Data Model Changes

Add to `users` PocketBase collection:

| Field | Type | Default |
|---|---|---|
| `industry` | Plain text | "" |
| `targetGeo` | Plain text | "India" |
| `enabledEngines` | Plain text (JSON) | `'["CHATGPT","PERPLEXITY","GEMINI","GOOGLE","COPILOT"]'` |

`categories` already derivable from SKUs. No new collection needed.

### API

**PATCH `/api/brand/profile`** — Update brand profile fields on user record.

```typescript
// Request
{ brandName?: string, domain?: string, description?: string, industry?: string, targetGeo?: string, enabledEngines?: string[] }

// Response
{ success: true, updated: { ...fields } }
```

### Files

- New: `src/app/(dashboard)/brand-profile/page.tsx`
- New: `src/app/api/brand/profile/route.ts`
- Edit: `src/components/dashboard/Sidebar.tsx` — add nav item
- Edit: PocketBase `users` collection — add 3 fields

---

## Feature 2: Daily Automated Monitoring

### What
Make the existing `scan_schedules` system actually work. Run brand scans on a cron (daily or weekly), store each result, and build history for trend charts.

### Current State
- `scan_schedules` collection exists with `frequency` (daily/weekly/off) and `active` fields
- `/api/audit/schedule` route exists but the Vercel Cron trigger is incomplete
- No historical brand scan data — each new scan overwrites the previous

### Design

**Required refactor:** Extract the brand scan pipeline from the SSE handler at `/api/brand-scan/start/route.ts` into a shared function. Currently the entire scan logic (query gen → engine scanning → scoring → DB writes) lives inside the SSE callback closure. Extract to:

```typescript
// New file: src/lib/scanners/brand-scan-pipeline.ts
export async function runBrandScanPipeline(params: {
  pb: PocketBase;
  userId: string;
  brandName: string;
  brandDomain: string;
  brandDescription: string;
  categories: string[];
  onProgress?: (event: string, data: Record<string, unknown>) => void;
}): Promise<{ scanId: string; visibilityScore: number }>
```

The SSE route calls this with an `onProgress` callback that sends SSE events. The cron calls it without `onProgress` (silent background run).

**Cron approach:** Extend the existing `GET /api/audit/schedule` handler (which already has CRON_SECRET auth and schedule filtering) to also trigger brand scans. Add a second cron entry in `vercel.json` specifically for brand scans, or run both from the same handler.

**New endpoint:** `GET /api/brand-scan/history`

```typescript
// Query params: ?period=30d|90d|all (default: all)
// Response
{
  scans: [
    { id, visibilityScore, tierScores, completedAt, totalQueries, brandVisibleCount },
    ...
  ]
}
```

Uses `pb.collection("brand_scans").getList(1, 100, { filter, sort: "-created" })` (NOT `getFullList` with `limit` — that's a pre-existing bug where PocketBase ignores the limit param on `getFullList`).

**Concurrency:** Process max 5 users per cron invocation. If more users have active schedules, process in batches across multiple cron runs (track last-processed via timestamp).

### Files

- New: `src/lib/scanners/brand-scan-pipeline.ts` — extracted pipeline
- New: `src/app/api/brand-scan/history/route.ts`
- Edit: `src/app/api/brand-scan/start/route.ts` — use extracted pipeline
- Edit: `src/app/api/audit/schedule/route.ts` — add brand scan cron trigger
- Edit: `vercel.json` — add/update cron config

---

## Feature 3: Visibility Trend Charts

### What
Plot visibility score over time on the existing `/trends` page. The page already renders `VisibilityTrendChart`, `ShareOfVoiceChart`, and `SentimentChart` with audit-based data. This feature enhances those charts to also use `brand_scans` historical data as the primary source, with audit data as fallback.

### UI Layout

```
┌─────────────────────────────────────────────────────┐
│  Visibility Trends                                   │
├─────────────────────────────────────────────────────┤
│                                                       │
│  ┌── Overall Score ──────────────────────────────┐  │
│  │  Line chart: X = date, Y = visibility score   │  │
│  │  Shows last 30 days / 90 days / all time      │  │
│  │  [30d] [90d] [All]                            │  │
│  └───────────────────────────────────────────────┘  │
│                                                       │
│  ┌── Per-Tier Breakdown ─────────────────────────┐  │
│  │  Multi-line chart: one line per tier           │  │
│  │  hero_sku (blue), category_geo (green),       │  │
│  │  need_problem (orange), trust_compare (purple),│  │
│  │  market_trend (gray)                           │  │
│  └───────────────────────────────────────────────┘  │
│                                                       │
│  ┌── Score Changes ──────────────────────────────┐  │
│  │  Table: Date | Score | Change | Direction     │  │
│  │  2026-03-22 | 45  | +5   | ↑                 │  │
│  │  2026-03-15 | 40  | -2   | ↓                 │  │
│  │  2026-03-08 | 42  | +12  | ↑                 │  │
│  └───────────────────────────────────────────────┘  │
│                                                       │
└─────────────────────────────────────────────────────┘
```

### Data Source
Reads from `/api/brand-scan/history` (Feature 2). Each brand_scan record has `visibilityScore`, `tierScores`, `completedAt`.

### Charts
Use Recharts (already in the project). Components:
- `VisibilityTrendChart` — line chart for overall score
- `TierTrendChart` — multi-line for per-tier scores
- `ScoreChangeTable` — tabular delta view

### Files

- Rewrite: `src/app/(dashboard)/trends/page.tsx`
- New: `src/components/charts/VisibilityTrendChart.tsx`
- New: `src/components/charts/TierTrendChart.tsx`

---

## Feature 4: Share of Voice (SoV)

### What
Calculate what percentage of AI mentions your brand gets vs competitors. Every competitor platform has this.

### Formula

Uses the existing `calculateShareOfVoice` utility at `src/lib/utils/share-of-voice.ts`:

```
SoV = brand_mentions / (brand_mentions + all_competitor_mentions) * 100
```

This is a mentions-based formula (not total-scans-based). If brand is mentioned 3 times and competitors total 7 times, brand SoV = 30%.

### Data Sources (both supported)

1. **From `scan_results`** (SKU audits): `brandVisible` and `competitorDomain` fields
2. **From `brand_scans`** (brand scans): Parse `results` JSON blob, count `brandVisible: true` entries and `competitorMentioned` entries

The API accepts a `source` param to choose. Default: `brand_scans` if available, fallback to `scan_results`.

### Where it shows

1. **Dashboard** — enhance existing `ShareOfVoiceChart` (already at `src/components/charts/ShareOfVoiceChart.tsx`)
2. **Trends** — SoV over time (when historical data exists)

**New endpoint:** `GET /api/analytics/share-of-voice`

```typescript
// Query params: ?source=brand_scans|scan_results&period=latest|30d|90d
// Response
{
  brandName: "GiveEasy",
  brandSoV: 15.5,
  competitors: [
    { name: "OLX", domain: "olx.in", soV: 42.3 },
    { name: "Cashify", domain: "cashify.com", soV: 28.1 },
    { name: "Quikr", domain: "quikr.com", soV: 14.1 }
  ],
  totalMentions: 60,
  period: "latest"
}
```

### Files

- New: `src/app/api/analytics/share-of-voice/route.ts`
- Edit: `src/components/charts/ShareOfVoiceChart.tsx` — enhance to accept API data
- Edit: `src/app/(dashboard)/dashboard/page.tsx` — add SoV widget

---

## Feature 5: Per-Engine Breakdown

### What
Visual comparison of visibility across engines. "You're visible on Perplexity but invisible on ChatGPT."

### UI

Bar chart or radar chart showing visibility % per engine:

```
Engine Visibility Breakdown
┌──────────────────────────────────────┐
│  ChatGPT    ████████░░░░  67%       │
│  Perplexity ██████░░░░░░  50%       │
│  Google     ████░░░░░░░░  33%       │
│  Gemini     ██░░░░░░░░░░  17%       │
│  Copilot    ░░░░░░░░░░░░   0%       │
└──────────────────────────────────────┘
```

### Data Source

Already in `scan_results` — group by `engine`, count `brandVisible == true` / total per engine.

**New endpoint:** `GET /api/analytics/engine-breakdown`

```typescript
// Response
{
  engines: [
    { engine: "CHATGPT", visible: 4, total: 6, percentage: 67 },
    { engine: "PERPLEXITY", visible: 3, total: 6, percentage: 50 },
    ...
  ],
  auditId?: string  // optional — if scoped to specific audit
}
```

### Placement

1. **Audit results page** (`/audit/[auditId]`) — per-audit engine comparison
2. **Dashboard** — latest scan engine breakdown

### Files

- New: `src/app/api/analytics/engine-breakdown/route.ts`
- Edit: `src/components/charts/EngineComparisonChart.tsx` — enhance existing component (NOT create new one) to accept API data and support both audit and brand scan sources
- Edit: `src/app/(dashboard)/dashboard/page.tsx` — add engine widget
- Edit: `src/app/(dashboard)/audit/[auditId]/page.tsx` — add engine chart

---

## Feature 6: Connect Prompts to Scans

### What
Let users link their prompt library to brand scans. Currently prompts are managed separately and never used in scans.

### Design

When running a brand scan, optionally include queries from the user's prompt library alongside the auto-generated queries.

**Flow:**
1. User creates prompts in `/prompts` (already works)
2. On brand scan start, fetch user's prompts from `prompts` collection
3. Add them as a 6th tier: `custom` (in addition to the 5 auto-generated tiers)
4. Scan results tagged with `tier: "custom"` so they're distinguishable
5. Custom queries don't count toward the weighted visibility score — they're supplementary

**Changes to brand scan pipeline:**
- After generating 20 auto queries, append user's prompts (up to 10 max)
- Tag with `tier: "custom"`, `intent: "User-defined prompt"`
- Include in results but not in tier score calculation

### Files

- Edit: `src/app/api/brand-scan/start/route.ts` — fetch and append prompts
- Edit: `src/types/brand-scan.ts` — add `"custom"` to tier union type

---

## Implementation Parallelism

These features are largely independent and can be built in parallel:

```
                    ┌─ Feature 1: Brand Profile Tab (UI + API)
                    │
                    ├─ Feature 2: Daily Cron + History API
Parallel Work ──────┤
                    ├─ Feature 4: Share of Voice API + Chart
                    │
                    └─ Feature 5: Engine Breakdown API + Chart

Sequential ─────────┬─ Feature 3: Trends Page (depends on Feature 2 history API)
                    └─ Feature 6: Prompt-Scan Link (depends on brand scan pipeline understanding)
```

**4 streams can run in parallel. Features 3 and 6 are sequential dependencies.**

---

## PocketBase Schema Changes Summary

### `users` collection — add fields:

| Field | Type | Default |
|---|---|---|
| `industry` | Plain text | "" |
| `targetGeo` | Plain text | "India" |
| `enabledEngines` | Plain text | `'["CHATGPT","PERPLEXITY","GEMINI","GOOGLE","COPILOT"]'` |

### No new collections needed.

Existing collections used:
- `brand_scans` — historical scan data (already stores per-scan)
- `scan_results` — per-query results (SoV + engine breakdown source)
- `prompts` — user's prompt library (Feature 6)
- `scan_schedules` — cron config (Feature 2)
- `competitors` — SoV competitor list (Feature 4)

---

## New API Endpoints Summary

| Endpoint | Method | Feature |
|---|---|---|
| `/api/brand/profile` | PATCH | Brand Profile |
| `/api/brand-scan/history` | GET | Historical scans |
| `/api/cron/brand-scan` | GET | Daily cron trigger |
| `/api/analytics/share-of-voice` | GET | Share of Voice |
| `/api/analytics/engine-breakdown` | GET | Engine comparison |

---

## Frontend Files Summary

| File | Action | Feature |
|---|---|---|
| `src/app/(dashboard)/brand-profile/page.tsx` | NEW | Brand Profile page |
| `src/app/(dashboard)/trends/page.tsx` | ENHANCE | Trends page — add brand_scans data source |
| `src/components/charts/VisibilityTrendChart.tsx` | ENHANCE | Add brand_scans history support |
| `src/components/charts/TierTrendChart.tsx` | NEW | Per-tier trend chart |
| `src/components/charts/ShareOfVoiceChart.tsx` | ENHANCE | Accept API data, improve UI |
| `src/components/charts/EngineComparisonChart.tsx` | ENHANCE | Accept API data, support both sources |
| `src/components/dashboard/Sidebar.tsx` | EDIT | Add Brand Profile nav item |
| `src/lib/scanners/brand-scan-pipeline.ts` | NEW | Extracted brand scan pipeline |

---

## Success Criteria

1. User can change brand URL on `/brand-profile` and re-run brand scan from the same page
2. Daily cron runs brand scans for users with active schedules
3. `/trends` shows visibility score plotted over time with at least 2 data points
4. Dashboard shows Share of Voice donut chart with brand vs competitors
5. Dashboard/audit page shows per-engine visibility bar chart
6. User's prompt library queries are included in brand scans as supplementary queries
