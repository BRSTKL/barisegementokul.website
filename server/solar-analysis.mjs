const DEFAULT_GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta"
const DEFAULT_SOLAR_GEMINI_MODEL = "gemini-2.0-flash"

export async function generateGeminiSolarAnalysis({
  analysis,
  apiKey,
  baseUrl = DEFAULT_GEMINI_BASE_URL,
  model = DEFAULT_SOLAR_GEMINI_MODEL,
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
              text: buildSolarPrompt(analysis),
            },
          ],
        },
      ],
      generationConfig: {
        maxOutputTokens: 700,
        temperature: 0.35,
      },
    }),
  })

  if (!response.ok) {
    throw new Error(await buildProviderErrorMessage(response, "Gemini"))
  }

  const data = await response.json()
  const text = extractGeminiResponseText(data)

  if (!text) {
    throw new Error("The Gemini response did not contain any solar analysis text.")
  }

  return {
    text,
    model,
    generatedAt: new Date().toISOString(),
    provider: "google-gemini",
  }
}

function buildSystemInstruction() {
  return "You are a senior solar PV engineer. Analyze the provided location, irradiance history, and PV system settings. Respond in English only. Be technically grounded, concise, and realistic. Mention uncertainty when assumptions matter. Do not use markdown headings or bullet points."
}

function buildSolarPrompt(analysis) {
  return [
    "Write one fluent, professional English paragraph based on the provided data.",
    "Keep the analysis between 140 and 220 words.",
    "Make sure the paragraph covers:",
    "- annual yield and specific yield",
    "- the effect of the selected tilt and azimuth",
    "- a brief mention of the strongest and weakest production months",
    "- a short comment on performance ratio and system type",
    "- a meaningful but careful note about CO2 savings",
    "- one sentence explaining that the result is a planning-grade estimate based on 2018-2022 climate averages and typical field losses",
    "Do not use markdown, headings, bullet points, or tables.",
    "",
    JSON.stringify(analysis, null, 2),
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
    return rawText || `${providerLabel} analysis request failed with status ${response.status}.`
  }

  return rawText || `${providerLabel} analysis request failed with status ${response.status}.`
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
