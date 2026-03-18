import React from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import {
  AlertTriangle,
  BarChart3,
  Database,
  Gauge,
  Search,
  SlidersHorizontal,
  TableProperties,
  Workflow,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  TURBINE_BLADE_RECORDS,
  TURBINE_IMPUTATION_SUMMARY,
  TURBINE_PIPELINE_LOG,
  type TurbineBladeStatus,
} from "@/data/turbineDataManagement"

const ORANGE = "#E87722"
const ACCENT = "#3A7CA5"
const GREEN = "#27AE60"
const SLATE = "#64748B"

const STATUS_COLORS: Record<TurbineBladeStatus, string> = {
  Draft: "#94A3B8",
  "In Review": ORANGE,
  Approved: GREEN,
  Archived: "#475569",
}

const MATERIAL_COLORS: Record<string, string> = {
  IN738: ORANGE,
  "Rene 80": ACCENT,
  "CMSX-4": GREEN,
}

const numberFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
})

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
})

type FilterProps = {
  label: string
  value: string
  onChange: (value: string) => void
  options: string[]
}

function DemoPanel({
  title,
  description,
  icon,
  children,
  className = "",
}: {
  title: string
  description?: string
  icon?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <Card className={`border-border/70 bg-card/90 shadow-sm ${className}`}>
      <CardContent className="p-5 sm:p-6">
        <div className="mb-5 flex items-start gap-3">
          {icon ? <div className="rounded-2xl bg-primary/10 p-3 text-primary">{icon}</div> : null}
          <div>
            <h3 className="text-lg font-semibold text-foreground">{title}</h3>
            {description ? <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p> : null}
          </div>
        </div>
        {children}
      </CardContent>
    </Card>
  )
}

function KpiCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <Card className="border-border/70 bg-card/90 shadow-sm">
      <CardContent className="p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">{label}</p>
        <div className="mt-3 text-3xl font-bold text-foreground">{value}</div>
        <p className="mt-2 text-sm text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  )
}

function FilterField({ label, value, onChange, options }: FilterProps) {
  return (
    <label className="block space-y-2">
      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-primary"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  )
}

function formatCompactNumber(value: number) {
  return numberFormatter.format(value)
}

function formatDateLabel(value: string) {
  return dateFormatter.format(new Date(`${value}T00:00:00`))
}

export function TurbineDataManagementDemo() {
  const [activeTab, setActiveTab] = React.useState("overview")
  const [stageFilter, setStageFilter] = React.useState("All")
  const [performanceDisciplineFilter, setPerformanceDisciplineFilter] = React.useState("All")
  const [statusDisciplineFilter, setStatusDisciplineFilter] = React.useState("All")
  const [engineerFilter, setEngineerFilter] = React.useState("All")
  const [statusFilter, setStatusFilter] = React.useState("All")
  const [recordSearch, setRecordSearch] = React.useState("")
  const deferredSearch = React.useDeferredValue(recordSearch)

  const overview = React.useMemo(() => {
    const total = TURBINE_BLADE_RECORDS.length
    const approved = TURBINE_BLADE_RECORDS.filter((record) => record.status === "Approved").length
    const inReview = TURBINE_BLADE_RECORDS.filter((record) => record.status === "In Review")
    const anomalies = TURBINE_BLADE_RECORDS.filter((record) => record.anomalyFlag)
    const avgCreepLife = TURBINE_BLADE_RECORDS.reduce((sum, record) => sum + record.creepLifeH, 0) / total
    const avgEfficiency = TURBINE_BLADE_RECORDS.reduce((sum, record) => sum + record.efficiencyPct, 0) / total
    const avgReviewDays = inReview.reduce((sum, record) => sum + record.daysSinceUpdate, 0) / inReview.length

    return {
      total,
      approvedShare: Math.round((approved / total) * 100),
      avgCreepLife: Math.round(avgCreepLife),
      avgEfficiency: avgEfficiency.toFixed(1),
      avgReviewDays: Math.round(avgReviewDays),
      anomalyCount: anomalies.length,
    }
  }, [])

  const modelCounts = React.useMemo(
    () =>
      Array.from(
        TURBINE_BLADE_RECORDS.reduce((map, record) => {
          map.set(record.turbineModel, (map.get(record.turbineModel) ?? 0) + 1)
          return map
        }, new Map<string, number>()),
      ).map(([model, count]) => ({ model, count })),
    [],
  )

  const statusDistribution = React.useMemo(
    () =>
      Array.from(
        TURBINE_BLADE_RECORDS.reduce((map, record) => {
          map.set(record.status, (map.get(record.status) ?? 0) + 1)
          return map
        }, new Map<string, number>()),
      ).map(([status, count]) => ({ status, count })),
    [],
  )

  const materialPerformance = React.useMemo(() => {
    const grouped = new Map<string, { material: string; creep: number; efficiency: number; count: number }>()
    TURBINE_BLADE_RECORDS.forEach((record) => {
      const current = grouped.get(record.material) ?? { material: record.material, creep: 0, efficiency: 0, count: 0 }
      current.creep += record.creepLifeH
      current.efficiency += record.efficiencyPct
      current.count += 1
      grouped.set(record.material, current)
    })
    return Array.from(grouped.values())
      .map((item) => ({
        material: item.material,
        avgCreepLifeH: Math.round(item.creep / item.count),
        avgEfficiencyPct: Number((item.efficiency / item.count).toFixed(1)),
      }))
      .sort((left, right) => right.avgCreepLifeH - left.avgCreepLifeH)
  }, [])

  const anomaliesByStage = React.useMemo(
    () =>
      [1, 2, 3, 4].map((stage) => ({
        stage: `Stage ${stage}`,
        count: TURBINE_BLADE_RECORDS.filter((record) => record.bladeStage === stage && record.anomalyFlag).length,
      })),
    [],
  )

  const performanceRecords = React.useMemo(() => {
    return TURBINE_BLADE_RECORDS.filter((record) => {
      if (stageFilter !== "All" && String(record.bladeStage) !== stageFilter) {
        return false
      }
      if (performanceDisciplineFilter !== "All" && record.discipline !== performanceDisciplineFilter) {
        return false
      }
      return true
    })
  }, [performanceDisciplineFilter, stageFilter])

  const performanceByMaterial = React.useMemo(() => {
    const grouped = new Map<string, { material: string; count: number; efficiency: number }>()
    performanceRecords.forEach((record) => {
      const current = grouped.get(record.material) ?? { material: record.material, count: 0, efficiency: 0 }
      current.count += 1
      current.efficiency += record.efficiencyPct
      grouped.set(record.material, current)
    })
    return Array.from(grouped.values()).map((item) => ({
      material: item.material,
      count: item.count,
      avgEfficiencyPct: Number((item.efficiency / item.count).toFixed(1)),
    }))
  }, [performanceRecords])

  const statusRecords = React.useMemo(() => {
    const query = deferredSearch.trim().toLowerCase()
    return TURBINE_BLADE_RECORDS.filter((record) => {
      if (engineerFilter !== "All" && record.assignedEngineer !== engineerFilter) {
        return false
      }
      if (statusDisciplineFilter !== "All" && record.discipline !== statusDisciplineFilter) {
        return false
      }
      if (statusFilter !== "All" && record.status !== statusFilter) {
        return false
      }
      if (
        query &&
        ![record.bladeId, record.turbineModel, record.material, record.assignedEngineer, record.discipline]
          .join(" ")
          .toLowerCase()
          .includes(query)
      ) {
        return false
      }
      return true
    })
  }, [deferredSearch, engineerFilter, statusDisciplineFilter, statusFilter])

  const engineerStatusMatrix = React.useMemo(() => {
    const engineers = Array.from(new Set(TURBINE_BLADE_RECORDS.map((record) => record.assignedEngineer)))
    const statuses: TurbineBladeStatus[] = ["Approved", "In Review", "Draft", "Archived"]

    return engineers.map((engineer) => {
      const entry: Record<string, string | number> = { engineer }
      statuses.forEach((status) => {
        entry[status] = statusRecords.filter(
          (record) => record.assignedEngineer === engineer && record.status === status,
        ).length
      })
      return entry
    })
  }, [statusRecords])

  const anomalyRecords = React.useMemo(() => TURBINE_BLADE_RECORDS.filter((record) => record.anomalyFlag), [])
  const totalImputations = React.useMemo(
    () => TURBINE_IMPUTATION_SUMMARY.reduce((sum, item) => sum + item.count, 0),
    [],
  )

  const stageOptions = ["All", "1", "2", "3", "4"]
  const disciplineOptions = ["All", "Aerodynamics", "Heat Transfer", "Structural"]
  const engineerOptions = ["All", ...Array.from(new Set(TURBINE_BLADE_RECORDS.map((record) => record.assignedEngineer)))]
  const statusOptions = ["All", "Approved", "In Review", "Draft", "Archived"]

  const leadingMaterial = materialPerformance[0]
  const leadingAnomalyStage = [...anomaliesByStage].sort((left, right) => right.count - left.count)[0]

  return (
    <section className="overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm">
      <header className="rounded-t-xl border-b border-border bg-slate-900 px-4 py-4 text-slate-50 sm:px-6 sm:py-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-mono text-lg font-bold text-white sm:text-xl">Turbine Data Management</h2>
              <Badge className="border-orange-400/30 bg-orange-500/15 text-orange-200 hover:bg-orange-500/15">
                Interactive
              </Badge>
            </div>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
              React adaptation of the standalone Python and Dash project: 200 blade records, documented pipeline logic,
              mobile-safe filters, and four engineering review tabs.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
            <div className="rounded-2xl border border-slate-700/80 bg-slate-800/80 px-4 py-3">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Records</div>
              <div className="mt-1 text-xl font-semibold text-white">{overview.total}</div>
            </div>
            <div className="rounded-2xl border border-slate-700/80 bg-slate-800/80 px-4 py-3">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Flags</div>
              <div className="mt-1 text-xl font-semibold text-white">{overview.anomalyCount}</div>
            </div>
          </div>
        </div>
      </header>

      <div className="space-y-6 p-4 sm:space-y-7 sm:p-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="Approved Share" value={`${overview.approvedShare}%`} hint="Processed portfolio currently approved" />
          <KpiCard label="Avg Creep Life" value={`${formatCompactNumber(overview.avgCreepLife)} h`} hint="Average across all simulated blades" />
          <KpiCard label="Avg Efficiency" value={`${overview.avgEfficiency}%`} hint="Normalized fleet performance signal" />
          <KpiCard label="Review Stall" value={`${overview.avgReviewDays} d`} hint="Average days since update for review items" />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="overflow-x-auto pb-2">
            <TabsList className="flex h-auto w-max min-w-full justify-start gap-2 p-1 sm:w-fit sm:min-w-0 sm:flex-wrap sm:justify-start">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="status">Status</TabsTrigger>
              <TabsTrigger value="quality">Data Quality</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 xl:grid-cols-5">
              <DemoPanel
                title="Blade count by turbine model"
                description="Fleet composition mirrors the processed dataset used for the dashboard study."
                icon={<BarChart3 className="h-5 w-5" />}
                className="xl:col-span-3"
              >
                <div className="h-[280px] sm:h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={modelCounts} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                      <XAxis dataKey="model" tick={{ fontSize: 12 }} tickMargin={8} stroke={SLATE} />
                      <YAxis tick={{ fontSize: 12 }} stroke={SLATE} />
                      <Tooltip cursor={{ fill: "rgba(148, 163, 184, 0.10)" }} contentStyle={{ borderRadius: 16, borderColor: "#E2E8F0" }} />
                      <Bar dataKey="count" radius={[10, 10, 0, 0]} fill={ORANGE} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </DemoPanel>

              <DemoPanel
                title="Status distribution"
                description="Approval mix and review backlog stay visible at portfolio level."
                icon={<Gauge className="h-5 w-5" />}
                className="xl:col-span-2"
              >
                <div className="h-[280px] sm:h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={statusDistribution} dataKey="count" nameKey="status" cx="50%" cy="50%" innerRadius={62} outerRadius={102} paddingAngle={3}>
                        {statusDistribution.map((entry) => (
                          <Cell key={entry.status} fill={STATUS_COLORS[entry.status as TurbineBladeStatus]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: 16, borderColor: "#E2E8F0" }} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </DemoPanel>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <Card className="border-border/70 bg-card/90 shadow-sm">
                <CardContent className="p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Material leader</p>
                  <div className="mt-3 text-xl font-semibold text-foreground">{leadingMaterial.material}</div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Highest average creep life at {formatCompactNumber(leadingMaterial.avgCreepLifeH)} h, with {leadingMaterial.avgEfficiencyPct}% average efficiency.
                  </p>
                </CardContent>
              </Card>
              <Card className="border-border/70 bg-card/90 shadow-sm">
                <CardContent className="p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">QA hotspot</p>
                  <div className="mt-3 text-xl font-semibold text-foreground">{leadingAnomalyStage.stage}</div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    The highest anomaly concentration appears in {leadingAnomalyStage.stage.toLowerCase()}, matching the heavier thermal exposure described in the source project.
                  </p>
                </CardContent>
              </Card>
              <Card className="border-border/70 bg-card/90 shadow-sm">
                <CardContent className="p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Workflow bottleneck</p>
                  <div className="mt-3 text-xl font-semibold text-foreground">In Review</div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Review work remains the largest active queue and averages {overview.avgReviewDays} days since last update, making approval flow the first operational lever.
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <Card className="border-border/70 bg-card/90 shadow-sm">
              <CardContent className="p-5">
                <div className="mb-4 flex items-center gap-3">
                  <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                    <SlidersHorizontal className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Performance filters</h3>
                    <p className="text-sm text-muted-foreground">Narrow the record set by blade stage and discipline.</p>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <FilterField label="Blade stage" value={stageFilter} onChange={setStageFilter} options={stageOptions} />
                  <FilterField label="Discipline" value={performanceDisciplineFilter} onChange={setPerformanceDisciplineFilter} options={disciplineOptions} />
                  <Card className="border-dashed border-border/70 bg-muted/20 md:col-span-2 xl:col-span-2">
                    <CardContent className="flex h-full items-center justify-between gap-4 p-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Filtered records</p>
                        <div className="mt-2 text-2xl font-bold text-foreground">{performanceRecords.length}</div>
                      </div>
                      <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary">
                        200 record base set
                      </Badge>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-6 xl:grid-cols-5">
              <DemoPanel
                title="Thermal load vs creep life"
                description="Material clusters remain visible while stage and discipline filters narrow the field."
                icon={<Workflow className="h-5 w-5" />}
                className="xl:col-span-3"
              >
                <div className="h-[300px] sm:h-[340px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 16, right: 18, left: 0, bottom: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis type="number" dataKey="maxTempC" name="Max Temp C" tick={{ fontSize: 12 }} stroke={SLATE} />
                      <YAxis type="number" dataKey="creepLifeH" name="Creep Life" tick={{ fontSize: 12 }} stroke={SLATE} />
                      <Tooltip cursor={{ strokeDasharray: "3 3" }} contentStyle={{ borderRadius: 16, borderColor: "#E2E8F0" }} />
                      <Legend />
                      {Object.keys(MATERIAL_COLORS).map((material) => (
                        <Scatter key={material} name={material} data={performanceRecords.filter((record) => record.material === material)} fill={MATERIAL_COLORS[material]} />
                      ))}
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              </DemoPanel>

              <DemoPanel
                title="Efficiency by material"
                description="Average efficiency shifts as the record set changes."
                icon={<Gauge className="h-5 w-5" />}
                className="xl:col-span-2"
              >
                <div className="h-[300px] sm:h-[340px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={performanceByMaterial} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                      <XAxis dataKey="material" tick={{ fontSize: 12 }} tickMargin={8} stroke={SLATE} />
                      <YAxis tick={{ fontSize: 12 }} stroke={SLATE} domain={[80, 92]} />
                      <Tooltip contentStyle={{ borderRadius: 16, borderColor: "#E2E8F0" }} />
                      <Bar dataKey="avgEfficiencyPct" radius={[10, 10, 0, 0]}>
                        {performanceByMaterial.map((entry) => (
                          <Cell key={entry.material} fill={MATERIAL_COLORS[entry.material]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </DemoPanel>
            </div>
          </TabsContent>

          <TabsContent value="status" className="space-y-6">
            <Card className="border-border/70 bg-card/90 shadow-sm">
              <CardContent className="p-5">
                <div className="mb-4 flex items-center gap-3">
                  <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                    <TableProperties className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Workflow tracker</h3>
                    <p className="text-sm text-muted-foreground">Engineer, discipline, status, and search filters update both the chart and record list.</p>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <FilterField label="Engineer" value={engineerFilter} onChange={setEngineerFilter} options={engineerOptions} />
                  <FilterField label="Discipline" value={statusDisciplineFilter} onChange={setStatusDisciplineFilter} options={disciplineOptions} />
                  <FilterField label="Status" value={statusFilter} onChange={setStatusFilter} options={statusOptions} />
                  <label className="block space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Search records</span>
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        value={recordSearch}
                        onChange={(event) => setRecordSearch(event.target.value)}
                        placeholder="Blade id, model, engineer..."
                        className="h-11 w-full rounded-xl border border-border bg-background pl-10 pr-3 text-sm outline-none transition-colors focus:border-primary"
                      />
                    </div>
                  </label>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-6 xl:grid-cols-5">
              <DemoPanel
                title="Items per engineer by status"
                description="Stacked counts change immediately as the workflow filters are adjusted."
                icon={<BarChart3 className="h-5 w-5" />}
                className="xl:col-span-3"
              >
                <div className="h-[300px] sm:h-[340px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={engineerStatusMatrix} margin={{ top: 12, right: 12, left: 0, bottom: 18 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                      <XAxis dataKey="engineer" tick={{ fontSize: 12 }} angle={-18} textAnchor="end" height={60} stroke={SLATE} />
                      <YAxis tick={{ fontSize: 12 }} stroke={SLATE} />
                      <Tooltip contentStyle={{ borderRadius: 16, borderColor: "#E2E8F0" }} />
                      <Legend />
                      {(["Approved", "In Review", "Draft", "Archived"] as TurbineBladeStatus[]).map((status) => (
                        <Bar key={status} dataKey={status} stackId="status" fill={STATUS_COLORS[status]} radius={status === "Archived" ? [8, 8, 0, 0] : 0} />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </DemoPanel>

              <DemoPanel
                title="Filtered set"
                description="Use this count to see how narrow the active review slice has become."
                icon={<Search className="h-5 w-5" />}
                className="xl:col-span-2"
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <Card className="border-border/70 bg-muted/20">
                    <CardContent className="p-4">
                      <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Visible records</div>
                      <div className="mt-2 text-3xl font-bold text-foreground">{statusRecords.length}</div>
                    </CardContent>
                  </Card>
                  <Card className="border-border/70 bg-muted/20">
                    <CardContent className="p-4">
                      <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Review backlog</div>
                      <div className="mt-2 text-3xl font-bold text-foreground">{statusRecords.filter((record) => record.status === "In Review").length}</div>
                    </CardContent>
                  </Card>
                </div>
              </DemoPanel>
            </div>

            <DemoPanel
              title="Blade records"
              description="Desktop uses a table; mobile falls back to stacked record cards for readability."
              icon={<TableProperties className="h-5 w-5" />}
            >
              <div className="space-y-3 md:hidden">
                {statusRecords.slice(0, 12).map((record) => (
                  <Card key={record.bladeId} className="border-border/70 bg-background/70">
                    <CardContent className="space-y-3 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-semibold text-foreground">{record.bladeId}</div>
                          <div className="text-sm text-muted-foreground">{record.turbineModel} · {record.material}</div>
                        </div>
                        <Badge className="border-0 text-white" style={{ backgroundColor: STATUS_COLORS[record.status] }}>
                          {record.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <div className="text-muted-foreground">Engineer</div>
                          <div>{record.assignedEngineer}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Discipline</div>
                          <div>{record.discipline}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Stage</div>
                          <div>{record.bladeStage}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Updated</div>
                          <div>{record.daysSinceUpdate} d ago</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="hidden overflow-x-auto md:block">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      <th className="px-3 py-3">Blade</th>
                      <th className="px-3 py-3">Model</th>
                      <th className="px-3 py-3">Stage</th>
                      <th className="px-3 py-3">Material</th>
                      <th className="px-3 py-3">Discipline</th>
                      <th className="px-3 py-3">Engineer</th>
                      <th className="px-3 py-3">Status</th>
                      <th className="px-3 py-3">Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statusRecords.slice(0, 12).map((record) => (
                      <tr key={record.bladeId} className="border-b border-border/60 last:border-b-0">
                        <td className="px-3 py-3 font-medium text-foreground">{record.bladeId}</td>
                        <td className="px-3 py-3 text-muted-foreground">{record.turbineModel}</td>
                        <td className="px-3 py-3 text-muted-foreground">{record.bladeStage}</td>
                        <td className="px-3 py-3 text-muted-foreground">{record.material}</td>
                        <td className="px-3 py-3 text-muted-foreground">{record.discipline}</td>
                        <td className="px-3 py-3 text-muted-foreground">{record.assignedEngineer}</td>
                        <td className="px-3 py-3">
                          <Badge className="border-0 text-white" style={{ backgroundColor: STATUS_COLORS[record.status] }}>
                            {record.status}
                          </Badge>
                        </td>
                        <td className="px-3 py-3 text-muted-foreground">{formatDateLabel(record.lastUpdated)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </DemoPanel>
          </TabsContent>

          <TabsContent value="quality" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <KpiCard label="Imputations" value={String(totalImputations)} hint="Documented fill operations from the source pipeline" />
              <KpiCard label="Anomaly Flags" value={String(anomalyRecords.length)} hint="Rows that stayed visible after cleaning" />
              <KpiCard label="Pipeline Events" value={String(TURBINE_PIPELINE_LOG.length)} hint="Logged steps from input to processed export" />
              <KpiCard label="Missing After Run" value="0%" hint="Post-imputation summary for the live demo dataset" />
            </div>

            <div className="grid gap-6 xl:grid-cols-5">
              <DemoPanel
                title="Imputation summary"
                description="This mirrors the documented cleaning pass from the Python pipeline."
                icon={<Database className="h-5 w-5" />}
                className="xl:col-span-3"
              >
                <div className="h-[300px] sm:h-[340px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={TURBINE_IMPUTATION_SUMMARY} margin={{ top: 12, right: 12, left: 0, bottom: 22 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                      <XAxis dataKey="field" tick={{ fontSize: 11 }} angle={-18} textAnchor="end" height={68} stroke={SLATE} />
                      <YAxis tick={{ fontSize: 12 }} stroke={SLATE} />
                      <Tooltip contentStyle={{ borderRadius: 16, borderColor: "#E2E8F0" }} />
                      <Bar dataKey="count" radius={[10, 10, 0, 0]} fill={ACCENT} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </DemoPanel>

              <DemoPanel
                title="Anomalies by stage"
                description="Stage 1 carries the heaviest QA burden in this dataset."
                icon={<AlertTriangle className="h-5 w-5" />}
                className="xl:col-span-2"
              >
                <div className="h-[300px] sm:h-[340px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={anomaliesByStage} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                      <XAxis dataKey="stage" tick={{ fontSize: 12 }} stroke={SLATE} />
                      <YAxis tick={{ fontSize: 12 }} stroke={SLATE} allowDecimals={false} />
                      <Tooltip contentStyle={{ borderRadius: 16, borderColor: "#E2E8F0" }} />
                      <Bar dataKey="count" radius={[10, 10, 0, 0]} fill={ORANGE} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </DemoPanel>
            </div>

            <div className="grid gap-6 xl:grid-cols-5">
              <DemoPanel
                title="Flagged records"
                description="Each anomaly stays visible with a readable reason instead of being hidden."
                icon={<AlertTriangle className="h-5 w-5" />}
                className="xl:col-span-3"
              >
                <div className="grid gap-3">
                  {anomalyRecords.map((record) => (
                    <div key={record.bladeId} className="rounded-2xl border border-orange-500/20 bg-orange-500/[0.06] p-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <div className="font-semibold text-foreground">{record.bladeId} · {record.turbineModel} · Stage {record.bladeStage}</div>
                          <div className="text-sm text-muted-foreground">{record.material} · {record.assignedEngineer}</div>
                        </div>
                        <Badge className="border-orange-500/25 bg-orange-500/15 text-orange-200 hover:bg-orange-500/15">
                          Flagged
                        </Badge>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-foreground/85">{record.anomalyReason}</p>
                    </div>
                  ))}
                </div>
              </DemoPanel>

              <DemoPanel
                title="Transformation log"
                description="A compact audit stream from raw input through processed export."
                icon={<Workflow className="h-5 w-5" />}
                className="xl:col-span-2"
              >
                <div className="space-y-3">
                  {TURBINE_PIPELINE_LOG.map((entry) => (
                    <div key={`${entry.timestamp}-${entry.message}`} className="rounded-2xl border border-border/70 bg-background/70 p-4">
                      <div className="flex items-center gap-2">
                        <Badge
                          className={
                            entry.level === "WARNING"
                              ? "border-orange-500/25 bg-orange-500/15 text-orange-200 hover:bg-orange-500/15"
                              : "border-sky-500/25 bg-sky-500/15 text-sky-200 hover:bg-sky-500/15"
                          }
                        >
                          {entry.level}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{entry.timestamp}</span>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-foreground/85">{entry.message}</p>
                    </div>
                  ))}
                </div>
              </DemoPanel>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <footer className="border-t border-border px-4 py-4 text-center text-xs text-muted-foreground sm:px-6">
        React demo adaptation of the turbine-data-management project · mobile-safe layout · source workflow preserved
      </footer>
    </section>
  )
}
