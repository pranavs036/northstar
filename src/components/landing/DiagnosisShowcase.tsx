"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useInView } from "framer-motion";

function TypewriterText({ text, delay = 0, speed = 20 }: { text: string; delay?: number; speed?: number }) {
  const [displayText, setDisplayText] = useState("");
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    const startTimeout = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(startTimeout);
  }, [isInView, delay]);

  useEffect(() => {
    if (!started) return;
    let idx = 0;
    const interval = setInterval(() => {
      idx++;
      setDisplayText(text.slice(0, idx));
      if (idx >= text.length) clearInterval(interval);
    }, speed);
    return () => clearInterval(interval);
  }, [started, text, speed]);

  return (
    <span ref={ref}>
      {displayText}
      {started && displayText.length < text.length && (
        <span className="inline-block w-[2px] h-[1em] bg-[#34D399] ml-0.5 animate-pulse align-middle" />
      )}
    </span>
  );
}

export default function DiagnosisShowcase() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.2 });
  const [blurAmount, setBlurAmount] = useState(8);

  useEffect(() => {
    if (!isInView) return;

    const handleScroll = () => {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const viewportH = window.innerHeight;
      const progress = Math.max(0, Math.min(1, 1 - rect.top / (viewportH * 0.5)));
      setBlurAmount(8 * (1 - progress));
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isInView]);

  return (
    <div ref={sectionRef}>
      {/* Main diagnosis card */}
      <motion.div
        className="relative rounded-[0.625em] border border-[rgba(255,255,255,0.08)] bg-[#222236] p-8 md:p-10 overflow-hidden"
        style={{ filter: `blur(${blurAmount}px)` }}
        initial={{ opacity: 0, y: 40 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
      >
        {/* Scan line */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: isInView
              ? "linear-gradient(90deg, transparent 0%, rgba(79, 125, 243, 0.08) 50%, transparent 100%)"
              : "none",
            animation: isInView ? "scan-line 2s ease-in-out 1" : "none",
          }}
        />

        {/* Severity badge */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F06B6B] opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#F06B6B]" />
            </span>
            <span className="text-[13px] tracking-[0.05em] uppercase text-[#F06B6B]">
              Critical
            </span>
          </div>
          <span className="text-[13px] tracking-[0.05em] uppercase text-[#E5E4E0]/40">
            ChatGPT
          </span>
        </div>

        {/* Query */}
        <p className="text-[13px] text-[#E5E4E0]/50 mb-4">
          Query: &ldquo;best wireless headphones under $200&rdquo;
        </p>

        {/* Diagnosis text */}
        <div className="space-y-4 text-[15px] leading-relaxed text-[#E5E4E0]/80">
          <p>
            Your competitor <span className="text-[#F06B6B]">Bose</span> gets cited because their PDP has FAQ schema,
            2,847 reviews with aggregateRating markup, and a 1,200-word product description with comparison tables.
          </p>
          <p>
            Your PDP has <span className="text-[#FBBF24]">no structured data</span>, 12 reviews (not marked up),
            and a 90-word description.
          </p>
        </div>

        {/* Fix section - typewriter */}
        <div className="mt-6 pt-6 border-t border-[rgba(255,255,255,0.06)]">
          <p className="text-[15px] leading-relaxed">
            <span className="text-[#34D399] font-bold">FIX:</span>{" "}
            <span className="text-[#E5E4E0]/70">
              <TypewriterText
                text="Add Product JSON-LD with aggregateRating, expand description to 500+ words with specs table, add FAQ section with 5 common questions."
                delay={1200}
                speed={20}
              />
            </span>
          </p>
        </div>
      </motion.div>

      {/* Supporting cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <motion.div
          className="rounded-[0.625em] border border-[rgba(255,255,255,0.08)] bg-[#222236] p-6"
          initial={{ opacity: 0, x: -40 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="h-2 w-2 rounded-full bg-[#FBBF24]" />
            <span className="text-[13px] tracking-[0.05em] uppercase text-[#FBBF24]">High</span>
            <span className="ml-auto text-[13px] text-[#E5E4E0]/40">Perplexity</span>
          </div>
          <p className="text-[14px] text-[#E5E4E0]/60 leading-relaxed">
            Missing review markup prevents citation. Competitor has 3x the structured review data.
          </p>
        </motion.div>

        <motion.div
          className="rounded-[0.625em] border border-[rgba(255,255,255,0.08)] bg-[#222236] p-6"
          initial={{ opacity: 0, x: 40 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.5, delay: 1.0 }}
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="h-2 w-2 rounded-full bg-[#4F7DF3]" />
            <span className="text-[13px] tracking-[0.05em] uppercase text-[#4F7DF3]">Medium</span>
            <span className="ml-auto text-[13px] text-[#E5E4E0]/40">Google AI</span>
          </div>
          <p className="text-[14px] text-[#E5E4E0]/60 leading-relaxed">
            No brand schema on homepage. Organization JSON-LD with sameAs links needed for entity recognition.
          </p>
        </motion.div>
      </div>

      <style jsx>{`
        @keyframes scan-line {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
