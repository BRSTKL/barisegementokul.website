import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import http from "node:http"

import { generateGeminiInterpretiveSummary } from "./interpretive-summary.mjs"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, "..")
const distDir = path.join(rootDir, "dist")

loadServerEnv(path.join(rootDir, ".env.local"))
loadServerEnv(path.join(rootDir, ".env"))

const HOST = process.env.HOST || "127.0.0.1"
const PORT = Number(process.env.PORT || 8787)
const SERVE_STATIC = process.env.SERVE_STATIC !== "0"
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ""
const GEMINI_BASE_URL = process.env.GEMINI_BASE_URL || "https://generativelanguage.googleapis.com/v1beta"
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3-flash-preview"

const server = http.createServer(async (request, response) => {
  try {
    if (request.method === "POST" && request.url === "/api/interpretive-summary") {
      await handleInterpretiveSummary(request, response)
      return
    }

    if (SERVE_STATIC) {
      serveStaticApp(request, response)
      return
    }

    writeJson(response, 404, {
      error: {
        message: "Not found.",
      },
    })
  } catch (error) {
    writeJson(response, 500, {
      error: {
        message: error instanceof Error ? error.message : "Unexpected server error.",
      },
    })
  }
})

server.listen(PORT, HOST, () => {
  process.stdout.write(`Secure Gemini proxy listening on http://${HOST}:${PORT}\n`)
})

async function handleInterpretiveSummary(request, response) {
  if (!GEMINI_API_KEY) {
    writeJson(response, 500, {
      error: {
        message: "Missing GEMINI_API_KEY on the server. Add it to .env.local or the host environment.",
      },
    })
    return
  }

  const body = await readJsonBody(request)
  const analysis = body?.analysis
  const requestedModel = typeof body?.model === "string" && body.model.trim() ? body.model.trim() : GEMINI_MODEL

  if (!analysis || typeof analysis !== "object") {
    writeJson(response, 400, {
      error: {
        message: "Request body must include an analysis object.",
      },
    })
    return
  }

  const summary = await generateGeminiInterpretiveSummary({
    analysis,
    apiKey: GEMINI_API_KEY,
    baseUrl: GEMINI_BASE_URL,
    model: requestedModel,
  })

  writeJson(response, 200, summary)
}

function serveStaticApp(request, response) {
  const requestPath = request.url && request.url !== "/" ? request.url.split("?")[0] : "/index.html"
  const safePath = path.normalize(requestPath || "/index.html").replace(/^(\.\.[/\\])+/, "")
  const targetPath = path.join(distDir, safePath === "/" ? "index.html" : safePath)

  if (fs.existsSync(targetPath) && fs.statSync(targetPath).isFile()) {
    writeFile(response, targetPath)
    return
  }

  const indexPath = path.join(distDir, "index.html")
  if (fs.existsSync(indexPath)) {
    writeFile(response, indexPath)
    return
  }

  writeJson(response, 404, {
    error: {
      message: "Static build not found. Run `npm run build` first or set SERVE_STATIC=0 for API-only mode.",
    },
  })
}

function writeFile(response, filePath) {
  const ext = path.extname(filePath).toLowerCase()
  const contentType = getContentType(ext)
  response.writeHead(200, {
    "Content-Type": contentType,
    "Cache-Control": ext === ".html" ? "no-cache" : "public, max-age=31536000, immutable",
  })
  fs.createReadStream(filePath).pipe(response)
}

function writeJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  })
  response.end(JSON.stringify(payload))
}

function getContentType(ext) {
  switch (ext) {
    case ".css":
      return "text/css; charset=utf-8"
    case ".html":
      return "text/html; charset=utf-8"
    case ".js":
      return "application/javascript; charset=utf-8"
    case ".json":
      return "application/json; charset=utf-8"
    case ".mjs":
      return "application/javascript; charset=utf-8"
    case ".svg":
      return "image/svg+xml"
    case ".png":
      return "image/png"
    case ".jpg":
    case ".jpeg":
      return "image/jpeg"
    case ".webp":
      return "image/webp"
    case ".woff2":
      return "font/woff2"
    default:
      return "application/octet-stream"
  }
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let raw = ""

    request.on("data", (chunk) => {
      raw += chunk

      if (raw.length > 1_000_000) {
        reject(new Error("Request body is too large."))
        request.destroy()
      }
    })

    request.on("end", () => {
      if (!raw) {
        resolve({})
        return
      }

      try {
        resolve(JSON.parse(raw))
      } catch {
        reject(new Error("Request body must be valid JSON."))
      }
    })

    request.on("error", reject)
  })
}

function loadServerEnv(filePath) {
  if (!fs.existsSync(filePath)) {
    return
  }

  const content = fs.readFileSync(filePath, "utf8")

  content.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) {
      return
    }

    const separatorIndex = trimmed.indexOf("=")
    if (separatorIndex === -1) {
      return
    }

    const key = trimmed.slice(0, separatorIndex).trim()
    const value = trimmed.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, "")

    if (key && process.env[key] == null) {
      process.env[key] = value
    }
  })
}
