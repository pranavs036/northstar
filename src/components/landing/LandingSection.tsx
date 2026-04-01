"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

interface LandingSectionProps {
  children: React.ReactNode;
  variant?: "cream" | "dark" | "gradient";
  className?: string;
  id?: string;
  fullHeight?: boolean;
}

export default function LandingSection({
  children,
  variant = "cream",
  className = "",
  id,
  fullHeight = false,
}: LandingSectionProps) {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.1 });

  const bgClass =
    variant === "dark"
      ? "bg-[#1A1A2E] text-[#E5E4E0]"
      : variant === "gradient"
        ? "bg-gradient-to-br from-[#4F7DF3] via-[#34D399]/70 to-[#FBBF24] text-white"
        : "bg-[#E5E4E0] text-[#1A1A2E]";

  return (
    <motion.section
      ref={ref}
      id={id}
      className={`relative ${bgClass} ${fullHeight ? "min-h-screen" : ""} ${className}`}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : { opacity: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="max-w-[1200px] mx-auto px-6 md:px-12 py-24 md:py-32 lg:py-40">
        {children}
      </div>
    </motion.section>
  );
}
