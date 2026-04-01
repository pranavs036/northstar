import type { RecordModel } from "pocketbase";

export interface UserRecord extends RecordModel {
  email: string;
  name: string;
  brandName: string;
  domain: string;
  plan: "FREE" | "AUDIT" | "MAINTENANCE";
  verified: boolean;
  role?: "owner" | "admin" | "editor" | "viewer";
}

export interface TeamMemberRecord extends RecordModel {
  id: string;
  owner: string; // user ID of brand owner
  member: string; // user ID of team member
  role: "owner" | "admin" | "editor" | "viewer";
  inviteToken?: string;
  inviteEmail: string;
  inviteAccepted: boolean;
  created: string;
}

export interface SkuRecord extends RecordModel {
  user: string;
  skuCode: string;
  name: string;
  category: string;
  url: string;
  description: string;
}

export interface CompetitorRecord extends RecordModel {
  user: string;
  domain: string;
  name: string;
}

export interface AuditRecord extends RecordModel {
  user: string;
  status: "PENDING" | "SCANNING" | "ANALYZING" | "COMPLETE" | "FAILED";
  agentScore: number | null;
  reportUrl: string;
  completedAt: string;
}

export interface ScanResultRecord extends RecordModel {
  sku: string;
  engine: "CHATGPT" | "CLAUDE" | "GOOGLE" | "PERPLEXITY" | "BING" | "GEMINI" | "COPILOT";
  query: string;
  brandVisible: boolean;
  competitorDomain: string;
  rawResponse: string;
  sentimentLabel?: "POSITIVE" | "NEUTRAL" | "NEGATIVE";
  sentimentScore?: number;
  sentimentReasoning?: string;
  citations?: string; // JSON string of Citation[]
  citationCount?: number;
  brandCited?: boolean;
  brandPosition?: number;
}

export interface DiagnosisRecord extends RecordModel {
  audit: string;
  sku: string;
  engine: "CHATGPT" | "CLAUDE" | "GOOGLE" | "PERPLEXITY" | "BING" | "GEMINI" | "COPILOT";
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  reason: string;
  fix: string;
  competitorData: Record<string, unknown> | null;
  brandPdpData: Record<string, unknown> | null;
}
