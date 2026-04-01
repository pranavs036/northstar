# NorthStar Landing Page Design

**Date:** 2026-03-23
**Status:** Draft
**Inspiration:** OFF+BRAND (itsoffbrand.com) — warm neutrals, single typeface, generous whitespace, signature animation, pill CTAs, kinetic typography

---

## Design Language

### Color Palette

```css
:root {
  /* Backgrounds */
  --ns-cream: #E5E4E0;              /* primary bg — warm, not sterile */
  --ns-cream-alt: #F1F0EC;          /* alternate light bg */
  --ns-dark: #1A1A2E;               /* dark sections — blue-tinted charcoal, tech feel */
  --ns-dark-alt: #222236;           /* dark section alt */

  /* Accents */
  --ns-blue: #4F7DF3;               /* primary accent — trust, tech */
  --ns-green: #34D399;              /* cited/recommended = green */
  --ns-red: #F06B6B;                /* not cited/gap = red */
  --ns-amber: #FBBF24;             /* warning/medium severity */

  /* The signature gradient (scanner/radar feel) */
  --ns-gradient: linear-gradient(135deg, #4F7DF3, #34D399 45%, #FBBF24);

  /* Neutrals */
  --ns-border: rgba(111, 111, 111, 0.15);
  --ns-text-muted: rgba(26, 26, 46, 0.5);
  --ns-pill-radius: 6.25em;
  --ns-card-radius: 0.625em;
}
```

### Typography

Single typeface: **Satoshi** (geometric, clean, similar feel to Ataero Retina).
Single weight: **400** for everything. **700** only for CTAs and nav links.

| Element | Size | Case | Weight |
|---|---|---|---|
| Hero headline | 72-86px | UPPERCASE | 400 |
| Section headings | 48-56px | UPPERCASE | 400 |
| Eyebrow labels | 13px, letter-spacing 5% | UPPERCASE | 400 |
| Body text | 15px, line-height 1.5 | Sentence | 400 |
| CTA buttons | 14px | Sentence | 700 |
| Nav links | 13px | Sentence | 700 |

### Signature Visual Element

Instead of OFF+BRAND's iridescent orb: a **pulsing radar/scanner ring** visualization.

- Concentric circles radiating outward (like a radar sweep)
- Dots on the rings represent brands — YOUR brand (green pulse) vs competitors (muted/red)
- Rendered as CSS animation (not WebGL — lighter, faster)
- Fixed position on scroll through the first 2-3 sections, then fades
- Gradient glow uses `--ns-gradient`
- Dashed orbit rings (same `1px dashed` treatment as OFF+BRAND's orb outline)

### Buttons

All pill-shaped, ghost style (same as OFF+BRAND):
- Background: matches page bg
- Border: `1px solid var(--ns-border)`
- Border-radius: `var(--ns-pill-radius)`
- Arrow icon (→) accompanies all CTAs
- On hover: subtle fill with `--ns-blue` at 10% opacity

Primary CTA (dark sections): inverted — light bg on dark.

### Micro-interactions

- **Character-level text animation** on hero headline — letters scatter and reassemble on load
- **Custom cursor** with `mix-blend-mode: difference` (same as OFF+BRAND)
- **Scroll progress indicator** — dot on left edge
- **Section transitions** — cream ↔ dark background swaps as user scrolls

---

## Page Flow

### Section 1: Hero (Full Viewport)

**Background:** `--ns-cream`

```
┌─────────────────────────────────────────────────────────────┐
│                                                               │
│  NORTHSTAR              [How It Works]  [Pricing]  [Login →] │
│                                                               │
│                                                               │
│                    PRODUCTS DON'T GET                         │
│                   SEARCHED ANYMORE.                           │
│                  THEY GET RECOMMENDED.                        │
│                                                               │
│                   ◯ ◯ ◯ (radar rings                         │
│                    with brand dots)                            │
│                                                               │
│  We find why AI recommends your             [Run Free Audit →]│
│  competitors — and fix it.                                    │
│                                                               │
│                                              SCROLL ↓        │
└─────────────────────────────────────────────────────────────┘
```

**Copy:**
- Hero: `PRODUCTS DON'T GET SEARCHED ANYMORE. THEY GET RECOMMENDED.`
- Sub: `We find why AI recommends your competitors — and fix it.`
- CTA: `Run Free Audit →` (pill button)

**Animation:** Letters of the hero scatter around the radar rings on load, then reassemble into readable text.

---

### Section 2: The Shift (Dark bg)

**Background:** `--ns-dark`
**Text:** `--ns-cream`

```
┌─────────────────────────────────────────────────────────────┐
│                                                               │
│  ★★★★                                                        │
│                                                               │
│  SEO GOT YOU TO PAGE ONE.                                    │
│  GEO GETS YOU INTO THE ANSWER.                               │
│                                                               │
│  ─────────────────────────────────────────                   │
│                                                               │
│  THE PARADIGM               AI engines don't rank links.     │
│                             They recommend brands. Your       │
│                             schema markup, content depth,     │
│                             review signals, and structured    │
│                             data determine whether you get    │
│                             cited or ignored.                 │
│                                                               │
│                             NorthStar audits your catalog     │
│                             across every major AI engine,     │
│                             diagnoses why competitors get     │
│                             recommended over you, and gives   │
│                             you the exact fix for each gap.   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

**Copy structure:** Big statement left (OFF+BRAND style), supporting paragraph right.

---

### Section 3: How It Works (Cream bg)

**Background:** `--ns-cream`

```
┌─────────────────────────────────────────────────────────────┐
│                                                               │
│  HOW IT WORKS                                     01 / 03    │
│                                                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │              │  │              │  │              │         │
│  │   SCAN       │  │  DIAGNOSE   │  │    FIX       │         │
│  │              │  │              │  │              │         │
│  │  We query    │  │  Claude AI   │  │  Every gap   │         │
│  │  ChatGPT,    │  │  analyzes    │  │  comes with  │         │
│  │  Perplexity, │  │  why your    │  │  a specific  │         │
│  │  Gemini,     │  │  competitor  │  │  actionable  │         │
│  │  Google AI,  │  │  gets cited  │  │  fix. Add    │         │
│  │  and Copilot │  │  over you    │  │  this schema.│         │
│  │  with real   │  │  for each    │  │  Expand this │         │
│  │  customer    │  │  query on    │  │  content.    │         │
│  │  queries.    │  │  each engine.│  │  Done.       │         │
│  │              │  │              │  │              │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

Three cards on the 12-column grid (4 cols each). Same card style as OFF+BRAND's work cards: subtle border-radius, no shadow, thin border.

---

### Section 4: The Diagnosis (Dark bg)

**Background:** `--ns-dark`

**Purpose:** Show what a real diagnosis looks like — this is the product's differentiator.

```
┌─────────────────────────────────────────────────────────────┐
│                                                               │
│  EVERY DIAGNOSIS COMES WITH A SPECIFIC FIX                   │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐   │
│  │  ● CRITICAL                           ChatGPT          │   │
│  │                                                         │   │
│  │  Query: "best wireless headphones under $200"          │   │
│  │                                                         │   │
│  │  Your competitor Bose gets cited because their PDP     │   │
│  │  has FAQ schema, 2,847 reviews with aggregateRating    │   │
│  │  markup, and a 1,200-word product description with     │   │
│  │  comparison tables.                                     │   │
│  │                                                         │   │
│  │  Your PDP has no structured data, 12 reviews           │   │
│  │  (not marked up), and a 90-word description.           │   │
│  │                                                         │   │
│  │  FIX: Add Product JSON-LD with aggregateRating,        │   │
│  │  expand description to 500+ words with specs table,    │   │
│  │  add FAQ section with 5 common questions.              │   │
│  └───────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌─────────────────┐  ┌─────────────────┐                   │
│  │ ● HIGH           │  │ ● MEDIUM         │                   │
│  │ Perplexity       │  │ Google AI        │                   │
│  │ Missing review   │  │ No brand schema  │                   │
│  │ markup...        │  │ on homepage...   │                   │
│  └─────────────────┘  └─────────────────┘                   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

This is a styled version of the actual `DiagnosisCard` component from the product. Real data, real fixes. The hero card is large, supporting cards are smaller below.

---

### Section 5: The Engines (Cream bg)

**Background:** `--ns-cream`

Interactive visualization — inspired by OFF+BRAND's "solar system" services layout.

```
┌─────────────────────────────────────────────────────────────┐
│                                                               │
│  WE SCAN FIVE ENGINES                                        │
│  SO YOU DON'T HAVE TO                                        │
│                                                               │
│              Perplexity                                       │
│                  ◯                                            │
│        Google ◯     ◯ ChatGPT                                │
│                  ◯                                            │
│        Copilot ◯     ◯ Gemini                                │
│                                                               │
│  Each engine has different citation                           │
│  signals. What works on Perplexity                            │
│  may not work on ChatGPT. We test                            │
│  all five and diagnose per engine.                            │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

Engine logos arranged in a circular/orbital pattern around a central radar animation. On hover, each engine shows a tooltip with what it prioritizes (e.g., "ChatGPT: favors review count + structured data").

---

### Section 6: Results / Social Proof (Dark bg)

**Background:** `--ns-dark`

```
┌─────────────────────────────────────────────────────────────┐
│                                                               │
│  FROM UNCITED TO RECOMMENDED                      RESULTS    │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │               │  │               │  │               │      │
│  │  Brand X      │  │  Brand Y      │  │  Brand Z      │      │
│  │  Electronics  │  │  Furniture    │  │  Fashion      │      │
│  │               │  │               │  │               │      │
│  │  8% → 52%     │  │  3% → 41%    │  │  15% → 68%   │      │
│  │  citation     │  │  citation     │  │  citation     │      │
│  │  rate         │  │  rate         │  │  rate         │      │
│  │               │  │               │  │               │      │
│  │  "Added JSON- │  │  "Expanded    │  │  "Fixed FAQ   │      │
│  │  LD schema    │  │  product      │  │  markup and   │      │
│  │  across 200   │  │  descriptions │  │  review       │      │
│  │  SKUs"        │  │  to 600+      │  │  schema"      │      │
│  │               │  │  words each"  │  │               │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

Cards in 2-col staggered grid (OFF+BRAND work cards style). Each card shows the metric change AND the specific action that caused it.

---

### Section 7: Metrics That Matter (Cream bg)

**Background:** `--ns-cream`

```
┌─────────────────────────────────────────────────────────────┐
│                                                               │
│  THE METRICS THAT MATTER FOR GEO                             │
│                                                               │
│  01  Agent-Readiness Score     Your catalog's overall        │
│  ──────────────────────────    readiness for AI engines      │
│                                                               │
│  02  Share of Voice            Your brand's mention rate     │
│  ──────────────────────────    vs competitors in AI answers  │
│                                                               │
│  03  Citation Rate             How often AI links to         │
│  ──────────────────────────    your domain specifically      │
│                                                               │
│  04  Engine Breakdown          Visibility per engine —       │
│  ──────────────────────────    fix the ones you're losing    │
│                                                               │
│  05  Severity Diagnosis        Critical / High / Medium      │
│  ──────────────────────────    gaps with exact fixes         │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

Styled like OFF+BRAND's awards section: numbered rows, horizontal layout, thin separators.

---

### Section 8: Brand Statement (Gradient bg)

**Background:** Full-viewport gradient using `--ns-gradient` (expanded scanner gradient)

```
┌─────────────────────────────────────────────────────────────┐
│                                                               │
│          PRODUCTS DON'T GET SEARCHED ANYMORE.                │
│          THEY GET RECOMMENDED.                               │
│                                                               │
│          MAKE SURE AI RECOMMENDS YOURS.                      │
│                                                               │
│                                      [Run Free Audit →]      │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

Callback to the hero — reinforces the headline. This is the emotional peak before the footer.

---

### Section 9: Footer (Cream bg)

```
┌─────────────────────────────────────────────────────────────┐
│                                                               │
│  READY TO SEE WHAT                   PRODUCT                 │
│  AI THINKS ABOUT                     Dashboard →             │
│  YOUR BRAND?                         Audit →                 │
│                                      Brand Scan →            │
│  [Get Your Audit →]                  Schema Audit →          │
│                                      Pricing →               │
│                                                               │
│                                      CONNECT                 │
│                                      Twitter →               │
│                                      LinkedIn →              │
│                                                               │
│  ─────────────────────────────────────────────────────────   │
│                                                               │
│  © 2026 NorthStar                              NORTHSTAR     │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

Same structure as OFF+BRAND: big CTA left, sitemap + social links right, brand mark bottom-right.

---

## Animation System

### Layer 1: Hero Entrance (on load, first 2 seconds)

**Character scatter → reassemble:**
- Each letter of "PRODUCTS DON'T GET SEARCHED ANYMORE. THEY GET RECOMMENDED." is an individual `<span>`
- On load: letters are randomly positioned around the radar rings, rotated, scaled down to 0.3, opacity 0
- Over 1.5s: letters fly to their final positions with staggered timing (30ms between each character)
- Easing: `cubic-bezier(0.16, 1, 0.3, 1)` — fast start, gentle settle
- The sub-headline and CTA fade in after the main text assembles (0.3s delay)

**Radar rings entrance:**
- 3 concentric dashed circles scale from 0 to 1 with staggered delay (0s, 0.2s, 0.4s)
- Once assembled: continuous slow rotation (ring 1: 60s/revolution, ring 2: 45s reverse, ring 3: 90s)
- Brand dots pulse gently: `scale(1) → scale(1.3) → scale(1)` on a 3s loop, staggered

### Layer 2: Scroll-Triggered Reveals (every section)

**Section headings:**
- Each section heading uses `SplitText` — characters slide up from 20px below with 0 opacity
- Stagger: 15ms per character
- Trigger: when section enters 20% of viewport
- Easing: `spring(1, 80, 10)` (Framer Motion spring — slight overshoot, then settle)

**Body text + cards:**
- Fade up: `translateY(40px), opacity: 0 → translateY(0), opacity: 1`
- Duration: 0.6s
- Stagger between cards/paragraphs: 100ms
- Trigger: viewport intersection at 15%

**Section background transitions:**
- Cream → dark transitions use a `clip-path: inset()` animation — the dark bg slides up like a curtain, revealing from bottom
- Duration: 0.8s, easing: `cubic-bezier(0.65, 0, 0.35, 1)`

### Layer 3: Diagnosis Card Animation (Section 4)

**The showstopper section:**
- The critical diagnosis card starts as a blurred, unreadable block
- As user scrolls into view: blur reduces from `blur(8px)` to `blur(0)` over scroll distance
- Simultaneously: severity dot pulses red, a scan-line sweeps horizontally across the card (CSS gradient animation)
- The "FIX:" section types out character by character (typewriter effect, 20ms/char) after the card is fully revealed
- Supporting cards (HIGH, MEDIUM) slide in from the sides with 200ms stagger

### Layer 4: Engine Orbit (Section 5)

**Interactive orbital animation:**
- 5 engine icons orbit the central radar on slow elliptical paths
- Each engine has a different orbit radius and speed (creates organic movement)
- On hover: hovered engine scales to 1.2x, other engines dim to 40% opacity, tooltip fades in from below
- On hover: a "scan line" shoots from center to the hovered engine (gradient line, 0.3s)
- The central radar pulses subtly on each engine hover

**Orbit speeds:**
```
ChatGPT:    35s/revolution, radius 140px, clockwise
Perplexity: 28s/revolution, radius 120px, counter-clockwise
Gemini:     42s/revolution, radius 160px, clockwise
Google:     50s/revolution, radius 100px, counter-clockwise
Copilot:    38s/revolution, radius 180px, clockwise
```

### Layer 5: Results Counter (Section 6)

**Number count-up:**
- Citation rate numbers animate from 0% to final value (e.g., 0% → 52%)
- Duration: 1.5s, easing: `ease-out`
- Uses `requestAnimationFrame` for smooth interpolation
- The "→" arrow between before/after pulses green as the number climbs
- Trigger: viewport intersection

### Layer 6: Metrics Rows (Section 7)

**Sequential reveal:**
- Each row slides in from the left with stagger: 150ms between rows
- The numbered index (01, 02...) scales up from 0 with a slight bounce
- The separator line draws itself from left to right (`width: 0% → 100%`, 0.4s)
- Like a list being checked off — gives a feeling of thoroughness

### Layer 7: Brand Statement (Section 8)

**Gradient background animation:**
- The gradient slowly shifts hue angles: `135deg → 180deg → 225deg → 135deg` on a 10s loop
- Creates a living, breathing background
- Text is white with subtle `text-shadow: 0 0 80px rgba(79, 125, 243, 0.3)` for glow

**Text reveal:**
- Same character-scatter animation as the hero (callback)
- But this time letters assemble from the EDGES of the viewport inward (more dramatic)
- CTA button fades in last with a gentle scale: `0.9 → 1.0`

### Layer 8: Persistent Elements

**Custom cursor:**
- 20px circle, `rgba(255, 255, 255, 0.6)`, `mix-blend-mode: difference`
- Follows mouse with `transform: translate3d()` (GPU-accelerated)
- On interactive elements (buttons, links, cards): scales to 2x, changes to ring (border only)
- On dark sections: automatically inverts via blend mode
- Transition: `scale 0.25s cubic-bezier(0.16, 1, 0.3, 1)`

**Scroll progress:**
- Thin vertical line on left edge (2px wide, `--ns-border` color)
- Active dot (8px circle, `--ns-blue`) slides along the line tracking scroll position
- "SCROLL ↓" text at bottom-right of hero, fades out after 10% scroll

**Radar persistence:**
- The radar animation from the hero stays `position: fixed` through sections 1-3
- At section 4 (diagnosis): radar fades out with `opacity: 1 → 0` over 200px of scroll
- Reappears briefly in section 5 (engines) as the orbital center

### Performance Rules

- All animations use `transform` and `opacity` only (composited, no layout thrash)
- `will-change: transform, opacity` on animated elements
- Intersection Observer for scroll triggers (not scroll event listeners)
- `prefers-reduced-motion: reduce` — disable character scatter, replace with simple fade-in
- Animations below fold are lazy-initialized (no work until section approaches viewport)
- Target: 60fps on mid-range devices, graceful degradation on low-end

---

## Implementation Notes

### Tech Stack
- **Next.js** static page at `/` (already exists, needs full rewrite)
- **Framer Motion** for character-level text animations and scroll-triggered reveals
- **CSS animations** for radar/scanner rings (no WebGL needed)
- **Satoshi font** from Google Fonts or Fontshare
- **No component library** for the landing page — custom CSS following the design tokens

### Key Components to Build
1. `LandingHero` — hero with animated headline + radar viz
2. `LandingSection` — reusable section wrapper (handles cream/dark bg swap)
3. `DiagnosisShowcase` — styled diagnosis card for the landing page
4. `EngineOrbit` — interactive engine visualization
5. `ResultCard` — before/after case study card
6. `MetricsRow` — numbered metrics list (awards-style)
7. `LandingFooter` — CTA + sitemap footer
8. `RadarAnimation` — CSS-based radar/scanner rings with brand dots
9. `SplitText` — character-level text animation wrapper

### Animation Library
Framer Motion for:
- `SplitText` character animations (stagger reveal)
- Scroll-triggered section reveals
- Radar ring pulse animations
- Custom cursor (or pure CSS with `mix-blend-mode`)

### Performance
- Static generation (no server-side data fetching on landing page)
- Lazy-load animations below the fold
- Preload Satoshi font
- No WebGL — CSS animations only for the radar (lighter than OFF+BRAND's approach)

---

## Success Criteria

1. The page FEELS like OFF+BRAND — warm, premium, unhurried, generous whitespace
2. Hero communicates the value prop in one line without being hyperbolic
3. The diagnosis section makes visitors think "I need to see what my gaps are"
4. Every CTA leads to the free audit flow (signup → catalog upload → scan)
5. Page loads in under 2 seconds (no heavy WebGL)
6. Mobile responsive — single column, same typography scale principles
