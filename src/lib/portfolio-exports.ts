import type { ColumnMappingAudit, PortfolioAnalysis, PortfolioRecord } from "@/lib/portfolio-data-demo"

export function downloadAnalysisCsv(analysis: PortfolioAnalysis) {
  downloadFile(
    serializeRecordsToCsv(analysis.records),
    `portfolio-normalized-${buildTimestamp()}.csv`,
    "text/csv;charset=utf-8"
  )
}

export function downloadMappingAuditCsv(analysis: PortfolioAnalysis) {
  downloadFile(
    serializeColumnMappingsToCsv(analysis.columnMappings),
    `portfolio-column-mapping-${buildTimestamp()}.csv`,
    "text/csv;charset=utf-8"
  )
}

export function downloadReportMarkdown(analysis: PortfolioAnalysis) {
  downloadFile(
    buildManagementReportMarkdown(analysis),
    `portfolio-management-report-${buildTimestamp()}.md`,
    "text/markdown;charset=utf-8"
  )
}

export function serializeRecordsToCsv(records: PortfolioRecord[]) {
  const header = [
    "Project ID",
    "Project Name",
    "Region",
    "Country",
    "City",
    "Site",
    "Phase",
    "Status",
    "Progress",
    "Budget",
    "Actual Cost",
    "Forecast Cost",
    "Start Date",
    "End Date",
    "Last Update",
    "Documentation Status",
    "Meeting Status",
    "Risk Level",
    "Open Issues",
    "Project Manager",
    "Contractor",
    "Data Completeness",
    "Source Name",
    "Source Sheet",
    "Notes",
  ]

  const rows = records.map((record) => [
    record.id,
    record.name,
    record.region,
    record.country,
    record.city,
    record.site,
    record.phase,
    record.status,
    record.progress,
    record.budget,
    record.actualCost,
    record.forecastCost,
    record.startDate,
    record.endDate,
    record.lastUpdate,
    record.documentationStatus,
    record.meetingStatus,
    record.riskLevel,
    record.openIssues,
    record.projectManager,
    record.contractor,
    record.dataCompleteness,
    record.sourceName,
    record.sourceSheet ?? "",
    record.notes,
  ])

  return [header, ...rows].map((row) => row.map(escapeCsvCell).join(",")).join("\r\n")
}

export function serializeColumnMappingsToCsv(mappings: ColumnMappingAudit[]) {
  const header = [
    "Source Name",
    "Sheet Name",
    "Row Count",
    "Header",
    "Normalized Header",
    "Mapped Field",
    "Field Label",
    "Alias",
    "Match Type",
    "Confidence",
    "Unmatched Headers",
  ]

  const rows = mappings.flatMap((mapping) => {
    const unmatched = mapping.unmatchedHeaders.join(" | ")

    if (!mapping.matches.length) {
      return [[mapping.sourceName, mapping.sheetName, mapping.rowCount, "", "", "", "", "", "", "", unmatched]]
    }

    return mapping.matches.map((match) => [
      mapping.sourceName,
      mapping.sheetName,
      mapping.rowCount,
      match.header,
      match.normalizedHeader,
      match.matchedField,
      match.fieldLabel,
      match.alias,
      match.matchType,
      match.confidence,
      unmatched,
    ])
  })

  return [header, ...rows].map((row) => row.map(escapeCsvCell).join(",")).join("\r\n")
}

export function buildManagementReportMarkdown(analysis: PortfolioAnalysis) {
  const lines: string[] = []

  lines.push("# Construction Portfolio Report")
  lines.push("")
  lines.push(`Generated: ${new Date(analysis.generatedAt).toLocaleString("en-US")}`)
  lines.push("")
  lines.push("## Executive Snapshot")
  lines.push("")
  lines.push(`- Total projects: ${analysis.summary.totalProjects}`)
  lines.push(`- Total budget: ${formatCurrency(analysis.summary.totalBudget)}`)
  lines.push(`- Average progress: ${analysis.summary.averageProgress}%`)
  lines.push(`- Delayed projects: ${analysis.summary.delayedCount}`)
  lines.push(`- At-risk projects: ${analysis.summary.atRiskCount}`)
  lines.push(`- Data quality score: ${analysis.summary.qualityScore}/100`)
  lines.push("")
  lines.push("## Management Summary")
  lines.push("")
  analysis.managementSummary.forEach((item) => lines.push(`- ${item}`))
  lines.push("")
  lines.push("## Key Quality Findings")
  lines.push("")
  analysis.qualityFindings.forEach((finding) => {
    lines.push(`### ${finding.title}`)
    lines.push("")
    lines.push(`- Severity: ${finding.level}`)
    lines.push(`- Detail: ${finding.detail}`)
    lines.push(`- Recommendation: ${finding.recommendation}`)
    if (finding.impactedProjects.length) {
      lines.push(`- Impacted projects: ${finding.impactedProjects.join(", ")}`)
    }
    lines.push("")
  })
  lines.push("## Ad-hoc Report Draft")
  lines.push("")
  analysis.adHocReport.forEach((item) => lines.push(`- ${item}`))
  lines.push("")
  lines.push("## Data Standards")
  lines.push("")
  analysis.standards.forEach((item) => lines.push(`- ${item}`))
  lines.push("")
  lines.push("## Administrative Actions")
  lines.push("")
  analysis.adminActions.forEach((item) => lines.push(`- ${item}`))
  lines.push("")
  lines.push("## Top Attention Projects")
  lines.push("")
  analysis.records.slice(0, 10).forEach((record) => {
    lines.push(
      `- ${record.name} | ${record.status} | Risk ${record.riskLevel} | Progress ${record.progress ?? 0}% | Docs ${record.documentationStatus} | Meeting ${record.meetingStatus}`
    )
  })

  return lines.join("\n")
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}

function escapeCsvCell(value: unknown) {
  const stringValue = value == null ? "" : String(value)
  return `"${stringValue.replace(/"/g, '""')}"`
}

function buildTimestamp() {
  return new Date().toISOString().replace(/[:]/g, "-").slice(0, 19)
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "EUR",
    notation: value >= 1_000_000 ? "compact" : "standard",
    maximumFractionDigits: value >= 1_000_000 ? 1 : 0,
  }).format(value)
}
