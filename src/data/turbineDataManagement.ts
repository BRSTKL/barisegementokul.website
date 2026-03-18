export type TurbineBladeMaterial = "IN738" | "Rene 80" | "CMSX-4"
export type TurbineBladeDiscipline = "Aerodynamics" | "Heat Transfer" | "Structural"
export type TurbineBladeStatus = "Draft" | "In Review" | "Approved" | "Archived"

export interface TurbineBladeRecord {
  bladeId: string
  turbineModel: string
  bladeStage: number
  material: TurbineBladeMaterial
  maxTempC: number
  tbcThicknessUm: number
  coolingChannels: number
  creepLifeH: number
  fatigueCycles: number
  efficiencyPct: number
  discipline: TurbineBladeDiscipline
  assignedEngineer: string
  status: TurbineBladeStatus
  lastUpdated: string
  daysSinceUpdate: number
  anomalyFlag: boolean
  anomalyReason: string
}

export interface TurbineImputationSummary {
  field: string
  count: number
  strategy: string
}

export interface TurbinePipelineLogEntry {
  timestamp: string
  level: "INFO" | "WARNING"
  message: string
}

const REFERENCE_DATE = new Date("2026-03-18T00:00:00Z")

const TURBINE_MODELS = ["SGT-800", "SGT-5000F", "SGT-6000G", "SGT-4000F", "SGT-700"] as const
const TURBINE_MATERIALS: TurbineBladeMaterial[] = ["IN738", "Rene 80", "CMSX-4"]
const DISCIPLINES: TurbineBladeDiscipline[] = ["Aerodynamics", "Heat Transfer", "Structural"]
const ENGINEERS = [
  "M. Fischer",
  "L. Bauer",
  "A. Schneider",
  "J. Muller",
  "K. Weber",
  "T. Hoffmann",
  "S. Richter",
] as const

const STATUS_PATTERN: TurbineBladeStatus[] = [
  "Approved",
  "Approved",
  "Approved",
  "Approved",
  "Approved",
  "Approved",
  "Approved",
  "Approved",
  "Approved",
  "In Review",
  "In Review",
  "In Review",
  "In Review",
  "In Review",
  "In Review",
  "Draft",
  "Draft",
  "Draft",
  "Archived",
  "Archived",
]

const MATERIAL_PROFILES: Record<
  TurbineBladeMaterial,
  { tempBase: number; creepBase: number; efficiencyBase: number }
> = {
  IN738: { tempBase: 914, creepBase: 27600, efficiencyBase: 84.4 },
  "Rene 80": { tempBase: 958, creepBase: 32200, efficiencyBase: 86.8 },
  "CMSX-4": { tempBase: 1003, creepBase: 39400, efficiencyBase: 89.2 },
}

const ANOMALY_OVERRIDES = new Map<
  number,
  { maxTempC?: number; efficiencyPct?: number; reason: string }
>([
  [12, { maxTempC: 1126, reason: "max_temp_c above upper threshold" }],
  [44, { maxTempC: 782, reason: "max_temp_c below lower threshold" }],
  [76, { efficiencyPct: 101.4, reason: "efficiency_pct above upper threshold" }],
  [117, { efficiencyPct: 68.1, reason: "efficiency_pct below lower threshold" }],
  [
    158,
    {
      maxTempC: 1112,
      efficiencyPct: 69.3,
      reason: "combined thermal and efficiency outlier",
    },
  ],
])

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10)
}

function daysAgoToDate(daysAgo: number) {
  return new Date(REFERENCE_DATE.getTime() - daysAgo * 24 * 60 * 60 * 1000)
}

function buildBladeRecord(index: number): TurbineBladeRecord {
  const bladeStage = (index % 4) + 1
  const material = TURBINE_MATERIALS[index % TURBINE_MATERIALS.length]
  const profile = MATERIAL_PROFILES[material]
  const status = STATUS_PATTERN[index % STATUS_PATTERN.length]
  const turbineModel = TURBINE_MODELS[(index * 3 + bladeStage) % TURBINE_MODELS.length]
  const discipline = DISCIPLINES[(index * 5 + 1) % DISCIPLINES.length]
  const assignedEngineer = ENGINEERS[(index * 7 + bladeStage) % ENGINEERS.length]

  let maxTempC = Number((profile.tempBase + bladeStage * 12 + ((index * 7) % 37) - 18).toFixed(1))
  const tbcThicknessUm = Number((95 + ((index * 13) % 145)).toFixed(1))
  const coolingChannels = 10 + ((index * 5) % 21)
  const creepLifeH = Math.max(
    5400,
    Math.round(profile.creepBase - bladeStage * 980 + ((index * 503) % 4200) - 1600),
  )
  const fatigueCycles = 70000 + ((index * 4213) % 190000)
  let efficiencyPct = Number(
    (profile.efficiencyBase - bladeStage * 0.55 + (((index * 11) % 23) - 11) / 5).toFixed(2),
  )

  let daysSinceUpdate = 18 + ((index * 17) % 420)
  if (status === "In Review") daysSinceUpdate += 28
  if (status === "Draft") daysSinceUpdate += 10
  if (status === "Archived") daysSinceUpdate += 70

  const anomalyOverride = ANOMALY_OVERRIDES.get(index)
  if (anomalyOverride?.maxTempC !== undefined) {
    maxTempC = anomalyOverride.maxTempC
  }
  if (anomalyOverride?.efficiencyPct !== undefined) {
    efficiencyPct = anomalyOverride.efficiencyPct
  }

  return {
    bladeId: `BLD-${String(index + 1).padStart(4, "0")}`,
    turbineModel,
    bladeStage,
    material,
    maxTempC,
    tbcThicknessUm,
    coolingChannels,
    creepLifeH,
    fatigueCycles,
    efficiencyPct,
    discipline,
    assignedEngineer,
    status,
    lastUpdated: formatDate(daysAgoToDate(daysSinceUpdate)),
    daysSinceUpdate,
    anomalyFlag: Boolean(anomalyOverride),
    anomalyReason: anomalyOverride?.reason ?? "",
  }
}

export const TURBINE_BLADE_RECORDS = Array.from({ length: 200 }, (_, index) =>
  buildBladeRecord(index),
)

export const TURBINE_IMPUTATION_SUMMARY: TurbineImputationSummary[] = [
  { field: "max_temp_c", count: 9, strategy: "Median impute" },
  { field: "tbc_thickness_um", count: 12, strategy: "Median impute" },
  { field: "creep_life_h", count: 13, strategy: "Median impute" },
  { field: "efficiency_pct", count: 5, strategy: "Median impute" },
  { field: "discipline", count: 3, strategy: "Mode impute" },
  { field: "assigned_engineer", count: 7, strategy: "Mode impute" },
]

export const TURBINE_PIPELINE_LOG: TurbinePipelineLogEntry[] = [
  {
    timestamp: "2026-03-18T19:40:38",
    level: "INFO",
    message: "Pipeline started - reading raw_blades.csv",
  },
  {
    timestamp: "2026-03-18T19:40:38",
    level: "INFO",
    message: "Loaded 200 rows and 14 columns",
  },
  {
    timestamp: "2026-03-18T19:40:38",
    level: "INFO",
    message: "Schema validation passed",
  },
  {
    timestamp: "2026-03-18T19:40:38",
    level: "INFO",
    message: "max_temp_c: 9 missing -> median impute",
  },
  {
    timestamp: "2026-03-18T19:40:38",
    level: "INFO",
    message: "tbc_thickness_um: 12 missing -> median impute",
  },
  {
    timestamp: "2026-03-18T19:40:38",
    level: "INFO",
    message: "creep_life_h: 13 missing -> median impute",
  },
  {
    timestamp: "2026-03-18T19:40:38",
    level: "INFO",
    message: "efficiency_pct: 5 missing -> median impute",
  },
  {
    timestamp: "2026-03-18T19:40:38",
    level: "INFO",
    message: "discipline: 3 missing -> mode impute",
  },
  {
    timestamp: "2026-03-18T19:40:38",
    level: "INFO",
    message: "assigned_engineer: 7 missing -> mode impute",
  },
  {
    timestamp: "2026-03-18T19:40:38",
    level: "WARNING",
    message: "max_temp_c: 3 outliers outside allowed range",
  },
  {
    timestamp: "2026-03-18T19:40:38",
    level: "WARNING",
    message: "efficiency_pct: 3 outliers outside allowed range",
  },
  {
    timestamp: "2026-03-18T19:40:38",
    level: "INFO",
    message: "Total anomaly flags: 5",
  },
  {
    timestamp: "2026-03-18T19:40:38",
    level: "INFO",
    message: "Normalized 6 numerical columns",
  },
  {
    timestamp: "2026-03-18T19:40:38",
    level: "INFO",
    message: "Parsed last_updated and added days_since_update",
  },
  {
    timestamp: "2026-03-18T19:40:38",
    level: "INFO",
    message: "Saved processed_data.csv and transformation_log.json",
  },
]
