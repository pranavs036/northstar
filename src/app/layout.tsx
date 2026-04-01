import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NorthStar — AI Ecommerce Optimization",
  description:
    "Products don't get searched anymore. They get recommended. NorthStar finds why AI recommends your competitors — and fixes it.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          href="https://api.fontshare.com/v2/css?f[]=satoshi@400,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        style={{ fontFamily: "'Satoshi', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}
      >
        {children}
      </body>
    </html>
  );
}
