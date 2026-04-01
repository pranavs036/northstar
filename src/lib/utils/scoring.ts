type Severity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

const SEVERITY_WEIGHTS: Record<Severity, number> = {
  CRITICAL: 25,
  HIGH: 15,
  MEDIUM: 8,
  LOW: 3,
};

/**
 * Calculate Agent-Readiness Score (0–100) for a brand's catalog.
 *
 * Score starts at 100 and deducts points based on diagnosis severity.
 * Normalized against total SKU count so larger catalogs aren't unfairly punished.
 */
export function calculateAgentReadinessScore(
  totalSkus: number,
  diagnoses: Array<{ severity: Severity }>
): number {
  if (totalSkus === 0) return 0;

  const totalPenalty = diagnoses.reduce(
    (sum, d) => sum + SEVERITY_WEIGHTS[d.severity],
    0
  );

  // Normalize: max possible penalty per SKU is 25 (all CRITICAL across 5 engines)
  const maxPenalty = totalSkus * 25 * 5; // 5 engines now
  const normalizedPenalty = (totalPenalty / maxPenalty) * 100;

  return Math.max(0, Math.round(100 - normalizedPenalty));
}

/**
 * Calculate Agent-Readiness Score from scan results.
 * Formula: (total brandVisible scans / total scans) * 100
 */
export function calculateVisibilityScore(
  scanResults: Array<{ brandVisible: boolean }>
): number {
  if (scanResults.length === 0) return 0;
  const visibleCount = scanResults.filter((r) => r.brandVisible).length;
  return Math.round((visibleCount / scanResults.length) * 100);
}

/**
 * Calculate per-SKU visibility rate.
 * Formula: (brandVisible scans for this SKU / total scans for this SKU) * 100
 * Returns null if no scans exist for the SKU.
 */
export function calculateSkuVisibilityRate(
  scanResults: Array<{ brandVisible: boolean }>
): number | null {
  if (scanResults.length === 0) return null;
  const visibleCount = scanResults.filter((r) => r.brandVisible).length;
  return visibleCount / scanResults.length;
}

/**
 * Calculate the Visibility Rate stat for the dashboard.
 * Formula: % of SKUs that have at least 1 visible scan result
 */
export function calculateCatalogVisibilityRate(
  skuIds: string[],
  scanResults: Array<{ sku: string; brandVisible: boolean }>
): number {
  if (skuIds.length === 0) return 0;
  const visibleSkuCount = skuIds.filter((skuId) =>
    scanResults.some((r) => r.sku === skuId && r.brandVisible)
  ).length;
  return (visibleSkuCount / skuIds.length) * 100;
}
