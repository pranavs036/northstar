import Link from "next/link";
import {
  ArrowRight,
  Zap,
  CheckCircle2,
  Search,
  Target,
  TrendingUp,
  FileText,
  Star,
  Upload,
  ScanLine,
  ClipboardList,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#080810] text-slate-100 overflow-x-hidden">
      {/* Dot grid background */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        aria-hidden="true"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(148,163,184,0.05) 1px, transparent 0)",
          backgroundSize: "36px 36px",
        }}
      />

      {/* ── NAV ─────────────────────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.05] bg-[#080810]/80 backdrop-blur-xl">
        <nav className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2.5 no-underline"
            style={{ color: "inherit" }}
          >
            <div className="w-7 h-7 rounded-md bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-[15px] font-semibold text-slate-100 tracking-tight">
              NorthStar
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm">
            <Link
              href="#how-it-works"
              className="text-slate-500 hover:text-slate-200 transition-colors duration-200 no-underline"
              style={{ color: "rgb(100 116 139)" }}
            >
              How it works
            </Link>
            <Link
              href="#features"
              className="text-slate-500 hover:text-slate-200 transition-colors duration-200 no-underline"
              style={{ color: "rgb(100 116 139)" }}
            >
              Features
            </Link>
            <Link
              href="#pricing"
              className="text-slate-500 hover:text-slate-200 transition-colors duration-200 no-underline"
              style={{ color: "rgb(100 116 139)" }}
            >
              Pricing
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden sm:block text-sm px-3 py-1.5 transition-colors duration-200 no-underline cursor-pointer"
              style={{ color: "rgb(100 116 139)" }}
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="text-sm font-medium px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-500 hover:to-violet-500 transition-all duration-200 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 no-underline cursor-pointer"
              style={{ color: "white" }}
            >
              Get started
            </Link>
          </div>
        </nav>
      </header>

      <main className="relative z-10">
        {/* ── HERO ────────────────────────────────────────────────────────── */}
        <section className="relative pt-36 pb-28 px-6 flex flex-col items-center text-center overflow-hidden">
          {/* Glow orb */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] pointer-events-none"
            aria-hidden="true"
            style={{
              background:
                "radial-gradient(ellipse at center top, rgba(99,102,241,0.13) 0%, rgba(139,92,246,0.06) 45%, transparent 70%)",
            }}
          />

          {/* Badge */}
          <div className="relative mb-7 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-indigo-500/25 bg-indigo-500/8 text-indigo-300 text-xs font-medium tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            AI Search Optimization for Ecommerce
          </div>

          {/* Headline */}
          <h1 className="relative max-w-4xl text-5xl md:text-6xl lg:text-[72px] font-bold tracking-[-0.03em] text-slate-50 leading-[1.04] mb-7">
            Your products are{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage:
                  "linear-gradient(135deg, #818cf8 0%, #a78bfa 50%, #818cf8 100%)",
              }}
            >
              invisible to AI search.
            </span>
            <br />
            We fix that.
          </h1>

          {/* Sub-headline */}
          <p className="relative max-w-xl text-lg text-slate-400 leading-relaxed mb-10">
            Competitors ranking above you in ChatGPT, Google AI, and Perplexity
            aren&apos;t luckier — they have better structured data. NorthStar
            reverse-engineers exactly what they&apos;re doing. Then tells you
            how to close the gap.
          </p>

          {/* CTAs */}
          <div className="relative flex flex-col sm:flex-row items-center gap-4">
            <Link
              href="/signup"
              className="group flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold text-sm hover:from-indigo-500 hover:to-violet-500 transition-all duration-200 shadow-xl shadow-indigo-500/25 hover:shadow-indigo-500/40 no-underline cursor-pointer"
              style={{ color: "white" }}
            >
              Start your free audit
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-200" />
            </Link>
            <Link
              href="#how-it-works"
              className="flex items-center gap-2 px-6 py-3.5 rounded-xl border border-white/[0.1] text-sm font-medium hover:border-white/[0.18] hover:bg-white/[0.03] transition-all duration-200 no-underline cursor-pointer"
              style={{ color: "rgb(203 213 225)" }}
            >
              See how it works
            </Link>
          </div>

          {/* Stats */}
          <div className="relative mt-20 flex flex-col sm:flex-row items-center justify-center gap-10 sm:gap-16">
            {[
              { value: "4 AI engines", label: "scanned per SKU" },
              { value: "48hr", label: "average audit turnaround" },
              { value: "SKU-level", label: "diagnosis + fix list" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl font-bold text-slate-100 tabular-nums">
                  {stat.value}
                </div>
                <div className="text-sm text-slate-600 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── PROBLEM STATEMENT ────────────────────────────────────────────── */}
        <section className="py-24 px-6 border-y border-white/[0.05]">
          <div className="max-w-5xl mx-auto">
            <p className="text-xs font-semibold tracking-widest text-indigo-400 uppercase mb-4">
              The AI Search Gap
            </p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-50 tracking-tight leading-tight max-w-3xl mb-6">
              When a customer asks ChatGPT for the best running shoe, your
              competitor gets cited.{" "}
              <span className="text-slate-600">You don&apos;t.</span>
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl leading-relaxed mb-16">
              Search is moving from blue links to AI-generated answers. If your
              products aren&apos;t cited in those answers, you don&apos;t exist
              to that buyer. The gap is structural — and fixable.
            </p>

            {/* Stat tiles */}
            <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/[0.06] border border-white/[0.06] rounded-xl overflow-hidden">
              {[
                {
                  stat: "60%+",
                  label: "of searches end with no click",
                  desc: "AI Overviews answer the query directly. Your PDP never gets visited.",
                },
                {
                  stat: "3×",
                  label: "higher buyer intent",
                  desc: "Customers who discover products via AI-cited answers convert at significantly higher rates.",
                },
                {
                  stat: "Day 0",
                  label: "for most ecommerce brands",
                  desc: "The majority haven't updated their structured data in years. The gap is wide open.",
                },
              ].map((item) => (
                <div key={item.stat} className="bg-[#080810] p-8 md:p-10">
                  <div className="text-3xl font-bold text-indigo-400 mb-2 tabular-nums">
                    {item.stat}
                  </div>
                  <div className="text-sm font-semibold text-slate-200 mb-3">
                    {item.label}
                  </div>
                  <div className="text-sm text-slate-600 leading-relaxed">
                    {item.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
        <section id="how-it-works" className="py-24 px-6">
          <div className="max-w-5xl mx-auto">
            <p className="text-xs font-semibold tracking-widest text-indigo-400 uppercase mb-4">
              How it works
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-50 tracking-tight mb-4">
              Three steps. Full picture.
            </h2>
            <p className="text-slate-400 mb-16 max-w-md">
              From catalog upload to actionable diagnosis — in 48 hours, not 4
              weeks.
            </p>

            <div className="grid md:grid-cols-3 gap-5">
              {[
                {
                  step: "01",
                  Icon: Upload,
                  title: "Upload your catalog",
                  desc: "Drop in your product CSV or connect your Shopify store. Add 3–5 competitor domains. Takes 5 minutes.",
                },
                {
                  step: "02",
                  Icon: ScanLine,
                  title: "We scan every SKU",
                  desc: "NorthStar queries ChatGPT, Google AI Overviews, Perplexity, and Bing for every product — recording exactly what each engine cites and why.",
                },
                {
                  step: "03",
                  Icon: ClipboardList,
                  title: "You get a diagnosis",
                  desc: "Per-SKU report: exactly why competitors outrank you, what structural data they have that you lack, and a prioritized fix list.",
                },
              ].map(({ step, Icon, title, desc }) => (
                <div
                  key={step}
                  className="group p-7 rounded-xl border border-white/[0.07] bg-white/[0.02] hover:border-indigo-500/25 hover:bg-white/[0.035] transition-all duration-300 cursor-default"
                >
                  <div className="flex items-start justify-between mb-6">
                    <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center group-hover:bg-indigo-500/15 transition-colors duration-200">
                      <Icon className="w-5 h-5 text-indigo-400" />
                    </div>
                    <span className="text-5xl font-bold tabular-nums select-none text-white/[0.05] group-hover:text-white/[0.08] transition-colors duration-200">
                      {step}
                    </span>
                  </div>
                  <h3 className="font-semibold text-slate-100 mb-2">{title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FEATURES ─────────────────────────────────────────────────────── */}
        <section
          id="features"
          className="py-24 px-6 border-t border-white/[0.05]"
        >
          <div className="max-w-5xl mx-auto">
            <p className="text-xs font-semibold tracking-widest text-indigo-400 uppercase mb-4">
              Platform
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-50 tracking-tight mb-4">
              Built for AI-era ecommerce.
            </h2>
            <p className="text-slate-400 mb-16 max-w-md">
              Everything you need to diagnose, fix, and maintain AI search
              visibility across your entire catalog.
            </p>

            <div className="grid md:grid-cols-2 gap-5">
              {[
                {
                  Icon: Search,
                  accent: "indigo",
                  title: "AI Engine Scanner",
                  desc: "Automated queries to ChatGPT, Google AI Overviews, Perplexity, and Bing Copilot. We record exactly which SKUs get cited — and which get buried — across every engine.",
                  tags: ["ChatGPT", "Google AI", "Perplexity", "Bing"],
                  iconCls: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
                  tagCls: "text-indigo-300 bg-indigo-500/8 border-indigo-500/20",
                },
                {
                  Icon: Target,
                  accent: "violet",
                  title: "Competitor Deep-Dive",
                  desc: "We scrape competitor PDPs and extract every structural advantage they hold: JSON-LD schema types, FAQ markup, review counts, attribute depth, and content length.",
                  tags: ["JSON-LD", "Schema Markup", "Meta Tags"],
                  iconCls: "text-violet-400 bg-violet-500/10 border-violet-500/20",
                  tagCls: "text-violet-300 bg-violet-500/8 border-violet-500/20",
                },
                {
                  Icon: FileText,
                  accent: "blue",
                  title: "SKU-Level Diagnosis",
                  desc: "Not vague advice — specific gaps. \"Competitor X ranks above you because they have FAQ schema and 47 reviews cited. You have neither.\" Then: the exact fix, per engine.",
                  tags: ["Critical", "High", "Medium Priority"],
                  iconCls: "text-blue-400 bg-blue-500/10 border-blue-500/20",
                  tagCls: "text-blue-300 bg-blue-500/8 border-blue-500/20",
                },
                {
                  Icon: TrendingUp,
                  accent: "emerald",
                  title: "Agent-Readiness Score",
                  desc: "A 0–100 score for your catalog's AI-readiness. Track improvement over time. Weekly re-scans flag when previously-fixed SKUs slip back below the threshold.",
                  tags: ["0–100 Score", "Weekly Scans", "Trend Tracking"],
                  iconCls: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
                  tagCls: "text-emerald-300 bg-emerald-500/8 border-emerald-500/20",
                },
              ].map(({ Icon, title, desc, tags, iconCls, tagCls }) => (
                <div
                  key={title}
                  className="group p-7 rounded-xl border border-white/[0.07] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.035] transition-all duration-300 cursor-default"
                >
                  <div
                    className={`w-10 h-10 rounded-lg border flex items-center justify-center mb-6 ${iconCls}`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-slate-100 mb-2">{title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed mb-5">
                    {desc}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className={`text-xs px-2.5 py-1 rounded-full border ${tagCls}`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── SOCIAL PROOF ──────────────────────────────────────────────────── */}
        <section className="py-24 px-6 border-t border-white/[0.05]">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <p className="text-xs font-semibold tracking-widest text-indigo-400 uppercase mb-4">
                What brands are saying
              </p>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-50 tracking-tight">
                Trusted by ecommerce teams.
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-5">
              {[
                {
                  quote:
                    "We had no idea our structured data was years out of date. NorthStar showed us exactly what Allbirds had that we didn't — within 48 hours of upload.",
                  name: "Sarah K.",
                  role: "Head of Growth",
                  company: "DTC Footwear Brand",
                },
                {
                  quote:
                    "The SKU-level diagnosis is unlike anything else. It's not 'improve your content.' It's 'add FAQ schema and expand material attributes.' Immediately actionable.",
                  name: "Marcus T.",
                  role: "VP Ecommerce",
                  company: "Home Goods Retailer",
                },
                {
                  quote:
                    "We fixed 12 critical SKUs in two weeks. Three are now cited in Perplexity answers for high-intent queries. This directly moves revenue.",
                  name: "Priya M.",
                  role: "Ecommerce Director",
                  company: "Fashion Brand",
                },
              ].map((t) => (
                <div
                  key={t.name}
                  className="p-7 rounded-xl border border-white/[0.07] bg-white/[0.02] flex flex-col"
                >
                  <div className="flex gap-0.5 mb-5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className="w-3.5 h-3.5 text-amber-400 fill-amber-400"
                      />
                    ))}
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed mb-6 flex-1">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <div className="pt-5 border-t border-white/[0.06]">
                    <div className="text-sm font-semibold text-slate-100">
                      {t.name}
                    </div>
                    <div className="text-xs text-slate-600 mt-0.5">
                      {t.role} &middot; {t.company}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── PRICING ───────────────────────────────────────────────────────── */}
        <section
          id="pricing"
          className="py-24 px-6 border-t border-white/[0.05]"
        >
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <p className="text-xs font-semibold tracking-widest text-indigo-400 uppercase mb-4">
                Pricing
              </p>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-50 tracking-tight mb-4">
                Simple, transparent pricing.
              </h2>
              <p className="text-slate-400 max-w-sm mx-auto">
                One-time audit to find the gaps. Monthly maintenance to stay
                ahead of them.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Audit */}
              <div className="p-8 rounded-xl border border-white/[0.08] bg-white/[0.02] flex flex-col">
                <div className="text-xs font-semibold tracking-widest text-slate-500 uppercase mb-4">
                  One-time Audit
                </div>
                <div className="mb-1">
                  <span className="text-4xl font-bold text-slate-50 tracking-tight">
                    $2K – $10K
                  </span>
                </div>
                <p className="text-sm text-slate-600 mb-8">
                  Based on catalog size
                </p>
                <ul className="space-y-3.5 mb-10 flex-1">
                  {[
                    "Full catalog AI visibility scan",
                    "Competitor deep-dive per SKU",
                    "SKU-level diagnosis + fix list",
                    "Agent-Readiness Score",
                    "PDF audit report",
                  ].map((f) => (
                    <li
                      key={f}
                      className="flex items-center gap-3 text-sm text-slate-300"
                    >
                      <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/signup"
                  className="block w-full text-center px-5 py-3 rounded-lg border border-white/[0.1] text-sm font-medium hover:border-indigo-500/35 hover:bg-indigo-500/5 transition-all duration-200 no-underline cursor-pointer"
                  style={{ color: "rgb(203 213 225)" }}
                >
                  Request an audit
                </Link>
              </div>

              {/* Maintenance — highlighted */}
              <div className="p-8 rounded-xl border border-indigo-500/30 flex flex-col relative overflow-hidden">
                {/* Subtle gradient fill */}
                <div
                  className="absolute inset-0 pointer-events-none rounded-xl"
                  aria-hidden="true"
                  style={{
                    background:
                      "linear-gradient(160deg, rgba(99,102,241,0.07) 0%, rgba(139,92,246,0.04) 50%, transparent 100%)",
                  }}
                />
                <div className="relative">
                  <div className="flex items-start justify-between mb-4">
                    <div className="text-xs font-semibold tracking-widest text-indigo-400 uppercase">
                      Monthly Maintenance
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/25">
                      Recommended
                    </span>
                  </div>
                  <div className="mb-1">
                    <span className="text-4xl font-bold text-slate-50 tracking-tight">
                      30%
                    </span>
                    <span className="text-slate-400 text-sm ml-2">
                      of audit / month
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 mb-8">
                    After your initial audit
                  </p>
                  <ul className="space-y-3.5 mb-10">
                    {[
                      "Weekly re-scans across all SKUs",
                      "Alerts when fixed SKUs slip back",
                      "New SKU auto-queue",
                      "Competitor monitoring",
                      "Monthly trend report",
                    ].map((f) => (
                      <li
                        key={f}
                        className="flex items-center gap-3 text-sm text-slate-300"
                      >
                        <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/signup"
                    className="block w-full text-center px-5 py-3 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-semibold hover:from-indigo-500 hover:to-violet-500 transition-all duration-200 shadow-lg shadow-indigo-500/20 no-underline cursor-pointer"
                    style={{ color: "white" }}
                  >
                    Get started
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── FINAL CTA ─────────────────────────────────────────────────────── */}
        <section className="py-28 px-6 border-t border-white/[0.05]">
          <div className="max-w-3xl mx-auto text-center relative">
            <div
              className="absolute inset-0 pointer-events-none"
              aria-hidden="true"
              style={{
                background:
                  "radial-gradient(ellipse at center, rgba(99,102,241,0.1) 0%, transparent 65%)",
              }}
            />
            <div className="relative">
              <p className="text-xs font-semibold tracking-widest text-indigo-400 uppercase mb-5">
                Get started today
              </p>
              <h2 className="text-4xl md:text-5xl lg:text-[56px] font-bold text-slate-50 tracking-tight leading-[1.05] mb-6">
                Start your AI visibility
                <br />
                audit today.
              </h2>
              <p className="text-slate-400 text-lg mb-10 max-w-md mx-auto leading-relaxed">
                See where your catalog stands in AI search — and exactly what it
                takes to close the gap on your competitors.
              </p>
              <Link
                href="/signup"
                className="group inline-flex items-center gap-2.5 px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold text-[15px] hover:from-indigo-500 hover:to-violet-500 transition-all duration-200 shadow-2xl shadow-indigo-500/30 hover:shadow-indigo-500/45 no-underline cursor-pointer"
                style={{ color: "white" }}
              >
                Request your audit
                <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform duration-200" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ── FOOTER ────────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.05] py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <Link
            href="/"
            className="flex items-center gap-2 no-underline cursor-pointer"
            style={{ color: "inherit" }}
          >
            <div className="w-6 h-6 rounded bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold text-slate-500 hover:text-slate-300 transition-colors duration-200">
              NorthStar
            </span>
          </Link>
          <div className="flex items-center gap-6 text-sm">
            {["Privacy", "Terms"].map((label) => (
              <Link
                key={label}
                href="#"
                className="no-underline transition-colors duration-200 cursor-pointer"
                style={{ color: "rgb(71 85 105)" }}
              >
                {label}
              </Link>
            ))}
            <Link
              href="mailto:hello@northstar.ai"
              className="no-underline transition-colors duration-200 cursor-pointer"
              style={{ color: "rgb(71 85 105)" }}
            >
              Contact
            </Link>
          </div>
          <p className="text-xs" style={{ color: "rgb(51 65 85)" }}>
            © 2026 NorthStar. Built for AI-era ecommerce.
          </p>
        </div>
      </footer>
    </div>
  );
}
