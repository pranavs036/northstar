"use client";

import { useEffect, useRef, useState } from "react";

export default function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const position = useRef({ x: 0, y: 0 });
  const target = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number>(0);

  useEffect(() => {
    // Only show custom cursor on non-touch devices
    if (typeof window === "undefined" || "ontouchstart" in window) return;

    const handleMouseMove = (e: MouseEvent) => {
      target.current = { x: e.clientX, y: e.clientY };
      if (!isVisible) setIsVisible(true);
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const isInteractive =
        target.closest("a") ||
        target.closest("button") ||
        target.closest("[role='button']") ||
        target.closest(".cursor-hover");
      setIsHovering(!!isInteractive);
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    const animate = () => {
      position.current.x += (target.current.x - position.current.x) * 0.15;
      position.current.y += (target.current.y - position.current.y) * 0.15;
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${position.current.x - (isHovering ? 20 : 10)}px, ${position.current.y - (isHovering ? 20 : 10)}px, 0)`;
      }
      rafRef.current = requestAnimationFrame(animate);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseover", handleMouseOver);
    document.addEventListener("mouseleave", handleMouseLeave);
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseover", handleMouseOver);
      document.removeEventListener("mouseleave", handleMouseLeave);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isHovering, isVisible]);

  if (typeof window !== "undefined" && "ontouchstart" in window) return null;

  return (
    <div
      ref={cursorRef}
      className="fixed top-0 left-0 pointer-events-none z-[9999] hidden md:block"
      style={{
        width: isHovering ? 40 : 20,
        height: isHovering ? 40 : 20,
        borderRadius: "50%",
        backgroundColor: isHovering ? "transparent" : "rgba(255, 255, 255, 0.6)",
        border: isHovering ? "1.5px solid rgba(255, 255, 255, 0.6)" : "none",
        mixBlendMode: "difference",
        opacity: isVisible ? 1 : 0,
        transition: "width 0.25s cubic-bezier(0.16, 1, 0.3, 1), height 0.25s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.25s, border 0.25s, opacity 0.3s",
        willChange: "transform",
      }}
    />
  );
}
