"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import SplitText from "./SplitText";
import RadarAnimation from "./RadarAnimation";

/* ─── SVG Background: interconnected nodes / product recommendation flow ─── */
function HeroBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 1200 800"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Interconnected nodes pattern — product recommendation network */}
        <g opacity="0.10" stroke="#1A1A2E" strokeWidth="1">
          {/* Grid of product nodes */}
          {[
            [150, 120], [350, 80], [550, 150], [750, 100], [950, 130], [1050, 200],
            [100, 300], [300, 280], [500, 320], [700, 270], [900, 310], [1100, 350],
            [200, 480], [400, 450], [600, 500], [800, 460], [1000, 490],
            [150, 650], [350, 680], [550, 620], [750, 670], [950, 640], [1100, 580],
          ].map(([cx, cy], i) => (
            <g key={`node-${i}`}>
              {/* Node circle */}
              <circle cx={cx} cy={cy} r={i % 3 === 0 ? 18 : 12} strokeWidth="1.5" fill="none" />
              {/* Inner dot */}
              <circle cx={cx} cy={cy} r="3" fill="#1A1A2E" opacity="0.5" stroke="none" />
            </g>
          ))}

          {/* Connection lines between nodes — recommendation paths */}
          {[
            [150, 120, 350, 80], [350, 80, 550, 150], [550, 150, 750, 100],
            [750, 100, 950, 130], [950, 130, 1050, 200],
            [150, 120, 100, 300], [350, 80, 300, 280], [550, 150, 500, 320],
            [750, 100, 700, 270], [950, 130, 900, 310],
            [100, 300, 300, 280], [300, 280, 500, 320], [500, 320, 700, 270],
            [700, 270, 900, 310], [900, 310, 1100, 350],
            [100, 300, 200, 480], [300, 280, 400, 450], [500, 320, 600, 500],
            [700, 270, 800, 460], [900, 310, 1000, 490],
            [200, 480, 400, 450], [400, 450, 600, 500], [600, 500, 800, 460],
            [800, 460, 1000, 490],
            [200, 480, 150, 650], [400, 450, 350, 680], [600, 500, 550, 620],
            [800, 460, 750, 670], [1000, 490, 950, 640],
            [1100, 350, 1100, 580], [1050, 200, 1100, 350],
            // Cross connections — AI recommendation paths
            [150, 120, 300, 280], [550, 150, 700, 270], [350, 80, 500, 320],
            [750, 100, 900, 310], [300, 280, 200, 480], [700, 270, 600, 500],
            [500, 320, 400, 450], [900, 310, 800, 460],
          ].map(([x1, y1, x2, y2], i) => (
            <line key={`line-${i}`} x1={x1} y1={y1} x2={x2} y2={y2} strokeDasharray={i % 4 === 0 ? "4 6" : "none"} />
          ))}

          {/* Search/flow arrows — showing data flowing through the network */}
          <g opacity="0.6">
            {/* Arrow paths showing recommendation flow */}
            <path d="M120,300 Q250,200 350,80" strokeWidth="2" strokeDasharray="6 4" />
            <path d="M500,320 Q600,250 750,100" strokeWidth="2" strokeDasharray="6 4" />
            <path d="M800,460 Q900,380 1050,200" strokeWidth="2" strokeDasharray="6 4" />
          </g>

          {/* Larger hub nodes — representing AI engines */}
          {[
            [300, 280], [700, 270], [500, 320],
          ].map(([cx, cy], i) => (
            <g key={`hub-${i}`}>
              <circle cx={cx} cy={cy} r="28" strokeWidth="1" strokeDasharray="4 3" />
            </g>
          ))}
        </g>

        {/* Subtle gradient overlays for depth */}
        <defs>
          <radialGradient id="hero-glow-1" cx="30%" cy="40%" r="40%">
            <stop offset="0%" stopColor="#4F7DF3" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#4F7DF3" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="hero-glow-2" cx="70%" cy="60%" r="35%">
            <stop offset="0%" stopColor="#34D399" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#34D399" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#hero-glow-1)" />
        <rect width="100%" height="100%" fill="url(#hero-glow-2)" />
      </svg>
    </div>
  );
}

export default function LandingHero() {
  const [scrollY, setScrollY] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollIndicatorOpacity = Math.max(0, 1 - scrollY / 300);

  return (
    <section
      id="hero"
      className="relative min-h-screen bg-[#E5E4E0] text-[#1A1A2E] flex flex-col overflow-hidden"
    >
      {/* Background graphic — interconnected recommendation network */}
      <HeroBackground />

      {/* Nav */}
      <header className="relative z-20 w-full">
        <nav className="max-w-[1200px] mx-auto px-6 md:px-12 h-20 flex items-center justify-between">
          <Link href="/" className="text-[13px] font-bold tracking-[0.05em] uppercase">
            NorthStar
          </Link>
          <div className="flex items-center gap-8">
            <Link
              href="/demo"
              className="hidden md:flex text-[13px] font-bold items-center gap-2 px-5 py-2.5 rounded-[6.25em] border-2 border-[#1A1A2E] text-[#1A1A2E] hover:bg-[#1A1A2E]/5 transition-all"
            >
              Free Audit
            </Link>
            <Link
              href="/demo?mode=contact"
              className="hidden md:flex text-[13px] font-bold items-center gap-2 px-5 py-2.5 rounded-[6.25em] bg-[#1A1A2E] text-[#E5E4E0] hover:bg-[#1A1A2E]/90 transition-all"
            >
              Get Demo <span aria-hidden="true">&rarr;</span>
            </Link>
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-[#1A1A2E]/70 hover:text-[#1A1A2E] transition-colors"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                {mobileMenuOpen ? (
                  <>
                    <line x1="4" y1="4" x2="16" y2="16" />
                    <line x1="16" y1="4" x2="4" y2="16" />
                  </>
                ) : (
                  <>
                    <line x1="3" y1="6" x2="17" y2="6" />
                    <line x1="3" y1="10" x2="17" y2="10" />
                    <line x1="3" y1="14" x2="17" y2="14" />
                  </>
                )}
              </svg>
            </button>
          </div>
        </nav>

        {/* Mobile dropdown menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="md:hidden mx-6 mt-1 rounded-xl border border-[rgba(111,111,111,0.15)] bg-[#E5E4E0] p-5 shadow-lg"
            >
              <div className="flex flex-col gap-3">
                <Link
                  href="/demo"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-[14px] font-bold text-[#1A1A2E]/70 hover:text-[#1A1A2E] transition-colors py-1"
                >
                  Free Audit
                </Link>
                <div className="border-t border-[rgba(111,111,111,0.15)] pt-3 mt-1">
                  <Link
                    href="/demo?mode=contact"
                    className="text-[13px] font-bold flex items-center justify-center gap-2 px-5 py-2.5 rounded-[6.25em] bg-[#1A1A2E] text-[#E5E4E0] hover:bg-[#1A1A2E]/90 transition-all w-full"
                  >
                    Get Demo <span aria-hidden="true">&rarr;</span>
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Hero Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 md:px-12 mt-8 md:mt-16">
        {/* Radar - positioned behind text */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-40 md:opacity-50">
          <RadarAnimation size={400} />
        </div>

        {/* Main headline */}
        <div className="relative text-center max-w-[900px]">
          <motion.h1
            className="text-[clamp(36px,7vw,86px)] leading-[0.95] tracking-[-0.02em] uppercase font-normal"
            initial={{ opacity: 0, y: 30 }}
            animate={mounted ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            PRODUCTS DON&apos;T GET SEARCHED ANYMORE.
          </motion.h1>
          <motion.h1
            className="text-[clamp(36px,7vw,86px)] leading-[0.95] tracking-[-0.02em] uppercase font-normal mt-2"
            initial={{ opacity: 0, y: 30 }}
            animate={mounted ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            THEY GET RECOMMENDED.
          </motion.h1>
        </div>

        {/* Sub + CTA */}
        <motion.div
          className="relative mt-16 flex flex-col md:flex-row items-center gap-8"
          initial={{ opacity: 0, y: 30 }}
          animate={mounted ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 1.8, duration: 0.6, ease: "easeOut" }}
        >
          <p className="text-[15px] leading-relaxed text-[#1A1A2E]/60 max-w-[320px] text-center md:text-left">
            We find why AI recommends your competitors — and fix it.
          </p>
          <Link
            href="/demo"
            className="text-[14px] font-bold flex items-center gap-2 px-7 py-3.5 rounded-[6.25em] border-2 border-[#1A1A2E] bg-[#1A1A2E] text-[#E5E4E0] hover:bg-[#1A1A2E]/90 transition-all shadow-lg shadow-[#1A1A2E]/10"
          >
            Run Free Audit <span aria-hidden="true">&rarr;</span>
          </Link>
        </motion.div>

        {/* Social proof — legally safe language */}
        <motion.div
          className="relative mt-16 mb-8 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={mounted ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 2.2, duration: 0.6, ease: "easeOut" }}
        >
          <p className="text-[12px] tracking-[0.08em] text-[#1A1A2E]/40 mb-6 uppercase">
            Working with early partners including
          </p>
          <div className="flex items-center justify-center gap-10 md:gap-16 flex-wrap">
            {["Tatami Shop", "Giveasy.in", "Peesafe"].map((brand) => (
              <span
                key={brand}
                className="text-[24px] md:text-[32px] font-bold tracking-[-0.02em] text-[#1A1A2E]/70"
              >
                {brand}
              </span>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="pb-12 text-center text-[11px] tracking-[0.15em] uppercase text-[#1A1A2E]/30"
        style={{ opacity: scrollIndicatorOpacity }}
      >
        SCROLL &darr;
      </motion.div>
    </section>
  );
}
