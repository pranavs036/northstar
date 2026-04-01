"use client";

import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";

export default function LandingFooter() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <footer ref={ref} className="bg-[#E5E4E0] text-[#1A1A2E]">
      <div className="max-w-[1200px] mx-auto px-6 md:px-12 py-24 md:py-32">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-24">
          {/* Left: CTA */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-[clamp(32px,5vw,48px)] leading-[1.05] tracking-[-0.02em] uppercase font-normal mb-8">
              Ready to see what AI thinks about your brand?
            </h2>
            <Link
              href="/demo"
              className="inline-flex items-center gap-2 text-[14px] font-bold px-7 py-3.5 rounded-[6.25em] border border-[rgba(111,111,111,0.15)] bg-[#E5E4E0] hover:bg-[#4F7DF3]/10 transition-all"
            >
              Try Free Audit <span aria-hidden="true">&rarr;</span>
            </Link>
          </motion.div>

          {/* Right: Sitemap */}
          <motion.div
            className="grid grid-cols-2 gap-12"
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            <div>
              <h3 className="text-[13px] tracking-[0.05em] uppercase text-[#1A1A2E]/40 mb-6">
                Product
              </h3>
              <ul className="space-y-3">
                {[
                  { label: "Free Audit", href: "/demo" },
                  { label: "Dashboard", href: "/dashboard" },
                  { label: "Audit", href: "/audit" },
                  { label: "Brand Scan", href: "/scan" },
                  { label: "Schema Audit", href: "/schema" },
                  { label: "Pricing", href: "/pricing" },
                ].map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-[14px] text-[#1A1A2E]/60 hover:text-[#1A1A2E] transition-colors flex items-center gap-1.5"
                    >
                      {link.label}{" "}
                      <span className="text-[11px] opacity-0 group-hover:opacity-100 transition-opacity">
                        &rarr;
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-[13px] tracking-[0.05em] uppercase text-[#1A1A2E]/40 mb-6">
                Connect
              </h3>
              <ul className="space-y-3">
                {[
                  { label: "Twitter", href: "https://twitter.com" },
                  { label: "LinkedIn", href: "https://linkedin.com" },
                ].map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[14px] text-[#1A1A2E]/60 hover:text-[#1A1A2E] transition-colors flex items-center gap-1.5"
                    >
                      {link.label}{" "}
                      <span className="text-[11px]">&rarr;</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        </div>

        {/* Bottom bar */}
        <div className="mt-24 pt-8 border-t border-[rgba(111,111,111,0.15)] flex items-center justify-between">
          <p className="text-[13px] text-[#1A1A2E]/40">
            &copy; 2026 NorthStar
          </p>
          <span className="text-[13px] font-bold tracking-[0.05em] uppercase text-[#1A1A2E]/20">
            NorthStar
          </span>
        </div>
      </div>
    </footer>
  );
}
