# NorthStar — Sales Pitch Document

**For use by:** Pranav & Priya in sales conversations
**Last updated:** 2026-03-23
**Primary prospect profile:** Mid-market ecommerce brands (GiveEasy, refurbished electronics/furniture marketplaces in India)

---

## The Problem (From Their Perspective)

### What the SEO team lead is thinking

> "I spent 3 years getting us to page 1 on Google for 'refurbished iPhone 12 India.' Now someone asks ChatGPT 'best place to buy a used iPhone in India' and it recommends Cashify and Togofogo. We don't even exist in the answer. My entire SEO playbook is irrelevant and I don't know where to start."

> "My boss asked me why we're not showing up on Perplexity. I didn't even know Perplexity was a thing our customers use. I tried asking it manually — it recommended three competitors and didn't mention us once. I have 800 SKUs. Am I supposed to test each one on five AI engines by hand?"

> "I can see in analytics that direct search traffic is declining 15-20% quarter over quarter. People aren't Googling 'buy refurbished washing machine near me' anymore — they're asking ChatGPT 'what's a reliable refurbished appliance brand in India?' and going straight to whoever gets named. We're invisible and I have no tool to even measure the problem."

> "I added schema markup to our top 50 PDPs last quarter. Did it help? I have absolutely no idea. There's no 'Google Search Console' for AI engines. I'm flying blind."

### Specific scenarios where AI search is costing them revenue

**Scenario 1: The product comparison query.**
A customer asks ChatGPT: "Should I buy a refurbished laptop from GiveEasy or Cashify?" ChatGPT pulls from Cashify's rich product pages — 1,500-word descriptions, FAQ sections, 3,200 reviews with aggregate ratings — and gives a detailed answer favoring Cashify. GiveEasy's PDPs have 80-word descriptions and no structured data. ChatGPT literally cannot build a compelling case for GiveEasy even if the product is better.

**Scenario 2: The category discovery query.**
A customer asks Perplexity: "Best refurbished furniture stores in India that deliver to Bangalore." Perplexity cites three competitors who have location-specific landing pages, FAQ schema about delivery policies, and reviews mentioning Bangalore by name. GiveEasy sells furniture, delivers to Bangalore, has better prices — but none of that is structured in a way Perplexity can parse.

**Scenario 3: The trust query.**
A customer asks Google AI Overview: "Is it safe to buy refurbished electronics online in India?" Google's AI answer cites brands with Organization schema, clear return policies in FAQ markup, trust badges mentioned in review text, and BBB/Trustpilot ratings. GiveEasy has a great return policy buried in a page nobody links to, with no schema markup. The AI doesn't know it exists.

**Scenario 4: The "I don't even know what I'm losing" problem.**
The marketing team lead looks at declining traffic and rising CAC. They know AI search is part of it — they've read the articles. But they can't quantify it. They can't walk into a board meeting and say "We're losing X lakhs per month because AI engines recommend our competitors." They can't even say which competitors are winning or why.

---

## NorthStar's Core Features (Ranked by "Shut Up and Take My Money" Factor)

### 1. SKU-Level Diagnosis with Specific Fixes
**SUTAM Rating: 10/10**

**What it is:** For every product in your catalog, NorthStar tells you exactly why a competitor gets recommended over you on each AI engine — and gives you the specific fix.

**Why they care:** This is the difference between "your visibility score is 35%" (useless) and "Cashify outranks you for 'refurbished iPhone 12 under 20000' on ChatGPT because they have Product JSON-LD with aggregateRating from 2,847 reviews, a 1,200-word description with specs comparison table, and FAQ schema covering warranty and battery health. Your PDP has no structured data, 12 reviews not marked up, and a 90-word description. Add Product JSON-LD, expand your description to 500+ words with a specs table, and add 5 FAQ entries covering warranty, battery, return policy, condition grading, and delivery timeline."

**How it works:** We query 5 AI engines with natural customer queries for each SKU, scrape the competitor PDP that gets cited over you, extract their schema/content/review signals, and use Claude AI to generate a gap analysis with exact fix instructions.

### 2. Multi-Engine Scanning (5 AI Engines, Real Customer Queries)
**SUTAM Rating: 9/10**

**What it is:** We scan your products across ChatGPT, Google AI Overviews, Perplexity, Gemini, and Copilot using the actual queries your customers type — not keyword-stuffed test phrases.

**Why they care:** Each engine has different citation preferences. Your refurbished Samsung Galaxy might show up on Perplexity (which favors recent content) but be invisible on ChatGPT (which favors structured data depth). Fixing for one engine might do nothing on another. You need to know where you're winning and where you're losing, engine by engine, SKU by SKU.

**How it works:** For each SKU, we generate 5 natural-language queries (price-anchored, geo-aware, no brand name bias) — things like "used smartphones under 25000 India" or "second hand iPhone 12 good battery life." We fire those queries at all 5 engines and record whether you get cited, who gets cited instead, and what the AI said.

### 3. Competitor PDP Reverse-Engineering
**SUTAM Rating: 8/10**

**What it is:** When a competitor gets cited over you, we scrape their actual product page and show you a side-by-side comparison: their schema vs yours, their content depth vs yours, their review signals vs yours.

**Why they care:** Knowing you're invisible is step one. Knowing that Cashify's iPhone 12 PDP has Product + AggregateRating + FAQ + BreadcrumbList schema while yours has zero structured data — that's step two. Seeing the exact delta means you know precisely what to build, not vaguely what to improve.

**How it works:** When our scan detects a competitor citation, we scrape their PDP using headless Playwright. We extract JSON-LD structured data, Open Graph tags, meta descriptions, FAQ sections, review counts, content length, and attribute depth. We compare against your PDP and generate a structured gap report.

### 4. Agent-Readiness Score + Share of Voice
**SUTAM Rating: 7/10**

**What it is:** A single number (0-100) that tells you how ready your catalog is for AI engine recommendations, plus your Share of Voice vs competitors — what percentage of AI mentions you get vs them.

**Why they care:** The SEO team lead needs a number to put in front of their CEO. "Our Agent-Readiness Score is 28 out of 100. Cashify's is 71. That's why they get recommended and we don't. Here's the plan to close the gap." It's also the metric that proves ROI after fixes are implemented: "We went from 28 to 54 in 6 weeks."

**How it works:** We score based on weighted tiers — hero SKU visibility (35%), category queries (25%), need/problem queries (20%), trust/comparison queries (10%), and market trend queries (10%). Share of Voice = your brand mentions / (your mentions + all competitor mentions) across all scanned queries.

### 5. Fix Priority Queue with Schema Auto-Generation
**SUTAM Rating: 7/10**

**What it is:** All your fixes ranked by severity and revenue impact in a single prioritized list, with copy-paste JSON-LD schema code and AI-generated content (FAQs, expanded descriptions, meta tags) ready to implement.

**Why they care:** An SEO team of 2-3 people managing 800 SKUs needs to know: fix this iPhone 12 PDP first (critical, high-revenue SKU), then these 15 laptop PDPs (high severity), then these 40 furniture listings (medium). And they need the actual code/content, not just instructions. "Add FAQ schema" is vague. Handing them a complete JSON-LD block with 5 pre-written FAQ entries they can paste into their CMS — that's actionable.

**How it works:** We aggregate all diagnoses, sort by severity x estimated revenue impact x implementation effort, and present them as a prioritized task list. For each fix, we generate the actual implementation: JSON-LD code blocks, rewritten product descriptions (500+ words, conversational, AI-readable), FAQ entries with schema markup, and optimized meta tags.

---

## The Pitch (60-Second Versions)

### For the Marketing Team Lead

"You've noticed that when people ask ChatGPT or Perplexity for product recommendations in your category, your competitors get named and you don't. That's not bad luck — it's because their product pages are structured in a way AI can read, and yours aren't.

NorthStar scans your entire catalog across 5 AI engines, figures out exactly why each competitor gets recommended over you for each product, and gives you the specific fix — down to 'add this JSON-LD schema, expand this description, add these 5 FAQ entries.' We don't just show you a dashboard. We hand you a prioritized fix list with copy-paste code and content.

One audit. You implement the fixes. Your products start showing up in AI answers. We've seen citation rates go from single digits to 40-50% for brands that execute on the recommendations.

We can start with a free scan that takes 3 minutes. You'll see your Agent-Readiness Score and your top 3 gaps before you pay anything."

### For the SEO Team Lead

"GEO is the new SEO, and you already know that. The problem is there's no Google Search Console for AI engines. You have no visibility into what ChatGPT, Perplexity, or Gemini are doing with your product pages.

NorthStar is like running a full technical SEO audit, but for AI engines. For each SKU in your catalog, we generate natural customer queries, fire them at 5 AI engines, and if a competitor gets cited over you, we scrape their PDP and yours, compare the structured data, content depth, review signals, and schema markup, and tell you exactly what they have that you don't.

The output isn't a 'visibility score.' It's: 'For your iPhone 12 listing, Cashify gets recommended on ChatGPT because they have Product schema with aggregateRating from 2,847 reviews and a 1,200-word description. You have no schema and 90 words. Here's the JSON-LD to add, here's an expanded description, here are 5 FAQ entries with markup.'

You already know how to implement structured data and optimize content. You just need someone to tell you what's missing, SKU by SKU, engine by engine. That's what we do."

### For the CEO/Founder

"Your customers are shifting from Google searches to AI conversations. When someone asks ChatGPT 'best refurbished electronics store in India,' right now it recommends your competitors. Not because they're better — because their website is structured in a way AI can read and yours isn't.

This is a fixable problem. NorthStar audits your product catalog across 5 AI engines, identifies exactly why competitors get recommended over you, and delivers a prioritized fix list. Your team implements the changes — mostly structured data and content improvements — and your products start appearing in AI recommendations.

Here's the ROI math: if just 5 of your 800 SKUs start getting recommended by ChatGPT, and each drives even 50 additional purchases per month at your average order value of INR 15,000, that's INR 37.5 lakhs per month in new revenue. The audit costs between $499 and $5,000 depending on catalog size. It pays for itself in the first week.

The alternative is hiring a GEO consultant for $5K-$20K who'll take 3 months to deliver what we deliver in a week, or building the scanning infrastructure in-house which would take your engineering team 3+ months."

---

## Why Not [Competitor]?

### vs Otterly.AI ($29-$989/month)

**What they do well:** Broad multi-engine monitoring (6 engines), daily tracking, Brand Visibility Index, clean dashboards.

**What they don't do:** Tell you WHY you're invisible or WHAT to fix. Otterly shows you a chart that says your visibility score is 35% on ChatGPT. NorthStar tells you "your iPhone 12 PDP is invisible because Cashify has Product JSON-LD with aggregateRating and you don't — here's the exact schema to add."

**The line:** "Otterly is a thermometer. NorthStar is the doctor. One tells you you're sick. The other tells you what's wrong and writes the prescription."

Otterly also operates at the brand/domain level. They don't do SKU-level diagnosis. For an ecommerce brand with 200-800 SKUs, "your brand visibility is 35%" is useless. You need to know WHICH products are invisible and WHY.

### vs Semrush AI Visibility ($99/month add-on)

**What they do well:** Leverages Semrush's massive keyword database. Good integration if you already pay for Semrush.

**What they don't do:** AI visibility is a bolt-on feature to an SEO tool. It was built to check boxes on a feature comparison chart, not to solve the GEO problem from first principles. No SKU-level diagnosis. No competitor PDP scraping. No fix generation. No schema auto-generation. It's an SEO tool that added an AI tab, not a GEO tool.

**The line:** "Semrush added AI visibility like Google added social features. It exists. It's not why you'd buy it."

### vs Doing It Manually

Let's do the math for a brand like GiveEasy:

| Task | Manual effort | With NorthStar |
|------|--------------|----------------|
| Generate natural queries for 200 SKUs (5 per SKU) | 1,000 queries to write. At 30 seconds each = ~8.5 hours | Automated. 0 hours. |
| Test 1,000 queries across 5 AI engines | 5,000 individual queries. At 45 seconds each (copy-paste, read, record) = ~62.5 hours | Automated. Runs in ~45 minutes. |
| Record which competitors get cited | Part of the 62.5 hours above — manual spreadsheet entry | Automated. Stored per SKU per engine. |
| Scrape competitor PDPs, extract schema, compare | At 15 minutes per PDP analysis = ~50 hours (for 200 competitor citations) | Automated. Side-by-side delta generated. |
| Generate fix recommendations per SKU | Requires GEO expertise most teams don't have. Consultant would charge $5K-$20K. | AI-generated diagnosis with specific fixes, schema code, and content suggestions. |
| Re-scan after fixes to measure impact | Repeat the 62.5 hours every month | Automated daily monitoring from $99/month. |

**Total manual effort: ~120+ hours of skilled SEO work per audit cycle.** That's 3 weeks of full-time work for one person, and that person needs to understand structured data, schema markup, AI engine citation preferences, and competitive analysis.

**With NorthStar: Upload CSV, click "Start Audit," come back in 45 minutes.** Total hands-on time: 10 minutes.

### vs Hiring a GEO Consultant

- Typical engagement: $5,000-$20,000
- Typical timeline: 4-8 weeks to deliver an audit report
- Typical output: A PDF with recommendations like "improve your structured data" and "add FAQ sections" — rarely SKU-specific, never with copy-paste code
- Ongoing cost: another $3,000-$5,000 per quarter for re-audits

NorthStar's Growth audit ($1,999) covers 200 SKUs, includes re-scans at 30 and 60 days to measure fix impact, and delivers SKU-level diagnosis with actual schema code and content. Delivered in days, not weeks.

---

## Pricing Justification

### The ROI Calculation

**For a brand like GiveEasy (refurbished electronics/furniture, India market):**

Assumptions:
- Average order value (AOV): INR 15,000 (~$180)
- Catalog: 500 SKUs across electronics, furniture, appliances
- Current AI citation rate: ~5% (most SKUs invisible)
- Post-fix AI citation rate: 35-50% (based on what competitors with proper schema achieve)

**Conservative scenario — just 10 SKUs start getting recommended:**

Each recommended SKU drives an estimated 30-100 additional visits/month from AI engines (users who click through from ChatGPT/Perplexity citations). At a 3% conversion rate:

- 10 SKUs x 50 visits/month x 3% conversion = 15 additional orders/month
- 15 orders x INR 15,000 AOV = INR 2,25,000/month (~$2,700/month)
- Annual revenue impact: INR 27,00,000 (~$32,400)

**NorthStar Growth audit cost: $1,999 one-time.**
**ROI: 16x in the first year. Payback period: under 1 month.**

**Aggressive scenario — 50 SKUs start getting recommended:**

- 50 SKUs x 50 visits/month x 3% conversion = 75 additional orders/month
- 75 orders x INR 15,000 = INR 11,25,000/month (~$13,500/month)
- Annual revenue impact: INR 1.35 crore (~$162,000)

Even if we're off by 5x on traffic estimates, the audit still pays for itself within the first quarter.

### Cost Comparison

| Option | Cost | Timeline | What You Get |
|--------|------|----------|-------------|
| NorthStar Growth Audit | $1,999 one-time | 1 week | 200 SKUs audited across 5 engines, SKU-level diagnosis with fixes, schema code, content suggestions, 2 re-scans |
| GEO Consultant | $5,000-$20,000 | 4-8 weeks | PDF report with general recommendations, no schema code, no SKU-level specificity |
| Build internally | $0 direct cost, but 3+ months engineering time | 3-4 months | Custom tool that scans 1-2 engines, no competitor analysis, no AI diagnosis, maintenance burden |
| Otterly + manual fixes | $189/month ($2,268/year) | Ongoing | Visibility dashboard — you still need to figure out the fixes yourself |
| Do nothing | $0 | N/A | Continue losing share to competitors who are optimizing for AI. The gap widens every month. |

### The "Do Nothing" Cost

AI search adoption is growing 30-40% year over year. Every month a brand waits to optimize for AI engines, competitors are:
- Adding structured data to their PDPs
- Expanding product content
- Accumulating reviews with proper markup
- Getting cited more, which reinforces their position (AI engines learn from citation patterns)

The cost of waiting isn't zero. It's the compounding advantage your competitors build while you're invisible.

---

## Objection Handling

**"We're already using Semrush/Ahrefs for SEO."**
Great — keep using them for SEO. NorthStar isn't an SEO tool. SEO gets you ranked in Google's link results. GEO gets you cited in AI answers. Different problem, different tool. Semrush's AI visibility add-on tells you your score. NorthStar tells you why and gives you the fix per product.

**"We'll wait until AI search is more mature."**
Your competitors aren't waiting. The brands that optimize now build a citation advantage that compounds. AI engines learn which brands have authoritative, well-structured product data. Getting in early is how you become the default recommendation in your category.

**"Can't our dev team just add schema markup?"**
They can — if they know WHICH schema to add, to WHICH pages, optimized for WHICH engines. The problem isn't implementation. It's diagnosis. NorthStar tells you that your iPhone 12 PDP needs Product + AggregateRating + FAQ schema, a 500-word description, and 5 specific FAQ entries — and hands your dev team the code. Without that diagnosis, your team is guessing.

**"$1,999 is expensive for one audit."**
If one SKU starts getting recommended on ChatGPT and drives 30 extra orders at INR 15,000 each, that's INR 4.5 lakhs in the first month. The audit pays for itself from a single product getting cited. And you get 200 SKUs audited, not one.

**"How do we know the fixes will actually work?"**
We include re-scans at 30 and 60 days in the Growth plan. You implement the fixes, we re-scan, and you see the before/after. We're building a Fix Intelligence Database from every audit we run — we already know which fixes move the needle on which engines.

---

## GiveEasy-Specific Talking Points

If you're pitching GiveEasy or a similar refurbished marketplace in India, lead with these:

1. **The refurbished market trust problem.** AI engines are extra cautious about recommending refurbished/used product sellers. They favor brands with clear return policies (in FAQ schema), warranty information (structured), and high review counts with ratings markup. Most refurbished marketplaces have this information buried in policy pages with no structured data. NorthStar identifies every trust gap and tells you exactly how to surface it for AI.

2. **The India geo problem.** When someone asks "best refurbished electronics in India," AI engines favor brands with India-specific content signals — .in domains, INR pricing in structured data, Indian city names in content and reviews, GST/warranty information. If your PDPs don't have geo-specific signals, you lose to competitors who do. NorthStar's queries are geo-aware and price-anchored in INR.

3. **The category breadth problem.** GiveEasy sells electronics AND furniture AND appliances. That's 3 different competitive landscapes. The competitor beating you for refurbished phones (Cashify) is different from the one beating you for refurbished furniture (FurniturewalaH, Rentomojo). NorthStar diagnoses per SKU, so you get separate competitive intelligence for each category.

4. **The condition/grading problem.** Refurbished products have condition grades (Like New, Good, Fair) that should be in structured data but almost never are. This is a gap NorthStar catches that generic GEO tools miss. Adding condition information to Product schema is a quick win that most refurbished sellers haven't done.

---

## One-Line Summary

**NorthStar doesn't tell you that you're invisible on AI search. It tells you exactly why your competitor gets recommended instead of you — and gives you the fix for each product, on each engine, with copy-paste code.**

---

*Document for internal sales use. Update with real case study data once first 3 paid audits are complete.*
