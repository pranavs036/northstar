import type { RecordModel } from "pocketbase";

export interface BrandScanRecord extends RecordModel {
  user: string;
  status: "PENDING" | "SCANNING" | "COMPLETE" | "FAILED";
  brandName: string;
  brandDomain: string;
  brandDescription: string;
  categories: string; // JSON string of string[]
  totalQueries: number;
  completedQueries: number;
  brandVisibleCount: number;
  visibilityScore: number; // 0-100
  results: string; // JSON string of BrandScanResult[]
  tierScores: string; // JSON string of TierScores
  completedAt: string;
}

export interface CompetitorPosition {
  domain: string;
  name: string;
  position: number;
}

export interface BrandScanResult {
  query: string;
  tier: "awareness" | "category" | "intent" | "competitor" | "thought_leadership";
  intent: string;
  engine: string;
  brandVisible: boolean;
  brandPosition: number;               // 0 = not found, 1 = first, 2 = second...
  competitorMentioned: string;         // first competitor domain (backward compat)
  competitorPositions: CompetitorPosition[]; // all competitors with positions
  totalBrandsMentioned: number;
  rawResponse: string;
  sentimentLabel?: "POSITIVE" | "NEUTRAL" | "NEGATIVE";
}

export interface TierScores {
  awareness: TierScore;
  category: TierScore;
  intent: TierScore;
  competitor: TierScore;
  thought_leadership: TierScore;
}

export interface TierScore {
  total: number;
  visible: number;
  score: number;
  avgPosition: number; // average brand position in this tier (0 if never found)
}

export interface BrandScanSSEEvent {
  type: "started" | "progress" | "query-result" | "complete" | "error";
  scanId: string;
  message: string;
  progress: number; // 0-100
  data?: Record<string, unknown>;
}
