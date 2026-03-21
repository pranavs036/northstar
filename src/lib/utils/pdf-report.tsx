import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

// ─── Colour palette ────────────────────────────────────────────────────────
const COLORS = {
  brand: "#6366F1",        // indigo
  brandLight: "#EEF2FF",
  success: "#22C55E",
  warning: "#F59E0B",
  error: "#EF4444",
  text: "#0F172A",
  textMuted: "#64748B",
  border: "#E2E8F0",
  bg: "#F8FAFC",
  white: "#FFFFFF",
};

// ─── Styles ────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // Page
  page: {
    fontFamily: "Helvetica",
    backgroundColor: COLORS.white,
    paddingBottom: 48,
  },
  coverPage: {
    fontFamily: "Helvetica",
    backgroundColor: COLORS.brand,
    paddingBottom: 0,
  },

  // Footer
  footer: {
    position: "absolute",
    bottom: 16,
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 8,
    color: COLORS.textMuted,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 8,
    marginHorizontal: 40,
  },

  // Cover
  coverHeader: {
    paddingTop: 72,
    paddingHorizontal: 48,
  },
  coverBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 4,
    paddingVertical: 4,
    paddingHorizontal: 10,
    alignSelf: "flex-start",
    marginBottom: 24,
  },
  coverBadgeText: {
    color: COLORS.white,
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  coverTitle: {
    color: COLORS.white,
    fontSize: 34,
    fontFamily: "Helvetica-Bold",
    marginBottom: 8,
    lineHeight: 1.2,
  },
  coverSubtitle: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 14,
    marginBottom: 48,
  },
  coverDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.25)",
    marginHorizontal: 48,
    marginBottom: 40,
  },
  coverScoreContainer: {
    paddingHorizontal: 48,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 16,
  },
  coverScoreLabel: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 11,
    marginBottom: 6,
  },
  coverScoreValue: {
    color: COLORS.white,
    fontSize: 80,
    fontFamily: "Helvetica-Bold",
    lineHeight: 1,
  },
  coverScoreUnit: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 22,
    marginBottom: 14,
  },
  coverDateRow: {
    position: "absolute",
    bottom: 40,
    left: 48,
    right: 48,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  coverDateText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 10,
  },
  coverNorthstar: {
    color: COLORS.white,
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
  },

  // Content pages
  pageHeader: {
    backgroundColor: COLORS.brand,
    paddingVertical: 18,
    paddingHorizontal: 40,
    marginBottom: 28,
  },
  pageHeaderText: {
    color: COLORS.white,
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.5,
  },
  pageHeaderSub: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 9,
    marginTop: 2,
  },
  section: {
    paddingHorizontal: 40,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: COLORS.text,
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },

  // Metric cards
  metricRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 4,
  },
  metricCard: {
    flex: 1,
    backgroundColor: COLORS.bg,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
  },
  metricLabel: {
    fontSize: 8,
    color: COLORS.textMuted,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  metricValue: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: COLORS.text,
  },
  metricUnit: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontFamily: "Helvetica",
  },

  // Sentiment row
  sentimentRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  sentimentCard: {
    flex: 1,
    borderRadius: 6,
    padding: 12,
    alignItems: "center",
  },
  sentimentLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  sentimentValue: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
  },

  // Engine breakdown table
  table: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: COLORS.bg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tableRowLast: {
    flexDirection: "row",
    paddingVertical: 9,
    paddingHorizontal: 12,
  },
  tableHeaderCell: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: COLORS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tableCell: {
    fontSize: 9,
    color: COLORS.text,
  },
  colEngine: { flex: 2 },
  colVisible: { flex: 1 },
  colTotal: { flex: 1 },
  colRate: { flex: 1 },

  // Progress bar
  progressTrack: {
    height: 5,
    backgroundColor: COLORS.border,
    borderRadius: 3,
    marginTop: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: 5,
    borderRadius: 3,
  },

  // Findings
  findingCard: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    marginBottom: 8,
    overflow: "hidden",
  },
  findingHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 8,
  },
  findingBody: {
    padding: 12,
    gap: 6,
  },
  severityBadge: {
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: 3,
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  findingSkuName: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: COLORS.text,
    flex: 1,
  },
  findingEngineBadge: {
    backgroundColor: COLORS.brandLight,
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: 3,
    fontSize: 7,
    color: COLORS.brand,
    fontFamily: "Helvetica-Bold",
  },
  findingLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: COLORS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  findingText: {
    fontSize: 8.5,
    color: COLORS.text,
    lineHeight: 1.5,
  },

  // Recommendation cards
  recCard: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    marginBottom: 8,
    overflow: "hidden",
  },
  recAccent: {
    width: 4,
    backgroundColor: COLORS.brand,
  },
  recBody: {
    flex: 1,
    padding: 12,
    gap: 4,
  },
  recTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: COLORS.text,
  },
  recText: {
    fontSize: 8.5,
    color: COLORS.textMuted,
    lineHeight: 1.5,
  },
  recMeta: {
    flexDirection: "row",
    gap: 8,
    marginTop: 2,
  },
});

// ─── Helpers ───────────────────────────────────────────────────────────────

function severityColor(severity: string): string {
  switch (severity) {
    case "CRITICAL": return COLORS.error;
    case "HIGH":     return COLORS.warning;
    case "MEDIUM":   return "#8B5CF6";
    default:         return COLORS.textMuted;
  }
}

function scoreColor(score: number): string {
  if (score >= 75) return COLORS.success;
  if (score >= 50) return COLORS.warning;
  return COLORS.error;
}

function visibilityBarColor(rate: number): string {
  if (rate >= 70) return COLORS.success;
  if (rate >= 40) return COLORS.warning;
  return COLORS.error;
}

const SEVERITY_ORDER: Record<string, number> = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};

// ─── Footer ────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <Text style={styles.footer} fixed>
      Generated by NorthStar — AI Visibility Intelligence Platform
    </Text>
  );
}

// ─── Props ─────────────────────────────────────────────────────────────────

export interface AuditReportProps {
  brandName: string;
  auditDate: string;
  agentScore: number;
  visibilityRate: number;
  totalSkus: number;
  engineBreakdown: Array<{ engine: string; visible: number; total: number }>;
  diagnoses: Array<{
    skuName: string;
    engine: string;
    severity: string;
    reason: string;
    fix: string;
  }>;
  sentimentSummary: { positive: number; neutral: number; negative: number };
}

// ─── Cover Page ────────────────────────────────────────────────────────────

function CoverPage({
  brandName,
  auditDate,
  agentScore,
}: Pick<AuditReportProps, "brandName" | "auditDate" | "agentScore">) {
  return (
    <Page size="A4" style={styles.coverPage}>
      <View style={styles.coverHeader}>
        <View style={styles.coverBadge}>
          <Text style={styles.coverBadgeText}>NorthStar Audit Report</Text>
        </View>
        <Text style={styles.coverTitle}>{brandName}</Text>
        <Text style={styles.coverSubtitle}>AI Visibility Audit Report</Text>
      </View>

      <View style={styles.coverDivider} />

      <View style={styles.coverScoreContainer}>
        <View>
          <Text style={styles.coverScoreLabel}>Agent-Readiness Score</Text>
          <View style={{ flexDirection: "row", alignItems: "flex-end" }}>
            <Text
              style={[
                styles.coverScoreValue,
                { color: scoreColor(agentScore) },
              ]}
            >
              {agentScore}
            </Text>
            <Text style={styles.coverScoreUnit}> /100</Text>
          </View>
        </View>
      </View>

      <View style={styles.coverDateRow}>
        <Text style={styles.coverDateText}>{auditDate}</Text>
        <Text style={styles.coverNorthstar}>northstar.ai</Text>
      </View>
    </Page>
  );
}

// ─── Executive Summary ─────────────────────────────────────────────────────

function ExecutiveSummaryPage({
  agentScore,
  visibilityRate,
  totalSkus,
  sentimentSummary,
  auditDate,
}: Pick<
  AuditReportProps,
  "agentScore" | "visibilityRate" | "totalSkus" | "sentimentSummary" | "auditDate"
>) {
  const total =
    sentimentSummary.positive +
    sentimentSummary.neutral +
    sentimentSummary.negative;

  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.pageHeader}>
        <Text style={styles.pageHeaderText}>Executive Summary</Text>
        <Text style={styles.pageHeaderSub}>{auditDate}</Text>
      </View>

      {/* Key metrics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Key Metrics</Text>
        <View style={styles.metricRow}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Agent-Readiness Score</Text>
            <Text
              style={[styles.metricValue, { color: scoreColor(agentScore) }]}
            >
              {agentScore}
              <Text style={styles.metricUnit}>/100</Text>
            </Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Visibility Rate</Text>
            <Text
              style={[
                styles.metricValue,
                { color: visibilityBarColor(visibilityRate) },
              ]}
            >
              {visibilityRate}
              <Text style={styles.metricUnit}>%</Text>
            </Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Total SKUs Scanned</Text>
            <Text style={styles.metricValue}>{totalSkus}</Text>
          </View>
        </View>
      </View>

      {/* Sentiment */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sentiment Analysis</Text>
        <View style={styles.sentimentRow}>
          <View
            style={[
              styles.sentimentCard,
              { backgroundColor: "#F0FDF4", borderWidth: 1, borderColor: "#BBF7D0" },
            ]}
          >
            <Text
              style={[styles.sentimentLabel, { color: COLORS.success }]}
            >
              Positive
            </Text>
            <Text
              style={[styles.sentimentValue, { color: COLORS.success }]}
            >
              {sentimentSummary.positive}
            </Text>
            {total > 0 && (
              <Text style={{ fontSize: 8, color: COLORS.textMuted, marginTop: 2 }}>
                {Math.round((sentimentSummary.positive / total) * 100)}%
              </Text>
            )}
          </View>
          <View
            style={[
              styles.sentimentCard,
              { backgroundColor: "#FFFBEB", borderWidth: 1, borderColor: "#FDE68A" },
            ]}
          >
            <Text
              style={[styles.sentimentLabel, { color: COLORS.warning }]}
            >
              Neutral
            </Text>
            <Text
              style={[styles.sentimentValue, { color: COLORS.warning }]}
            >
              {sentimentSummary.neutral}
            </Text>
            {total > 0 && (
              <Text style={{ fontSize: 8, color: COLORS.textMuted, marginTop: 2 }}>
                {Math.round((sentimentSummary.neutral / total) * 100)}%
              </Text>
            )}
          </View>
          <View
            style={[
              styles.sentimentCard,
              { backgroundColor: "#FEF2F2", borderWidth: 1, borderColor: "#FECACA" },
            ]}
          >
            <Text
              style={[styles.sentimentLabel, { color: COLORS.error }]}
            >
              Negative
            </Text>
            <Text
              style={[styles.sentimentValue, { color: COLORS.error }]}
            >
              {sentimentSummary.negative}
            </Text>
            {total > 0 && (
              <Text style={{ fontSize: 8, color: COLORS.textMuted, marginTop: 2 }}>
                {Math.round((sentimentSummary.negative / total) * 100)}%
              </Text>
            )}
          </View>
        </View>
      </View>

      <Footer />
    </Page>
  );
}

// ─── Engine Breakdown ──────────────────────────────────────────────────────

function EngineBreakdownPage({
  engineBreakdown,
}: Pick<AuditReportProps, "engineBreakdown">) {
  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.pageHeader}>
        <Text style={styles.pageHeaderText}>Engine Breakdown</Text>
        <Text style={styles.pageHeaderSub}>
          Visibility performance per AI engine
        </Text>
      </View>

      <View style={styles.section}>
        <View style={styles.table}>
          {/* Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.colEngine]}>
              Engine
            </Text>
            <Text style={[styles.tableHeaderCell, styles.colVisible]}>
              Visible
            </Text>
            <Text style={[styles.tableHeaderCell, styles.colTotal]}>Total</Text>
            <Text style={[styles.tableHeaderCell, styles.colRate]}>Rate</Text>
          </View>

          {/* Rows */}
          {engineBreakdown.map((row, i) => {
            const rate =
              row.total > 0
                ? Math.round((row.visible / row.total) * 100)
                : 0;
            const isLast = i === engineBreakdown.length - 1;
            return (
              <View
                key={row.engine}
                style={isLast ? styles.tableRowLast : styles.tableRow}
              >
                <Text style={[styles.tableCell, styles.colEngine, { fontFamily: "Helvetica-Bold" }]}>
                  {row.engine}
                </Text>
                <Text style={[styles.tableCell, styles.colVisible]}>
                  {row.visible}
                </Text>
                <Text style={[styles.tableCell, styles.colTotal]}>
                  {row.total}
                </Text>
                <View style={[styles.colRate]}>
                  <Text
                    style={[
                      styles.tableCell,
                      { color: visibilityBarColor(rate), fontFamily: "Helvetica-Bold" },
                    ]}
                  >
                    {rate}%
                  </Text>
                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${rate}%`,
                          backgroundColor: visibilityBarColor(rate),
                        },
                      ]}
                    />
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </View>

      <Footer />
    </Page>
  );
}

// ─── Findings ──────────────────────────────────────────────────────────────

function FindingsPage({
  diagnoses,
}: Pick<AuditReportProps, "diagnoses">) {
  const sorted = [...diagnoses].sort(
    (a, b) =>
      (SEVERITY_ORDER[a.severity] ?? 99) - (SEVERITY_ORDER[b.severity] ?? 99)
  );

  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.pageHeader}>
        <Text style={styles.pageHeaderText}>Findings</Text>
        <Text style={styles.pageHeaderSub}>
          {sorted.length} issue{sorted.length !== 1 ? "s" : ""} detected —
          sorted by severity
        </Text>
      </View>

      <View style={styles.section}>
        {sorted.length === 0 ? (
          <View
            style={[
              styles.metricCard,
              { alignItems: "center", paddingVertical: 24 },
            ]}
          >
            <Text style={{ fontSize: 10, color: COLORS.success, fontFamily: "Helvetica-Bold" }}>
              No issues found
            </Text>
            <Text style={{ fontSize: 9, color: COLORS.textMuted, marginTop: 4 }}>
              Your products are visible across all scanned AI engines.
            </Text>
          </View>
        ) : (
          sorted.map((d, i) => (
            <View key={i} style={styles.findingCard}>
              <View style={styles.findingHeader}>
                <Text
                  style={[
                    styles.severityBadge,
                    {
                      backgroundColor: `${severityColor(d.severity)}20`,
                      color: severityColor(d.severity),
                    },
                  ]}
                >
                  {d.severity}
                </Text>
                <Text style={styles.findingSkuName}>{d.skuName}</Text>
                <Text style={styles.findingEngineBadge}>{d.engine}</Text>
              </View>
              <View style={styles.findingBody}>
                <View>
                  <Text style={styles.findingLabel}>Reason</Text>
                  <Text style={styles.findingText}>{d.reason}</Text>
                </View>
                <View>
                  <Text style={styles.findingLabel}>Recommended Fix</Text>
                  <Text style={styles.findingText}>{d.fix}</Text>
                </View>
              </View>
            </View>
          ))
        )}
      </View>

      <Footer />
    </Page>
  );
}

// ─── Recommendations ───────────────────────────────────────────────────────

function RecommendationsPage({
  diagnoses,
}: Pick<AuditReportProps, "diagnoses">) {
  const sorted = [...diagnoses]
    .sort(
      (a, b) =>
        (SEVERITY_ORDER[a.severity] ?? 99) -
        (SEVERITY_ORDER[b.severity] ?? 99)
    )
    .slice(0, 5);

  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.pageHeader}>
        <Text style={styles.pageHeaderText}>Top Recommendations</Text>
        <Text style={styles.pageHeaderSub}>
          Priority fixes to improve AI visibility
        </Text>
      </View>

      <View style={styles.section}>
        {sorted.map((d, i) => (
          <View key={i} style={styles.recCard}>
            <View
              style={[
                styles.recAccent,
                { backgroundColor: severityColor(d.severity) },
              ]}
            />
            <View style={styles.recBody}>
              <View style={styles.recMeta}>
                <Text
                  style={[
                    styles.severityBadge,
                    {
                      backgroundColor: `${severityColor(d.severity)}20`,
                      color: severityColor(d.severity),
                    },
                  ]}
                >
                  {d.severity}
                </Text>
                <Text style={styles.findingEngineBadge}>{d.engine}</Text>
              </View>
              <Text style={styles.recTitle}>{d.skuName}</Text>
              <Text style={styles.recText}>{d.fix}</Text>
            </View>
          </View>
        ))}

        {sorted.length === 0 && (
          <View
            style={[
              styles.metricCard,
              { alignItems: "center", paddingVertical: 24 },
            ]}
          >
            <Text
              style={{
                fontSize: 10,
                color: COLORS.success,
                fontFamily: "Helvetica-Bold",
              }}
            >
              No action items — great visibility!
            </Text>
          </View>
        )}
      </View>

      <Footer />
    </Page>
  );
}

// ─── Root document ─────────────────────────────────────────────────────────

export function AuditReport(props: AuditReportProps) {
  return (
    <Document
      title={`${props.brandName} — AI Visibility Audit Report`}
      author="NorthStar"
      subject="AI Visibility Audit"
    >
      <CoverPage
        brandName={props.brandName}
        auditDate={props.auditDate}
        agentScore={props.agentScore}
      />
      <ExecutiveSummaryPage
        agentScore={props.agentScore}
        visibilityRate={props.visibilityRate}
        totalSkus={props.totalSkus}
        sentimentSummary={props.sentimentSummary}
        auditDate={props.auditDate}
      />
      <EngineBreakdownPage engineBreakdown={props.engineBreakdown} />
      <FindingsPage diagnoses={props.diagnoses} />
      <RecommendationsPage diagnoses={props.diagnoses} />
    </Document>
  );
}
