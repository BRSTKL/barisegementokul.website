import React from "react"
import { motion } from "framer-motion"
import {
  AlertTriangle,
  BarChart3,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  Copy,
  Download,
  FileSpreadsheet,
  FileText,
  FolderKanban,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Table2,
  TrendingUp,
  Upload,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  type AnalysisSource,
  type ColumnMappingAudit,
  type CoverageItem,
  type DistributionItem,
  type PortfolioAnalysis,
  type PortfolioRecord,
  type QualityFinding,
} from "@/lib/portfolio-data-demo"
import {
  downloadAnalysisCsv,
  downloadMappingAuditCsv,
  downloadReportMarkdown,
} from "@/lib/portfolio-exports"
import { type InterpretiveSummaryResult } from "@/lib/portfolio-llm"

const WORKFLOW_STEPS = [
  "Upload Excel or PDF source files.",
  "Review the charts to understand portfolio health.",
  "Inspect project tables and quality issues.",
  "Export results or generate the Gemini summary.",
]

const SUPPORTED_FIELDS = [
  "Project ID",
  "Project Name",
  "Region",
  "Status",
  "Progress",
  "Budget",
  "Forecast Cost",
  "End Date",
  "Last Update",
  "Documentation",
  "Meeting Pack",
  "Risk Level",
]

const STATUS_ORDER = ["Delayed", "At Risk", "On Track", "Planned", "Completed", "Unknown"]

type DataLabView = "overview" | "projects" | "issues" | "reports"
type Tone = "primary" | "emerald" | "amber" | "rose" | "sky" | "slate"

interface DashboardBarItem {
  label: string
  value: number
  tone: Tone
  helper?: string
}

interface MappingSummaryRow {
  sourceName: string
  sheetName: string
  rowCount: number
  matchedCount: number
  unmatchedCount: number
  averageConfidence: number
  unmatchedHeaders: string[]
}

interface ProjectPortfolioDataLabLayoutProps {
  analysis: PortfolioAnalysis
  isLoading: boolean
  isDragging: boolean
  error: string | null
  uploadedFiles: string[]
  copied: boolean
  aiSummary: InterpretiveSummaryResult | null
  isGeneratingAi: boolean
  aiError: string | null
  activeView: DataLabView
  projectSearch: string
  regionFilter: string
  analyzeButtonLabel: string
  inputRef: React.RefObject<HTMLInputElement>
  onChooseFiles: () => void
  onLoadSample: () => void
  onProjectSearchChange: (value: string) => void
  onRegionFilterChange: (value: string) => void
  onActiveViewChange: (view: DataLabView) => void
  onGenerateAiSummary: () => void
  onCopySummary: () => void
  onFileChange: (files: File[]) => void
  onDragOver: (event: React.DragEvent<HTMLDivElement>) => void
  onDragLeave: () => void
  onDrop: (event: React.DragEvent<HTMLDivElement>) => void
}

const VIEW_TABS: Array<{
  value: DataLabView
  label: string
  helper: string
  icon: React.ComponentType<{ className?: string }>
}> = [
  { value: "overview", label: "Overview", helper: "Charts and portfolio health", icon: BarChart3 },
  { value: "projects", label: "Projects", helper: "Filter and compare records", icon: FolderKanban },
  { value: "issues", label: "Issues", helper: "Quality findings and mapping", icon: AlertTriangle },
  { value: "reports", label: "Reports", helper: "Exports and Gemini summary", icon: FileText },
]

export function ProjectPortfolioDataLabLayout({
  analysis,
  isLoading,
  isDragging,
  error,
  uploadedFiles,
  copied,
  aiSummary,
  isGeneratingAi,
  aiError,
  activeView,
  projectSearch,
  regionFilter,
  analyzeButtonLabel,
  inputRef,
  onChooseFiles,
  onLoadSample,
  onProjectSearchChange,
  onRegionFilterChange,
  onActiveViewChange,
  onGenerateAiSummary,
  onCopySummary,
  onFileChange,
  onDragOver,
  onDragLeave,
  onDrop,
}: ProjectPortfolioDataLabLayoutProps) {
  const rowsIngested = React.useMemo(
    () => sumNumberList(analysis.sources.map((source) => source.rowsIngested)),
    [analysis.sources]
  )
  const portfolioOpenActions = React.useMemo(
    () => sumNumberList(analysis.records.map((record) => record.openIssues ?? 0)),
    [analysis.records]
  )
  const regionOptions = React.useMemo(
    () => ["all", ...new Set(analysis.records.map((record) => record.region).filter(Boolean))],
    [analysis.records]
  )
  const filteredRecords = React.useMemo(() => {
    const query = projectSearch.trim().toLowerCase()

    return analysis.records.filter((record) => {
      const matchesRegion = regionFilter === "all" || record.region === regionFilter
      if (!matchesRegion) {
        return false
      }

      if (!query) {
        return true
      }

      return [
        record.name,
        record.region,
        record.country,
        record.projectManager,
        record.contractor,
      ]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query))
    })
  }, [analysis.records, projectSearch, regionFilter])
  const criticalFindingCount = analysis.qualityFindings.filter((finding) => finding.level === "critical").length
  const warningFindingCount = analysis.qualityFindings.filter((finding) => finding.level === "warning").length
  const infoFindingCount = analysis.qualityFindings.filter((finding) => finding.level === "info").length
  const freshnessScore = percentageValue(
    analysis.summary.totalProjects - analysis.summary.staleUpdateCount,
    analysis.summary.totalProjects
  )
  const fieldCoverageAverage = averageNumberList(analysis.fieldCoverage.map((item) => item.coverage))
  const scheduleHealthScore = percentageValue(
    analysis.summary.totalProjects - analysis.summary.delayedCount - analysis.summary.atRiskCount,
    analysis.summary.totalProjects
  )
  const qualityDimensions: DashboardBarItem[] = [
    { label: "Field coverage", value: fieldCoverageAverage, helper: "Mandatory fields populated", tone: qualityTone(fieldCoverageAverage) },
    { label: "Freshness", value: freshnessScore, helper: "Updated in 45 days", tone: qualityTone(freshnessScore) },
    { label: "Documentation", value: analysis.summary.documentationCoverage, helper: "Permit and drawing packs", tone: qualityTone(analysis.summary.documentationCoverage) },
    { label: "Meeting packs", value: analysis.summary.meetingReadiness, helper: "Review material readiness", tone: qualityTone(analysis.summary.meetingReadiness) },
    { label: "Schedule health", value: scheduleHealthScore, helper: "Not delayed or at risk", tone: qualityTone(scheduleHealthScore) },
  ]
  const attentionRecords = analysis.records.slice(0, 5)
  const fieldCoverageRows = [...analysis.fieldCoverage].sort((left, right) => left.coverage - right.coverage)
  const mappingSummaryRows: MappingSummaryRow[] = analysis.columnMappings.map((mapping) => ({
    sourceName: mapping.sourceName,
    sheetName: mapping.sheetName,
    rowCount: mapping.rowCount,
    matchedCount: mapping.matches.length,
    unmatchedCount: mapping.unmatchedHeaders.length,
    averageConfidence: mapping.matches.length
      ? Math.round(averageNumberList(mapping.matches.map((match) => match.confidence * 100)))
      : 0,
    unmatchedHeaders: mapping.unmatchedHeaders,
  }))
  const filteredAverageProgress = filteredRecords.length
    ? Math.round(sumNumberList(filteredRecords.map((record) => record.progress ?? 0)) / filteredRecords.length)
    : 0
  const filteredOpenIssues = sumNumberList(filteredRecords.map((record) => record.openIssues ?? 0))
  const filteredStatusDistribution = buildToneDistribution(
    filteredRecords.map((record) => record.status),
    STATUS_ORDER,
    statusTone
  )
  const filteredControlRows: DashboardBarItem[] = [
    {
      label: "Docs ready",
      value: percentageValue(
        filteredRecords.filter((record) => ["Complete", "Partial"].includes(record.documentationStatus)).length,
        filteredRecords.length
      ),
      helper: "Documentation status",
      tone: "emerald",
    },
    {
      label: "Meeting ready",
      value: percentageValue(
        filteredRecords.filter((record) => ["Ready", "Updated"].includes(record.meetingStatus)).length,
        filteredRecords.length
      ),
      helper: "Review pack readiness",
      tone: "sky",
    },
    {
      label: "Fresh updates",
      value: percentageValue(
        filteredRecords.filter((record) => !isStaleProjectDate(record.lastUpdate)).length,
        filteredRecords.length
      ),
      helper: "Updated in 45 days",
      tone: "amber",
    },
  ]

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
        <Card className="border-primary/20 bg-gradient-to-br from-background via-background to-primary/5">
          <CardHeader>
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="outline" className="border-primary/30 text-primary">
                Construction Portfolio Data Lab
              </Badge>
              <Badge variant="secondary">{analysis.mode === "sample" ? "Sample dataset" : "Uploaded dataset"}</Badge>
            </div>
            <CardTitle className="text-2xl tracking-tight sm:text-3xl">
              Understand the dataset quickly, then drill into the records that need work.
            </CardTitle>
            <CardDescription>
              This demo reads Excel trackers and PDF portfolio packs, consolidates project data, checks quality, and
              turns the output into charts, tables, exports, and a Gemini-based summary.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              className={`rounded-3xl border-2 border-dashed p-5 transition-colors sm:p-6 ${
                isDragging ? "border-primary bg-primary/10" : "border-border bg-background/70"
              }`}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-primary">
                    {isLoading ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
                    <span className="font-semibold">Upload portfolio files</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Supports `.xlsx`, `.xls`, `.csv`, and `.pdf`. Start with Excel for the best tracking output.
                  </p>
                </div>

                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
                  <Button className="w-full sm:w-auto" onClick={onChooseFiles} disabled={isLoading}>
                    <Upload className="mr-2 h-4 w-4" />
                    Choose files
                  </Button>
                  <Button className="w-full sm:w-auto" variant="outline" onClick={onLoadSample} disabled={isLoading}>
                    Load sample
                  </Button>
                </div>
              </div>

              <input
                ref={inputRef}
                type="file"
                accept=".xlsx,.xls,.csv,.pdf"
                multiple
                className="hidden"
                onChange={(event) => onFileChange(Array.from(event.target.files ?? []))}
              />

              <div className="mt-5 flex flex-wrap gap-2">
                {(uploadedFiles.length ? uploadedFiles : analysis.sources.map((source) => source.label)).map((label) => (
                  <Badge key={label} variant="outline" className="border-border/60 bg-background/80">
                    {label.endsWith(".pdf") ? <FileText className="mr-2 h-3.5 w-3.5" /> : <FileSpreadsheet className="mr-2 h-3.5 w-3.5" />}
                    {label}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <Button className="w-full sm:w-auto" variant="outline" size="sm" onClick={() => downloadAnalysisCsv(analysis)}>
                <Download className="mr-2 h-4 w-4" />
                Export normalized CSV
              </Button>
              <Button className="w-full sm:w-auto" variant="outline" size="sm" onClick={() => downloadMappingAuditCsv(analysis)}>
                <Table2 className="mr-2 h-4 w-4" />
                Export mapping audit
              </Button>
              <Button className="w-full sm:w-auto" variant="outline" size="sm" onClick={() => downloadReportMarkdown(analysis)}>
                <FileText className="mr-2 h-4 w-4" />
                Download report
              </Button>
            </div>

            {error ? (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100">
                {error}
              </div>
            ) : null}
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="h-5 w-5 text-primary" />
                Start here
              </CardTitle>
              <CardDescription>A simple flow from upload to action.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {WORKFLOW_STEPS.map((item, index) => (
                <div key={item} className="flex items-start gap-3 rounded-2xl border border-border/60 bg-muted/20 p-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    0{index + 1}
                  </div>
                  <span className="text-sm leading-6 text-muted-foreground">{item}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ShieldCheck className="h-5 w-5 text-primary" />
                Live snapshot
              </CardTitle>
              <CardDescription>The current dataset status refreshes after each upload.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <DashboardSnapshotTile label="Projects" value={String(analysis.summary.totalProjects)} helper="Consolidated records" />
                <DashboardSnapshotTile label="Rows" value={formatCompactCount(rowsIngested)} helper="Rows ingested" />
                <DashboardSnapshotTile label="Open findings" value={String(analysis.qualityFindings.length)} helper="QA findings" />
                <DashboardSnapshotTile label="Open actions" value={String(portfolioOpenActions)} helper="Project actions" />
              </div>
              <div className="space-y-3">
                <div className="text-sm font-semibold">Expected tracker fields</div>
                <div className="flex flex-wrap gap-2">
                  {SUPPORTED_FIELDS.slice(0, 8).map((field) => (
                    <Badge key={field} variant="secondary" className="bg-background/80">
                      {field}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <DashboardMetricCard icon={FolderKanban} label="Projects" value={String(analysis.summary.totalProjects)} helper="Consolidated records" tone="primary" />
        <DashboardMetricCard icon={Building2} label="Budget" value={formatCurrencyCompact(analysis.summary.totalBudget)} helper="Tracked portfolio budget" tone="sky" />
        <DashboardMetricCard icon={TrendingUp} label="Average progress" value={`${analysis.summary.averageProgress}%`} helper="Portfolio execution progress" tone="emerald" />
        <DashboardMetricCard icon={ShieldCheck} label="Quality score" value={`${analysis.summary.qualityScore}/100`} helper="Reporting readiness" tone={qualityTone(analysis.summary.qualityScore)} />
        <DashboardMetricCard icon={AlertTriangle} label="Stale trackers" value={String(analysis.summary.staleUpdateCount)} helper="Need status refresh" tone={analysis.summary.staleUpdateCount ? "amber" : "emerald"} />
      </div>

      <Tabs value={activeView} onValueChange={(value) => onActiveViewChange(value as DataLabView)} className="space-y-6">
        <div className="overflow-x-auto">
          <TabsList className="h-auto w-max min-w-full justify-start rounded-3xl bg-muted/40 p-1.5">
            {VIEW_TABS.map(({ value, label, helper, icon: Icon }) => (
              <TabsTrigger key={value} value={value} className="h-auto min-w-[180px] rounded-2xl px-4 py-3 data-[state=active]:shadow-sm">
                <div className="flex items-start gap-3 text-left">
                  <div className="rounded-xl bg-background/80 p-2 text-primary">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="font-medium">{label}</div>
                    <div className="text-xs text-muted-foreground">{helper}</div>
                  </div>
                </div>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="overview" className="mt-0">
          <OverviewTabPanel analysis={analysis} qualityDimensions={qualityDimensions} attentionRecords={attentionRecords} />
        </TabsContent>
        <TabsContent value="projects" className="mt-0">
          <ProjectsTabPanel
            analysis={analysis}
            filteredRecords={filteredRecords}
            filteredAverageProgress={filteredAverageProgress}
            filteredOpenIssues={filteredOpenIssues}
            filteredStatusDistribution={filteredStatusDistribution}
            filteredControlRows={filteredControlRows}
            projectSearch={projectSearch}
            regionFilter={regionFilter}
            regionOptions={regionOptions}
            onProjectSearchChange={onProjectSearchChange}
            onRegionFilterChange={onRegionFilterChange}
          />
        </TabsContent>
        <TabsContent value="issues" className="mt-0">
          <IssuesTabPanel
            analysis={analysis}
            criticalFindingCount={criticalFindingCount}
            warningFindingCount={warningFindingCount}
            infoFindingCount={infoFindingCount}
            fieldCoverageRows={fieldCoverageRows}
            mappingSummaryRows={mappingSummaryRows}
          />
        </TabsContent>
        <TabsContent value="reports" className="mt-0">
          <ReportsTabPanel
            analysis={analysis}
            aiSummary={aiSummary}
            aiError={aiError}
            copied={copied}
            isGeneratingAi={isGeneratingAi}
            isLoading={isLoading}
            analyzeButtonLabel={analyzeButtonLabel}
            onCopySummary={onCopySummary}
            onGenerateAiSummary={onGenerateAiSummary}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function OverviewTabPanel({
  analysis,
  qualityDimensions,
  attentionRecords,
}: {
  analysis: PortfolioAnalysis
  qualityDimensions: DashboardBarItem[]
  attentionRecords: PortfolioRecord[]
}) {
  return (
    <div className="space-y-6">
      <DashboardTabIntro
        title="Portfolio overview"
        description="A clearer landing view with the key charts, top watchlist projects, and source ingestion details."
      />

      <div className="grid gap-6 xl:grid-cols-[1.05fr,0.95fr]">
        <Card>
          <CardHeader>
            <CardTitle>Data quality at a glance</CardTitle>
            <CardDescription>
              One score ring and five simple dimensions to show where the portfolio reporting is strong or weak.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 lg:grid-cols-[220px,1fr]">
            <DashboardScoreRing value={analysis.summary.qualityScore} label="Quality score" />
            <div className="space-y-4">
              {qualityDimensions.map((item) => (
                <DashboardMetricBar key={item.label} label={item.label} value={item.value} helper={item.helper} tone={item.tone} />
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status distribution</CardTitle>
            <CardDescription>
              A simple chart for delayed, at risk, on track, planned, and completed projects.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <DashboardVerticalChart items={analysis.statusDistribution.map((item) => ({ ...item, tone: statusTone(item.label) }))} />
            <div className="grid gap-3 sm:grid-cols-3">
              <DashboardSnapshotTile label="Delayed" value={String(analysis.summary.delayedCount)} helper="Need recovery" />
              <DashboardSnapshotTile label="At risk" value={String(analysis.summary.atRiskCount)} helper="Watchlist" />
              <DashboardSnapshotTile label="Completed" value={String(analysis.summary.completedCount)} helper="Closed out" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr,1.05fr]">
        <Card>
          <CardHeader>
            <CardTitle>Regional exposure</CardTitle>
            <CardDescription>Top portfolio regions by tracked budget or exposure in the uploaded files.</CardDescription>
          </CardHeader>
          <CardContent>
            <DashboardHorizontalChart
              items={analysis.regionDistribution.map((item) => ({
                ...item,
                tone: "primary" as Tone,
                helper: formatCurrencyCompact(item.value),
              }))}
              formatter={(value) => formatCurrencyCompact(value)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Priority watchlist</CardTitle>
            <CardDescription>
              The five projects most likely to need action, based on risk, stale data, and missing controls.
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <DashboardAttentionTable records={attentionRecords} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr,1.05fr]">
        <Card>
          <CardHeader>
            <CardTitle>Source ingestion</CardTitle>
            <CardDescription>What was read from the uploaded Excel and PDF files.</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <DashboardSourceTable sources={analysis.sources} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Management notes</CardTitle>
            <CardDescription>
              Short narrative output for the current dataset, useful before opening the reports tab.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <DashboardActionList title="Summary highlights" items={analysis.managementSummary.slice(0, 4)} />
            <Separator />
            <DashboardNoteFeed notes={analysis.notes} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function ProjectsTabPanel({
  analysis,
  filteredRecords,
  filteredAverageProgress,
  filteredOpenIssues,
  filteredStatusDistribution,
  filteredControlRows,
  projectSearch,
  regionFilter,
  regionOptions,
  onProjectSearchChange,
  onRegionFilterChange,
}: {
  analysis: PortfolioAnalysis
  filteredRecords: PortfolioRecord[]
  filteredAverageProgress: number
  filteredOpenIssues: number
  filteredStatusDistribution: DashboardBarItem[]
  filteredControlRows: DashboardBarItem[]
  projectSearch: string
  regionFilter: string
  regionOptions: string[]
  onProjectSearchChange: (value: string) => void
  onRegionFilterChange: (value: string) => void
}) {
  return (
    <div className="space-y-6">
      <DashboardTabIntro
        title="Project register"
        description="A simpler project view: filter first, then compare progress, controls, and last update in the table."
      />

      <Card>
        <CardContent className="flex flex-col gap-4 pt-6">
          <div className="grid gap-4 xl:grid-cols-[1fr,auto]">
            <input
              className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary"
              placeholder="Search by project, region, country, manager, or contractor"
              value={projectSearch}
              onChange={(event) => onProjectSearchChange(event.target.value)}
            />
            <div className="flex flex-wrap gap-2">
              {regionOptions.map((option) => (
                <Button
                  key={option}
                  size="sm"
                  variant={regionFilter === option ? "default" : "outline"}
                  onClick={() => onRegionFilterChange(option)}
                >
                  {option === "all" ? "All regions" : option}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-4">
            <DashboardSnapshotTile label="Shown projects" value={String(filteredRecords.length)} helper="Current filter result" />
            <DashboardSnapshotTile label="Avg progress" value={`${filteredAverageProgress}%`} helper="For current filter" />
            <DashboardSnapshotTile label="Open actions" value={String(filteredOpenIssues)} helper="Sum of project issues" />
            <DashboardSnapshotTile
              label="Scope"
              value={regionFilter === "all" ? "All regions" : regionFilter}
              helper={projectSearch ? `Query: ${projectSearch}` : "No text filter"}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.25fr,0.75fr]">
        <Card>
          <CardHeader>
            <CardTitle>Project tracking table</CardTitle>
            <CardDescription>Main working table for project status, controls, and recency checks.</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <DashboardProjectTable records={filteredRecords} />
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Filtered portfolio health</CardTitle>
              <CardDescription>Quick charts that react to the project filter and region selection.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <DashboardHorizontalChart items={filteredStatusDistribution} formatter={(value) => `${value} projects`} />
              <Separator />
              <div className="space-y-4">
                {filteredControlRows.map((item) => (
                  <DashboardMetricBar key={item.label} label={item.label} value={item.value} helper={item.helper} tone={item.tone} />
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Project notes</CardTitle>
              <CardDescription>Recent narrative context pulled from trackers and supporting PDF material.</CardDescription>
            </CardHeader>
            <CardContent>
              <DashboardNoteFeed notes={analysis.notes} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function DashboardTabIntro({ title, description }: { title: string; description: string }) {
  return (
    <div className="space-y-2">
      <h3 className="text-2xl font-semibold tracking-tight">{title}</h3>
      <p className="max-w-3xl text-sm leading-6 text-muted-foreground">{description}</p>
    </div>
  )
}

function DashboardMetricCard({
  icon: Icon,
  label,
  value,
  helper,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  helper: string
  tone: Tone
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
      <Card className="h-full overflow-hidden">
        <CardContent className="p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="text-sm text-muted-foreground">{label}</div>
            <div className={`rounded-xl p-2 ${toneBgClass(tone)} ${toneTextClass(tone)}`}>
              <Icon className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-semibold tracking-tight">{value}</div>
          <div className="mt-2 text-sm text-muted-foreground">{helper}</div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function DashboardSnapshotTile({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-background/80 p-4">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-2 text-xl font-semibold tracking-tight">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{helper}</div>
    </div>
  )
}

function DashboardScoreRing({ value, label }: { value: number; label: string }) {
  const normalized = clampNumber(value, 0, 100)
  const radius = 54
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference - (normalized / 100) * circumference

  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-border/60 bg-muted/20 p-4">
      <div className="relative flex h-36 w-36 items-center justify-center">
        <svg className="h-36 w-36 -rotate-90" viewBox="0 0 140 140">
          <circle cx="70" cy="70" r={radius} strokeWidth="12" className="stroke-current text-muted" fill="none" />
          <circle
            cx="70"
            cy="70"
            r={radius}
            strokeWidth="12"
            strokeLinecap="round"
            className="stroke-current text-primary"
            fill="none"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={dashOffset}
          />
        </svg>
        <div className="absolute text-center">
          <div className="text-3xl font-semibold">{normalized}</div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground">of 100</div>
        </div>
      </div>
      <div className="mt-4 text-sm font-medium">{label}</div>
    </div>
  )
}

function DashboardMetricBar({
  label,
  value,
  helper,
  tone,
}: {
  label: string
  value: number
  helper?: string
  tone: Tone
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3 text-sm">
        <div>
          <div className="font-medium">{label}</div>
          {helper ? <div className="text-xs text-muted-foreground">{helper}</div> : null}
        </div>
        <span className={`font-semibold ${toneTextClass(tone)}`}>{value}%</span>
      </div>
      <div className="h-2.5 rounded-full bg-muted">
        <div className={`h-2.5 rounded-full ${toneSolidClass(tone)}`} style={{ width: `${clampNumber(value, 0, 100)}%` }} />
      </div>
    </div>
  )
}

function DashboardVerticalChart({ items }: { items: Array<DistributionItem & { tone: Tone }> }) {
  if (!items.length) {
    return <DashboardEmptyState message="No distribution data is available for this dataset." />
  }

  const maxValue = Math.max(...items.map((item) => item.value), 1)

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
      {items.map((item) => {
        const height = Math.max((item.value / maxValue) * 100, item.value ? 16 : 0)

        return (
          <div key={item.label} className="space-y-3">
            <div className="flex h-40 items-end rounded-3xl bg-muted/40 p-2">
              <div className="flex w-full flex-col items-center justify-end gap-2">
                <span className="text-sm font-semibold">{item.value}</span>
                <div
                  className={`w-full rounded-2xl ${toneSolidClass(item.tone)}`}
                  style={{ height: `${height}%`, minHeight: item.value ? "20px" : "0px" }}
                />
              </div>
            </div>
            <div className="text-center text-xs font-medium text-muted-foreground">{item.label}</div>
          </div>
        )
      })}
    </div>
  )
}

function DashboardHorizontalChart({
  items,
  formatter,
}: {
  items: DashboardBarItem[]
  formatter: (value: number) => string
}) {
  if (!items.length) {
    return <DashboardEmptyState message="No chart data is available for this selection." />
  }

  const maxValue = Math.max(...items.map((item) => item.value), 1)

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.label} className="space-y-1.5">
          <div className="flex items-center justify-between gap-3 text-sm">
            <div>
              <div className="font-medium">{item.label}</div>
              {item.helper ? <div className="text-xs text-muted-foreground">{item.helper}</div> : null}
            </div>
            <span className="text-muted-foreground">{formatter(item.value)}</span>
          </div>
          <div className="h-3 rounded-full bg-muted">
            <div
              className={`h-3 rounded-full ${toneSolidClass(item.tone)}`}
              style={{ width: `${Math.max((item.value / maxValue) * 100, item.value ? 10 : 0)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

function IssuesTabPanel({
  analysis,
  criticalFindingCount,
  warningFindingCount,
  infoFindingCount,
  fieldCoverageRows,
  mappingSummaryRows,
}: {
  analysis: PortfolioAnalysis
  criticalFindingCount: number
  warningFindingCount: number
  infoFindingCount: number
  fieldCoverageRows: CoverageItem[]
  mappingSummaryRows: MappingSummaryRow[]
}) {
  return (
    <div className="space-y-6">
      <DashboardTabIntro
        title="Data quality issues"
        description="This page combines the findings table, coverage chart, and mapping audit so the user sees why the data needs cleanup."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardMetricCard icon={AlertTriangle} label="Critical" value={String(criticalFindingCount)} helper="Immediate follow-up" tone={criticalFindingCount ? "rose" : "slate"} />
        <DashboardMetricCard icon={AlertTriangle} label="Warnings" value={String(warningFindingCount)} helper="Needs review" tone={warningFindingCount ? "amber" : "slate"} />
        <DashboardMetricCard icon={CheckCircle2} label="Informational" value={String(infoFindingCount)} helper="Lower severity" tone="sky" />
        <DashboardMetricCard icon={ClipboardCheck} label="Missing fields" value={String(analysis.summary.missingFieldCount)} helper="Across the portfolio" tone={analysis.summary.missingFieldCount ? "amber" : "emerald"} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr,0.95fr]">
        <Card>
          <CardHeader>
            <CardTitle>Findings table</CardTitle>
            <CardDescription>Main issue list with severity, impact, recommendation, and affected projects.</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <DashboardFindingsTable findings={analysis.qualityFindings} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Field coverage chart</CardTitle>
            <CardDescription>Required fields ranked from weakest to strongest to make cleanup priorities obvious.</CardDescription>
          </CardHeader>
          <CardContent>
            <DashboardCoverageTable items={fieldCoverageRows} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Column mapping audit</CardTitle>
          <CardDescription>Header mapping results from uploaded spreadsheets, including confidence and unmatched columns.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="overflow-x-auto">
            <DashboardMappingAuditTable rows={mappingSummaryRows} />
          </div>

          {analysis.columnMappings.length ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {analysis.columnMappings.map((mapping, index) => (
                <DashboardMappingCard key={`${mapping.sourceName}-${mapping.sheetName}-${index}`} mapping={mapping} />
              ))}
            </div>
          ) : (
            <DashboardEmptyState message="Upload a spreadsheet to inspect header mapping decisions." />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function ReportsTabPanel({
  analysis,
  aiSummary,
  aiError,
  copied,
  isGeneratingAi,
  isLoading,
  analyzeButtonLabel,
  onCopySummary,
  onGenerateAiSummary,
}: {
  analysis: PortfolioAnalysis
  aiSummary: InterpretiveSummaryResult | null
  aiError: string | null
  copied: boolean
  isGeneratingAi: boolean
  isLoading: boolean
  analyzeButtonLabel: string
  onCopySummary: () => void
  onGenerateAiSummary: () => void
}) {
  return (
    <div className="space-y-6">
      <DashboardTabIntro
        title="Reports and exports"
        description="This is the output page: generate the Gemini summary, copy the report text, or export the normalized files."
      />

      <div className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Gemini interpretive summary
            </CardTitle>
            <CardDescription>The model only runs when you press the button. It analyzes the currently loaded dataset.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={onGenerateAiSummary} disabled={isGeneratingAi || isLoading}>
              {isGeneratingAi ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              {isGeneratingAi ? "Analyzing portfolio" : analyzeButtonLabel}
            </Button>

            <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground">
              This action uses the website's secure Gemini integration. No API key entry is required on this screen.
            </div>

            {aiError ? (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100">
                {aiError}
              </div>
            ) : null}

            {aiSummary ? (
              <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold">AI portfolio analysis</div>
                    <div className="text-xs text-muted-foreground">
                      {aiSummary.model} via {formatProvider(aiSummary.provider)} on {formatDateTime(aiSummary.generatedAt)}
                    </div>
                  </div>
                  <DashboardPill label="AI generated" tone="sky" />
                </div>
                <pre className="whitespace-pre-wrap font-sans text-sm leading-6 text-muted-foreground">{aiSummary.text}</pre>
              </div>
            ) : (
              <DashboardEmptyState message="Press the button when you want Gemini to interpret the uploaded portfolio." />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle>Regular and ad-hoc report output</CardTitle>
                <CardDescription>Ready-to-use management text built from the current portfolio analysis.</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={onCopySummary}>
                <Copy className="mr-2 h-4 w-4" />
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <DashboardActionList title="Executive summary" items={analysis.managementSummary} />
            <Separator />
            <DashboardActionList title="Ad-hoc report draft" items={analysis.adHocReport} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-primary" />
              Standards and QA process
            </CardTitle>
            <CardDescription>Practical controls to keep monthly reporting consistent across projects.</CardDescription>
          </CardHeader>
          <CardContent>
            <DashboardActionList title="Standards" items={analysis.standards} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderKanban className="h-5 w-5 text-primary" />
              Administrative actions
            </CardTitle>
            <CardDescription>Suggested documentation and meeting tasks created from the uploaded portfolio material.</CardDescription>
          </CardHeader>
          <CardContent>
            <DashboardActionList title="Action queue" items={analysis.adminActions} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Report extras
            </CardTitle>
            <CardDescription>Quick context for presentation slides, steering packs, and review decks.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div className="text-sm font-semibold">Keywords</div>
              <div className="flex flex-wrap gap-2">
                {analysis.keywords.length ? (
                  analysis.keywords.map((keyword) => (
                    <Badge key={keyword} variant="secondary" className="capitalize">
                      {keyword}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">No keywords available.</span>
                )}
              </div>
            </div>
            <Separator />
            <DashboardActionList title="Current limitations" items={analysis.limitations} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function DashboardAttentionTable({ records }: { records: PortfolioRecord[] }) {
  if (!records.length) {
    return <DashboardEmptyState message="No priority projects are available." />
  }

  return (
    <table className="w-full min-w-[640px] text-sm">
      <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
        <tr>
          <th className="pb-3">Project</th>
          <th className="pb-3">Owner</th>
          <th className="pb-3">Progress</th>
          <th className="pb-3">Controls</th>
          <th className="pb-3">Status</th>
        </tr>
      </thead>
      <tbody>
        {records.map((record) => (
          <tr key={record.id} className="border-t border-border/60">
            <td className="py-4 pr-4 align-top">
              <div className="font-medium">{record.name}</div>
              <div className="mt-1 text-xs text-muted-foreground">{record.region} | {record.country}</div>
            </td>
            <td className="py-4 pr-4 align-top text-muted-foreground">{record.projectManager || "Unassigned"}</td>
            <td className="py-4 pr-4 align-top">
              <div className="font-medium">{record.progress ?? 0}%</div>
              <div className="mt-1 h-2 w-24 rounded-full bg-muted">
                <div className="h-2 rounded-full bg-primary" style={{ width: `${clampNumber(record.progress ?? 0, 0, 100)}%` }} />
              </div>
            </td>
            <td className="py-4 pr-4 align-top">
              <div className="flex flex-wrap gap-2">
                <DashboardPill label={record.documentationStatus} tone={documentationTone(record.documentationStatus)} />
                <DashboardPill label={record.meetingStatus} tone={meetingTone(record.meetingStatus)} />
              </div>
            </td>
            <td className="py-4 align-top">
              <div className="flex flex-wrap gap-2">
                <DashboardPill label={record.status} tone={statusTone(record.status)} />
                <DashboardPill label={record.riskLevel} tone={riskTone(record.riskLevel)} />
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function DashboardSourceTable({ sources }: { sources: AnalysisSource[] }) {
  if (!sources.length) {
    return <DashboardEmptyState message="No source files are attached to the current dataset." />
  }

  return (
    <table className="w-full min-w-[640px] text-sm">
      <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
        <tr>
          <th className="pb-3">Source</th>
          <th className="pb-3">Type</th>
          <th className="pb-3">Rows</th>
          <th className="pb-3">Notes</th>
          <th className="pb-3">Detail</th>
        </tr>
      </thead>
      <tbody>
        {sources.map((source) => (
          <tr key={source.id} className="border-t border-border/60">
            <td className="py-4 pr-4 align-top font-medium">{source.label}</td>
            <td className="py-4 pr-4 align-top">
              <DashboardPill label={capitalizeWord(source.type)} tone={source.type === "pdf" ? "sky" : "primary"} />
            </td>
            <td className="py-4 pr-4 align-top">{source.rowsIngested}</td>
            <td className="py-4 pr-4 align-top">{source.notesExtracted}</td>
            <td className="py-4 align-top text-muted-foreground">{source.detail}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function DashboardProjectTable({ records }: { records: PortfolioRecord[] }) {
  if (!records.length) {
    return <DashboardEmptyState message="No project records matched the current filters." />
  }

  return (
    <table className="w-full min-w-[920px] text-sm">
      <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
        <tr>
          <th className="pb-3">Project</th>
          <th className="pb-3">Owner</th>
          <th className="pb-3">Budget</th>
          <th className="pb-3">Progress</th>
          <th className="pb-3">Data quality</th>
          <th className="pb-3">Controls</th>
          <th className="pb-3">Last update</th>
        </tr>
      </thead>
      <tbody>
        {records.map((record) => (
          <tr key={record.id} className="border-t border-border/60">
            <td className="py-4 pr-4 align-top">
              <div className="font-medium">{record.name}</div>
              <div className="mt-1 text-xs text-muted-foreground">{record.region} | {record.country} | {record.phase || "Phase unknown"}</div>
            </td>
            <td className="py-4 pr-4 align-top">
              <div className="font-medium">{record.projectManager || "Unassigned"}</div>
              <div className="mt-1 text-xs text-muted-foreground">{record.contractor || "Contractor missing"}</div>
            </td>
            <td className="py-4 pr-4 align-top">{formatCurrencyMaybe(record.budget)}</td>
            <td className="py-4 pr-4 align-top">
              <div className="font-medium">{record.progress ?? 0}%</div>
              <div className="mt-1 h-2 w-28 rounded-full bg-muted">
                <div className="h-2 rounded-full bg-primary" style={{ width: `${clampNumber(record.progress ?? 0, 0, 100)}%` }} />
              </div>
            </td>
            <td className="py-4 pr-4 align-top">
              <div className="font-medium">{record.dataCompleteness}%</div>
              <div className="mt-1 h-2 w-28 rounded-full bg-muted">
                <div className={`h-2 rounded-full ${toneSolidClass(qualityTone(record.dataCompleteness))}`} style={{ width: `${clampNumber(record.dataCompleteness, 0, 100)}%` }} />
              </div>
            </td>
            <td className="py-4 pr-4 align-top">
              <div className="mb-2 flex flex-wrap gap-2">
                <DashboardPill label={record.status} tone={statusTone(record.status)} />
                <DashboardPill label={record.riskLevel} tone={riskTone(record.riskLevel)} />
              </div>
              <div className="flex flex-wrap gap-2">
                <DashboardPill label={`Docs: ${record.documentationStatus}`} tone={documentationTone(record.documentationStatus)} />
                <DashboardPill label={`Meeting: ${record.meetingStatus}`} tone={meetingTone(record.meetingStatus)} />
              </div>
            </td>
            <td className="py-4 align-top">
              <div>{formatDate(record.lastUpdate)}</div>
              <div className="mt-1 text-xs text-muted-foreground">{isStaleProjectDate(record.lastUpdate) ? "Stale update" : "Current"}</div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function DashboardFindingsTable({ findings }: { findings: QualityFinding[] }) {
  if (!findings.length) {
    return <DashboardEmptyState message="No findings were generated for the current dataset." />
  }

  return (
    <table className="w-full min-w-[760px] text-sm">
      <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
        <tr>
          <th className="pb-3">Severity</th>
          <th className="pb-3">Issue</th>
          <th className="pb-3">Recommendation</th>
          <th className="pb-3">Impacted projects</th>
        </tr>
      </thead>
      <tbody>
        {findings.map((finding) => (
          <tr key={finding.id} className="border-t border-border/60">
            <td className="py-4 pr-4 align-top">
              <DashboardPill label={capitalizeWord(finding.level)} tone={levelTone(finding.level)} />
            </td>
            <td className="py-4 pr-4 align-top">
              <div className="font-medium">{finding.title}</div>
              <div className="mt-1 text-xs leading-5 text-muted-foreground">{finding.detail}</div>
            </td>
            <td className="py-4 pr-4 align-top text-muted-foreground">{finding.recommendation}</td>
            <td className="py-4 align-top">
              <div className="flex flex-wrap gap-2">
                {finding.impactedProjects.length ? (
                  finding.impactedProjects.map((project) => (
                    <Badge key={project} variant="outline" className="border-border/60">
                      {project}
                    </Badge>
                  ))
                ) : (
                  <span className="text-muted-foreground">Portfolio-wide</span>
                )}
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function DashboardCoverageTable({ items }: { items: CoverageItem[] }) {
  if (!items.length) {
    return <DashboardEmptyState message="No field coverage data is available." />
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.label} className="rounded-2xl border border-border/60 bg-muted/20 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="font-medium">{item.label}</div>
              <div className="text-xs text-muted-foreground">
                {item.populated} of {item.total} records populated
              </div>
            </div>
            <DashboardPill label={`${item.coverage}%`} tone={qualityTone(item.coverage)} />
          </div>
          <div className="mt-3 h-2.5 rounded-full bg-muted">
            <div className={`h-2.5 rounded-full ${toneSolidClass(qualityTone(item.coverage))}`} style={{ width: `${clampNumber(item.coverage, 0, 100)}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function DashboardMappingAuditTable({ rows }: { rows: MappingSummaryRow[] }) {
  if (!rows.length) {
    return <DashboardEmptyState message="No spreadsheet mappings are available for this dataset." />
  }

  return (
    <table className="w-full min-w-[760px] text-sm">
      <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
        <tr>
          <th className="pb-3">Source</th>
          <th className="pb-3">Sheet</th>
          <th className="pb-3">Rows</th>
          <th className="pb-3">Matched</th>
          <th className="pb-3">Unmatched</th>
          <th className="pb-3">Confidence</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={`${row.sourceName}-${row.sheetName}`} className="border-t border-border/60">
            <td className="py-4 pr-4 align-top font-medium">{row.sourceName}</td>
            <td className="py-4 pr-4 align-top text-muted-foreground">{row.sheetName}</td>
            <td className="py-4 pr-4 align-top">{row.rowCount}</td>
            <td className="py-4 pr-4 align-top">{row.matchedCount}</td>
            <td className="py-4 pr-4 align-top">{row.unmatchedCount}</td>
            <td className="py-4 align-top">{row.averageConfidence}%</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function DashboardMappingCard({ mapping }: { mapping: ColumnMappingAudit }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="font-semibold">{mapping.sourceName}</div>
          <div className="text-xs text-muted-foreground">
            {mapping.sheetName} | {mapping.rowCount} rows | {mapping.matches.length} mapped headers
          </div>
        </div>
        <DashboardPill
          label={mapping.unmatchedHeaders.length ? `${mapping.unmatchedHeaders.length} unmatched` : "All matched"}
          tone={mapping.unmatchedHeaders.length ? "amber" : "emerald"}
        />
      </div>

      <div className="space-y-2">
        {mapping.matches.slice(0, 6).map((match) => (
          <div
            key={`${mapping.sourceName}-${mapping.sheetName}-${match.header}-${match.matchedField}`}
            className="flex items-start justify-between gap-3 rounded-2xl border border-border/50 bg-background/70 p-3"
          >
            <div>
              <div className="font-medium">{match.header}</div>
              <div className="text-xs text-muted-foreground">
                {match.fieldLabel} via "{match.alias}" | {humanizeMatchType(match.matchType)}
              </div>
            </div>
            <DashboardPill label={`${Math.round(match.confidence * 100)}%`} tone="sky" />
          </div>
        ))}
      </div>

      <div className="mt-4 space-y-2">
        <div className="text-sm font-medium">Unmatched headers</div>
        <div className="flex flex-wrap gap-2">
          {mapping.unmatchedHeaders.length ? (
            mapping.unmatchedHeaders.map((header) => (
              <Badge key={header} variant="outline">
                {header}
              </Badge>
            ))
          ) : (
            <span className="text-sm text-muted-foreground">No unmatched headers detected.</span>
          )}
        </div>
      </div>
    </div>
  )
}

function DashboardNoteFeed({ notes }: { notes: PortfolioAnalysis["notes"] }) {
  if (!notes.length) {
    return <DashboardEmptyState message="No notes were extracted from the current dataset." />
  }

  return (
    <div className="space-y-3">
      {notes.slice(0, 5).map((note) => (
        <div key={note.id} className="rounded-2xl border border-border/60 bg-muted/20 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <DashboardPill label={capitalizeWord(note.type)} tone={severityTone(note.severity)} />
            {note.relatedProject ? <span className="text-sm font-medium">{note.relatedProject}</span> : null}
          </div>
          <div className="mt-2 text-sm leading-6 text-muted-foreground">{note.text}</div>
          <div className="mt-2 text-xs text-muted-foreground">{note.sourceName}</div>
        </div>
      ))}
    </div>
  )
}

function DashboardActionList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="space-y-3">
      <div className="text-sm font-semibold">{title}</div>
      <div className="space-y-3">
        {items.length ? (
          items.map((item) => (
            <div key={item} className="flex items-start gap-3 rounded-2xl border border-border/60 bg-muted/20 p-4">
              <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
              <span className="text-sm leading-6 text-muted-foreground">{item}</span>
            </div>
          ))
        ) : (
          <DashboardEmptyState message="No items are available." />
        )}
      </div>
    </div>
  )
}

function DashboardEmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground">
      {message}
    </div>
  )
}

function DashboardPill({ label, tone }: { label: string; tone: Tone }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${toneBgClass(tone)} ${toneTextClass(tone)}`}>
      {label}
    </span>
  )
}

function qualityTone(value: number): Tone {
  if (value >= 90) return "emerald"
  if (value >= 75) return "amber"
  return "rose"
}

function statusTone(status: string): Tone {
  switch (status) {
    case "Completed":
      return "emerald"
    case "On Track":
      return "primary"
    case "Planned":
      return "sky"
    case "At Risk":
      return "amber"
    case "Delayed":
      return "rose"
    default:
      return "slate"
  }
}

function riskTone(risk: string): Tone {
  switch (risk) {
    case "Low":
      return "emerald"
    case "Medium":
      return "primary"
    case "High":
      return "amber"
    case "Critical":
      return "rose"
    default:
      return "slate"
  }
}

function documentationTone(status: string): Tone {
  switch (status) {
    case "Complete":
      return "emerald"
    case "Partial":
      return "sky"
    case "Pending":
      return "amber"
    case "Missing":
      return "rose"
    default:
      return "slate"
  }
}

function meetingTone(status: string): Tone {
  switch (status) {
    case "Ready":
      return "emerald"
    case "Updated":
      return "sky"
    case "Pending":
      return "amber"
    case "Missing":
      return "rose"
    default:
      return "slate"
  }
}

function levelTone(level: QualityFinding["level"]): Tone {
  switch (level) {
    case "critical":
      return "rose"
    case "warning":
      return "amber"
    default:
      return "sky"
  }
}

function severityTone(severity: PortfolioAnalysis["notes"][number]["severity"]): Tone {
  switch (severity) {
    case "high":
      return "rose"
    case "medium":
      return "amber"
    case "low":
      return "sky"
    default:
      return "slate"
  }
}

function toneBgClass(tone: Tone) {
  switch (tone) {
    case "emerald":
      return "bg-emerald-500/12"
    case "amber":
      return "bg-amber-500/12"
    case "rose":
      return "bg-rose-500/12"
    case "sky":
      return "bg-sky-500/12"
    case "slate":
      return "bg-slate-500/12"
    default:
      return "bg-primary/12"
  }
}

function toneTextClass(tone: Tone) {
  switch (tone) {
    case "emerald":
      return "text-emerald-300"
    case "amber":
      return "text-amber-300"
    case "rose":
      return "text-rose-300"
    case "sky":
      return "text-sky-300"
    case "slate":
      return "text-slate-300"
    default:
      return "text-primary"
  }
}

function toneSolidClass(tone: Tone) {
  switch (tone) {
    case "emerald":
      return "bg-emerald-400"
    case "amber":
      return "bg-amber-400"
    case "rose":
      return "bg-rose-400"
    case "sky":
      return "bg-sky-400"
    case "slate":
      return "bg-slate-400"
    default:
      return "bg-primary"
  }
}

function buildToneDistribution(values: string[], order: string[], toneSelector: (value: string) => Tone): DashboardBarItem[] {
  const bucket = new Map<string, number>()
  values.filter(Boolean).forEach((value) => {
    bucket.set(value, (bucket.get(value) ?? 0) + 1)
  })

  return order
    .filter((value) => bucket.has(value))
    .map((value) => ({
      label: value,
      value: bucket.get(value) ?? 0,
      tone: toneSelector(value),
      helper: `${bucket.get(value) ?? 0} projects`,
    }))
}

function sumNumberList(values: number[]) {
  return values.reduce((total, value) => total + value, 0)
}

function averageNumberList(values: number[]) {
  if (!values.length) return 0
  return Math.round(sumNumberList(values) / values.length)
}

function percentageValue(value: number, total: number) {
  if (!total) return 0
  return clampNumber(Math.round((value / total) * 100), 0, 100)
}

function clampNumber(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function isStaleProjectDate(value: string | null) {
  if (!value) return true
  const difference = Date.now() - new Date(value).getTime()
  return difference / (1000 * 60 * 60 * 24) > 45
}

function formatCurrencyCompact(value: number) {
  if (!value) return "$0"
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value)
}

function formatCurrencyMaybe(value: number | null) {
  if (value == null) return "Missing"
  return formatCurrencyCompact(value)
}

function formatCompactCount(value: number) {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value)
}

function formatDate(value: string | null) {
  if (!value) return "Missing"
  return new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value))
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value))
}

function humanizeMatchType(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function capitalizeWord(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function formatProvider(value: InterpretiveSummaryResult["provider"]) {
  return value === "google-gemini" ? "Google Gemini" : "OpenAI Responses"
}
