import { z } from "zod";

export const StartAuditSchema = z.object({
  brandId: z.string().cuid(),
});

export type StartAuditInput = z.infer<typeof StartAuditSchema>;

export interface AuditSummary {
  id: string;
  status: "PENDING" | "SCANNING" | "ANALYZING" | "COMPLETE" | "FAILED";
  agentScore: number | null;
  createdAt: string;
  completedAt: string | null;
  totalSkus: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
}

export interface DiagnosisResult {
  id: string;
  skuCode: string;
  skuName: string;
  engine: "CHATGPT" | "GOOGLE" | "PERPLEXITY" | "BING";
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  reason: string;
  fix: string;
  competitorData: Record<string, unknown> | null;
}
