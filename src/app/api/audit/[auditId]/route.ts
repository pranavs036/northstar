import { NextRequest, NextResponse } from "next/server";
import PocketBase from "pocketbase";
import type {
  AuditRecord,
  DiagnosisRecord,
  ScanResultRecord,
  SkuRecord,
} from "@/types/pocketbase";

const POCKETBASE_URL =
  process.env.NEXT_PUBLIC_POCKETBASE_URL || "http://127.0.0.1:8090";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ auditId: string }> }
) {
  const { auditId } = await params;

  const pb = new PocketBase(POCKETBASE_URL);
  const pbCookie = request.cookies.get("pb_auth");
  if (!pbCookie) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  pb.authStore.loadFromCookie(`pb_auth=${pbCookie.value}`);

  if (!pb.authStore.isValid || !pb.authStore.record) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = pb.authStore.record.id;

  try {
    const audit = await pb
      .collection("audits")
      .getOne<AuditRecord>(auditId);

    if (audit.user !== userId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Fetch diagnoses and scan results
    const [diagnoses, scanResults, skus] = await Promise.all([
      pb.collection("diagnoses").getFullList<DiagnosisRecord>({
        filter: `audit="${auditId}"`,
        sort: "-created",
      }),
      pb.collection("scan_results").getFullList<ScanResultRecord>({
        filter: `sku.user="${userId}"`,
      }),
      pb.collection("skus").getFullList<SkuRecord>({
        filter: `user="${userId}"`,
      }),
    ]);

    const skuMap = new Map(skus.map((s) => [s.id, s]));

    const diagnosisResults = diagnoses.map((d) => {
      const sku = skuMap.get(d.sku);
      return {
        id: d.id,
        skuCode: sku?.skuCode || "Unknown",
        skuName: sku?.name || "Unknown",
        engine: d.engine,
        severity: d.severity,
        reason: d.reason,
        fix: d.fix,
        competitorData: d.competitorData,
      };
    });

    const severityCounts = {
      criticalCount: diagnoses.filter((d) => d.severity === "CRITICAL").length,
      highCount: diagnoses.filter((d) => d.severity === "HIGH").length,
      mediumCount: diagnoses.filter((d) => d.severity === "MEDIUM").length,
      lowCount: diagnoses.filter((d) => d.severity === "LOW").length,
    };

    return NextResponse.json({
      audit: {
        id: audit.id,
        status: audit.status,
        agentScore: audit.agentScore,
        createdAt: audit.created,
        completedAt: audit.completedAt,
        totalSkus: skus.length,
        ...severityCounts,
      },
      diagnoses: diagnosisResults,
      scanResults: scanResults.map((r) => ({
        id: r.id,
        skuId: r.sku,
        skuName: skuMap.get(r.sku)?.name || "Unknown",
        engine: r.engine,
        query: r.query,
        brandVisible: r.brandVisible,
        competitorDomain: r.competitorDomain,
      })),
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch audit details" },
      { status: 500 }
    );
  }
}
