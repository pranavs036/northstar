interface ScanInput {
  query: string;
  brandDomain: string;
  competitorDomains: string[];
}

interface ScanOutput {
  engine: "GOOGLE";
  query: string;
  brandVisible: boolean;
  competitorDomain: string;
  rawResponse: string;
}

export async function scanGoogle(input: ScanInput): Promise<ScanOutput> {
  // Google AI Overview scanning requires Playwright headless browser
  // This is a stub — will be implemented when browser automation is set up
  return {
    engine: "GOOGLE",
    query: input.query,
    brandVisible: false,
    competitorDomain: "",
    rawResponse:
      "[STUB] Google AI Overview scanning requires Playwright. Will be enabled in a future update.",
  };
}
