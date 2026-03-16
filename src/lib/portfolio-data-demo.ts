type SourceType = "excel" | "pdf" | "sample"
type NoteType = "documentation" | "meeting" | "risk" | "status" | "general"
type Severity = "low" | "medium" | "high"
type QualityLevel = "critical" | "warning" | "info"
type MatchType = "exact" | "prefix" | "suffix" | "contains"

type KnownField =
  | "projectId"
  | "projectName"
  | "region"
  | "country"
  | "city"
  | "site"
  | "phase"
  | "status"
  | "progress"
  | "budget"
  | "actualCost"
  | "forecastCost"
  | "startDate"
  | "endDate"
  | "lastUpdate"
  | "documentationStatus"
  | "meetingStatus"
  | "riskLevel"
  | "openIssues"
  | "contractor"
  | "projectManager"
  | "notes"

export interface AnalysisSource {
  id: string
  label: string
  type: SourceType
  detail: string
  rowsIngested: number
  notesExtracted: number
}

export interface PortfolioNote {
  id: string
  type: NoteType
  severity: Severity
  text: string
  sourceName: string
  relatedProject?: string
}

export interface PortfolioRecord {
  id: string
  name: string
  region: string
  country: string
  city: string
  site: string
  phase: string
  status: string
  progress: number | null
  budget: number | null
  actualCost: number | null
  forecastCost: number | null
  startDate: string | null
  endDate: string | null
  lastUpdate: string | null
  documentationStatus: string
  meetingStatus: string
  riskLevel: string
  openIssues: number | null
  projectManager: string
  contractor: string
  notes: string
  sourceName: string
  sourceSheet?: string
  dataCompleteness: number
}

export interface QualityFinding {
  id: string
  level: QualityLevel
  title: string
  detail: string
  recommendation: string
  impactedProjects: string[]
}

export interface DistributionItem {
  label: string
  value: number
}

export interface CoverageItem {
  label: string
  coverage: number
  populated: number
  total: number
}

export interface PortfolioSummary {
  totalProjects: number
  totalBudget: number
  totalActualCost: number
  totalForecastCost: number
  averageProgress: number
  delayedCount: number
  atRiskCount: number
  completedCount: number
  staleUpdateCount: number
  missingFieldCount: number
  documentationCoverage: number
  meetingReadiness: number
  qualityScore: number
}

export interface ColumnMappingMatch {
  header: string
  normalizedHeader: string
  matchedField: KnownField
  fieldLabel: string
  alias: string
  matchType: MatchType
  confidence: number
}

export interface ColumnMappingAudit {
  sourceName: string
  sheetName: string
  rowCount: number
  matches: ColumnMappingMatch[]
  unmatchedHeaders: string[]
}

export interface PortfolioAnalysis {
  mode: "sample" | "upload"
  generatedAt: string
  sources: AnalysisSource[]
  columnMappings: ColumnMappingAudit[]
  records: PortfolioRecord[]
  notes: PortfolioNote[]
  summary: PortfolioSummary
  qualityFindings: QualityFinding[]
  managementSummary: string[]
  adHocReport: string[]
  standards: string[]
  adminActions: string[]
  statusDistribution: DistributionItem[]
  regionDistribution: DistributionItem[]
  fieldCoverage: CoverageItem[]
  keywords: string[]
  limitations: string[]
}

interface ParsedSpreadsheetResult {
  source: AnalysisSource
  records: PortfolioRecord[]
  columnMappings: ColumnMappingAudit[]
}

interface ParsedPdfResult {
  source: AnalysisSource
  records: PortfolioRecord[]
  notes: PortfolioNote[]
  limitations: string[]
}

interface AnalysisBuildInput {
  mode: "sample" | "upload"
  records: PortfolioRecord[]
  notes: PortfolioNote[]
  sources: AnalysisSource[]
  columnMappings: ColumnMappingAudit[]
  limitations: string[]
}

type XlsxModule = typeof import("xlsx")
type PdfJsModule = {
  GlobalWorkerOptions: {
    workerSrc: string
  }
  getDocument: (source: Record<string, unknown>) => {
    promise: Promise<{
      numPages: number
      getPage: (pageNumber: number) => Promise<{
        getTextContent: () => Promise<{
          items: unknown[]
        }>
      }>
    }>
  }
}

const REQUIRED_FIELDS: Array<{ field: keyof PortfolioRecord; label: string }> = [
  { field: "name", label: "Project name" },
  { field: "status", label: "Status" },
  { field: "progress", label: "Progress" },
  { field: "budget", label: "Budget" },
  { field: "endDate", label: "Planned end date" },
  { field: "lastUpdate", label: "Last update" },
  { field: "documentationStatus", label: "Documentation status" },
  { field: "meetingStatus", label: "Meeting readiness" },
]

const FIELD_LABELS: Record<KnownField, string> = {
  projectId: "Project ID",
  projectName: "Project Name",
  region: "Region",
  country: "Country",
  city: "City",
  site: "Site / Facility",
  phase: "Phase",
  status: "Status",
  progress: "Progress",
  budget: "Budget",
  actualCost: "Actual Cost",
  forecastCost: "Forecast Cost",
  startDate: "Start Date",
  endDate: "End Date",
  lastUpdate: "Last Update",
  documentationStatus: "Documentation Status",
  meetingStatus: "Meeting Readiness",
  riskLevel: "Risk Level",
  openIssues: "Open Issues",
  contractor: "Contractor",
  projectManager: "Project Manager",
  notes: "Notes",
}

const FIELD_ALIASES: Record<KnownField, string[]> = {
  projectId: ["projectid", "id", "projectcode", "assetid", "constructionid"],
  projectName: [
    "project",
    "projectname",
    "projecttitle",
    "workstream",
    "package",
    "assetname",
    "buildingname",
  ],
  region: ["region", "cluster", "hub", "portfolio", "businessunit", "geography"],
  country: ["country", "nation"],
  city: ["city", "town", "municipality"],
  site: ["site", "facility", "campus", "location", "address", "building", "assetlocation"],
  phase: ["phase", "stage", "lifecycle", "packagephase", "constructionphase"],
  status: ["status", "projectstatus", "health", "overallstatus", "trafficlight", "currentstatus"],
  progress: [
    "progress",
    "percentcomplete",
    "completion",
    "complete",
    "physicalprogress",
    "progresspercent",
    "progresspct",
  ],
  budget: ["budget", "approvedbudget", "capex", "targetcost", "baselinebudget", "budgeteur", "budgetusd"],
  actualCost: ["actualcost", "actual", "costtodate", "spent", "spend", "incurredcost"],
  forecastCost: ["forecastcost", "forecast", "estimateatcompletion", "eac", "projectedcost"],
  startDate: ["startdate", "start", "kickoff", "mobilizationdate", "plannedstart", "startdt"],
  endDate: ["enddate", "plannedfinish", "finishdate", "duedate", "completiondate", "targetdate", "enddt"],
  lastUpdate: ["lastupdate", "reportdate", "statusdate", "reportingdate", "modified", "lastmodified"],
  documentationStatus: [
    "documentation",
    "documentstatus",
    "docstatus",
    "permitstatus",
    "submittalstatus",
    "drawingstatus",
  ],
  meetingStatus: ["meetingstatus", "meetingmaterials", "meetingpack", "minutesstatus", "steeringpack"],
  riskLevel: ["risklevel", "risk", "overallrisk", "healthrisk", "priority", "prioritylevel"],
  openIssues: ["issues", "openissues", "issuecount", "actionsopen", "riskitems"],
  contractor: ["contractor", "vendor", "supplier", "generalcontractor", "gc", "maincontractor"],
  projectManager: ["projectmanager", "manager", "pm", "owner", "lead", "projectlead"],
  notes: ["notes", "comment", "comments", "remarks", "summary", "description"],
}

const STATUS_ORDER = ["Delayed", "At Risk", "On Track", "Planned", "Completed", "Unknown"]
const RISK_ORDER = ["Critical", "High", "Medium", "Low", "Unknown"]
const DOCUMENTATION_ORDER = ["Missing", "Pending", "Partial", "Complete", "Unknown"]
const MEETING_ORDER = ["Missing", "Pending", "Updated", "Ready", "Unknown"]
const KEYWORD_STOPWORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "from",
  "into",
  "this",
  "that",
  "were",
  "been",
  "have",
  "has",
  "had",
  "will",
  "shall",
  "must",
  "project",
  "projects",
  "portfolio",
  "data",
  "construction",
  "real",
  "estate",
  "global",
  "team",
  "status",
  "report",
  "reports",
  "quality",
  "check",
  "checks",
  "update",
  "updated",
  "across",
  "latest",
  "please",
  "need",
])

const SAMPLE_RECORDS: PortfolioRecord[] = [
  {
    id: "be-ber-001",
    name: "Berlin Service Hub Retrofit",
    region: "DACH",
    country: "Germany",
    city: "Berlin",
    site: "Service Hub Campus",
    phase: "Execution",
    status: "On Track",
    progress: 68,
    budget: 5400000,
    actualCost: 3510000,
    forecastCost: 5290000,
    startDate: "2025-07-01",
    endDate: "2026-08-30",
    lastUpdate: "2026-03-05",
    documentationStatus: "Complete",
    meetingStatus: "Ready",
    riskLevel: "Medium",
    openIssues: 3,
    projectManager: "Anna Keller",
    contractor: "Nord Bau GmbH",
    notes: "Permit pack closed and HVAC replacement package is progressing on schedule.",
    sourceName: "Global_CRE_Portfolio_Q1.xlsx",
    sourceSheet: "DACH",
    dataCompleteness: 0,
  },
  {
    id: "be-cha-002",
    name: "Charlotte Campus Expansion",
    region: "North America",
    country: "United States",
    city: "Charlotte",
    site: "Turbine Campus",
    phase: "Execution",
    status: "Delayed",
    progress: 41,
    budget: 8800000,
    actualCost: 4720000,
    forecastCost: 9510000,
    startDate: "2025-06-10",
    endDate: "2026-05-20",
    lastUpdate: "2026-01-02",
    documentationStatus: "Pending",
    meetingStatus: "Pending",
    riskLevel: "High",
    openIssues: 8,
    projectManager: "Marcus Lee",
    contractor: "Atlas Build Partners",
    notes: "Electrical redesign and late material approvals are impacting milestone dates.",
    sourceName: "Global_CRE_Portfolio_Q1.xlsx",
    sourceSheet: "Americas",
    dataCompleteness: 0,
  },
  {
    id: "be-hou-003",
    name: "Houston Training Center Fit-Out",
    region: "North America",
    country: "United States",
    city: "Houston",
    site: "Training Center",
    phase: "Close-out",
    status: "Completed",
    progress: 100,
    budget: 2300000,
    actualCost: 2210000,
    forecastCost: 2210000,
    startDate: "2025-02-14",
    endDate: "2025-12-12",
    lastUpdate: "2026-02-18",
    documentationStatus: "Complete",
    meetingStatus: "Updated",
    riskLevel: "Low",
    openIssues: 0,
    projectManager: "Taylor Brooks",
    contractor: "Sterling Interiors",
    notes: "Handover documentation and lessons learned were archived for the close-out review.",
    sourceName: "Global_CRE_Portfolio_Q1.xlsx",
    sourceSheet: "Americas",
    dataCompleteness: 0,
  },
  {
    id: "be-gur-004",
    name: "Gurgaon Digital Operations Workspace",
    region: "Asia Pacific",
    country: "India",
    city: "Gurgaon",
    site: "Digital Operations Office",
    phase: "Design",
    status: "At Risk",
    progress: 24,
    budget: 3100000,
    actualCost: 1180000,
    forecastCost: 3460000,
    startDate: "2025-11-01",
    endDate: "2026-11-15",
    lastUpdate: "2026-02-27",
    documentationStatus: "Partial",
    meetingStatus: "Pending",
    riskLevel: "Critical",
    openIssues: 6,
    projectManager: "Priya Nair",
    contractor: "SKY Form Projects",
    notes: "Change request backlog is growing and concept approvals are still open.",
    sourceName: "Global_CRE_Portfolio_Q1.xlsx",
    sourceSheet: "APAC",
    dataCompleteness: 0,
  },
  {
    id: "be-fin-005",
    name: "Finspang Test Facility Upgrade",
    region: "Nordics",
    country: "Sweden",
    city: "Finspang",
    site: "Test Facility",
    phase: "Execution",
    status: "On Track",
    progress: 57,
    budget: 4700000,
    actualCost: 2610000,
    forecastCost: 4890000,
    startDate: "2025-08-21",
    endDate: "2026-09-30",
    lastUpdate: "2026-03-11",
    documentationStatus: "Complete",
    meetingStatus: "Ready",
    riskLevel: "Medium",
    openIssues: 2,
    projectManager: "Henrik Olsson",
    contractor: "Nordic Industrial Works",
    notes: "Procurement stays within tolerance; QA package for commissioning is nearly complete.",
    sourceName: "Global_CRE_Portfolio_Q1.xlsx",
    sourceSheet: "Nordics",
    dataCompleteness: 0,
  },
  {
    id: "be-abu-006",
    name: "Abu Dhabi Grid Solutions Office",
    region: "Middle East",
    country: "United Arab Emirates",
    city: "Abu Dhabi",
    site: "Grid Solutions Office",
    phase: "Execution",
    status: "On Track",
    progress: 76,
    budget: 2650000,
    actualCost: 1980000,
    forecastCost: 2710000,
    startDate: "2025-04-05",
    endDate: "2026-04-22",
    lastUpdate: "2026-03-08",
    documentationStatus: "Partial",
    meetingStatus: "Ready",
    riskLevel: "Low",
    openIssues: 1,
    projectManager: "Yousef Al Mansoori",
    contractor: "Desert Edge Contractors",
    notes: "Furniture package is complete but as-built drawing upload is still pending.",
    sourceName: "Global_CRE_Portfolio_Q1.xlsx",
    sourceSheet: "MEA",
    dataCompleteness: 0,
  },
]

const SAMPLE_NOTES: PortfolioNote[] = [
  {
    id: "sample-note-1",
    type: "meeting",
    severity: "high",
    text: "Charlotte Campus Expansion requires an updated steering committee pack before the next governance review.",
    sourceName: "Building_Excellence_SteerCo.pdf",
    relatedProject: "Charlotte Campus Expansion",
  },
  {
    id: "sample-note-2",
    type: "documentation",
    severity: "medium",
    text: "Abu Dhabi Grid Solutions Office is still missing final as-built drawing uploads in the document register.",
    sourceName: "Building_Excellence_SteerCo.pdf",
    relatedProject: "Abu Dhabi Grid Solutions Office",
  },
  {
    id: "sample-note-3",
    type: "risk",
    severity: "high",
    text: "Gurgaon Digital Operations Workspace shows open approval risks that could affect design freeze.",
    sourceName: "Building_Excellence_SteerCo.pdf",
    relatedProject: "Gurgaon Digital Operations Workspace",
  },
]

const SAMPLE_SOURCES: AnalysisSource[] = [
  {
    id: "sample-excel",
    label: "Global_CRE_Portfolio_Q1.xlsx",
    type: "sample",
    detail: "4 sheets consolidated",
    rowsIngested: 6,
    notesExtracted: 0,
  },
  {
    id: "sample-pdf",
    label: "Building_Excellence_SteerCo.pdf",
    type: "sample",
    detail: "Management brief indexed",
    rowsIngested: 0,
    notesExtracted: 3,
  },
]

let xlsxLoader: Promise<XlsxModule> | null = null
let pdfJsLoader: Promise<PdfJsModule> | null = null
let pdfWorkerLoader: Promise<string> | null = null

const SAMPLE_COLUMN_MAPPINGS: ColumnMappingAudit[] = [
  {
    sourceName: "Global_CRE_Portfolio_Q1.xlsx",
    sheetName: "DACH",
    rowCount: 6,
    matches: [
      createMappingMatch("Project Name", "projectName", "projectname", "exact", 1),
      createMappingMatch("Region", "region", "region", "exact", 1),
      createMappingMatch("Budget (EUR)", "budget", "budget", "prefix", 0.93),
      createMappingMatch("Progress (%)", "progress", "progress", "prefix", 0.93),
      createMappingMatch("Status", "status", "status", "exact", 1),
      createMappingMatch("End Date", "endDate", "enddate", "exact", 1),
      createMappingMatch("Project Manager", "projectManager", "projectmanager", "prefix", 0.93),
      createMappingMatch("Priority", "riskLevel", "priority", "exact", 0.94),
    ],
    unmatchedHeaders: ["Area (m2)"],
  },
]

export function createSamplePortfolioAnalysis(): PortfolioAnalysis {
  return buildAnalysis({
    mode: "sample",
    records: SAMPLE_RECORDS.map((record) => ({ ...record })),
    notes: SAMPLE_NOTES.map((note) => ({ ...note })),
    sources: SAMPLE_SOURCES.map((source) => ({ ...source })),
    columnMappings: SAMPLE_COLUMN_MAPPINGS.map((mapping) => ({ ...mapping, matches: mapping.matches.map((match) => ({ ...match })) })),
    limitations: ["Sample portfolio loaded. Upload your own Excel or PDF files to run the same analysis flow on custom data."],
  })
}

export async function analyzePortfolioFiles(files: File[]): Promise<PortfolioAnalysis> {
  const supportedFiles = files.filter((file) => isSpreadsheetFile(file) || isPdfFile(file))

  if (!supportedFiles.length) {
    throw new Error("Please upload at least one Excel or PDF file.")
  }

  const records: PortfolioRecord[] = []
  const notes: PortfolioNote[] = []
  const sources: AnalysisSource[] = []
  const columnMappings: ColumnMappingAudit[] = []
  const limitations: string[] = []

  for (const file of supportedFiles) {
    if (isSpreadsheetFile(file)) {
      const result = await parseSpreadsheetFile(file)
      records.push(...result.records)
      sources.push(result.source)
      columnMappings.push(...result.columnMappings)
      continue
    }

    const result = await parsePdfFile(file)
    records.push(...result.records)
    notes.push(...result.notes)
    sources.push(result.source)
    limitations.push(...result.limitations)
  }

  return buildAnalysis({
    mode: "upload",
    records,
    notes,
    sources,
    columnMappings,
    limitations,
  })
}

async function loadXlsx() {
  if (!xlsxLoader) {
    xlsxLoader = import("xlsx")
  }

  return xlsxLoader
}

async function loadPdfJs() {
  if (typeof window === "undefined") {
    if (!pdfJsLoader) {
      pdfJsLoader = import("pdfjs-dist/legacy/build/pdf.mjs") as Promise<PdfJsModule>
    }

    return pdfJsLoader
  }

  if (!pdfJsLoader) {
    pdfJsLoader = import("pdfjs-dist") as Promise<PdfJsModule>
  }

  if (!pdfWorkerLoader) {
    pdfWorkerLoader = import("pdfjs-dist/build/pdf.worker.min.mjs?url").then((module) => module.default)
  }

  const [pdfJs, workerSrc] = await Promise.all([pdfJsLoader, pdfWorkerLoader])
  pdfJs.GlobalWorkerOptions.workerSrc = workerSrc

  return pdfJs
}

function isSpreadsheetFile(file: File) {
  return /\.(xlsx|xls|csv)$/i.test(file.name)
}

function isPdfFile(file: File) {
  return /\.pdf$/i.test(file.name)
}

async function parseSpreadsheetFile(file: File): Promise<ParsedSpreadsheetResult> {
  const XLSX = await loadXlsx()
  const workbook = XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: false })
  const records: PortfolioRecord[] = []
  const columnMappings: ColumnMappingAudit[] = []

  workbook.SheetNames.forEach((sheetName) => {
    const sheet = workbook.Sheets[sheetName]
    const headerMatrix = XLSX.utils.sheet_to_json<(string | number)[]>(sheet, {
      header: 1,
      defval: "",
      raw: false,
    })
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: "",
      raw: true,
    })
    const headerRow = (headerMatrix[0] ?? []).map((cell) => cleanString(cell)).filter(Boolean)

    columnMappings.push(createColumnMappingAudit(file.name, sheetName, rows.length, headerRow))

    rows.forEach((row, index) => {
      const normalized = normalizeSpreadsheetRow(row, file.name, sheetName, index, XLSX)

      if (normalized) {
        records.push(normalized)
      }
    })
  })

  return {
    source: {
      id: slugify(file.name),
      label: file.name,
      type: "excel",
      detail: `${workbook.SheetNames.length} sheet${workbook.SheetNames.length === 1 ? "" : "s"} consolidated`,
      rowsIngested: records.length,
      notesExtracted: 0,
    },
    records,
    columnMappings,
  }
}

async function parsePdfFile(file: File): Promise<ParsedPdfResult> {
  const text = await extractPdfText(file)
  const notes = extractPdfNotes(text, file.name)
  const records = extractRecordsFromPdf(text, file.name)
  const limitations: string[] = []

  if (text.trim().length < 80) {
    limitations.push(
      `${file.name} appears to be image-based or has limited embedded text. Excel trackers or text-based PDFs produce richer structured results.`
    )
  }

  if (!records.length) {
    limitations.push(
      `${file.name} was indexed for management notes, but no reliable row-based project table was detected. Structured Excel inputs unlock deeper QA checks and tracking outputs.`
    )
  }

  return {
    source: {
      id: slugify(file.name),
      label: file.name,
      type: "pdf",
      detail: records.length ? "Text report indexed" : "Management notes indexed",
      rowsIngested: records.length,
      notesExtracted: notes.length,
    },
    records,
    notes,
    limitations,
  }
}

async function extractPdfText(file: File) {
  const { getDocument } = await loadPdfJs()
  const loadingTask = getDocument({
    data: new Uint8Array(await file.arrayBuffer()),
    disableWorker: typeof window === "undefined",
  })
  const pdf = await loadingTask.promise
  const pages: string[] = []

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber)
    const content = await page.getTextContent()
    const lineMap = new Map<number, string[]>()

    content.items.forEach((item) => {
      if (!isPdfTextItem(item) || !item.str.trim()) {
        return
      }

      const yPosition = Math.round(item.transform[5] || 0)
      const existing = lineMap.get(yPosition) ?? []
      existing.push(item.str)
      lineMap.set(yPosition, existing)
    })

    const pageLines = Array.from(lineMap.entries())
      .sort((left, right) => right[0] - left[0])
      .map(([, tokens]) => collapseWhitespace(tokens.join(" ")))

    pages.push(pageLines.join("\n"))
  }

  return pages.join("\n\n")
}

function isPdfTextItem(value: unknown): value is { str: string; transform: number[] } {
  if (typeof value !== "object" || value === null) {
    return false
  }

  return "str" in value && "transform" in value
}

function extractPdfNotes(text: string, sourceName: string) {
  const lines = text
    .split(/\n+/)
    .map((line) => collapseWhitespace(line))
    .filter(Boolean)

  const collected: PortfolioNote[] = []
  const seen = new Set<string>()

  lines.forEach((line, index) => {
    const normalized = normalizeText(line)
    if (normalized.length < 12) {
      return
    }

    let type: NoteType = "general"
    let severity: Severity = "low"

    if (/(document|drawing|permit|handover|submittal|register|approval)/.test(normalized)) {
      type = "documentation"
    } else if (/(meeting|minutes|agenda|steerco|steering|action item|stakeholder)/.test(normalized)) {
      type = "meeting"
    } else if (/(risk|blocked|delay|late|non[- ]?compliance|escalation|issue)/.test(normalized)) {
      type = "risk"
    } else if (/(progress|forecast|budget|status|completion|milestone)/.test(normalized)) {
      type = "status"
    } else {
      return
    }

    if (/(critical|blocked|missing|delayed|late|overdue|escalation|urgent)/.test(normalized)) {
      severity = "high"
    } else if (/(pending|partial|review|watchlist|follow up|action)/.test(normalized)) {
      severity = "medium"
    }

    const noteKey = `${type}:${normalized}`
    if (seen.has(noteKey)) {
      return
    }

    seen.add(noteKey)
    collected.push({
      id: `${slugify(sourceName)}-note-${index + 1}`,
      type,
      severity,
      text: line,
      sourceName,
    })
  })

  return collected.slice(0, 10)
}

function extractRecordsFromPdf(text: string, sourceName: string): PortfolioRecord[] {
  const lines = text
    .split(/\n+/)
    .map((line) => collapseWhitespace(line))
    .filter(Boolean)

  const blocks: Array<Record<string, unknown>> = []
  let currentBlock: Record<string, unknown> = {}

  lines.forEach((line) => {
    const matches = [...line.matchAll(/([A-Za-z][A-Za-z0-9 /()%+-]{2,30})\s*:\s*([^|]+)/g)]

    if (!matches.length) {
      if (Object.keys(currentBlock).length) {
        currentBlock.notes = `${cleanString(currentBlock.notes)} ${line}`.trim()
      }
      return
    }

    const startsNewProject = matches.some((match) => /(project|site|asset)/i.test(match[1]))
    if (startsNewProject && Object.keys(currentBlock).length >= 2) {
      blocks.push(currentBlock)
      currentBlock = {}
    }

    matches.forEach((match) => {
      currentBlock[match[1]] = match[2].trim()
    })
  })

  if (Object.keys(currentBlock).length >= 2) {
    blocks.push(currentBlock)
  }

  return blocks
    .map((row, index) => normalizeSpreadsheetRow(row, sourceName, "PDF Extract", index))
    .filter((record): record is PortfolioRecord => record !== null)
}

function normalizeSpreadsheetRow(
  row: Record<string, unknown>,
  sourceName: string,
  sourceSheet: string,
  _rowIndex: number,
  xlsx?: XlsxModule
): PortfolioRecord | null {
  const mapped = new Map<KnownField, string>()
  const rawValues = Object.values(row).map((value) => cleanString(value)).filter(Boolean)

  if (rawValues.length < 2) {
    return null
  }

  Object.entries(row).forEach(([header, value]) => {
    const fieldMatch = resolveFieldMatch(header)
    if (!fieldMatch) {
      return
    }

    const stringValue = cleanString(value)
    if (!stringValue) {
      return
    }

    const previous = mapped.get(fieldMatch.field)
    mapped.set(fieldMatch.field, previous ? `${previous} ${stringValue}` : stringValue)
  })

  const name = mapped.get("projectName") || mapped.get("site") || mapped.get("projectId")
  if (!name) {
    return null
  }

  const mappedKeys = Array.from(mapped.keys())
  const strongSignals = mappedKeys.filter((field) =>
    ["projectId", "status", "progress", "budget", "forecastCost", "endDate", "lastUpdate", "riskLevel"].includes(field)
  ).length

  if (sourceSheet === "PDF Extract") {
    const wordCount = name.split(/\s+/).filter(Boolean).length

    if (mappedKeys.length < 4 || strongSignals < 2 || name.length > 70 || wordCount > 8) {
      return null
    }
  }

  const projectId =
    mapped.get("projectId") ||
    `generated:${slugify(name)}:${slugify(mapped.get("region") || mapped.get("country") || mapped.get("site") || sourceSheet)}`
  const progress = parseProgress(mapped.get("progress"))
  const riskLevel = normalizeRisk(mapped.get("riskLevel"), mapped.get("notes"))
  const status = normalizeStatus(mapped.get("status"), progress, riskLevel, mapped.get("notes"))
  const documentationStatus = normalizeDocumentationStatus(
    mapped.get("documentationStatus"),
    mapped.get("notes")
  )
  const meetingStatus = normalizeMeetingStatus(mapped.get("meetingStatus"), mapped.get("notes"))

  return {
    id: projectId,
    name,
    region: mapped.get("region") || "Unassigned",
    country: mapped.get("country") || "Unknown",
    city: mapped.get("city") || "Unknown",
    site: mapped.get("site") || name,
    phase: mapped.get("phase") || inferPhase(status, progress),
    status,
    progress,
    budget: parseNumber(mapped.get("budget")),
    actualCost: parseNumber(mapped.get("actualCost")),
    forecastCost: parseNumber(mapped.get("forecastCost")),
    startDate: parseDateValue(mapped.get("startDate"), xlsx),
    endDate: parseDateValue(mapped.get("endDate"), xlsx),
    lastUpdate: parseDateValue(mapped.get("lastUpdate"), xlsx),
    documentationStatus,
    meetingStatus,
    riskLevel,
    openIssues: parseInteger(mapped.get("openIssues")),
    projectManager: mapped.get("projectManager") || "Unassigned",
    contractor: mapped.get("contractor") || "Unknown",
    notes: mapped.get("notes") || "",
    sourceName,
    sourceSheet,
    dataCompleteness: 0,
  }
}

function createColumnMappingAudit(sourceName: string, sheetName: string, rowCount: number, headers: string[]): ColumnMappingAudit {
  const matches: ColumnMappingMatch[] = []
  const unmatchedHeaders: string[] = []

  headers.forEach((header) => {
    const fieldMatch = resolveFieldMatch(header)

    if (!fieldMatch) {
      unmatchedHeaders.push(header)
      return
    }

    matches.push(
      createMappingMatch(
        header,
        fieldMatch.field,
        fieldMatch.alias,
        fieldMatch.matchType,
        fieldMatch.confidence
      )
    )
  })

  return {
    sourceName,
    sheetName,
    rowCount,
    matches,
    unmatchedHeaders,
  }
}

function createMappingMatch(
  header: string,
  field: KnownField,
  alias: string,
  matchType: MatchType,
  confidence: number
): ColumnMappingMatch {
  return {
    header,
    normalizedHeader: normalizeHeader(header),
    matchedField: field,
    fieldLabel: FIELD_LABELS[field],
    alias,
    matchType,
    confidence,
  }
}

function resolveFieldMatch(header: string) {
  const normalizedHeader = normalizeHeader(header)
  let bestMatch: {
    field: KnownField
    score: number
    aliasLength: number
    alias: string
    matchType: MatchType
    confidence: number
  } | null = null

  for (const [field, aliases] of Object.entries(FIELD_ALIASES) as Array<[KnownField, string[]]>) {
    for (const alias of aliases) {
      let score = 0
      let matchType: MatchType | null = null
      let confidence = 0

      if (normalizedHeader === alias) {
        score = 4
        matchType = "exact"
        confidence = 1
      } else if (normalizedHeader.startsWith(alias) || normalizedHeader.endsWith(alias)) {
        score = 3
        matchType = normalizedHeader.startsWith(alias) ? "prefix" : "suffix"
        confidence = 0.93
      } else if (alias.length >= 5 && normalizedHeader.includes(alias)) {
        score = 1
        matchType = "contains"
        confidence = 0.72
      }

      if (!score) {
        continue
      }

      if (
        !bestMatch ||
        score > bestMatch.score ||
        (score === bestMatch.score && alias.length > bestMatch.aliasLength)
      ) {
        bestMatch = { field, score, aliasLength: alias.length, alias, matchType: matchType!, confidence }
      }
    }
  }

  return bestMatch
}

function normalizeHeader(value: string) {
  return normalizeText(value).replace(/[^a-z0-9]+/g, "")
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

function collapseWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim()
}

function cleanString(value: unknown) {
  if (value == null) {
    return ""
  }

  if (typeof value === "string") {
    return collapseWhitespace(value)
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : ""
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No"
  }

  return collapseWhitespace(String(value))
}

function parseNumber(value?: string) {
  if (!value) {
    return null
  }

  const trimmed = value.trim()
  if (!trimmed) {
    return null
  }

  const sanitized = trimmed.replace(/[^\d,.-]/g, "")
  if (!sanitized) {
    return null
  }

  let normalized = sanitized

  if (sanitized.includes(",") && sanitized.includes(".")) {
    normalized =
      sanitized.lastIndexOf(",") > sanitized.lastIndexOf(".")
        ? sanitized.replace(/\./g, "").replace(",", ".")
        : sanitized.replace(/,/g, "")
  } else if (sanitized.includes(",")) {
    normalized = /,\d{1,2}$/.test(sanitized) ? sanitized.replace(",", ".") : sanitized.replace(/,/g, "")
  }

  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

function parseInteger(value?: string) {
  const parsed = parseNumber(value)
  return parsed == null ? null : Math.round(parsed)
}

function parseProgress(value?: string) {
  const parsed = parseNumber(value)
  if (parsed == null) {
    return null
  }

  const asPercent = value?.includes("%") ? parsed : parsed <= 1 ? parsed * 100 : parsed
  return clampNumber(Math.round(asPercent), 0, 100)
}

function parseDateValue(value?: string | number, xlsx?: XlsxModule) {
  if (value == null || value === "") {
    return null
  }

  if (typeof value === "number") {
    if (!xlsx) {
      return null
    }

    const parsedCode = xlsx.SSF.parse_date_code(value)
    if (!parsedCode) {
      return null
    }

    return toIsoDate(new Date(Date.UTC(parsedCode.y, parsedCode.m - 1, parsedCode.d)))
  }

  const trimmed = value.trim()
  if (!trimmed) {
    return null
  }

  const shortDateMatch = trimmed.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/)
  if (shortDateMatch) {
    const day = Number(shortDateMatch[1])
    const month = Number(shortDateMatch[2])
    const year = normalizeYear(shortDateMatch[3])
    return toIsoDate(new Date(Date.UTC(year, month - 1, day)))
  }

  const isoDateMatch = trimmed.match(/^(\d{4})[./-](\d{1,2})[./-](\d{1,2})$/)
  if (isoDateMatch) {
    return toIsoDate(
      new Date(Date.UTC(Number(isoDateMatch[1]), Number(isoDateMatch[2]) - 1, Number(isoDateMatch[3])))
    )
  }

  const parsed = new Date(trimmed)
  if (Number.isNaN(parsed.getTime())) {
    return null
  }

  return toIsoDate(parsed)
}

function normalizeYear(value: string) {
  const numeric = Number(value)
  if (value.length === 2) {
    return numeric >= 70 ? 1900 + numeric : 2000 + numeric
  }

  return numeric
}

function toIsoDate(value: Date) {
  if (Number.isNaN(value.getTime())) {
    return null
  }

  return value.toISOString().slice(0, 10)
}

function normalizeStatus(rawStatus?: string, progress?: number | null, riskLevel?: string, notes?: string) {
  const normalized = normalizeText([rawStatus, notes].filter(Boolean).join(" "))

  if (/complete|completed|done|closed|hand.?over|commission/.test(normalized) || progress === 100) {
    return "Completed"
  }

  if (/delay|delayed|behind|late|slip|hold/.test(normalized)) {
    return "Delayed"
  }

  if (/risk|critical|blocked|red/.test(normalized) || riskLevel === "Critical") {
    return "At Risk"
  }

  if (/planned|pipeline|tender|not started|design/.test(normalized) && (progress == null || progress < 15)) {
    return "Planned"
  }

  if (/track|active|ongoing|progress|execution|green/.test(normalized) || (progress != null && progress > 0 && progress < 100)) {
    return "On Track"
  }

  return "Unknown"
}

function normalizeRisk(rawRisk?: string, notes?: string) {
  const normalized = normalizeText([rawRisk, notes].filter(Boolean).join(" "))

  if (/critical|severe|red/.test(normalized)) {
    return "Critical"
  }

  if (/high|elevated|major/.test(normalized)) {
    return "High"
  }

  if (/medium|moderate|amber|yellow/.test(normalized)) {
    return "Medium"
  }

  if (/low|minor|green/.test(normalized)) {
    return "Low"
  }

  return "Unknown"
}

function normalizeDocumentationStatus(rawDocumentation?: string, notes?: string) {
  const normalized = normalizeText([rawDocumentation, notes].filter(Boolean).join(" "))

  if (/missing|not available|none|gap/.test(normalized)) {
    return "Missing"
  }

  if (/pending|awaiting|open|review/.test(normalized)) {
    return "Pending"
  }

  if (/partial|draft|in progress/.test(normalized)) {
    return "Partial"
  }

  if (/complete|closed|issued|uploaded|approved/.test(normalized)) {
    return "Complete"
  }

  return "Unknown"
}

function normalizeMeetingStatus(rawMeeting?: string, notes?: string) {
  const normalized = normalizeText([rawMeeting, notes].filter(Boolean).join(" "))

  if (/missing|not prepared|not available/.test(normalized)) {
    return "Missing"
  }

  if (/pending|awaiting|open/.test(normalized)) {
    return "Pending"
  }

  if (/updated|revised|refreshed/.test(normalized)) {
    return "Updated"
  }

  if (/ready|prepared|complete|shared/.test(normalized)) {
    return "Ready"
  }

  return "Unknown"
}

function inferPhase(status: string, progress: number | null) {
  if (status === "Completed") {
    return "Close-out"
  }

  if (progress != null && progress < 20) {
    return "Design"
  }

  if (progress != null && progress >= 20 && progress < 90) {
    return "Execution"
  }

  if (progress != null && progress >= 90) {
    return "Commissioning"
  }

  if (status === "Planned") {
    return "Planning"
  }

  return "Execution"
}

function buildAnalysis({ mode, records, notes, sources, columnMappings, limitations }: AnalysisBuildInput): PortfolioAnalysis {
  const duplicateGroups = detectDuplicateGroups(records)
  const consolidatedRecords = consolidateRecords(records).map((record) => ({
    ...record,
    dataCompleteness: calculateCompleteness(record),
  }))
  const linkedNotes = linkNotesToProjects(notes, consolidatedRecords)
  const qualityFindings = buildQualityFindings(consolidatedRecords, linkedNotes, duplicateGroups)
  const summary = buildSummary(consolidatedRecords, qualityFindings)
  const fieldCoverage = buildFieldCoverage(consolidatedRecords)
  const statusDistribution = buildStatusDistribution(consolidatedRecords)
  const regionDistribution = buildRegionDistribution(consolidatedRecords)
  const keywords = extractKeywords(consolidatedRecords, linkedNotes)
  const managementSummary = buildManagementSummary(
    consolidatedRecords,
    summary,
    sources,
    regionDistribution,
    qualityFindings
  )
  const adHocReport = buildAdHocReport(consolidatedRecords, summary, qualityFindings, linkedNotes)
  const standards = buildStandards(fieldCoverage, summary)
  const adminActions = buildAdminActions(consolidatedRecords, linkedNotes, sources)

  return {
    mode,
    generatedAt: new Date().toISOString(),
    sources,
    columnMappings,
    records: sortRecordsForAttention(consolidatedRecords),
    notes: linkedNotes,
    summary,
    qualityFindings,
    managementSummary,
    adHocReport,
    standards,
    adminActions,
    statusDistribution,
    regionDistribution,
    fieldCoverage,
    keywords,
    limitations: Array.from(new Set(limitations)),
  }
}

function detectDuplicateGroups(records: PortfolioRecord[]) {
  const groups = new Map<string, PortfolioRecord[]>()

  records.forEach((record) => {
    const key = getRecordKey(record)
    const existing = groups.get(key) ?? []
    existing.push(record)
    groups.set(key, existing)
  })

  return Array.from(groups.values()).filter((group) => group.length > 1)
}

function consolidateRecords(records: PortfolioRecord[]) {
  const groups = new Map<string, PortfolioRecord>()

  records.forEach((record) => {
    const key = getRecordKey(record)
    const existing = groups.get(key)

    if (!existing) {
      groups.set(key, { ...record })
      return
    }

    groups.set(key, mergeRecords(existing, record))
  })

  return Array.from(groups.values())
}

function getRecordKey(record: PortfolioRecord) {
  const normalizedId = normalizeText(record.id)
  if (normalizedId && !normalizedId.includes("unknown") && !normalizedId.startsWith("generated")) {
    return `id:${normalizedId}`
  }

  const nameKey = normalizeText(record.name)
  const regionKey = normalizeText(record.region || record.country || record.site)
  return `name:${nameKey}|${regionKey}`
}

function mergeRecords(base: PortfolioRecord, incoming: PortfolioRecord): PortfolioRecord {
  const merged: PortfolioRecord = { ...base }

  merged.name = preferText(base.name, incoming.name)
  merged.region = preferText(base.region, incoming.region)
  merged.country = preferText(base.country, incoming.country)
  merged.city = preferText(base.city, incoming.city)
  merged.site = preferText(base.site, incoming.site)
  merged.phase = preferText(base.phase, incoming.phase)
  merged.status = preferByOrder(base.status, incoming.status, STATUS_ORDER)
  merged.progress = preferNumber(base.progress, incoming.progress)
  merged.budget = preferNumber(base.budget, incoming.budget)
  merged.actualCost = preferNumber(base.actualCost, incoming.actualCost)
  merged.forecastCost = preferNumber(base.forecastCost, incoming.forecastCost)
  merged.startDate = preferEarlierDate(base.startDate, incoming.startDate)
  merged.endDate = preferLaterDate(base.endDate, incoming.endDate)
  merged.lastUpdate = preferLaterDate(base.lastUpdate, incoming.lastUpdate)
  merged.documentationStatus = preferByOrder(base.documentationStatus, incoming.documentationStatus, DOCUMENTATION_ORDER)
  merged.meetingStatus = preferByOrder(base.meetingStatus, incoming.meetingStatus, MEETING_ORDER)
  merged.riskLevel = preferByOrder(base.riskLevel, incoming.riskLevel, RISK_ORDER)
  merged.openIssues = preferNumber(base.openIssues, incoming.openIssues)
  merged.projectManager = preferText(base.projectManager, incoming.projectManager)
  merged.contractor = preferText(base.contractor, incoming.contractor)
  merged.notes = joinUniqueText(base.notes, incoming.notes)
  merged.sourceName = joinUniqueText(base.sourceName, incoming.sourceName, ", ")
  merged.sourceSheet = joinUniqueText(base.sourceSheet || "", incoming.sourceSheet || "", ", ") || undefined

  return merged
}

function preferText(base: string, incoming: string) {
  const baseClean = cleanFallbackValue(base)
  const incomingClean = cleanFallbackValue(incoming)

  if (!baseClean) {
    return incoming
  }

  if (!incomingClean) {
    return base
  }

  return incoming.length > base.length ? incoming : base
}

function cleanFallbackValue(value: string) {
  const normalized = normalizeText(value)
  return normalized === "unknown" || normalized === "unassigned" ? "" : normalized
}

function preferNumber(base: number | null, incoming: number | null) {
  if (base == null) {
    return incoming
  }

  if (incoming == null) {
    return base
  }

  return incoming
}

function preferByOrder(base: string, incoming: string, order: string[]) {
  const baseIndex = order.indexOf(base)
  const incomingIndex = order.indexOf(incoming)

  if (baseIndex === -1) {
    return incoming
  }

  if (incomingIndex === -1) {
    return base
  }

  return incomingIndex < baseIndex ? incoming : base
}

function preferLaterDate(base: string | null, incoming: string | null) {
  if (!base) {
    return incoming
  }

  if (!incoming) {
    return base
  }

  return new Date(incoming).getTime() > new Date(base).getTime() ? incoming : base
}

function preferEarlierDate(base: string | null, incoming: string | null) {
  if (!base) {
    return incoming
  }

  if (!incoming) {
    return base
  }

  return new Date(incoming).getTime() < new Date(base).getTime() ? incoming : base
}

function joinUniqueText(base: string, incoming: string, separator = " | ") {
  const parts = [base, incoming]
    .flatMap((value) => value.split(separator))
    .map((value) => collapseWhitespace(value))
    .filter(Boolean)

  return Array.from(new Set(parts)).join(separator)
}

function calculateCompleteness(record: PortfolioRecord) {
  const populated = REQUIRED_FIELDS.filter(({ field }) => {
    return isMeaningfulFieldValue(record[field])
  }).length

  return Math.round((populated / REQUIRED_FIELDS.length) * 100)
}

function linkNotesToProjects(notes: PortfolioNote[], records: PortfolioRecord[]) {
  return notes.map((note) => {
    if (note.relatedProject) {
      return note
    }

    const matched = records.find((record) => {
      const normalizedName = normalizeText(record.name)
      return normalizedName.length > 6 && normalizeText(note.text).includes(normalizedName)
    })

    return matched ? { ...note, relatedProject: matched.name } : note
  })
}

function buildQualityFindings(records: PortfolioRecord[], notes: PortfolioNote[], duplicateGroups: PortfolioRecord[][]) {
  const findings: QualityFinding[] = []

  if (duplicateGroups.length) {
    findings.push({
      id: "duplicates",
      level: "warning",
      title: "Duplicate project records detected",
      detail: `${duplicateGroups.length} duplicate group${duplicateGroups.length === 1 ? "" : "s"} were found across uploaded sources and consolidated into a single tracking view.`,
      recommendation: "Keep a single project identifier across workbook tabs and status reports.",
      impactedProjects: duplicateGroups.slice(0, 5).map((group) => group[0].name),
    })
  }

  const lowCoverageFields = buildFieldCoverage(records).filter((item) => item.coverage < 80)
  if (lowCoverageFields.length) {
    findings.push({
      id: "coverage",
      level: "critical",
      title: "Required data fields are not consistently populated",
      detail: `${lowCoverageFields.map((item) => item.label).join(", ")} are below the 80% completeness threshold, which weakens cross-portfolio reporting.`,
      recommendation: "Enforce a mandatory field set before status reporting is published.",
      impactedProjects: records
        .filter((record) => record.dataCompleteness < 75)
        .slice(0, 5)
        .map((record) => record.name),
    })
  }

  const staleProjects = records.filter((record) => isStaleUpdate(record.lastUpdate))
  if (staleProjects.length) {
    findings.push({
      id: "stale-updates",
      level: "warning",
      title: "Project trackers contain stale status updates",
      detail: `${staleProjects.length} project${staleProjects.length === 1 ? "" : "s"} have not been refreshed for more than 45 days.`,
      recommendation: "Refresh last-update dates before the next management reporting cycle.",
      impactedProjects: staleProjects.slice(0, 5).map((record) => record.name),
    })
  }

  const costVariance = records.filter(
    (record) =>
      record.budget != null &&
      ((record.actualCost != null && record.actualCost > record.budget * 1.1) ||
        (record.forecastCost != null && record.forecastCost > record.budget * 1.05))
  )
  if (costVariance.length) {
    findings.push({
      id: "cost-variance",
      level: "critical",
      title: "Forecast cost overruns require escalation",
      detail: `${costVariance.length} project${costVariance.length === 1 ? "" : "s"} are running above approved budget or are forecasting a cost overrun.`,
      recommendation: "Validate forecast assumptions and prepare a management watchlist with mitigation owners.",
      impactedProjects: costVariance.slice(0, 5).map((record) => record.name),
    })
  }

  const scheduleIssues = records.filter(
    (record) =>
      (record.startDate && record.endDate && new Date(record.endDate).getTime() < new Date(record.startDate).getTime()) ||
      (record.endDate &&
        new Date(record.endDate).getTime() < Date.now() &&
        record.status !== "Completed")
  )
  if (scheduleIssues.length) {
    findings.push({
      id: "schedule",
      level: "warning",
      title: "Schedule logic needs correction",
      detail: `${scheduleIssues.length} project${scheduleIssues.length === 1 ? "" : "s"} show invalid or overdue finish dates without a completed status.`,
      recommendation: "Cross-check planned end dates against current status and update slippage notes.",
      impactedProjects: scheduleIssues.slice(0, 5).map((record) => record.name),
    })
  }

  const documentationGaps = records.filter((record) => ["Missing", "Pending"].includes(record.documentationStatus))
  if (documentationGaps.length) {
    findings.push({
      id: "documentation",
      level: "warning",
      title: "Documentation register is incomplete",
      detail: `${documentationGaps.length} project${documentationGaps.length === 1 ? "" : "s"} still have missing or pending documentation packages.`,
      recommendation: "Standardize permit, drawing, and handover uploads before monthly reporting.",
      impactedProjects: documentationGaps.slice(0, 5).map((record) => record.name),
    })
  }

  const meetingGaps = records.filter((record) => ["Missing", "Pending"].includes(record.meetingStatus))
  if (meetingGaps.length) {
    findings.push({
      id: "meeting-materials",
      level: "info",
      title: "Meeting packs need administrative follow-up",
      detail: `${meetingGaps.length} project${meetingGaps.length === 1 ? "" : "s"} require updated steering or review meeting materials.`,
      recommendation: "Create a meeting-pack checklist with owners and due dates.",
      impactedProjects: meetingGaps.slice(0, 5).map((record) => record.name),
    })
  }

  const noteIssues = notes.filter((note) => note.severity === "high")
  if (noteIssues.length) {
    findings.push({
      id: "report-notes",
      level: "info",
      title: "Management briefs surfaced high-priority actions",
      detail: `${noteIssues.length} high-priority note${noteIssues.length === 1 ? "" : "s"} were extracted from PDF reports and linked to project governance follow-up.`,
      recommendation: "Fold these actions into the next ad-hoc report and meeting agenda.",
      impactedProjects: noteIssues
        .map((note) => note.relatedProject)
        .filter((project): project is string => Boolean(project))
        .slice(0, 5),
    })
  }

  return findings.slice(0, 7)
}

function buildSummary(records: PortfolioRecord[], findings: QualityFinding[]): PortfolioSummary {
  const totalProjects = records.length
  const totalBudget = sumNumbers(records.map((record) => record.budget))
  const totalActualCost = sumNumbers(records.map((record) => record.actualCost))
  const totalForecastCost = sumNumbers(records.map((record) => record.forecastCost))
  const averageProgress = averageNumbers(records.map((record) => record.progress))
  const delayedCount = records.filter((record) => record.status === "Delayed").length
  const atRiskCount = records.filter((record) => record.status === "At Risk").length
  const completedCount = records.filter((record) => record.status === "Completed").length
  const staleUpdateCount = records.filter((record) => isStaleUpdate(record.lastUpdate)).length
  const missingFieldCount = records.reduce((total, record) => total + countMissingFields(record), 0)
  const documentationCoverage = percentage(
    records.filter((record) => ["Complete", "Partial"].includes(record.documentationStatus)).length,
    totalProjects
  )
  const meetingReadiness = percentage(
    records.filter((record) => ["Ready", "Updated"].includes(record.meetingStatus)).length,
    totalProjects
  )
  const completenessScore = totalProjects
    ? Math.round(100 - (missingFieldCount / (totalProjects * REQUIRED_FIELDS.length)) * 100)
    : 0
  const freshnessScore = percentage(totalProjects - staleUpdateCount, totalProjects)
  const statusReliabilityScore = percentage(
    totalProjects - delayedCount - Math.ceil(atRiskCount * 0.75),
    totalProjects
  )
  const findingPenalty =
    findings.filter((finding) => finding.level === "critical").length * 8 +
    findings.filter((finding) => finding.level === "warning").length * 4 +
    findings.filter((finding) => finding.level === "info").length * 2

  const qualityScore = clampNumber(
    Math.round(
      completenessScore * 0.45 +
        freshnessScore * 0.2 +
        documentationCoverage * 0.15 +
        meetingReadiness * 0.1 +
        statusReliabilityScore * 0.1 -
        findingPenalty
    ),
    0,
    100
  )

  return {
    totalProjects,
    totalBudget,
    totalActualCost,
    totalForecastCost,
    averageProgress,
    delayedCount,
    atRiskCount,
    completedCount,
    staleUpdateCount,
    missingFieldCount,
    documentationCoverage,
    meetingReadiness,
    qualityScore,
  }
}

function buildFieldCoverage(records: PortfolioRecord[]) {
  return REQUIRED_FIELDS.map(({ field, label }) => {
    const populated = records.filter((record) => isMeaningfulFieldValue(record[field])).length

    return {
      label,
      coverage: percentage(populated, records.length),
      populated,
      total: records.length,
    }
  })
}

function buildStatusDistribution(records: PortfolioRecord[]) {
  return STATUS_ORDER.filter((status) => records.some((record) => record.status === status))
    .map((status) => ({
      label: status,
      value: records.filter((record) => record.status === status).length,
    }))
    .filter((item) => item.value > 0)
}

function buildRegionDistribution(records: PortfolioRecord[]) {
  const bucket = new Map<string, number>()

  records.forEach((record) => {
    const key = record.region || record.country || "Unassigned"
    const amount = record.budget ?? 1
    bucket.set(key, (bucket.get(key) ?? 0) + amount)
  })

  return Array.from(bucket.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((left, right) => right.value - left.value)
    .slice(0, 5)
}

function extractKeywords(records: PortfolioRecord[], notes: PortfolioNote[]) {
  const bucket = new Map<string, number>()
  const combinedText = [
    ...records.map((record) => `${record.name} ${record.phase} ${record.notes}`),
    ...notes.map((note) => note.text),
  ].join(" ")

  combinedText
    .split(/[^A-Za-z]+/)
    .map((token) => token.toLowerCase())
    .filter((token) => token.length > 4 && !KEYWORD_STOPWORDS.has(token))
    .forEach((token) => {
      bucket.set(token, (bucket.get(token) ?? 0) + 1)
    })

  return Array.from(bucket.entries())
    .sort((left, right) => right[1] - left[1])
    .slice(0, 8)
    .map(([keyword]) => keyword)
}

function buildManagementSummary(
  records: PortfolioRecord[],
  summary: PortfolioSummary,
  sources: AnalysisSource[],
  regionDistribution: DistributionItem[],
  findings: QualityFinding[]
) {
  const topRegion = regionDistribution[0]
  const attentionProjects = sortRecordsForAttention(records).slice(0, 3).map((record) => record.name)

  return [
    `Collected and consolidated ${summary.totalProjects} project records from ${sources.length} source file${sources.length === 1 ? "" : "s"} into a single construction portfolio view.`,
    `${summary.delayedCount} project${summary.delayedCount === 1 ? "" : "s"} are delayed and ${summary.atRiskCount} are at risk, while average completion sits at ${summary.averageProgress}% across the tracked portfolio.`,
    `Documentation coverage is ${summary.documentationCoverage}% and meeting-pack readiness is ${summary.meetingReadiness}%, giving the current portfolio a data quality score of ${summary.qualityScore}/100.`,
    topRegion
      ? `The strongest portfolio concentration is in ${topRegion.label}, which currently represents ${formatCompactNumber(topRegion.value)} of tracked exposure.`
      : "Regional exposure will appear once at least one project record is ingested.",
    attentionProjects.length
      ? `Immediate management attention should focus on ${attentionProjects.join(", ")}.`
      : "No active exception projects were identified in the current dataset.",
    findings.length
      ? `The most material reporting risk is "${findings[0].title.toLowerCase()}".`
      : "No significant data quality exceptions were found in the uploaded material.",
  ]
}

function buildAdHocReport(
  records: PortfolioRecord[],
  summary: PortfolioSummary,
  findings: QualityFinding[],
  notes: PortfolioNote[]
) {
  const delayedProjects = records
    .filter((record) => record.status === "Delayed" || record.status === "At Risk")
    .slice(0, 3)
    .map((record) => record.name)
  const documentationActions = records
    .filter((record) => ["Missing", "Pending"].includes(record.documentationStatus))
    .slice(0, 3)
    .map((record) => record.name)
  const meetingActions = notes
    .filter((note) => note.type === "meeting")
    .slice(0, 2)
    .map((note) => note.text)

  return [
    `Portfolio status: ${summary.completedCount} completed, ${summary.delayedCount} delayed, and ${summary.atRiskCount} at-risk projects.`,
    delayedProjects.length
      ? `Exception watchlist: ${delayedProjects.join(", ")} require immediate schedule or risk follow-up.`
      : "Exception watchlist: no delayed or at-risk projects were flagged by the current data.",
    findings.length
      ? `Data quality watchpoint: ${findings[0].detail}`
      : "Data quality watchpoint: all mandatory control checks passed.",
    documentationActions.length
      ? `Documentation focus: refresh missing or pending document packs for ${documentationActions.join(", ")}.`
      : "Documentation focus: no missing or pending document packs were identified.",
    meetingActions.length
      ? `Governance follow-up: ${meetingActions.join(" ")}`
      : "Governance follow-up: no additional meeting actions were extracted from supporting reports.",
  ]
}

function buildStandards(fieldCoverage: CoverageItem[], summary: PortfolioSummary) {
  const weakFields = fieldCoverage.filter((item) => item.coverage < 80).map((item) => item.label)

  return [
    "Maintain one mandatory project master template covering project ID, project name, region, status, progress, budget, end date, last update, documentation status, and meeting readiness.",
    "Run weekly validation for status-date-progress alignment so delayed, completed, and overdue projects are classified consistently.",
    `Only publish management reporting once the portfolio reaches a minimum data quality threshold of 85/100. Current score: ${summary.qualityScore}/100.`,
    weakFields.length
      ? `Priority standardization gap: ${weakFields.join(", ")} need stronger completion discipline across the portfolio.`
      : "Current coverage supports consistent management reporting across the uploaded dataset.",
  ]
}

function buildAdminActions(records: PortfolioRecord[], notes: PortfolioNote[], sources: AnalysisSource[]) {
  const missingDocs = records.filter((record) => ["Missing", "Pending"].includes(record.documentationStatus))
  const meetingPacks = records.filter((record) => ["Missing", "Pending"].includes(record.meetingStatus))
  const sourceLabels = sources.map((source) => source.label).join(", ")
  const extractedActions = notes
    .filter((note) => note.type === "meeting" || note.type === "documentation")
    .slice(0, 3)
    .map((note) => note.text)

  return [
    sourceLabels
      ? `Organize uploaded source material in the internal tracker: ${sourceLabels}.`
      : "No uploaded source files are currently queued for documentation control.",
    missingDocs.length
      ? `Prepare and archive missing documentation packs for ${missingDocs.slice(0, 3).map((record) => record.name).join(", ")}.`
      : "Documentation registers are sufficiently complete for the current dataset.",
    meetingPacks.length
      ? `Refresh steering committee or project review materials for ${meetingPacks.slice(0, 3).map((record) => record.name).join(", ")}.`
      : "Meeting packs are ready or recently updated for the tracked projects.",
    extractedActions.length
      ? `Supporting notes extracted from PDF material: ${extractedActions.join(" ")}`
      : "No additional administrative actions were extracted from PDF uploads.",
  ]
}

function countMissingFields(record: PortfolioRecord) {
  return REQUIRED_FIELDS.reduce((count, { field }) => {
    return isMeaningfulFieldValue(record[field]) ? count : count + 1
  }, 0)
}

function isStaleUpdate(dateValue: string | null) {
  if (!dateValue) {
    return true
  }

  const difference = Date.now() - new Date(dateValue).getTime()
  return difference / (1000 * 60 * 60 * 24) > 45
}

function sortRecordsForAttention(records: PortfolioRecord[]) {
  return [...records].sort((left, right) => scoreRecordAttention(right) - scoreRecordAttention(left))
}

function scoreRecordAttention(record: PortfolioRecord) {
  let score = 0

  if (record.status === "Delayed") {
    score += 30
  }

  if (record.status === "At Risk") {
    score += 22
  }

  if (record.riskLevel === "Critical") {
    score += 24
  }

  if (record.riskLevel === "High") {
    score += 16
  }

  if (["Missing", "Pending"].includes(record.documentationStatus)) {
    score += 10
  }

  if (["Missing", "Pending"].includes(record.meetingStatus)) {
    score += 8
  }

  if (isStaleUpdate(record.lastUpdate)) {
    score += 12
  }

  if (record.dataCompleteness < 75) {
    score += 8
  }

  return score + (record.openIssues ?? 0)
}

function sumNumbers(values: Array<number | null>): number {
  return values.reduce<number>((total, value) => total + (value ?? 0), 0)
}

function averageNumbers(values: Array<number | null>): number {
  const filtered = values.filter((value): value is number => value != null)
  if (!filtered.length) {
    return 0
  }

  return Math.round(filtered.reduce((total, value) => total + value, 0) / filtered.length)
}

function percentage(value: number, total: number) {
  if (!total) {
    return 0
  }

  return Math.round((value / total) * 100)
}

function clampNumber(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum)
}

function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("en-US", {
    notation: value >= 1000 ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(value)
}

function slugify(value: string) {
  return normalizeText(value).replace(/[^a-z0-9]+/g, "-")
}

function isMeaningfulFieldValue(value: unknown) {
  if (typeof value === "number") {
    return Number.isFinite(value)
  }

  if (typeof value === "string") {
    const normalized = normalizeText(value)
    return Boolean(
      normalized &&
        !["unknown", "unassigned", "n/a", "na", "none", "not available", "missing"].includes(normalized)
    )
  }

  return Boolean(value)
}
