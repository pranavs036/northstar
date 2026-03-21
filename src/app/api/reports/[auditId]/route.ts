import { NextRequest, NextResponse } from "next/server";
import PocketBase from "pocketbase";
import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import { AuditReport } from "@/lib/utils/pdf-report";
import type {
  AuditRecord,
  DiagnosisRecord,
  ScanResultRecord,
  SkuRecord,
  UserRecord,
} from "@/types/pocketbase";

const POCKETBASE_URL =
  process.env.NEXT_PUBLIC_POCKETBASE_URL || "http://127.0.0.1:8090";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ auditId: string }> }
) {
  const { auditId } = await params;

  // ── 1. Auth via PocketBase cookie ───────────────────────────────────────
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
    // ── 2. Fetch audit record ─────────────────────────────────────────────
    const audit = await pb
      .collection("audits")
      .getOne<AuditRecord>(auditId);

    if (audit.user !== userId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // ── 3. Fetch user's brand name ────────────────────────────────────────
    const user = await pb
      .collection("users")
      .getOne<UserRecord>(userId);

    // ── 4. Fetch diagnoses, SKUs, and scan results ────────────────────────
    const [diagnoses, skus, scanResults] = await Promise.all([
      pb.collection("diagnoses").getFullList<DiagnosisRecord>({
        filter: `audit="${auditId}"`,
        sort: "-created",
      }),
      pb.collection("skus").getFullList<SkuRecord>({
        filter: `user="${userId}"`,
      }),
      pb.collection("scan_results").getFullList<ScanResultRecord>({
        filter: `sku.user="${userId}"`,
      }),
    ]);

    const skuMap = new Map(skus.map((s) => [s.id, s]));

    // ── 5. Compute metrics ────────────────────────────────────────────────

    // Visibility rate (across all scan results belonging to the user's SKUs)
    const userScanResults = scanResults.filter((r) =>
      skus.some((s) => s.id === r.sku)
    );
    const totalScans = userScanResults.length;
    const visibleScans = userScanResults.filter((r) => r.brandVisible).length;
    const visibilityRate =
      totalScans > 0 ? Math.round((visibleScans / totalScans) * 100) : 0;

    // Engine breakdown
    const engines = ["CHATGPT", "PERPLEXITY", "GOOGLE", "GEMINI", "COPILOT"] as const;
    const engineLabels: Record<string, string> = {
      CHATGPT: "ChatGPT",
      PERPLEXITY: "Perplexity",
      GOOGLE: "Google AI",
      GEMINI: "Gemini",
      COPILOT: "Copilot",
    };
    const engineBreakdown = engines
      .map((engine) => {
        const engineScans = userScanResults.filter((r) => r.engine === engine);
        const visible = engineScans.filter((r) => r.brandVisible).length;
        return {
          engine: engineLabels[engine],
          visible,
          total: engineScans.length,
        };
      })
      .filter((e) => e.total > 0); // omit engines with no data

    // Sentiment summary
    const sentimentSummary = userScanResults.reduce(
      (acc, r) => {
        if (r.sentimentLabel === "POSITIVE") acc.positive += 1;
        else if (r.sentimentLabel === "NEUTRAL") acc.neutral += 1;
        else if (r.sentimentLabel === "NEGATIVE") acc.negative += 1;
        return acc;
      },
      { positive: 0, neutral: 0, negative: 0 }
    );

    // Diagnoses for PDF (flatten sku name)
    const pdfDiagnoses = diagnoses.map((d) => ({
      skuName: skuMap.get(d.sku)?.name ?? "Unknown SKU",
      engine: d.engine,
      severity: d.severity,
      reason: d.reason,
      fix: d.fix,
    }));

    // Audit date
    const auditDate = new Date(audit.created).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    // ── 6. Render PDF ─────────────────────────────────────────────────────
    const pdfBuffer = await renderToBuffer(
      createElement(AuditReport, {
        brandName: user.brandName || user.name || "Your Brand",
        auditDate,
        agentScore: audit.agentScore ?? 0,
        visibilityRate,
        totalSkus: skus.length,
        engineBreakdown,
        diagnoses: pdfDiagnoses,
        sentimentSummary,
      })
    );

    // ── 7. Return PDF response ────────────────────────────────────────────
    const filename = `northstar-audit-${auditId}.pdf`;

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": pdfBuffer.byteLength.toString(),
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[PDF report] generation failed:", err);
    return NextResponse.json(
      { error: "Failed to generate PDF report" },
      { status: 500 }
    );
  }
}
