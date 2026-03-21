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
