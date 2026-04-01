"use client";

import { useEffect, useRef, useMemo } from "react";
import { motion, useInView, useAnimation, Variants } from "framer-motion";

interface SplitTextProps {
  text: string;
  className?: string;
  delay?: number;
  staggerDelay?: number;
  scatter?: boolean;
  as?: "h1" | "h2" | "h3" | "p" | "span";
}

export default function SplitText({
  text,
  className = "",
  delay = 0,
  staggerDelay = 0.015,
  scatter = false,
  as: Tag = "h2",
}: SplitTextProps) {
  const controls = useAnimation();
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  useEffect(() => {
    if (isInView) {
      controls.start("visible");
    }
  }, [isInView, controls]);

  const words = text.split(" ");
  const allChars = text.replace(/ /g, "");

  // Pre-compute random scatter positions for each character
  const scatterOffsets = useMemo(() => {
    return allChars.split("").map(() => ({
      x: (Math.random() - 0.5) * 300,
      y: (Math.random() - 0.5) * 200,
      rotate: (Math.random() - 0.5) * 90,
    }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  const containerVariants: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: delay,
      },
    },
  };

  const slideUpVariants: Variants = {
    hidden: {
      opacity: 0,
      y: 20,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        damping: 12,
        stiffness: 100,
      },
    },
  };

  let charGlobalIdx = 0;

  return (
    <motion.div
      ref={ref}
      variants={containerVariants}
      initial="hidden"
      animate={controls}
      className={className}
      aria-label={text}
    >
      <Tag className="inline">
        {words.map((word, wordIdx) => (
          <span key={wordIdx} className="inline-block whitespace-nowrap">
            {word.split("").map((char, charIdx) => {
              const globalIdx = charGlobalIdx++;
              const offset = scatter ? scatterOffsets[globalIdx] : null;

              if (scatter && offset) {
                return (
                  <motion.span
                    key={`${wordIdx}-${charIdx}`}
                    initial={{
                      opacity: 0,
                      x: offset.x,
                      y: offset.y,
                      rotate: offset.rotate,
                      scale: 0.3,
                    }}
                    variants={{
                      hidden: {
                        opacity: 0,
                        x: offset.x,
                        y: offset.y,
                        rotate: offset.rotate,
                        scale: 0.3,
                      },
                      visible: {
                        opacity: 1,
                        x: 0,
                        y: 0,
                        rotate: 0,
                        scale: 1,
                        transition: {
                          type: "spring",
                          damping: 20,
                          stiffness: 100,
                          duration: 0.8,
                        },
                      },
                    }}
                    className="inline-block will-change-transform"
                  >
                    {char}
                  </motion.span>
                );
              }

              return (
                <motion.span
                  key={`${wordIdx}-${charIdx}`}
                  variants={slideUpVariants}
                  className="inline-block will-change-transform"
                >
                  {char}
                </motion.span>
              );
            })}
            {wordIdx < words.length - 1 && (
              <span className="inline-block">&nbsp;</span>
            )}
          </span>
        ))}
      </Tag>
    </motion.div>
  );
}
