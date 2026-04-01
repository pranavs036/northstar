"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useInView } from "framer-motion";

interface ResultCardProps {
  brand: string;
  category: string;
  beforeRate: number;
  afterRate: number;
  quote: string;
  delay?: number;
}

function CountUp({
  end,
  duration = 1500,
  trigger,
}: {
  end: number;
  duration?: number;
  trigger: boolean;
}) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!trigger) return;
    let startTime: number;
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      setValue(Math.round(eased * end));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [trigger, end, duration]);

  return <>{value}%</>;
}

export default function ResultCard({
  brand,
  category,
  beforeRate,
  afterRate,
  quote,
  delay = 0,
}: ResultCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <motion.div
      ref={ref}
      className="rounded-[0.625em] border border-[rgba(255,255,255,0.08)] bg-[#222236] p-8"
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay }}
    >
      {/* Brand & category */}
      <div className="mb-6">
        <h3 className="text-[15px] font-normal text-[#E5E4E0]">{brand}</h3>
        <p className="text-[13px] text-[#E5E4E0]/40 mt-1">{category}</p>
      </div>

      {/* Citation rate change */}
      <div className="flex items-baseline gap-3 mb-6">
        <span className="text-[clamp(32px,4vw,48px)] font-normal text-[#E5E4E0]/30 leading-none">
          <CountUp end={beforeRate} trigger={isInView} />
        </span>
        <motion.span
          className="text-[20px] text-[#34D399]"
          animate={isInView ? { scale: [1, 1.3, 1] } : {}}
          transition={{ duration: 0.8, delay: delay + 0.8, repeat: 1 }}
        >
          &rarr;
        </motion.span>
        <span className="text-[clamp(32px,4vw,48px)] font-normal text-[#34D399] leading-none">
          <CountUp end={afterRate} trigger={isInView} duration={1800} />
        </span>
      </div>

      <p className="text-[13px] tracking-[0.03em] uppercase text-[#E5E4E0]/40 mb-4">
        Citation Rate
      </p>

      {/* Quote */}
      <div className="pt-6 border-t border-[rgba(255,255,255,0.06)]">
        <p className="text-[14px] leading-relaxed text-[#E5E4E0]/50 italic">
          &ldquo;{quote}&rdquo;
        </p>
      </div>
    </motion.div>
  );
}
