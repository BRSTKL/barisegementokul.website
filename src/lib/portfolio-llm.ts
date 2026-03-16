import type { PortfolioAnalysis } from "@/lib/portfolio-data-demo"

export type AiProvider = "gemini" | "openai"

const viteEnv = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env ?? {}

const OPENAI_BASE_URL = viteEnv.VITE_OPENAI_BASE_URL || "https://api.openai.com/v1"
const OPENAI_MODEL = viteEnv.VITE_OPENAI_MODEL || "gpt-5-mini"
const GEMINI_PROXY_URL = viteEnv.VITE_GEMINI_PROXY_URL || "/api/interpretive-summary"
const GEMINI_MODEL = viteEnv.VITE_GEMINI_MODEL || "gemini-3-flash-preview"

export const DEFAULT_AI_PROVIDER: AiProvider = viteEnv.VITE_LLM_PROVIDER === "openai" ? "openai" : "gemini"

export interface InterpretiveSummaryResult {
  text: string
  model: string
  generatedAt: string
  provider: "google-gemini" | "openai-responses"
}

export interface GenerateInterpretiveSummaryOptions {
  analysis: PortfolioAnalysis
  provider?: AiProvider
  apiKey?: string
  baseUrl?: string
  model?: string
}

export function getDefaultAiProviderConfig(provider: AiProvider) {
  if (provider === "openai") {
    return {
      provider,
      baseUrl: OPENAI_BASE_URL,
      model: OPENAI_MODEL,
    }
  }

  return {
    provider,
    baseUrl: GEMINI_PROXY_URL,
    model: GEMINI_MODEL,
  }
}

export async function generateInterpretiveSummary({
  analysis,
  provider = DEFAULT_AI_PROVIDER,
  apiKey,
  baseUrl,
  model,
}: GenerateInterpretiveSummaryOptions): Promise<InterpretiveSummaryResult> {
  if (provider === "openai") {
    return generateOpenAiSummary({
      analysis,
      apiKey,
      baseUrl,
      model,
    })
  }

  return generateGeminiSummary({
    analysis,
    apiKey,
    baseUrl,
    model,
  })
}

async function generateOpenAiSummary({
  analysis,
  apiKey,
  baseUrl,
  model,
}: Omit<GenerateInterpretiveSummaryOptions, "provider">): Promise<InterpretiveSummaryResult> {
  const resolvedBaseUrl = (baseUrl || OPENAI_BASE_URL).replace(/\/$/, "")
  const resolvedModel = model || OPENAI_MODEL
  const usingDirectOpenAI = resolvedBaseUrl === OPENAI_BASE_URL

  if (usingDirectOpenAI && !apiKey) {
    throw new Error("Add an OpenAI API key or configure an OpenAI-compatible proxy URL before generating an AI summary.")
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  }

  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`
  }

  const response = await fetch(`${resolvedBaseUrl}/responses`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: resolvedModel,
      store: false,
      max_output_tokens: 900,
      instructions: buildSystemInstruction(),
      input: buildInterpretivePrompt(analysis),
    }),
  })

  if (!response.ok) {
    throw new Error(await buildProviderErrorMessage(response, "OpenAI"))
  }

  const data = (await response.json()) as Record<string, unknown>
  const text = extractOpenAiResponseText(data)

  if (!text) {
    throw new Error("The OpenAI response did not contain any summary text.")
  }

  return {
    text,
    model: resolvedModel,
    generatedAt: new Date().toISOString(),
    provider: "openai-responses",
  }
}

async function generateGeminiSummary({
  analysis,
  apiKey,
  baseUrl,
  model,
}: Omit<GenerateInterpretiveSummaryOptions, "provider">): Promise<InterpretiveSummaryResult> {
  const resolvedBaseUrl = (baseUrl || GEMINI_PROXY_URL).replace(/\/$/, "")
  const resolvedModel = model || GEMINI_MODEL
  const usingProxy = isGeminiProxyUrl(resolvedBaseUrl)
  const usingDirectGemini = !usingProxy

  if (usingDirectGemini && !apiKey) {
    throw new Error("Add a Gemini API key or configure a Gemini-compatible proxy URL before generating an AI summary.")
  }

  if (usingProxy) {
    return generateGeminiProxySummary({
      analysis,
      baseUrl: resolvedBaseUrl,
      model: resolvedModel,
    })
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  }

  if (apiKey) {
    headers["x-goog-api-key"] = apiKey
  }

  const response = await fetch(`${resolvedBaseUrl}/models/${resolvedModel}:generateContent`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      systemInstruction: {
        parts: [
          {
            text: buildSystemInstruction(),
          },
        ],
      },
      contents: [
        {
          role: "user",
          parts: [
            {
              text: buildInterpretivePrompt(analysis),
            },
          ],
        },
      ],
      generationConfig: {
        maxOutputTokens: 900,
        temperature: 0.3,
      },
    }),
  })

  if (!response.ok) {
    throw new Error(await buildProviderErrorMessage(response, "Gemini"))
  }

  const data = (await response.json()) as Record<string, unknown>
  const text = extractGeminiResponseText(data)

  if (!text) {
    throw new Error("The Gemini response did not contain any summary text.")
  }

  return {
    text,
    model: resolvedModel,
    generatedAt: new Date().toISOString(),
    provider: "google-gemini",
  }
}

async function generateGeminiProxySummary({
  analysis,
  baseUrl,
  model,
}: {
  analysis: PortfolioAnalysis
  baseUrl: string
  model: string
}): Promise<InterpretiveSummaryResult> {
  const response = await fetch(baseUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      analysis,
      model,
    }),
  })

  if (!response.ok) {
    throw new Error(await buildProviderErrorMessage(response, "Gemini proxy"))
  }

  const data = (await response.json()) as Partial<InterpretiveSummaryResult>

  if (!data.text || !data.model || !data.generatedAt || !data.provider) {
    throw new Error("The Gemini proxy response was missing required summary fields.")
  }

  return {
    text: data.text,
    model: data.model,
    generatedAt: data.generatedAt,
    provider: data.provider,
  }
}

function buildSystemInstruction() {
  return "You are a senior construction portfolio analyst. Analyze the uploaded construction project dataset directly from the normalized records, source mappings, QA findings, and extracted notes. Be concrete, concise, and commercially relevant. Focus on delivery risk, schedule credibility, reporting quality, administrative follow-up, and executive actions."
}

function buildInterpretivePrompt(analysis: PortfolioAnalysis) {
  const selectedRecords = selectRecordsForModel(analysis)
  const selectedNotes = analysis.notes.slice(0, 10).map((note) => ({
    relatedProject: note.relatedProject,
    text: note.text,
    sourceName: note.sourceName,
  }))
  const selectedMappings = analysis.columnMappings.slice(0, 5).map((mapping) => ({
    sourceName: mapping.sourceName,
    sheetName: mapping.sheetName,
    unmatchedHeaders: mapping.unmatchedHeaders,
    matches: mapping.matches.slice(0, 8).map((match) => ({
      header: match.header,
      field: match.fieldLabel,
      confidence: match.confidence,
      matchType: match.matchType,
    })),
  }))

  return [
    "Analyze the uploaded construction portfolio dataset directly.",
    "Treat the normalized project records as the primary evidence.",
    "Use summary metrics only as supporting context.",
    "",
    "Return markdown with exactly these sections:",
    "## Executive View",
    "## What This Means",
    "## Risks To Escalate",
    "## Recommended Next Actions",
    "",
    "Keep the answer under 400 words.",
    "Do not restate every metric. Diagnose the uploaded portfolio.",
    "Reference concrete project names when the records justify it.",
    "Call out data quality gaps when they weaken governance or make schedule claims unreliable.",
    "If the dataset is partial or low quality, say that clearly.",
    "",
    JSON.stringify(
      {
        mode: analysis.mode,
        generatedAt: analysis.generatedAt,
        sources: analysis.sources,
        summary: analysis.summary,
        qualityFindings: analysis.qualityFindings,
        fieldCoverage: analysis.fieldCoverage,
        normalizedRecords: selectedRecords,
        extractedNotes: selectedNotes,
        columnMappings: selectedMappings,
        priorGeneratedSummary: analysis.managementSummary,
        priorAdHocReport: analysis.adHocReport,
      },
      null,
      2
    ),
  ].join("\n")
}

async function buildProviderErrorMessage(response: Response, providerLabel: string) {
  const rawText = await response.text()

  try {
    const data = JSON.parse(rawText) as {
      error?: {
        message?: string
      }
    }

    if (data.error?.message) {
      return data.error.message
    }
  } catch {
    return rawText || `${providerLabel} summary request failed with status ${response.status}.`
  }

  return rawText || `${providerLabel} summary request failed with status ${response.status}.`
}

function extractOpenAiResponseText(data: Record<string, unknown>) {
  const directText = data.output_text
  if (typeof directText === "string" && directText.trim()) {
    return directText.trim()
  }

  const output = data.output
  if (!Array.isArray(output)) {
    return ""
  }

  const fragments: string[] = []

  output.forEach((item) => {
    if (typeof item !== "object" || item === null || !("content" in item)) {
      return
    }

    const content = (item as { content?: unknown }).content
    if (!Array.isArray(content)) {
      return
    }

    content.forEach((contentItem) => {
      if (
        typeof contentItem === "object" &&
        contentItem !== null &&
        "type" in contentItem &&
        (contentItem as { type?: unknown }).type === "output_text" &&
        "text" in contentItem &&
        typeof (contentItem as { text?: unknown }).text === "string"
      ) {
        fragments.push((contentItem as { text: string }).text)
      }
    })
  })

  return fragments.join("\n").trim()
}

function extractGeminiResponseText(data: Record<string, unknown>) {
  const candidates = data.candidates
  if (!Array.isArray(candidates)) {
    return ""
  }

  const fragments: string[] = []

  candidates.forEach((candidate) => {
    if (typeof candidate !== "object" || candidate === null || !("content" in candidate)) {
      return
    }

    const content = (candidate as { content?: unknown }).content
    if (typeof content !== "object" || content === null || !("parts" in content)) {
      return
    }

    const parts = (content as { parts?: unknown }).parts
    if (!Array.isArray(parts)) {
      return
    }

    parts.forEach((part) => {
      if (typeof part === "object" && part !== null && "text" in part && typeof (part as { text?: unknown }).text === "string") {
        fragments.push((part as { text: string }).text)
      }
    })
  })

  return fragments.join("\n").trim()
}

function isGeminiProxyUrl(baseUrl: string) {
  return baseUrl.startsWith("/") || baseUrl.includes("/api/interpretive-summary")
}

function selectRecordsForModel(analysis: PortfolioAnalysis) {
  const rankedRecords = [...analysis.records].sort((left, right) => {
    return scoreRecordForModel(right) - scoreRecordForModel(left)
  })

  const selected = rankedRecords.slice(0, Math.min(12, rankedRecords.length))

  return selected.map((record) => ({
    name: record.name,
    region: record.region,
    country: record.country,
    status: record.status,
    riskLevel: record.riskLevel,
    progress: record.progress,
    budget: record.budget,
    forecastCost: record.forecastCost,
    endDate: record.endDate,
    lastUpdate: record.lastUpdate,
    documentationStatus: record.documentationStatus,
    meetingStatus: record.meetingStatus,
    openIssues: record.openIssues,
    projectManager: record.projectManager,
    contractor: record.contractor,
    dataCompleteness: record.dataCompleteness,
    notes: record.notes,
    sourceName: record.sourceName,
    sourceSheet: record.sourceSheet ?? null,
  }))
}

function scoreRecordForModel(record: PortfolioAnalysis["records"][number]) {
  let score = 0

  if (record.status === "Delayed") {
    score += 6
  }

  if (record.status === "At Risk") {
    score += 5
  }

  if (record.riskLevel === "Critical") {
    score += 5
  } else if (record.riskLevel === "High") {
    score += 3
  }

  if (record.documentationStatus === "Missing") {
    score += 3
  }

  if (record.meetingStatus === "Not Ready") {
    score += 3
  }

  if (record.openIssues) {
    score += Math.min(record.openIssues, 4)
  }

  score += Math.max(0, 100 - record.dataCompleteness) / 20
  score += (record.budget ?? 0) > 0 ? Math.min((record.budget ?? 0) / 10_000_000, 4) : 0

  return score
}
