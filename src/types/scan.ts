export interface ScanResultEntry {
  id: string;
  engine: "CHATGPT" | "GOOGLE" | "PERPLEXITY" | "BING";
  query: string;
  brandVisible: boolean;
  competitorDomain: string | null;
  scannedAt: string;
}

export interface EngineVisibility {
  engine: "CHATGPT" | "GOOGLE" | "PERPLEXITY" | "BING";
  totalQueries: number;
  visibleCount: number;
  visibilityRate: number;
}

export interface CompetitorEntry {
  id: string;
  domain: string;
  name: string | null;
}
