"use client";

import { useEffect, useState } from "react";

interface RadarAnimationProps {
  size?: number;
  className?: string;
}

export default function RadarAnimation({
  size = 320,
  className = "",
}: RadarAnimationProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const rings = [
    { radius: size * 0.25, duration: 60, direction: 1, delay: 0 },
    { radius: size * 0.375, duration: 45, direction: -1, delay: 0.2 },
    { radius: size * 0.5, duration: 90, direction: 1, delay: 0.4 },
  ];

  const dots = [
    { ring: 0, angle: 45, color: "#34D399", label: "You", pulse: true },
    { ring: 0, angle: 200, color: "#F06B6B", label: "", pulse: false },
    { ring: 1, angle: 120, color: "#F06B6B", label: "", pulse: false },
    { ring: 1, angle: 300, color: "rgba(111,111,111,0.4)", label: "", pulse: false },
    { ring: 2, angle: 80, color: "#F06B6B", label: "", pulse: false },
    { ring: 2, angle: 250, color: "rgba(111,111,111,0.4)", label: "", pulse: false },
  ];

  return (
    <div
      className={`relative ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {/* Gradient glow behind */}
      <div
        className="absolute inset-0 rounded-full opacity-20 blur-3xl"
        style={{
          background:
            "linear-gradient(135deg, #4F7DF3, #34D399 45%, #FBBF24)",
        }}
      />

      {/* Center dot */}
      <div
        className="absolute rounded-full bg-[#4F7DF3]"
        style={{
          width: 8,
          height: 8,
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          boxShadow: "0 0 20px rgba(79, 125, 243, 0.6)",
        }}
      />

      {/* Rings */}
      {rings.map((ring, i) => (
        <div
          key={i}
          className="absolute rounded-full border border-dashed"
          style={{
            width: ring.radius * 2,
            height: ring.radius * 2,
            top: "50%",
            left: "50%",
            transform: `translate(-50%, -50%) scale(${mounted ? 1 : 0})`,
            borderColor: "rgba(111, 111, 111, 0.2)",
            transition: `transform 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${ring.delay}s`,
            animation: mounted
              ? `radar-spin-${i} ${ring.duration}s linear infinite`
              : "none",
            animationDelay: `${ring.delay + 0.8}s`,
          }}
        >
          {/* Dots on this ring */}
          {dots
            .filter((d) => d.ring === i)
            .map((dot, j) => {
              const rad = (dot.angle * Math.PI) / 180;
              const x = Math.cos(rad) * ring.radius + ring.radius;
              const y = Math.sin(rad) * ring.radius + ring.radius;
              return (
                <div
                  key={j}
                  className="absolute rounded-full"
                  style={{
                    width: dot.pulse ? 10 : 6,
                    height: dot.pulse ? 10 : 6,
                    backgroundColor: dot.color,
                    left: x - (dot.pulse ? 5 : 3),
                    top: y - (dot.pulse ? 5 : 3),
                    boxShadow: dot.pulse
                      ? `0 0 16px ${dot.color}`
                      : "none",
                    animation: dot.pulse
                      ? "radar-dot-pulse 3s ease-in-out infinite"
                      : "none",
                    animationDelay: `${j * 0.5}s`,
                  }}
                />
              );
            })}
        </div>
      ))}

      <style jsx>{`
        @keyframes radar-spin-0 {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
        @keyframes radar-spin-1 {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(-360deg); }
        }
        @keyframes radar-spin-2 {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
        @keyframes radar-dot-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.3); }
        }
      `}</style>
    </div>
  );
}
