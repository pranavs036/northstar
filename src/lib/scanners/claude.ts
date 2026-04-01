import { getClaudeClient } from "../ai/claude";

interface ScanInput {
  query: string;
  brandDomain: string;
  competitorDomains: string[];
}

interface BrandMention {
  name: string;
  position: number; // 1-based rank in the response
  domain?: string;  // matched domain if known
}

interface ScanOutput {
  engine: "CLAUDE";
  query: string;
  brandVisible: boolean;
  brandPosition: number;       // 0 = not found, 1 = first mentioned, etc.
  competitorDomain: string;
  competitorPositions: Array<{ domain: string; name: string; position: number }>;
  totalBrandsMentioned: number;
  rawResponse: string;
}

// Extract brand names and their positions from an AI response
function extractBrandPositions(
  response: string,
  brandDomain: string,
  competitorDomains: string[]
): { brandPosition: number; competitors: Array<{ domain: string; name: string; position: number }>; totalMentioned: number } {
  const lines = response.split("\n");
  const mentions: BrandMention[] = [];

  // Build lookup for brand and competitors
  const brandNames = getBrandNames(brandDomain);
  const competitorLookup = competitorDomains.map((d) => ({
    domain: d,
    names: getBrandNames(d),
  }));

  // Scan each line for numbered items or brand mentions
  let positionCounter = 0;
  const seen = new Set<string>();

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Check if this line looks like a recommendation (numbered, bulleted, or bold)
    const isListItem = /^[\d]+[\.\)]\s|^[-•*]\s|^\*\*/.test(trimmed);
    if (isListItem) {
      positionCounter++;
    }

    const lineLower = trimmed.toLowerCase();

    // Check brand
    for (const name of brandNames) {
      if (lineLower.includes(name) && !seen.has("brand")) {
        seen.add("brand");
        mentions.push({ name: brandDomain, position: positionCounter || mentions.length + 1 });
      }
    }

    // Check each competitor
    for (const comp of competitorLookup) {
      if (seen.has(comp.domain)) continue;
      for (const name of comp.names) {
        if (lineLower.includes(name)) {
          seen.add(comp.domain);
          mentions.push({ name: comp.domain, position: positionCounter || mentions.length + 1, domain: comp.domain });
          break;
        }
      }
    }
  }

  // Sort by position
  mentions.sort((a, b) => a.position - b.position);

  const brandMention = mentions.find((m) => m.name === brandDomain);
  const competitorMentions = mentions
    .filter((m) => m.domain && m.name !== brandDomain)
    .map((m) => ({ domain: m.domain!, name: m.domain!.split(".")[0], position: m.position }));

  return {
    brandPosition: brandMention?.position || 0,
    competitors: competitorMentions,
    totalMentioned: Math.max(positionCounter, mentions.length),
  };
}

// Get searchable name variants from a domain
function getBrandNames(domain: string): string[] {
  const clean = domain.toLowerCase().replace(/^www\./, "").replace(/\/$/, "");
  const base = clean.split(".")[0]; // "boat-lifestyle" from "boat-lifestyle.com"
  const names = [
    clean,                        // boat-lifestyle.com
    base,                         // boat-lifestyle
    base.replace(/-/g, " "),      // boat lifestyle
    base.replace(/-/g, ""),       // boatlifestyle
  ];

  // Common brand name mappings
  const brandMap: Record<string, string[]> = {
    "boat-lifestyle": ["boat", "boAt"],
    "amazon": ["amazon"],
    "flipkart": ["flipkart"],
    "gonoise": ["noise"],
    "myntra": ["myntra"],
    "ajio": ["ajio"],
    "thesouledstore": ["souled store", "the souled store"],
    "pepperfry": ["pepperfry"],
    "sleepyhead": ["sleepyhead"],
    "ikea": ["ikea"],
    "wakefit": ["wakefit"],
    "bewakoof": ["bewakoof"],
    "giveasy": ["giveasy", "give easy"],
    "cashify": ["cashify"],
    "olx": ["olx"],
    "quikr": ["quikr"],
  };

  for (const [key, aliases] of Object.entries(brandMap)) {
    if (base.includes(key)) {
      names.push(...aliases);
    }
  }

  return Array.from(new Set(names.map((n) => n.toLowerCase())));
}

export async function scanClaude(input: ScanInput): Promise<ScanOutput> {
  try {
    const claude = getClaudeClient();

    const response = await claude.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 512,
      messages: [
        {
          role: "user",
          content: input.query,
        },
      ],
    });

    const rawResponse = response.content[0].type === "text" ? response.content[0].text : "";

    // Extract positions
    const { brandPosition, competitors, totalMentioned } = extractBrandPositions(
      rawResponse,
      input.brandDomain,
      input.competitorDomains
    );

    const brandVisible = brandPosition > 0;

    // First competitor mentioned (for backward compat)
    const firstCompetitor = competitors.length > 0 ? competitors[0].domain : "";

    return {
      engine: "CLAUDE",
      query: input.query,
      brandVisible,
      brandPosition,
      competitorDomain: firstCompetitor,
      competitorPositions: competitors,
      totalBrandsMentioned: totalMentioned,
      rawResponse: rawResponse.slice(0, 10000),
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return {
      engine: "CLAUDE",
      query: input.query,
      brandVisible: false,
      brandPosition: 0,
      competitorDomain: "",
      competitorPositions: [],
      totalBrandsMentioned: 0,
      rawResponse: `[ERROR] Claude API failed: ${msg}`,
    };
  }
}
