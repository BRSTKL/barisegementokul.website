import React from "react"

import { ProjectPortfolioDataLabLayout } from "@/components/ProjectPortfolioDataLabLayout"
import {
  analyzePortfolioFiles,
  createSamplePortfolioAnalysis,
  type PortfolioAnalysis,
} from "@/lib/portfolio-data-demo"
import {
  generateInterpretiveSummary,
  type InterpretiveSummaryResult,
} from "@/lib/portfolio-llm"

export function ProjectPortfolioDataDemo() {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [analysis, setAnalysis] = React.useState<PortfolioAnalysis>(() => createSamplePortfolioAnalysis())
  const [isLoading, setIsLoading] = React.useState(false)
  const [isDragging, setIsDragging] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [uploadedFiles, setUploadedFiles] = React.useState<string[]>([])
  const [copied, setCopied] = React.useState(false)
  const [aiSummary, setAiSummary] = React.useState<InterpretiveSummaryResult | null>(null)
  const [isGeneratingAi, setIsGeneratingAi] = React.useState(false)
  const [aiError, setAiError] = React.useState<string | null>(null)
  const [activeView, setActiveView] = React.useState<"overview" | "projects" | "issues" | "reports">("overview")
  const [projectSearch, setProjectSearch] = React.useState("")
  const [regionFilter, setRegionFilter] = React.useState("all")

  const handleFiles = React.useCallback(async (nextFiles: File[]) => {
    if (!nextFiles.length) {
      return
    }

    setIsLoading(true)
    setError(null)
    setAiSummary(null)
    setAiError(null)
    setActiveView("overview")
    setUploadedFiles(nextFiles.map((file) => file.name))

    try {
      const nextAnalysis = await analyzePortfolioFiles(nextFiles)
      React.startTransition(() => setAnalysis(nextAnalysis))
    } catch (analysisError) {
      setError(analysisError instanceof Error ? analysisError.message : "The files could not be analyzed.")
    } finally {
      setIsLoading(false)
      setIsDragging(false)
      if (inputRef.current) {
        inputRef.current.value = ""
      }
    }
  }, [])

  const handleDrop = React.useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault()
      setIsDragging(false)
      void handleFiles(Array.from(event.dataTransfer.files))
    },
    [handleFiles]
  )

  const handleCopySummary = React.useCallback(async () => {
    try {
      await navigator.clipboard.writeText([...analysis.managementSummary, "", ...analysis.adHocReport].join("\n"))
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }, [analysis.adHocReport, analysis.managementSummary])

  const loadSample = React.useCallback(() => {
    React.startTransition(() => {
      setAnalysis(createSamplePortfolioAnalysis())
      setUploadedFiles([])
      setError(null)
      setAiSummary(null)
      setAiError(null)
      setActiveView("overview")
    })
  }, [])

  const handleGenerateAiSummary = React.useCallback(async () => {
    setIsGeneratingAi(true)
    setAiError(null)

    try {
      const nextSummary = await generateInterpretiveSummary({
        analysis,
        provider: "gemini",
      })
      setAiSummary(nextSummary)
    } catch (summaryError) {
      setAiError(summaryError instanceof Error ? summaryError.message : "The AI summary could not be generated.")
    } finally {
      setIsGeneratingAi(false)
    }
  }, [analysis])

  const analyzeButtonLabel =
    analysis.mode === "upload" ? "Analyze uploaded portfolio" : "Analyze current dataset"

  return (
    <ProjectPortfolioDataLabLayout
      analysis={analysis}
      isLoading={isLoading}
      isDragging={isDragging}
      error={error}
      uploadedFiles={uploadedFiles}
      copied={copied}
      aiSummary={aiSummary}
      isGeneratingAi={isGeneratingAi}
      aiError={aiError}
      activeView={activeView}
      projectSearch={projectSearch}
      regionFilter={regionFilter}
      analyzeButtonLabel={analyzeButtonLabel}
      inputRef={inputRef}
      onChooseFiles={() => inputRef.current?.click()}
      onLoadSample={loadSample}
      onProjectSearchChange={setProjectSearch}
      onRegionFilterChange={setRegionFilter}
      onActiveViewChange={setActiveView}
      onGenerateAiSummary={() => void handleGenerateAiSummary()}
      onCopySummary={() => void handleCopySummary()}
      onFileChange={(files) => void handleFiles(files)}
      onDragOver={(event) => {
        event.preventDefault()
        setIsDragging(true)
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    />
  )
}
