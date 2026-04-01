"use client";

import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

interface Engine {
  name: string;
  radius: number;
  duration: number;
  clockwise: boolean;
  startAngle: number;
  tooltip: string;
}

const engines: Engine[] = [
  {
    name: "ChatGPT",
    radius: 140,
    duration: 35,
    clockwise: true,
    startAngle: 0,
    tooltip: "Favors review count + structured data",
  },
  {
    name: "Perplexity",
    radius: 120,
    duration: 28,
    clockwise: false,
    startAngle: 72,
    tooltip: "Prioritizes content depth + citations",
  },
  {
    name: "Gemini",
    radius: 160,
    duration: 42,
    clockwise: true,
    startAngle: 144,
    tooltip: "Weights schema markup + authority signals",
  },
  {
    name: "Google AI",
    radius: 100,
    duration: 50,
    clockwise: false,
    startAngle: 216,
    tooltip: "Combines traditional SEO + structured data",
  },
  {
    name: "Copilot",
    radius: 180,
    duration: 38,
    clockwise: true,
    startAngle: 288,
    tooltip: "Leverages Bing index + entity data",
  },
];

export default function EngineOrbit() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });
  const [hoveredEngine, setHoveredEngine] = useState<string | null>(null);

  return (
    <div
      ref={ref}
      className="relative flex items-center justify-center"
      style={{ height: 440 }}
    >
      {/* Center radar core */}
      <div className="absolute">
        <div
          className="w-3 h-3 rounded-full bg-[#4F7DF3]"
          style={{
            boxShadow: "0 0 30px rgba(79, 125, 243, 0.4)",
            animation: hoveredEngine ? "center-pulse 0.6s ease-in-out" : "none",
          }}
        />
      </div>

      {/* Orbit rings */}
      {engines.map((engine, i) => (
        <div
          key={engine.name}
          className="absolute rounded-full border border-dashed"
          style={{
            width: engine.radius * 2,
            height: engine.radius * 2,
            borderColor: "rgba(111, 111, 111, 0.12)",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        />
      ))}

      {/* Engine nodes */}
      {engines.map((engine, i) => (
        <motion.div
          key={engine.name}
          className="absolute"
          style={{
            top: "50%",
            left: "50%",
            width: 0,
            height: 0,
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={
            isInView
              ? { opacity: 1, scale: 1 }
              : {}
          }
          transition={{ delay: 0.2 + i * 0.15, duration: 0.5 }}
        >
          <div
            style={{
              animation: isInView
                ? `orbit-${i} ${engine.duration}s linear infinite`
                : "none",
              animationDelay: "0.5s",
              position: "absolute",
              width: 0,
              height: 0,
            }}
          >
            <div
              className="cursor-hover"
              style={{
                transform: `translate(${engine.radius}px, 0) translate(-50%, -50%)`,
                position: "relative",
              }}
              onMouseEnter={() => setHoveredEngine(engine.name)}
              onMouseLeave={() => setHoveredEngine(null)}
            >
              {/* Scan line on hover */}
              {hoveredEngine === engine.name && (
                <div
                  className="absolute top-1/2 right-full w-[calc(100%+var(--line-w))] h-[1px]"
                  style={{
                    ["--line-w" as string]: `${engine.radius}px`,
                    width: engine.radius,
                    background: "linear-gradient(90deg, rgba(79, 125, 243, 0.6), transparent)",
                    transformOrigin: "right center",
                    animation: "scan-connect 0.3s ease-out forwards",
                  }}
                />
              )}

              {/* Engine node */}
              <div
                className="flex items-center justify-center rounded-full border transition-all duration-300"
                style={{
                  width: 56,
                  height: 56,
                  borderColor:
                    hoveredEngine === engine.name
                      ? "rgba(79, 125, 243, 0.5)"
                      : "rgba(111, 111, 111, 0.15)",
                  backgroundColor:
                    hoveredEngine === engine.name
                      ? "rgba(79, 125, 243, 0.08)"
                      : "rgba(229, 228, 224, 0.03)",
                  transform:
                    hoveredEngine === engine.name
                      ? "scale(1.2)"
                      : hoveredEngine && hoveredEngine !== engine.name
                        ? "scale(0.9)"
                        : "scale(1)",
                  opacity:
                    hoveredEngine && hoveredEngine !== engine.name ? 0.4 : 1,
                  // Counter-rotate to keep text upright
                  animation: isInView
                    ? `orbit-counter-${i} ${engine.duration}s linear infinite`
                    : "none",
                  animationDelay: "0.5s",
                }}
              >
                <span className="text-[11px] font-bold tracking-[0.03em] text-[#1A1A2E]/70 text-center leading-tight">
                  {engine.name}
                </span>
              </div>

              {/* Tooltip */}
              {hoveredEngine === engine.name && (
                <motion.div
                  className="absolute top-full left-1/2 -translate-x-1/2 mt-3 whitespace-nowrap"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="px-4 py-2 rounded-[0.625em] bg-[#1A1A2E] text-[#E5E4E0] text-[12px] border border-[rgba(255,255,255,0.08)]">
                    {engine.tooltip}
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      ))}

      <style jsx>{`
        ${engines
          .map(
            (engine, i) => `
          @keyframes orbit-${i} {
            from { transform: rotate(${engine.startAngle}deg); }
            to { transform: rotate(${engine.startAngle + (engine.clockwise ? 360 : -360)}deg); }
          }
          @keyframes orbit-counter-${i} {
            from { transform: rotate(-${engine.startAngle}deg); }
            to { transform: rotate(-${engine.startAngle + (engine.clockwise ? 360 : -360)}deg); }
          }
        `
          )
          .join("\n")}

        @keyframes center-pulse {
          0%, 100% { box-shadow: 0 0 30px rgba(79, 125, 243, 0.4); }
          50% { box-shadow: 0 0 50px rgba(79, 125, 243, 0.8); }
        }

        @keyframes scan-connect {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }
      `}</style>
    </div>
  );
}
