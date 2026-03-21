import { NextRequest, NextResponse } from "next/server";
import PocketBase from "pocketbase";
import type {
  DiagnosisRecord,
  ScanResultRecord,
  SkuRecord,
} from "@/types/pocketbase";

const POCKETBASE_URL =
  process.env.NEXT_PUBLIC_POCKETBASE_URL || "http://127.0.0.1:8090";

function toCSV(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (val: unknown): string => {
    const str = val === null || val === undefined ? "" : String(val);
    // Wrap in quotes if it contains commas, quotes, or newlines
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  const headerRow = headers.map(escape).join(",");
  const dataRows = rows.map((row) =>
    headers.map((h) => escape(row[h])).join(",")
  );
  return [headerRow, ...dataRows].join("\n");
}

export async function GET(request: NextRequest) {
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

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") ?? "json"; // "csv" | "json"
  const scope = searchParams.get("scope") ?? "diagnoses"; // "scans" | "diagnoses" | "citations"
  const auditId = searchParams.get("auditId");

  let rows: Record<string, unknown>[] = [];
  let filename = `northstar-${scope}`;

  try {
    // Fetch SKUs for the user (needed to enrich results)
    const skus = await pb.collection("skus").getFullList<SkuRecord>({
      filter: `user="${userId}"`,
    });
    const skuMap = new Map(skus.map((s) => [s.id, s]));

    if (scope === "diagnoses") {
      const filter = auditId
        ? `audit="${auditId}"`
        : `audit.user="${userId}"`;
      const diagnoses = await pb
        .collection("diagnoses")
        .getFullList<DiagnosisRecord>({ filter, sort: "-created" });

      rows = diagnoses.map((d) => {
        const sku = skuMap.get(d.sku);
        return {
          id: d.id,
          audit: d.audit,
          skuCode: sku?.skuCode ?? "",
          skuName: sku?.name ?? "",
          engine: d.engine,
          severity: d.severity,
          reason: d.reason,
          fix: d.fix,
          created: d.created,
        };
      });

      if (auditId) filename += `-${auditId}`;
    } else if (scope === "scans") {
      const skuIds = skus.map((s) => s.id);
      const skuFilter =
        skuIds.length > 0
          ? skuIds.map((id) => `sku="${id}"`).join(" || ")
          : "id=null";
      const scanResults = await pb
        .collection("scan_results")
        .getFullList<ScanResultRecord>({ filter: skuFilter, sort: "-created" });

      rows = scanResults.map((r) => {
        const sku = skuMap.get(r.sku);
        return {
          id: r.id,
          skuCode: sku?.skuCode ?? "",
          skuName: sku?.name ?? "",
          engine: r.engine,
          query: r.query,
          brandVisible: r.brandVisible,
          competitorDomain: r.competitorDomain ?? "",
          sentimentLabel: r.sentimentLabel ?? "",
          sentimentScore: r.sentimentScore ?? "",
          brandCited: r.brandCited ?? "",
          brandPosition: r.brandPosition ?? "",
          created: r.created,
        };
      });
    } else if (scope === "citations") {
      const skuIds = skus.map((s) => s.id);
      const skuFilter =
        skuIds.length > 0
          ? skuIds.map((id) => `sku="${id}"`).join(" || ")
          : "id=null";
      const scanResults = await pb
        .collection("scan_results")
        .getFullList<ScanResultRecord>({
          filter: `(${skuFilter}) && citations != ""`,
          sort: "-created",
        });

      // Flatten citation-level rows
      for (const r of scanResults) {
        const sku = skuMap.get(r.sku);
        if (r.citations) {
          let citations: Array<{
            url?: string;
            domain?: string;
            title?: string;
            position?: number;
          }> = [];
          try {
            citations = JSON.parse(r.citations);
          } catch {
            // skip malformed
          }
          for (const c of citations) {
            rows.push({
              scanId: r.id,
              skuCode: sku?.skuCode ?? "",
              skuName: sku?.name ?? "",
              engine: r.engine,
              query: r.query,
              citationUrl: c.url ?? "",
              citationDomain: c.domain ?? "",
              citationTitle: c.title ?? "",
              citationPosition: c.position ?? "",
              brandVisible: r.brandVisible,
              created: r.created,
            });
          }
        }
      }
    } else {
      return NextResponse.json({ error: "Invalid scope" }, { status: 400 });
    }
  } catch (err) {
    console.error("Export error:", err);
    return NextResponse.json(
      { error: "Failed to fetch export data" },
      { status: 500 }
    );
  }

  if (type === "csv") {
    const csv = toCSV(rows);
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}.csv"`,
      },
    });
  }

  // Default: JSON
  return new NextResponse(JSON.stringify(rows, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}.json"`,
    },
  });
}
