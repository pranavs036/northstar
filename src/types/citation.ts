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
}
