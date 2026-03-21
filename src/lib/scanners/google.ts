import { chromium } from "playwright";

export async function scanGoogle({
  query,
  brandDomain,
  competitorDomains,
}: {
  query: string;
  brandDomain: string;
  competitorDomains: string[];
}) {
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.setExtraHTTPHeaders({
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    });

    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    await page.goto(searchUrl, { waitUntil: "networkidle", timeout: 15000 });

    // Look for AI Overview container
    const aiOverviewSelectors = [
      '[data-attrid="ai_overview"]',
      ".xpdopen .LGOjhe",
      "#m-x-content",
      '[jsname="Cpkphb"]',
    ];

    let aiContent = "";
    for (const selector of aiOverviewSelectors) {
      const element = await page.$(selector);
      if (element) {
        aiContent = (await element.textContent()) || "";
        break;
      }
    }

    // Fallback: grab entire search results text
    if (!aiContent) {
      aiContent = (await page.textContent("#search")) || "";
    }

    const normalizedBrand = brandDomain.replace(/^www\./, "").toLowerCase();
    const brandVisible = aiContent.toLowerCase().includes(normalizedBrand);

    let competitorDomain = "";
    for (const comp of competitorDomains) {
      const normalizedComp = comp.replace(/^www\./, "").toLowerCase();
      if (aiContent.toLowerCase().includes(normalizedComp)) {
        competitorDomain = comp;
        break;
      }
    }

    return {
      engine: "GOOGLE" as const,
      query,
      brandVisible,
      competitorDomain,
      rawResponse: aiContent.slice(0, 10000),
    };
  } catch (error) {
    return {
      engine: "GOOGLE" as const,
      query,
      brandVisible: false,
      competitorDomain: "",
      rawResponse: `[ERROR] ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  } finally {
    if (browser) await browser.close();
  }
}
