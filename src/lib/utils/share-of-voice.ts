export interface ShareOfVoice {
  brandDomain: string;
  percentage: number;
  mentionCount: number;
}

export function calculateShareOfVoice(
  scanResults: Array<{
    brandVisible: boolean;
    competitorDomain: string;
    engine: string;
  }>,
  brandDomain: string,
  competitorDomains: string[]
): ShareOfVoice[] {
  const totalScans = scanResults.length;
  if (totalScans === 0) return [];

  const brandMentions = scanResults.filter((r) => r.brandVisible).length;

  const competitorMentions = competitorDomains.map((domain) => ({
    brandDomain: domain,
    mentionCount: scanResults.filter((r) => r.competitorDomain === domain).length,
    percentage: 0,
  }));

  const totalMentions = brandMentions + competitorMentions.reduce((sum, c) => sum + c.mentionCount, 0);

  if (totalMentions === 0) return [];

  const result: ShareOfVoice[] = [
    {
      brandDomain,
      mentionCount: brandMentions,
      percentage: Math.round((brandMentions / totalMentions) * 100),
    },
    ...competitorMentions.map((c) => ({
      ...c,
      percentage: Math.round((c.mentionCount / totalMentions) * 100),
    })),
  ];

  return result.sort((a, b) => b.percentage - a.percentage);
}
