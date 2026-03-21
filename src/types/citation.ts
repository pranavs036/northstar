export interface Citation {
  url: string;
  domain: string;
  context: string;
  isBrandCitation: boolean;
  isCompetitorCitation: boolean;
}

export interface CitationAnalysis {
  citations: Citation[];
  totalCitations: number;
  brandCitations: number;
  competitorCitations: number;
  uniqueDomains: string[];
  brandPosition: number; // 0 = not mentioned, 1 = first, 2 = second, etc.
}
