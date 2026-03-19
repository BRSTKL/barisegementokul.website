import React from "react"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { AlertTriangle, Loader2, MapPin, Sparkles, SunMedium } from "lucide-react"

import { LocationMap } from "@/components/ui/expand-map"
import { Button } from "@/components/ui/button"
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
  queryNormalized: string
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
    description: "Highest expected conversion efficiency with minimal storage losses.",
  },
  standalone: {
    label: "Standalone",
    performanceRatio: 0.74,
    description: "Battery and autonomy losses reduce the usable performance ratio.",
  },
  hybrid: {
    label: "Hybrid",
    performanceRatio: 0.79,
    description: "Balanced flexibility with moderate storage-related system losses.",
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
  return `${absoluteValue}° ${value >= 0 ? positiveLabel : negativeLabel}`
}

function formatCoordinatePair(latitude: number, longitude: number) {
  return `${formatCoordinateAxis(latitude, "N", "S")}, ${formatCoordinateAxis(longitude, "E", "W")}`
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
    query: profile.queryNormalized,
    latitude: Number(profile.latitude.toFixed(4)),
    longitude: Number(profile.longitude.toFixed(4)),
    systemSizeKw: controls.systemSizeKw,
    tilt: controls.tilt,
    azimuth: controls.azimuth,
    systemType: controls.systemType,
  })
}

function buildClimateProfile(match: NominatimLocation, climateData: OpenMeteoClimateResponse, cityQuery: string): ClimateProfile {
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
    queryNormalized: normalizeLocationQuery(cityQuery),
    displayName: match.display_name ?? cityQuery,
    latitude: Number.parseFloat(match.lat),
    longitude: Number.parseFloat(match.lon),
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

async function fetchClimateProfile(cityQuery: string) {
  let locationResponse: Response

  try {
    locationResponse = await fetch(`${NOMINATIM_URL}?q=${encodeURIComponent(cityQuery)}&format=json&limit=1`)
  } catch {
    throw new Error("The Nominatim geocoding request could not be completed.")
  }

  if (!locationResponse.ok) {
    throw new Error(await parseApiError(locationResponse, "The city lookup request failed."))
  }

  const locationResults = (await locationResponse.json()) as NominatimLocation[]
  const bestMatch = Array.isArray(locationResults) ? locationResults[0] : null

  if (!bestMatch?.lat || !bestMatch?.lon) {
    throw new Error(`No city match was found for "${cityQuery}".`)
  }

  const latitude = Number.parseFloat(bestMatch.lat)
  const longitude = Number.parseFloat(bestMatch.lon)

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

  const climateData = (await climateResponse.json()) as OpenMeteoClimateResponse
  return buildClimateProfile(bestMatch, climateData, cityQuery)
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

function MetricCard({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="rounded-[16px] border border-white/6 bg-black/15 px-4 py-3.5">
      <p className="text-[12px] font-medium text-zinc-400">{label}</p>
      <div className="mt-3 text-[2.05rem] font-semibold leading-none tracking-tight text-zinc-50">{value}</div>
      <p className="mt-1 text-sm font-semibold text-zinc-300">{unit}</p>
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
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  suffix: string
  onChange: (value: number) => void
}) {
  return (
    <label className="block space-y-3">
      <div className="flex items-end justify-between gap-4">
        <span className="text-[15px] font-medium text-zinc-300">{label}</span>
        <span className="text-[13px] font-medium text-zinc-500">
          {value}
          {suffix}
        </span>
      </div>
      <div className="px-1 pb-1 pt-5 text-zinc-100">
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
    </label>
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

  const hasPendingLocationChange = profile ? normalizeLocationQuery(controls.city) !== profile.queryNormalized : false
  const activeSystemConfig = SYSTEM_CONFIG[controls.systemType]
  const orientationPercent = estimate ? clamp(Math.round(estimate.orientationFactor * 100), 0, 100) : 0
  const locationLabel = profile?.displayName ?? (controls.city.trim() || "Location pending")
  const coordinateLabel = profile
    ? formatCoordinatePair(profile.latitude, profile.longitude)
    : "Run estimate to resolve coordinates"

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
      const nextControls = { ...controls, ...patch }
      setControls(nextControls)
      setRequestError(null)

      if ("city" in patch) {
        return
      }

      recalculateEstimate(nextControls)
    },
    [aiAnalysis, controls, profile?.queryNormalized, recalculateEstimate],
  )

  const handleEstimate = React.useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()

      const cityQuery = controls.city.trim()

      if (!cityQuery) {
        setRequestError("Enter a city name to fetch irradiance data.")
        return
      }

      setRequestError(null)
      setAiError(null)
      setAiAnalysis(null)

      const canReuseProfile = profile && normalizeLocationQuery(cityQuery) === profile.queryNormalized
      let activeProfile = profile

      try {
        if (!canReuseProfile) {
          setIsFetchingClimate(true)
          activeProfile = await fetchClimateProfile(cityQuery)
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
    [controls, profile],
  )

  return (
    <form onSubmit={handleEstimate} className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
      <div className="rounded-[24px] border border-white/10 bg-[#312f2c] p-5 text-zinc-100 shadow-[0_18px_40px_-28px_rgba(0,0,0,0.65)]">
        <div className="text-[13px] font-semibold uppercase tracking-[0.08em] text-zinc-400">SISTEM GIRDISI</div>

        <div className="mt-6 space-y-6">
          <label className="block space-y-2.5">
            <span className="text-[15px] font-medium text-zinc-300">Sehir</span>
            <input
              type="text"
              value={controls.city}
              onChange={(event) => updateControls({ city: event.target.value })}
              placeholder="Berlin, Istanbul, Madrid..."
              className="h-11 w-full rounded-xl border border-white/12 bg-[#282724] px-4 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-500 focus:border-white/20"
            />
            {profile || hasPendingLocationChange ? (
              <div className="flex flex-wrap gap-2 text-xs text-zinc-400">
                {profile ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/10 px-3 py-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {profile.displayName}
                  </span>
                ) : null}
                {hasPendingLocationChange ? (
                  <span className="rounded-full border border-sky-200/20 bg-sky-200/10 px-3 py-1 text-sky-100">
                    Sehir degisti, yeni iklim verisi alinacak
                  </span>
                ) : null}
              </div>
            ) : null}
          </label>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[15px] font-medium text-zinc-300">Konum</span>
              <span className="text-[12px] text-zinc-500">Harita karti</span>
            </div>
            <div className="flex justify-center rounded-[18px] border border-white/8 bg-black/10 px-3 py-4">
              <LocationMap location={locationLabel} coordinates={coordinateLabel} className="mx-auto" />
            </div>
          </div>

          <RangeField
            label="Sistem boyutu"
            value={controls.systemSizeKw}
            min={1}
            max={250}
            step={1}
            suffix=" kWp"
            onChange={(value) => updateControls({ systemSizeKw: value })}
          />

          <RangeField
            label="Panel egim acisi"
            value={controls.tilt}
            min={0}
            max={90}
            step={1}
            suffix=" deg"
            onChange={(value) => updateControls({ tilt: value })}
          />

          <RangeField
            label="Azimut"
            value={controls.azimuth}
            min={-90}
            max={90}
            step={5}
            suffix=" deg"
            onChange={(value) => updateControls({ azimuth: value })}
          />

          <label className="block space-y-2.5">
            <span className="text-[15px] font-medium text-zinc-300">Sistem tipi</span>
            <select
              value={controls.systemType}
              onChange={(event) => updateControls({ systemType: event.target.value as SystemType })}
              className="h-11 w-full rounded-xl border border-white/12 bg-[#282724] px-4 text-sm text-zinc-100 outline-none transition-colors focus:border-white/20"
            >
              {Object.entries(SYSTEM_CONFIG).map(([value, config]) => (
                <option key={value} value={value}>
                  {config.label}
                </option>
              ))}
            </select>
            <p className="text-sm leading-6 text-zinc-400">{activeSystemConfig.description}</p>
          </label>

          <div className="rounded-xl border border-white/8 bg-black/10 px-4 py-3 text-xs text-zinc-500">
            Open-Meteo {OPEN_METEO_MODEL} • 2018-2022 iklim verisi • Gemini AI analiz
          </div>

          <Button
            type="submit"
            className="h-12 w-full rounded-xl border border-white/15 bg-transparent text-base font-semibold text-zinc-50 hover:bg-white/5"
            disabled={isFetchingClimate || isGeneratingAi}
          >
            {isFetchingClimate ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Iklim verisi aliniyor
              </>
            ) : isGeneratingAi ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                AI analiz hazirlaniyor
              </>
            ) : (
              <>
                Hesapla ve analiz et
                <SunMedium className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>

          {requestError ? (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm leading-6 text-red-200">
              {requestError}
            </div>
          ) : null}
        </div>
      </div>

      <div className="rounded-[24px] border border-white/10 bg-[#312f2c] p-5 text-zinc-100 shadow-[0_18px_40px_-28px_rgba(0,0,0,0.65)]">
        <div className="text-[13px] font-semibold uppercase tracking-[0.08em] text-zinc-400">SONUCLAR</div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <MetricCard
            label="Yillik uretim"
            value={estimate ? wholeNumberFormatter.format(estimate.annualYieldKwh) : "--"}
            unit="kWh/yil"
          />
          <MetricCard
            label="Performans orani"
            value={estimate ? wholeNumberFormatter.format(Math.round(estimate.performanceRatio * 100)) : "--"}
            unit="%"
          />
          <MetricCard
            label="Spesifik uretim"
            value={estimate ? wholeNumberFormatter.format(Math.round(estimate.specificYield)) : "--"}
            unit="kWh/kWp"
          />
          <MetricCard
            label="CO2 tasarrufu"
            value={estimate ? wholeNumberFormatter.format(Math.round(estimate.co2SavedKg)) : "--"}
            unit="kg/yil"
          />
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="font-medium text-zinc-300">Yonelim uyumu</span>
            <span className="text-zinc-400">{estimate ? `%${orientationPercent} optimuma yakin` : "Hesaplama bekleniyor"}</span>
          </div>
          <div className="mt-2 rounded-xl border border-white/8 bg-[#252421] p-1">
            <div
              className="flex h-9 items-center rounded-lg bg-[#b6d2ef] px-3 text-sm font-semibold text-[#274c72] transition-all"
              style={{ width: `${estimate ? Math.max(18, orientationPercent) : 0}%` }}
            >
              {estimate ? `%${orientationPercent}` : ""}
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between gap-3 text-xs text-zinc-500">
            <span>{estimate ? `Optimum egim yaklasik ${estimate.optimalTilt} deg` : "Optimum egim hesaptan sonra gosterilir"}</span>
            <span>{profile ? `${decimalFormatter.format(profile.averageDailyRadiationKwhM2)} kWh/m^2/day` : ""}</span>
          </div>
        </div>

        <div className="mt-6">
          <div className="text-[13px] font-semibold uppercase tracking-[0.08em] text-zinc-400">AYLIK URETIM</div>
          <div className="mt-3 rounded-[18px] border border-white/8 bg-[#252421] p-3">
            {estimate ? (
              <div className="h-[190px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={estimate.monthlyProduction} margin={{ top: 8, right: 0, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#a1a1aa" }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#a1a1aa" }} tickLine={false} axisLine={false} />
                    <Tooltip
                      cursor={{ fill: "rgba(255,255,255,0.04)" }}
                      formatter={(value) => {
                        const numericValue = typeof value === "number" ? value : Number(value)
                        return [`${wholeNumberFormatter.format(Number.isFinite(numericValue) ? numericValue : 0)} kWh`, "Aylik uretim"]
                      }}
                      labelStyle={{ color: "#f4f4f5", fontWeight: 600 }}
                      itemStyle={{ color: "#d4d4d8" }}
                      contentStyle={{ borderRadius: 14, borderColor: "rgba(255,255,255,0.08)", backgroundColor: "#1f1f1c" }}
                    />
                    <Bar dataKey="productionKwh" radius={[8, 8, 4, 4]} fill="#b6d2ef" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex min-h-[190px] items-center justify-center px-4 text-center text-sm leading-6 text-zinc-500">
                Sonuc grafigi hesaplama yapildiginda burada gosterilecek.
              </div>
            )}
          </div>
        </div>

        <div className="my-6 h-px bg-white/10" />

        <div>
          <div className="text-[13px] font-semibold uppercase tracking-[0.08em] text-zinc-400">AI ANALIZ</div>
          <div className="mt-3 min-h-[220px] rounded-[18px] border border-white/8 bg-[#252421] p-5">
            {isGeneratingAi ? (
              <div className="flex items-center gap-3 text-sm text-zinc-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                AI analiz olusturuluyor...
              </div>
            ) : aiError ? (
              <div className="flex items-start gap-3 text-sm leading-7 text-red-200">
                <AlertTriangle className="mt-1 h-4 w-4 flex-shrink-0" />
                <span>{aiError}</span>
              </div>
            ) : aiAnalysis ? (
              <div className="space-y-5 text-[15px] leading-8 text-zinc-200">
                <p>{aiAnalysis}</p>
                {profile && estimate ? (
                  <div className="grid gap-2 text-xs text-zinc-500 sm:grid-cols-3">
                    <span>En guclu ay: {estimate.peakMonth}</span>
                    <span>En zayif ay: {estimate.weakestMonth}</span>
                    <span>Yillik isinim: {decimalFormatter.format(profile.annualRadiationKwhM2)} kWh/m^2</span>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="flex items-start gap-3 text-sm leading-7 text-zinc-500">
                <Sparkles className="mt-1 h-4 w-4 flex-shrink-0" />
                <span>Hesaplama yapildiginda Gemini bu panelde sistem icin detayli bir yorum uretecek.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </form>
  )
}
