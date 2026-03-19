import React from "react"
import { AlertTriangle, Leaf, Loader2, MapPin, Sparkles, SunMedium, Zap } from "lucide-react"

import { ActivityChartCard, type ActivityDataset } from "@/components/ui/activity-chart-card"
import { Button } from "@/components/ui/button"
import { LocationCanvas } from "@/components/ui/location-canvas"
import { Slider } from "@/components/ui/slider-number-flow"

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
const OPEN_METEO_URL = "https://climate-api.open-meteo.com/v1/climate"
const OPEN_METEO_MODEL = "EC_Earth3P_HR"
const CO2_FACTOR_KG_PER_KWH = 0.233

const viteEnv = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env ?? {}
const SOLAR_AI_PROXY_URL = viteEnv.VITE_SOLAR_AI_PROXY_URL || "/api/solar-estimator-analysis"

type SystemType = "grid-connected" | "standalone" | "hybrid"

interface EstimatorControls {
  city: string
  systemSizeKw: number
  tilt: number
  azimuth: number
  systemType: SystemType
}

interface NominatimLocation {
  lat: string
  lon: string
  display_name?: string
}

interface OpenMeteoClimateResponse {
  daily?: {
    time?: string[]
    shortwave_radiation_sum?: Array<number | null>
  }
  daily_units?: {
    shortwave_radiation_sum?: string
  }
}

interface ClimateProfile {
  requestKey: string
  displayName: string
  latitude: number
  longitude: number
  monthlyRadiationKwhM2: number[]
  annualRadiationKwhM2: number
  averageDailyRadiationKwhM2: number
  sourceYears: number[]
  climateModel: string
  radiationUnit: string
}

interface MonthlyProductionPoint {
  month: string
  productionKwh: number
  irradiationKwhM2: number
}

interface YieldEstimation {
  annualYieldKwh: number
  performanceRatio: number
  specificYield: number
  co2SavedKg: number
  monthlyProduction: MonthlyProductionPoint[]
  orientationFactor: number
  optimalTilt: number
  peakMonth: string
  weakestMonth: string
}

const SYSTEM_CONFIG: Record<SystemType, { label: string; performanceRatio: number; description: string }> = {
  "grid-connected": {
    label: "Grid-connected",
    performanceRatio: 0.84,
    description: "Best overall efficiency when the PV system can export excess energy back to the grid.",
  },
  standalone: {
    label: "Standalone",
    performanceRatio: 0.74,
    description: "Battery storage and autonomy losses reduce the usable output for off-grid operation.",
  },
  hybrid: {
    label: "Hybrid",
    performanceRatio: 0.79,
    description: "Balanced topology with moderate storage losses and stronger operational flexibility.",
  },
}

const DEFAULT_CONTROLS: EstimatorControls = {
  city: "Berlin",
  systemSizeKw: 12,
  tilt: 30,
  azimuth: 0,
  systemType: "grid-connected",
}

const wholeNumberFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
})

const decimalFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function normalizeLocationQuery(value: string) {
  return value.trim().toLowerCase()
}

function inferRadiationFactor(unit: string | undefined) {
  const normalizedUnit = (unit ?? "").toLowerCase()
  return normalizedUnit.includes("mj") ? 0.277778 : 1
}

function getOptimalTilt(latitude: number) {
  return clamp(Math.round(Math.abs(latitude) * 0.76 + 3), 10, 40)
}

function formatCoordinateAxis(value: number, positiveLabel: string, negativeLabel: string) {
  const absoluteValue = Math.abs(value).toFixed(4)
  return `${absoluteValue} ${value >= 0 ? positiveLabel : negativeLabel}`
}

function formatCoordinatePair(latitude: number, longitude: number) {
  return `${formatCoordinateAxis(latitude, "N", "S")}, ${formatCoordinateAxis(longitude, "E", "W")}`
}

function parseCoordinateQuery(value: string) {
  const match = value.trim().match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/)

  if (!match) {
    return null
  }

  const latitude = Number(match[1])
  const longitude = Number(match[2])

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null
  }

  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
    return null
  }

  return {
    latitude: Number(latitude.toFixed(4)),
    longitude: Number(longitude.toFixed(4)),
  }
}

function buildCityRequestKey(cityQuery: string) {
  return `city:${normalizeLocationQuery(cityQuery)}`
}

function buildCoordinateRequestKey(latitude: number, longitude: number) {
  return `coord:${latitude.toFixed(4)},${longitude.toFixed(4)}`
}

function estimateSolarYield(profile: ClimateProfile, controls: EstimatorControls): YieldEstimation {
  const optimalTilt = getOptimalTilt(profile.latitude)
  const tiltDeviation = Math.abs(controls.tilt - optimalTilt)
  const azimuthDeviation = Math.abs(controls.azimuth)

  const tiltFactor = clamp(1.08 - tiltDeviation * 0.0045, 0.86, 1.08)
  const azimuthFactor = clamp(1 - azimuthDeviation * 0.0018, 0.78, 1)
  const orientationFactor = clamp(tiltFactor * azimuthFactor, 0.72, 1.08)
  const performanceRatio = SYSTEM_CONFIG[controls.systemType].performanceRatio

  const monthlyProductionRaw = profile.monthlyRadiationKwhM2.map((irradiationValue) => {
    return irradiationValue * orientationFactor * performanceRatio * controls.systemSizeKw
  })

  const monthlyProduction = monthlyProductionRaw.map((productionKwh, index) => ({
    month: MONTH_LABELS[index],
    productionKwh: Math.round(productionKwh),
    irradiationKwhM2: profile.monthlyRadiationKwhM2[index] ?? 0,
  }))

  const annualYieldRaw = monthlyProductionRaw.reduce((sum, value) => sum + value, 0)
  const annualYieldKwh = Math.round(annualYieldRaw)
  const specificYield = annualYieldRaw / controls.systemSizeKw
  const co2SavedKg = annualYieldRaw * CO2_FACTOR_KG_PER_KWH
  const rankedMonths = [...monthlyProduction].sort((left, right) => right.productionKwh - left.productionKwh)

  return {
    annualYieldKwh,
    performanceRatio,
    specificYield,
    co2SavedKg,
    monthlyProduction,
    orientationFactor,
    optimalTilt,
    peakMonth: rankedMonths[0]?.month ?? "Jun",
    weakestMonth: rankedMonths[rankedMonths.length - 1]?.month ?? "Dec",
  }
}

function buildAnalysisSignature(profile: ClimateProfile, controls: EstimatorControls) {
  return JSON.stringify({
    requestKey: profile.requestKey,
    systemSizeKw: controls.systemSizeKw,
    tilt: controls.tilt,
    azimuth: controls.azimuth,
    systemType: controls.systemType,
  })
}

function buildClimateProfile(
  climateData: OpenMeteoClimateResponse,
  {
    requestKey,
    displayName,
    latitude,
    longitude,
  }: {
    requestKey: string
    displayName: string
    latitude: number
    longitude: number
  },
): ClimateProfile {
  const timeSeries = climateData.daily?.time
  const radiationSeries = climateData.daily?.shortwave_radiation_sum

  if (!Array.isArray(timeSeries) || !Array.isArray(radiationSeries) || !timeSeries.length || timeSeries.length !== radiationSeries.length) {
    throw new Error("Open-Meteo did not return usable irradiance data for that location.")
  }

  const radiationFactor = inferRadiationFactor(climateData.daily_units?.shortwave_radiation_sum)
  const monthlyTotalsByYear = Array.from({ length: 12 }, () => new Map<number, number>())
  const yearlyTotals = new Map<number, number>()

  for (let index = 0; index < timeSeries.length; index += 1) {
    const rawRadiation = radiationSeries[index]

    if (typeof rawRadiation !== "number" || !Number.isFinite(rawRadiation)) {
      continue
    }

    const date = new Date(`${timeSeries[index]}T00:00:00Z`)
    if (Number.isNaN(date.getTime())) {
      continue
    }

    const year = date.getUTCFullYear()
    const month = date.getUTCMonth()
    const kwhPerSquareMeter = rawRadiation * radiationFactor

    monthlyTotalsByYear[month].set(year, (monthlyTotalsByYear[month].get(year) ?? 0) + kwhPerSquareMeter)
    yearlyTotals.set(year, (yearlyTotals.get(year) ?? 0) + kwhPerSquareMeter)
  }

  const sourceYears = Array.from(yearlyTotals.keys()).sort((left, right) => left - right)

  if (!sourceYears.length) {
    throw new Error("Open-Meteo returned climate data, but it could not be aggregated into yearly irradiance values.")
  }

  const monthlyRadiationKwhM2 = monthlyTotalsByYear.map((monthMap) => {
    const monthValues = Array.from(monthMap.values())
    if (!monthValues.length) {
      return 0
    }

    const averageMonth = monthValues.reduce((sum, value) => sum + value, 0) / monthValues.length
    return Number(averageMonth.toFixed(1))
  })

  const annualRadiationKwhM2 = Number(
    (Array.from(yearlyTotals.values()).reduce((sum, value) => sum + value, 0) / sourceYears.length).toFixed(1),
  )

  return {
    requestKey,
    displayName,
    latitude,
    longitude,
    monthlyRadiationKwhM2,
    annualRadiationKwhM2,
    averageDailyRadiationKwhM2: Number((annualRadiationKwhM2 / 365).toFixed(2)),
    sourceYears,
    climateModel: OPEN_METEO_MODEL,
    radiationUnit: climateData.daily_units?.shortwave_radiation_sum ?? "unknown",
  }
}

async function parseApiError(response: Response, fallbackMessage: string) {
  const rawText = await response.text()

  try {
    const parsed = JSON.parse(rawText) as {
      error?: {
        message?: string
      }
    }

    if (parsed.error?.message) {
      return parsed.error.message
    }
  } catch {
    return rawText || fallbackMessage
  }

  return rawText || fallbackMessage
}

async function fetchOpenMeteoClimate(latitude: number, longitude: number) {
  let climateResponse: Response

  try {
    climateResponse = await fetch(
      `${OPEN_METEO_URL}?latitude=${latitude}&longitude=${longitude}&start_date=2018-01-01&end_date=2022-12-31&daily=shortwave_radiation_sum&models=${OPEN_METEO_MODEL}`,
    )
  } catch {
    throw new Error("The Open-Meteo irradiance request could not be completed.")
  }

  if (!climateResponse.ok) {
    throw new Error(await parseApiError(climateResponse, "The irradiance request failed."))
  }

  return (await climateResponse.json()) as OpenMeteoClimateResponse
}

async function fetchClimateProfile(locationQuery: string) {
  const coordinateQuery = parseCoordinateQuery(locationQuery)

  if (coordinateQuery) {
    const climateData = await fetchOpenMeteoClimate(coordinateQuery.latitude, coordinateQuery.longitude)
    return buildClimateProfile(climateData, {
      requestKey: buildCoordinateRequestKey(coordinateQuery.latitude, coordinateQuery.longitude),
      displayName: "Pinned coordinates",
      latitude: coordinateQuery.latitude,
      longitude: coordinateQuery.longitude,
    })
  }

  let locationResponse: Response

  try {
    locationResponse = await fetch(`${NOMINATIM_URL}?q=${encodeURIComponent(locationQuery)}&format=json&limit=1`)
  } catch {
    throw new Error("The Nominatim geocoding request could not be completed.")
  }

  if (!locationResponse.ok) {
    throw new Error(await parseApiError(locationResponse, "The city lookup request failed."))
  }

  const locationResults = (await locationResponse.json()) as NominatimLocation[]
  const bestMatch = Array.isArray(locationResults) ? locationResults[0] : null

  if (!bestMatch?.lat || !bestMatch?.lon) {
    throw new Error(`No city match was found for "${locationQuery}".`)
  }

  const latitude = Number.parseFloat(bestMatch.lat)
  const longitude = Number.parseFloat(bestMatch.lon)
  const climateData = await fetchOpenMeteoClimate(latitude, longitude)

  return buildClimateProfile(climateData, {
    requestKey: buildCityRequestKey(locationQuery),
    displayName: bestMatch.display_name ?? locationQuery,
    latitude,
    longitude,
  })
}

function buildAnalysisPayload(profile: ClimateProfile, estimate: YieldEstimation, controls: EstimatorControls) {
  return {
    location: {
      cityInput: controls.city,
      resolvedName: profile.displayName,
      latitude: Number(profile.latitude.toFixed(4)),
      longitude: Number(profile.longitude.toFixed(4)),
    },
    climate: {
      provider: "Open-Meteo Climate API",
      model: profile.climateModel,
      sourceYears: profile.sourceYears,
      irradianceVariable: "shortwave_radiation_sum",
      sourceUnit: profile.radiationUnit,
      annualRadiationKwhM2: profile.annualRadiationKwhM2,
      averageDailyRadiationKwhM2: profile.averageDailyRadiationKwhM2,
      monthlyRadiationKwhM2: profile.monthlyRadiationKwhM2.map((value, index) => ({
        month: MONTH_LABELS[index],
        value,
      })),
    },
    system: {
      sizeKwp: controls.systemSizeKw,
      tiltDegrees: controls.tilt,
      azimuthDegrees: controls.azimuth,
      systemType: SYSTEM_CONFIG[controls.systemType].label,
      performanceRatioPct: Math.round(estimate.performanceRatio * 100),
      optimalTiltEstimateDegrees: estimate.optimalTilt,
      orientationFactor: Number(estimate.orientationFactor.toFixed(3)),
    },
    outputs: {
      annualYieldKwh: estimate.annualYieldKwh,
      specificYieldKwhPerKwp: Math.round(estimate.specificYield),
      co2SavedKgPerYear: Math.round(estimate.co2SavedKg),
      peakMonth: estimate.peakMonth,
      weakestMonth: estimate.weakestMonth,
      monthlyProductionKwh: estimate.monthlyProduction.map((entry) => ({
        month: entry.month,
        value: entry.productionKwh,
      })),
    },
  }
}

async function fetchSolarAiAnalysis(profile: ClimateProfile, estimate: YieldEstimation, controls: EstimatorControls) {
  let response: Response

  try {
    response = await fetch(SOLAR_AI_PROXY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        analysis: buildAnalysisPayload(profile, estimate, controls),
        model: "gemini-2.0-flash",
      }),
    })
  } catch {
    throw new Error("The Gemini analysis service is unavailable. Start the secure API server or check your connection.")
  }

  if (!response.ok) {
    throw new Error(await parseApiError(response, "The Gemini analysis request failed."))
  }

  const data = (await response.json()) as {
    text?: string
  }

  if (!data.text?.trim()) {
    throw new Error("Gemini returned an empty solar analysis.")
  }

  return data.text.trim()
}

function ResultMetric({
  label,
  value,
  helper,
  accent = "sky",
}: {
  label: string
  value: string
  helper: string
  accent?: "sky" | "emerald"
}) {
  const accentClass =
    accent === "emerald"
      ? "from-emerald-300/25 to-emerald-500/10 shadow-[0_18px_50px_-34px_rgba(16,185,129,0.6)]"
      : "from-sky-300/25 to-blue-500/10 shadow-[0_18px_50px_-34px_rgba(59,130,246,0.6)]"

  return (
    <div
      className={`rounded-[22px] bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-4 sm:rounded-[26px] sm:p-5 ${accentClass}`}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{label}</p>
      <div className="mt-3 text-[1.65rem] font-semibold tracking-[-0.05em] text-white sm:mt-4 sm:text-[2rem]">{value}</div>
      <p className="mt-2 text-sm text-slate-300">{helper}</p>
    </div>
  )
}

function RangeField({
  label,
  value,
  min,
  max,
  step,
  suffix,
  detail,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  suffix: string
  detail: string
  onChange: (value: number) => void
}) {
  return (
    <div className="space-y-3 rounded-[20px] bg-white/[0.05] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] sm:rounded-[24px]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-white">{label}</p>
          <p className="mt-1 text-xs leading-5 text-slate-400">{detail}</p>
        </div>
        <span className="self-start rounded-full bg-white/8 px-3 py-1 text-sm font-medium text-sky-100">
          {value}
          {suffix}
        </span>
      </div>
      <div className="px-1 pb-1 pt-4 text-zinc-100 sm:pt-5">
        <Slider
          value={[value]}
          onValueChange={(nextValue) => {
            const resolvedValue = nextValue[0]
            if (typeof resolvedValue === "number") {
              onChange(resolvedValue)
            }
          }}
          min={min}
          max={max}
          step={step}
          aria-label={label}
          className="w-full"
        />
      </div>
    </div>
  )
}

export function SolarEstimator() {
  const [controls, setControls] = React.useState<EstimatorControls>(DEFAULT_CONTROLS)
  const [profile, setProfile] = React.useState<ClimateProfile | null>(null)
  const [estimate, setEstimate] = React.useState<YieldEstimation | null>(null)
  const [aiAnalysis, setAiAnalysis] = React.useState<string | null>(null)
  const [requestError, setRequestError] = React.useState<string | null>(null)
  const [aiError, setAiError] = React.useState<string | null>(null)
  const [isFetchingClimate, setIsFetchingClimate] = React.useState(false)
  const [isGeneratingAi, setIsGeneratingAi] = React.useState(false)
  const lastAiSignatureRef = React.useRef<string | null>(null)

  const parsedCoordinates = React.useMemo(() => parseCoordinateQuery(controls.city), [controls.city])
  const activeRequestKey = React.useMemo(() => {
    if (parsedCoordinates) {
      return buildCoordinateRequestKey(parsedCoordinates.latitude, parsedCoordinates.longitude)
    }

    return controls.city.trim() ? buildCityRequestKey(controls.city) : null
  }, [controls.city, parsedCoordinates])

  const hasPendingLocationChange = Boolean(activeRequestKey && profile && profile.requestKey !== activeRequestKey)
  const activeSystemConfig = SYSTEM_CONFIG[controls.systemType]
  const orientationPercent = estimate ? clamp(Math.round(estimate.orientationFactor * 100), 0, 100) : 0
  const displayLatitude = parsedCoordinates?.latitude ?? profile?.latitude ?? 12
  const displayLongitude = parsedCoordinates?.longitude ?? profile?.longitude ?? 16
  const locationLabel = hasPendingLocationChange
    ? parsedCoordinates
      ? "Pinned coordinates"
      : controls.city.trim() || "Choose a location"
    : profile?.displayName ?? (parsedCoordinates ? "Pinned coordinates" : controls.city.trim() || "Choose a location")
  const coordinateLabel = parsedCoordinates
    ? formatCoordinatePair(parsedCoordinates.latitude, parsedCoordinates.longitude)
    : profile
      ? formatCoordinatePair(profile.latitude, profile.longitude)
      : "Search a city or click on the map to pin a point."

  const currentAnalysisSignature = React.useMemo(() => {
    if (!profile) {
      return null
    }

    return buildAnalysisSignature(profile, controls)
  }, [controls, profile])

  const isAnalysisStale = Boolean(aiAnalysis && currentAnalysisSignature && currentAnalysisSignature !== lastAiSignatureRef.current)

  const recalculateEstimate = React.useCallback(
    (nextControls: EstimatorControls) => {
      if (!profile) {
        return
      }

      const nextEstimate = estimateSolarYield(profile, nextControls)
      React.startTransition(() => setEstimate(nextEstimate))
    },
    [profile],
  )

  const updateControls = React.useCallback(
    (patch: Partial<EstimatorControls>) => {
      setControls((current) => {
        const nextControls = { ...current, ...patch }

        if (!("city" in patch)) {
          recalculateEstimate(nextControls)
        }

        return nextControls
      })

      setRequestError(null)
      setAiError(null)
    },
    [recalculateEstimate],
  )

  const handleLocationQueryChange = React.useCallback((value: string) => {
    setControls((current) => ({ ...current, city: value }))
    setRequestError(null)
    setAiError(null)
  }, [])

  const handleMapCoordinateSelect = React.useCallback((selection: { latitude: number; longitude: number }) => {
    const coordinateQuery = `${selection.latitude.toFixed(4)}, ${selection.longitude.toFixed(4)}`
    setControls((current) => ({ ...current, city: coordinateQuery }))
    setRequestError(null)
    setAiError(null)
  }, [])

  const handleEstimate = React.useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()

      const locationQuery = controls.city.trim()

      if (!locationQuery) {
        setRequestError("Enter a city name or pin custom coordinates on the map.")
        return
      }

      setRequestError(null)
      setAiError(null)
      setAiAnalysis(null)

      const canReuseProfile = Boolean(activeRequestKey && profile && profile.requestKey === activeRequestKey)
      let activeProfile = canReuseProfile ? profile : null

      try {
        if (!activeProfile) {
          setIsFetchingClimate(true)
          activeProfile = await fetchClimateProfile(locationQuery)
          setProfile(activeProfile)
        }

        if (!activeProfile) {
          throw new Error("The solar climate profile is unavailable for this request.")
        }

        const nextEstimate = estimateSolarYield(activeProfile, controls)
        React.startTransition(() => setEstimate(nextEstimate))

        setIsGeneratingAi(true)

        try {
          const nextAnalysis = await fetchSolarAiAnalysis(activeProfile, nextEstimate, controls)
          setAiAnalysis(nextAnalysis)
          lastAiSignatureRef.current = buildAnalysisSignature(activeProfile, controls)
        } catch (analysisError) {
          setAiError(analysisError instanceof Error ? analysisError.message : "The AI analysis could not be generated.")
        }
      } catch (error) {
        setRequestError(error instanceof Error ? error.message : "The solar estimate request failed.")
      } finally {
        setIsFetchingClimate(false)
        setIsGeneratingAi(false)
      }
    },
    [activeRequestKey, controls, profile],
  )

  const chartDatasets = React.useMemo<Record<string, ActivityDataset>>(() => {
    if (!estimate || !profile) {
      return {
        Production: {
          totalValue: "--",
          description: "Run the estimator to unlock the production profile for the selected site.",
          data: MONTH_LABELS.map((month) => ({ label: month, value: 0 })),
        },
        Irradiance: {
          totalValue: "--",
          description: "Historical irradiance will appear once a climate profile is available.",
          data: MONTH_LABELS.map((month) => ({ label: month, value: 0 })),
        },
      }
    }

    return {
      Production: {
        totalValue: `${wholeNumberFormatter.format(estimate.annualYieldKwh)} kWh`,
        description: `${estimate.peakMonth} leads the year while ${estimate.weakestMonth} remains the weakest production month.`,
        data: estimate.monthlyProduction.map((entry) => ({
          label: entry.month,
          value: entry.productionKwh,
        })),
      },
      Irradiance: {
        totalValue: `${decimalFormatter.format(profile.annualRadiationKwhM2)} kWh/m2`,
        description: `${profile.sourceYears[0]}-${profile.sourceYears[profile.sourceYears.length - 1]} climate average from ${profile.climateModel}.`,
        data: estimate.monthlyProduction.map((entry) => ({
          label: entry.month,
          value: Math.round(entry.irradiationKwhM2),
        })),
      },
    }
  }, [estimate, profile])

  const monthlyRows = React.useMemo(
    () =>
      estimate?.monthlyProduction ??
      MONTH_LABELS.map((month) => ({
        month,
        productionKwh: 0,
        irradiationKwhM2: 0,
      })),
    [estimate],
  )

  const aiParagraphs = React.useMemo(() => {
    if (!aiAnalysis) {
      return []
    }

    return aiAnalysis
      .split(/\n\s*\n/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean)
  }, [aiAnalysis])

  return (
    <form onSubmit={handleEstimate} className="grid gap-4 md:gap-6 xl:grid-cols-[0.94fr_1.06fr]">
      <section className="relative overflow-hidden rounded-[26px] bg-[linear-gradient(180deg,rgba(15,23,42,0.98),rgba(2,6,23,0.96))] p-4 text-white shadow-[0_34px_120px_-52px_rgba(14,165,233,0.6)] sm:rounded-[32px] sm:p-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.14),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.16),transparent_32%)]" />

        <div className="relative z-10">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-100/90">
              <SunMedium className="h-3.5 w-3.5" />
              Solar Yield Estimator
            </div>
            <h2 className="mt-4 text-[1.9rem] font-semibold leading-tight tracking-[-0.05em] text-white sm:mt-5 sm:text-[2.3rem]">
              Model a cleaner PV concept with real climate data.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:leading-7">
              Search by city, pin exact coordinates on the map, tune the PV setup, and generate a Gemini-backed engineering review from historical irradiance.
            </p>
          </div>

          <div className="mt-6 sm:mt-8">
            <LocationCanvas
              location={locationLabel}
              coordinates={coordinateLabel}
              query={controls.city}
              latitude={displayLatitude}
              longitude={displayLongitude}
              isLoading={isFetchingClimate}
              onQueryChange={handleLocationQueryChange}
              onCoordinateSelect={handleMapCoordinateSelect}
            />
          </div>

          <div className="mt-6 grid gap-4">
            <RangeField
              label="System size"
              value={controls.systemSizeKw}
              min={1}
              max={250}
              step={1}
              suffix=" kWp"
              detail="Installed DC size directly scales annual energy yield."
              onChange={(value) => updateControls({ systemSizeKw: value })}
            />
            <RangeField
              label="Tilt angle"
              value={controls.tilt}
              min={0}
              max={90}
              step={1}
              suffix=" deg"
              detail="Tilt shapes the seasonal balance and should track local solar geometry."
              onChange={(value) => updateControls({ tilt: value })}
            />
            <RangeField
              label="Azimuth"
              value={controls.azimuth}
              min={-90}
              max={90}
              step={5}
              suffix=" deg"
              detail="Zero is south-facing in this model. Positive values shift west, negative values shift east."
              onChange={(value) => updateControls({ azimuth: value })}
            />
          </div>

          <div className="mt-6 rounded-[22px] bg-white/[0.05] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] sm:rounded-[28px]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-white">System type</p>
                <p className="mt-1 text-xs leading-5 text-slate-400">{activeSystemConfig.description}</p>
              </div>
              <div className="inline-flex items-center gap-2 self-start rounded-full bg-white/6 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-100/85">
                <Zap className="h-3.5 w-3.5" />
                PV topology
              </div>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              {Object.entries(SYSTEM_CONFIG).map(([value, config]) => {
                const isActive = value === controls.systemType

                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => updateControls({ systemType: value as SystemType })}
                    className={`rounded-[18px] px-4 py-3 text-left transition sm:rounded-[22px] ${
                      isActive
                        ? "bg-[linear-gradient(180deg,rgba(125,211,252,0.28),rgba(37,99,235,0.2))] text-white shadow-[0_18px_40px_-24px_rgba(96,165,250,0.75)]"
                        : "bg-white/[0.04] text-slate-300 hover:bg-white/[0.07]"
                    }`}
                  >
                    <div className="text-sm font-semibold">{config.label}</div>
                    <div className="mt-1 text-xs text-slate-400">PR {Math.round(config.performanceRatio * 100)}%</div>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2 text-xs text-slate-300">
            <span className="rounded-full bg-white/6 px-3 py-1">Open-Meteo {OPEN_METEO_MODEL}</span>
            <span className="rounded-full bg-white/6 px-3 py-1">2018-2022 climate average</span>
            <span className="rounded-full bg-white/6 px-3 py-1">Gemini engineering summary</span>
            {hasPendingLocationChange ? <span className="rounded-full bg-sky-400/15 px-3 py-1 text-sky-100">Location has changed since the last run</span> : null}
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button
              type="submit"
              className="h-12 flex-1 rounded-full bg-[linear-gradient(90deg,#38bdf8,#2563eb)] px-6 text-base font-semibold text-white shadow-[0_22px_52px_-26px_rgba(59,130,246,0.9)] hover:opacity-95"
              disabled={isFetchingClimate || isGeneratingAi}
            >
              {isFetchingClimate ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Fetching climate data
                </>
              ) : isGeneratingAi ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating AI review
                </>
              ) : (
                <>
                  Analyze system
                  <SunMedium className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>

            <div className="rounded-[18px] bg-white/[0.05] px-4 py-3 text-sm leading-6 text-slate-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] sm:rounded-full sm:px-5">
              Press Enter inside the map search field or use this button to refresh the study.
            </div>
          </div>

          {requestError ? (
            <div className="mt-4 flex items-start gap-3 rounded-[24px] bg-red-500/12 px-4 py-4 text-sm leading-7 text-red-100">
              <AlertTriangle className="mt-1 h-4 w-4 flex-shrink-0" />
              <span>{requestError}</span>
            </div>
          ) : null}
        </div>
      </section>

      <section className="relative overflow-hidden rounded-[26px] bg-[linear-gradient(180deg,rgba(8,15,28,0.98),rgba(2,6,14,0.96))] p-4 text-white shadow-[0_34px_120px_-56px_rgba(15,23,42,0.9)] sm:rounded-[32px] sm:p-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.12),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.1),transparent_32%)]" />

        <div className="relative z-10">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/6 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-200">
                <MapPin className="h-3.5 w-3.5 text-sky-300" />
                Simulation output
              </div>
              <h3 className="mt-4 text-[1.9rem] font-semibold leading-tight tracking-[-0.05em] text-white sm:text-3xl">
                Climate-aware PV outlook
              </h3>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300 sm:leading-7">
                Annual production, performance ratio, carbon savings, and an AI interpretation are combined into one engineering view.
              </p>
            </div>

            <div className="w-full rounded-[20px] bg-white/[0.05] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] sm:w-auto sm:rounded-[24px]">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Resolved site</div>
              <div className="mt-2 text-sm font-medium text-white">{profile?.displayName ?? "Waiting for estimate"}</div>
              <div className="mt-1 text-xs text-slate-400">{profile ? formatCoordinatePair(profile.latitude, profile.longitude) : coordinateLabel}</div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <ResultMetric
              label="Annual yield"
              value={estimate ? wholeNumberFormatter.format(estimate.annualYieldKwh) : "--"}
              helper="kWh per year"
            />
            <ResultMetric
              label="Performance ratio"
              value={estimate ? `${wholeNumberFormatter.format(Math.round(estimate.performanceRatio * 100))}%` : "--"}
              helper={SYSTEM_CONFIG[controls.systemType].label}
            />
            <ResultMetric
              label="Specific yield"
              value={estimate ? wholeNumberFormatter.format(Math.round(estimate.specificYield)) : "--"}
              helper="kWh per kWp"
            />
            <ResultMetric
              label="CO2 avoided"
              value={estimate ? wholeNumberFormatter.format(Math.round(estimate.co2SavedKg)) : "--"}
              helper="kg per year"
              accent="emerald"
            />
          </div>

          <div className="mt-6 rounded-[22px] bg-white/[0.05] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] sm:rounded-[28px] sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-white">Orientation fit</p>
                <p className="mt-1 text-xs leading-6 text-slate-400">
                  {estimate
                    ? `The selected layout is operating at roughly ${orientationPercent}% of the modeled orientation optimum.`
                    : "Run the estimator to compare the selected geometry with the modeled optimum."}
                </p>
              </div>
              <div className="rounded-full bg-white/6 px-4 py-2 text-sm font-medium text-sky-100">
                {estimate ? `${orientationPercent}% fit` : "No data yet"}
              </div>
            </div>

            <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-900/70">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,#7dd3fc,#2563eb)] transition-all"
                style={{ width: `${estimate ? Math.max(10, orientationPercent) : 10}%` }}
              />
            </div>

            <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-400">
              <span>Estimated optimal tilt: {estimate ? `${estimate.optimalTilt} deg` : "--"}</span>
              <span>Average daily irradiance: {profile ? `${decimalFormatter.format(profile.averageDailyRadiationKwhM2)} kWh/m2/day` : "--"}</span>
              <span>Climate window: {profile ? `${profile.sourceYears[0]}-${profile.sourceYears[profile.sourceYears.length - 1]}` : "2018-2022"}</span>
            </div>
          </div>

          <div className="mt-6">
            <ActivityChartCard title="Monthly output profile" datasets={chartDatasets} className="max-w-none" />
          </div>

          <div className="mt-6 overflow-hidden rounded-[22px] bg-white/[0.05] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] sm:rounded-[28px]">
            <div className="flex items-center justify-between gap-3 px-4 pt-4 sm:px-5 sm:pt-5">
              <div>
                <p className="text-sm font-semibold text-white">Monthly breakdown</p>
                <p className="mt-1 text-xs text-slate-400">Production and irradiance are shown side by side for quick monthly comparison.</p>
              </div>
              <div className="rounded-full bg-white/6 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-300">
                12 months
              </div>
            </div>

            <div className="mt-4 grid gap-3 px-4 pb-4 md:hidden">
              {monthlyRows.map((entry) => {
                const share = estimate && estimate.annualYieldKwh > 0 ? (entry.productionKwh / estimate.annualYieldKwh) * 100 : 0

                return (
                  <div key={entry.month} className="rounded-[18px] bg-white/[0.04] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-white">{entry.month}</p>
                      <span className="rounded-full bg-white/6 px-3 py-1 text-xs font-medium text-sky-100">
                        {decimalFormatter.format(share)}%
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Production</p>
                        <p className="mt-1 text-white">{wholeNumberFormatter.format(entry.productionKwh)} kWh</p>
                      </div>
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Irradiance</p>
                        <p className="mt-1 text-white">{decimalFormatter.format(entry.irradiationKwhM2)} kWh/m2</p>
                      </div>
                    </div>

                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-900/70">
                      <div
                        className="h-full rounded-full bg-[linear-gradient(90deg,#7dd3fc,#2563eb)]"
                        style={{ width: `${Math.max(10, share)}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="mt-4 hidden overflow-x-auto px-3 pb-3 md:block">
              <table className="w-full min-w-[560px] border-separate border-spacing-y-2 text-left text-sm text-slate-200">
                <thead>
                  <tr className="text-xs uppercase tracking-[0.16em] text-slate-500">
                    <th className="px-3 py-2 font-semibold">Month</th>
                    <th className="px-3 py-2 font-semibold">Production</th>
                    <th className="px-3 py-2 font-semibold">Irradiance</th>
                    <th className="px-3 py-2 font-semibold">Share</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyRows.map((entry) => {
                    const share = estimate && estimate.annualYieldKwh > 0 ? (entry.productionKwh / estimate.annualYieldKwh) * 100 : 0

                    return (
                      <tr key={entry.month} className="rounded-[20px] bg-white/[0.04]">
                        <td className="rounded-l-[18px] px-3 py-3 font-medium text-white">{entry.month}</td>
                        <td className="px-3 py-3">{wholeNumberFormatter.format(entry.productionKwh)} kWh</td>
                        <td className="px-3 py-3">{decimalFormatter.format(entry.irradiationKwhM2)} kWh/m2</td>
                        <td className="rounded-r-[18px] px-3 py-3 text-sky-100">{decimalFormatter.format(share)}%</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-6 rounded-[22px] bg-white/[0.05] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] sm:rounded-[28px] sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-white/6 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">
                  <Sparkles className="h-3.5 w-3.5 text-sky-300" />
                  AI assessment
                </div>
                <p className="mt-4 text-lg font-semibold text-white">Gemini engineering interpretation</p>
                <p className="mt-1 text-sm leading-6 text-slate-400">
                  The text below combines historical climate averages, PV geometry, and system losses into one concise review.
                </p>
              </div>

              {isAnalysisStale ? (
                <div className="rounded-full bg-amber-300/15 px-3 py-1 text-xs font-medium text-amber-100">
                  Reflects the last submitted setup
                </div>
              ) : null}
            </div>

            <div className="mt-5 min-h-[200px] rounded-[20px] bg-slate-950/45 p-4 sm:min-h-[220px] sm:rounded-[24px] sm:p-5">
              {isGeneratingAi ? (
                <div className="flex items-center gap-3 text-sm text-slate-300">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating a new AI interpretation...
                </div>
              ) : aiError ? (
                <div className="flex items-start gap-3 text-sm leading-7 text-red-100">
                  <AlertTriangle className="mt-1 h-4 w-4 flex-shrink-0" />
                  <span>{aiError}</span>
                </div>
              ) : aiAnalysis ? (
                <div className="space-y-5 text-[15px] leading-7 text-slate-100 sm:leading-8">
                  {(aiParagraphs.length ? aiParagraphs : [aiAnalysis]).map((paragraph, index) => (
                    <p key={`${index}-${paragraph.slice(0, 24)}`}>{paragraph}</p>
                  ))}
                  {profile && estimate ? (
                    <div className="flex flex-wrap gap-2 text-xs text-slate-400">
                      <span className="rounded-full bg-white/6 px-3 py-1">Peak month: {estimate.peakMonth}</span>
                      <span className="rounded-full bg-white/6 px-3 py-1">Weakest month: {estimate.weakestMonth}</span>
                      <span className="rounded-full bg-white/6 px-3 py-1">
                        Annual irradiance: {decimalFormatter.format(profile.annualRadiationKwhM2)} kWh/m2
                      </span>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="flex items-start gap-3 text-sm leading-7 text-slate-400">
                  <Sparkles className="mt-1 h-4 w-4 flex-shrink-0 text-sky-300" />
                  <span>Run the estimator to generate an English Gemini assessment for the selected solar design.</span>
                </div>
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-400">
              <span className="rounded-full bg-white/6 px-3 py-1">Gemini 2.0 Flash</span>
              <span className="rounded-full bg-white/6 px-3 py-1">Server-side API key</span>
              <span className="rounded-full bg-white/6 px-3 py-1">Planning-grade estimate</span>
              <span className="rounded-full bg-emerald-300/15 px-3 py-1 text-emerald-100">
                <Leaf className="mr-1 inline h-3 w-3" />
                Carbon savings included
              </span>
            </div>
          </div>
        </div>
      </section>
    </form>
  )
}
