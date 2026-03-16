const DEFAULT_GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta"
const DEFAULT_GEMINI_MODEL = "gemini-3-flash-preview"

export async function generateGeminiInterpretiveSummary({
  analysis,
  apiKey,
  baseUrl = DEFAULT_GEMINI_BASE_URL,
  model = DEFAULT_GEMINI_MODEL,
}) {
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY on the server.")
  }

  const resolvedBaseUrl = baseUrl.replace(/\/$/, "")
  const response = await fetch(`${resolvedBaseUrl}/models/${model}:generateContent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
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

  const data = await response.json()
  const text = extractGeminiResponseText(data)

  if (!text) {
    throw new Error("The Gemini response did not contain any summary text.")
  }

  return {
    text,
    model,
    generatedAt: new Date().toISOString(),
    provider: "google-gemini",
  }
}

export function buildSystemInstruction() {
  return "You are a senior construction portfolio analyst. Analyze the uploaded construction project dataset directly from the normalized records, source mappings, QA findings, and extracted notes. Be concrete, concise, and commercially relevant. Focus on delivery risk, schedule credibility, reporting quality, administrative follow-up, and executive actions."
}

export function buildInterpretivePrompt(analysis) {
  const selectedRecords = selectRecordsForModel(analysis)
  const selectedNotes = Array.isArray(analysis?.notes)
    ? analysis.notes.slice(0, 10).map((note) => ({
        relatedProject: note?.relatedProject,
        text: note?.text,
        sourceName: note?.sourceName,
      }))
    : []
  const selectedMappings = Array.isArray(analysis?.columnMappings)
    ? analysis.columnMappings.slice(0, 5).map((mapping) => ({
        sourceName: mapping?.sourceName,
        sheetName: mapping?.sheetName,
        unmatchedHeaders: Array.isArray(mapping?.unmatchedHeaders) ? mapping.unmatchedHeaders : [],
        matches: Array.isArray(mapping?.matches)
          ? mapping.matches.slice(0, 8).map((match) => ({
              header: match?.header,
              field: match?.fieldLabel,
              confidence: match?.confidence,
              matchType: match?.matchType,
            }))
          : [],
      }))
    : []

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
        mode: analysis?.mode,
        generatedAt: analysis?.generatedAt,
        sources: analysis?.sources,
        summary: analysis?.summary,
        qualityFindings: analysis?.qualityFindings,
        fieldCoverage: analysis?.fieldCoverage,
        normalizedRecords: selectedRecords,
        extractedNotes: selectedNotes,
        columnMappings: selectedMappings,
        priorGeneratedSummary: analysis?.managementSummary,
        priorAdHocReport: analysis?.adHocReport,
      },
      null,
      2
    ),
  ].join("\n")
}

async function buildProviderErrorMessage(response, providerLabel) {
  const rawText = await response.text()

  try {
    const data = JSON.parse(rawText)
    if (data?.error?.message) {
      return data.error.message
    }
  } catch {
    return rawText || `${providerLabel} summary request failed with status ${response.status}.`
  }

  return rawText || `${providerLabel} summary request failed with status ${response.status}.`
}

function extractGeminiResponseText(data) {
  const candidates = data?.candidates
  if (!Array.isArray(candidates)) {
    return ""
  }

  const fragments = []

  candidates.forEach((candidate) => {
    const parts = candidate?.content?.parts
    if (!Array.isArray(parts)) {
      return
    }

    parts.forEach((part) => {
      if (typeof part?.text === "string") {
        fragments.push(part.text)
      }
    })
  })

  return fragments.join("\n").trim()
}

function selectRecordsForModel(analysis) {
  const records = Array.isArray(analysis?.records) ? [...analysis.records] : []
  const ranked = records.sort((left, right) => scoreRecordForModel(right) - scoreRecordForModel(left))

  return ranked.slice(0, Math.min(12, ranked.length)).map((record) => ({
    name: record?.name,
    region: record?.region,
    country: record?.country,
    status: record?.status,
    riskLevel: record?.riskLevel,
    progress: record?.progress,
    budget: record?.budget,
    forecastCost: record?.forecastCost,
    endDate: record?.endDate,
    lastUpdate: record?.lastUpdate,
    documentationStatus: record?.documentationStatus,
    meetingStatus: record?.meetingStatus,
    openIssues: record?.openIssues,
    projectManager: record?.projectManager,
    contractor: record?.contractor,
    dataCompleteness: record?.dataCompleteness,
    notes: record?.notes,
    sourceName: record?.sourceName,
    sourceSheet: record?.sourceSheet ?? null,
  }))
}

function scoreRecordForModel(record) {
  let score = 0

  if (record?.status === "Delayed") {
    score += 6
  }

  if (record?.status === "At Risk") {
    score += 5
  }

  if (record?.riskLevel === "Critical") {
    score += 5
  } else if (record?.riskLevel === "High") {
    score += 3
  }

  if (record?.documentationStatus === "Missing") {
    score += 3
  }

  if (record?.meetingStatus === "Not Ready") {
    score += 3
  }

  if (typeof record?.openIssues === "number") {
    score += Math.min(record.openIssues, 4)
  }

  if (typeof record?.dataCompleteness === "number") {
    score += Math.max(0, 100 - record.dataCompleteness) / 20
  }

  if (typeof record?.budget === "number" && record.budget > 0) {
    score += Math.min(record.budget / 10_000_000, 4)
  }

  return score
}
