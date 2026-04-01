"use client";

import { useEffect, useState } from "react";

export default function ScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(docHeight > 0 ? scrollTop / docHeight : 0);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="fixed left-4 top-0 bottom-0 z-50 hidden md:flex flex-col items-center pointer-events-none">
      {/* Track */}
      <div className="w-[2px] h-full bg-[rgba(111,111,111,0.15)] relative">
        {/* Active dot */}
        <div
          className="absolute left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-[#4F7DF3] transition-[top] duration-100"
          style={{
            top: `${progress * 100}%`,
            boxShadow: "0 0 8px rgba(79, 125, 243, 0.4)",
          }}
        />
      </div>
    </div>
  );
}
