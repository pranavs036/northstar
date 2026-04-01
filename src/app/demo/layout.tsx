import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free AI Visibility Audit | NorthStar",
  description:
    "See how AI search engines like ChatGPT, Perplexity, and Google AI see your brand. Get a free visibility score and actionable diagnosis in under 60 seconds.",
};

export default function DemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
