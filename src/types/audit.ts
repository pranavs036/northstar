import { z } from "zod";

export const StartAuditSchema = z.object({
  brandId: z.string().min(1),
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

// SSE event types for real-time audit progress
export type AuditEventType =
  | "audit:started"
  | "audit:query-gen"
  | "audit:scanning"
  | "audit:scan-result"
  | "audit:diagnosing"
  | "audit:diagnosis-result"
  | "audit:scoring"
  | "audit:complete"
  | "audit:error";

export interface AuditEvent {
  type: AuditEventType;
  data: {
    auditId: string;
    message: string;
    progress?: number; // 0-100
    skuName?: string;
    engine?: string;
    severity?: string;
  };
}
