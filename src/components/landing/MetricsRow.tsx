"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

interface MetricsRowProps {
  index: string;
  title: string;
  description: string;
  delay?: number;
}

export default function MetricsRow({
  index,
  title,
  description,
  delay = 0,
}: MetricsRowProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });

  return (
    <motion.div
      ref={ref}
      className="relative"
      initial={{ opacity: 0, x: -30 }}
      animate={isInView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.5, delay }}
    >
      <div className="grid grid-cols-[60px_1fr] md:grid-cols-[80px_280px_1fr] gap-4 md:gap-8 items-start py-8">
        {/* Number */}
        <motion.span
          className="text-[clamp(24px,3vw,36px)] font-normal text-[#1A1A2E]/20 leading-none"
          initial={{ scale: 0 }}
          animate={isInView ? { scale: 1 } : {}}
          transition={{
            type: "spring",
            damping: 10,
            stiffness: 200,
            delay: delay + 0.1,
          }}
        >
          {index}
        </motion.span>

        {/* Title */}
        <h3 className="text-[15px] md:text-[17px] font-normal text-[#1A1A2E] leading-snug">
          {title}
        </h3>

        {/* Description */}
        <p className="hidden md:block text-[14px] text-[#1A1A2E]/50 leading-relaxed">
          {description}
        </p>
      </div>

      {/* Animated separator line */}
      <motion.div
        className="h-[1px] bg-[rgba(111,111,111,0.15)]"
        initial={{ scaleX: 0 }}
        animate={isInView ? { scaleX: 1 } : {}}
        transition={{ duration: 0.4, delay: delay + 0.2 }}
        style={{ transformOrigin: "left" }}
      />
    </motion.div>
  );
}
