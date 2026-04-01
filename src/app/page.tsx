"use client";

import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";

import LandingHero from "@/components/landing/LandingHero";
import LandingSection from "@/components/landing/LandingSection";
import SplitText from "@/components/landing/SplitText";
import MetricsRow from "@/components/landing/MetricsRow";
import LandingFooter from "@/components/landing/LandingFooter";
import CustomCursor from "@/components/landing/CustomCursor";
import ScrollProgress from "@/components/landing/ScrollProgress";

/* ─── Fade-up wrapper for scroll reveals ─── */
function FadeUp({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.15 });
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

export default function LandingPage() {
  return (
    <div className="landing-page bg-[#E5E4E0] overflow-x-hidden">
      <CustomCursor />
      <ScrollProgress />

      {/* ─── SECTION 1: HERO ─── */}
      <LandingHero />

      {/* ─── SECTION 2: THE URGENCY / FOMO (Dark, Full Width) ─── */}
      <section className="relative bg-[#1A1A2E] text-[#E5E4E0] overflow-hidden" id="the-shift">
        <div className="max-w-[1100px] mx-auto px-6 md:px-12 py-24 md:py-36 lg:py-44">
          <FadeUp>
            <p className="text-[#FBBF24] text-[18px] tracking-wider mb-10">
              &#9733;&#9733;&#9733;&#9733;
            </p>
          </FadeUp>

          <FadeUp delay={0.1}>
            <h2 className="text-[clamp(28px,5vw,52px)] leading-[1.1] tracking-[-0.02em] uppercase font-normal max-w-[950px]">
              Every day your products aren&apos;t optimised for AI search, you&apos;re losing revenue to competitors who are.
            </h2>
          </FadeUp>

          <FadeUp delay={0.25}>
            <div className="w-full h-[1px] bg-[rgba(255,255,255,0.08)] my-12 md:my-16" />
          </FadeUp>

          <FadeUp delay={0.35}>
            <p className="text-[clamp(18px,2.5vw,26px)] leading-[1.5] text-[#E5E4E0]/70 max-w-[850px]">
              Traffic is shifting from Google to ChatGPT, Perplexity, and AI agents — and your SEO strategy doesn&apos;t cover this. AI engines don&apos;t rank links. They <span className="text-[#FBBF24] font-bold">recommend brands</span>. If you&apos;re not in the answer, you don&apos;t exist.
            </p>
          </FadeUp>

          <FadeUp delay={0.5}>
            <p className="text-[clamp(16px,2vw,20px)] leading-[1.5] text-[#E5E4E0]/50 max-w-[750px] mt-8">
              Your schema markup, content depth, review signals, and structured data determine whether AI cites you or your competitor. NorthStar tells you exactly where you&apos;re losing — and how to fix it.
            </p>
          </FadeUp>

          <FadeUp delay={0.6} className="mt-12">
            <Link
              href="/demo"
              className="inline-flex items-center gap-2 text-[14px] font-bold px-7 py-3.5 rounded-[6.25em] border border-[#FBBF24]/30 bg-[#FBBF24]/10 text-[#FBBF24] hover:bg-[#FBBF24]/20 transition-all"
            >
              See where you stand <span aria-hidden="true">&rarr;</span>
            </Link>
          </FadeUp>
        </div>
      </section>

      {/* ─── SECTION 3: HOW IT WORKS — Architecture (Cream) ─── */}
      <LandingSection variant="cream" id="how-it-works">
        <div className="mb-16">
          <SplitText
            text="HOW IT WORKS"
            className="text-[clamp(32px,5vw,56px)] leading-[1.05] tracking-[-0.02em] uppercase font-normal"
            as="h2"
          />
          <FadeUp delay={0.2}>
            <p className="text-[clamp(16px,2vw,20px)] leading-[1.6] text-[#1A1A2E]/60 max-w-[700px] mt-6">
              NorthStar adds a layer <strong className="text-[#1A1A2E]/80">on top</strong> of your traditional SEO — not replacing it. We reverse-engineer what AI engines actually look at when deciding which products to recommend.
            </p>
          </FadeUp>
        </div>

        {/* Architecture explanation */}
        <FadeUp delay={0.3}>
          <div className="rounded-[0.625em] border border-[rgba(111,111,111,0.15)] bg-white/40 p-8 md:p-12 mb-8">
            <p className="text-[13px] tracking-[0.05em] uppercase text-[#1A1A2E]/40 mb-6">
              The Technology
            </p>
            <p className="text-[clamp(15px,1.5vw,18px)] leading-[1.7] text-[#1A1A2E]/70 max-w-[800px]">
              We query every major AI engine with real customer search patterns for your products, analyze why competitors get recommended over you, and generate specific fixes for your product pages. Not generic advice — exact changes per SKU, per engine.
            </p>
          </div>
        </FadeUp>

        {/* Flow diagram */}
        <FadeUp delay={0.4}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-8">
            {[
              {
                label: "Your Catalog",
                detail: "Upload your SKUs and competitor domains",
                icon: (
                  <svg className="w-8 h-8 mb-4 text-[#4F7DF3]" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="4" y="4" width="24" height="24" rx="4" />
                    <line x1="4" y1="12" x2="28" y2="12" />
                    <line x1="4" y1="20" x2="28" y2="20" />
                    <line x1="12" y1="4" x2="12" y2="28" />
                  </svg>
                ),
              },
              {
                label: "AI Engine Scanning",
                detail: "We test your visibility across 5 AI engines",
                icon: (
                  <svg className="w-8 h-8 mb-4 text-[#4F7DF3]" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="16" cy="16" r="12" />
                    <circle cx="16" cy="16" r="6" />
                    <circle cx="16" cy="16" r="2" fill="currentColor" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="16" y1="26" x2="16" y2="30" />
                    <line x1="2" y1="16" x2="6" y2="16" />
                    <line x1="26" y1="16" x2="30" y2="16" />
                  </svg>
                ),
              },
              {
                label: "Gap Analysis",
                detail: "AI diagnoses why competitors outrank you",
                icon: (
                  <svg className="w-8 h-8 mb-4 text-[#4F7DF3]" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M6 24 L6 14" strokeWidth="3" strokeLinecap="round" />
                    <path d="M13 24 L13 8" strokeWidth="3" strokeLinecap="round" />
                    <path d="M20 24 L20 16" strokeWidth="3" strokeLinecap="round" />
                    <path d="M27 24 L27 6" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                ),
              },
              {
                label: "Actionable Fixes",
                detail: "Specific changes per SKU, per engine",
                icon: (
                  <svg className="w-8 h-8 mb-4 text-[#34D399]" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M6 16 L12 22 L26 8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ),
              },
            ].map((step, i) => (
              <div key={step.label} className="relative">
                <div className="rounded-[0.625em] border border-[rgba(111,111,111,0.15)] bg-[#E5E4E0] p-6 md:p-8 h-full">
                  {step.icon}
                  <h3 className="text-[16px] md:text-[18px] uppercase font-bold tracking-[-0.01em] mb-2">
                    {step.label}
                  </h3>
                  <p className="text-[14px] leading-relaxed text-[#1A1A2E]/50">
                    {step.detail}
                  </p>
                </div>
                {/* Arrow connector (hidden on mobile, hidden on last item) */}
                {i < 3 && (
                  <div className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 text-[#1A1A2E]/20 text-[20px]">
                    &rarr;
                  </div>
                )}
              </div>
            ))}
          </div>
        </FadeUp>

        {/* Engine badges */}
        <FadeUp delay={0.5}>
          <div className="rounded-[0.625em] border border-[rgba(111,111,111,0.15)] bg-white/40 p-6 md:p-8">
            <p className="text-[13px] tracking-[0.05em] uppercase text-[#1A1A2E]/40 mb-5">
              Engines We Scan
            </p>
            <div className="flex flex-wrap gap-3">
              {["ChatGPT", "Perplexity", "Google AI Overviews", "Gemini", "Microsoft Copilot"].map((engine) => (
                <span
                  key={engine}
                  className="inline-flex items-center px-4 py-2 rounded-full text-[13px] font-bold tracking-[-0.01em] bg-[#1A1A2E]/5 text-[#1A1A2E]/70 border border-[#1A1A2E]/10"
                >
                  {engine}
                </span>
              ))}
            </div>
          </div>
        </FadeUp>
      </LandingSection>

      {/* ─── SECTION 4: METRICS THAT MATTER (Cream) ─── */}
      <LandingSection variant="cream" id="metrics">
        <SplitText
          text="THE METRICS THAT MATTER FOR GEO"
          className="text-[clamp(32px,5vw,56px)] leading-[1.05] tracking-[-0.02em] uppercase font-normal mb-16"
          as="h2"
        />

        <div>
          {[
            {
              index: "01",
              title: "Agent-Readiness Score",
              description:
                "Your catalog's overall readiness for AI engines",
            },
            {
              index: "02",
              title: "Share of Voice",
              description:
                "Your brand's mention rate vs competitors in AI answers",
            },
            {
              index: "03",
              title: "Citation Rate",
              description:
                "How often AI links to your domain specifically",
            },
            {
              index: "04",
              title: "Engine Breakdown",
              description:
                "Visibility per engine — fix the ones you're losing",
            },
            {
              index: "05",
              title: "Severity Diagnosis",
              description:
                "Critical / High / Medium gaps with exact fixes",
            },
          ].map((metric, i) => (
            <MetricsRow
              key={metric.index}
              {...metric}
              delay={i * 0.15}
            />
          ))}
        </div>
      </LandingSection>

      {/* ─── FOOTER ─── */}
      <LandingFooter />
    </div>
  );
}
