import React from "react"
import { motion } from "framer-motion"
import {
  ArrowLeft,
  CheckCircle2,
  FileSpreadsheet,
  FolderKanban,
  ShieldCheck,
  Sparkles,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const ProjectPortfolioDataDemo = React.lazy(() =>
  import("./ProjectPortfolioDataDemo").then((module) => ({ default: module.ProjectPortfolioDataDemo }))
)

interface DataLabProjectPageProps {
  title: string
  description: string
  tags: string[]
  metrics?: {
    label: string
    value: string
  }[]
  onBack: () => void
}

const PROJECT_HIGHLIGHTS = [
  "Upload Excel or PDF construction portfolio files and consolidate them into a single tracking view.",
  "Run real column-mapping audits, QA checks, stale-data detection, and standards coverage analysis.",
  "Generate management-ready reporting, CSV exports, and secure Gemini-backed interpretive summaries.",
]

export function DataLabProjectPage({
  title,
  description,
  tags,
  metrics = [],
  onBack,
}: DataLabProjectPageProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-8">
        <Button variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Portfolio
        </Button>
      </div>

      <main className="container mx-auto px-4 pb-20">
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]"
        >
          <Card className="border-primary/20 bg-gradient-to-br from-background via-background to-primary/10">
            <CardHeader className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">Interactive Project</Badge>
                <Badge variant="secondary">Secure Gemini Proxy</Badge>
              </div>
              <CardTitle className="text-4xl leading-tight md:text-5xl">{title}</CardTitle>
              <CardDescription className="max-w-3xl text-base">{description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                {PROJECT_HIGHLIGHTS.map((item) => (
                  <div key={item} className="rounded-2xl border border-border/60 bg-background/70 p-4">
                    <CheckCircle2 className="mb-3 h-5 w-5 text-primary" />
                    <p className="text-sm text-muted-foreground">{item}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Project Snapshot
              </CardTitle>
              <CardDescription>The standalone project page keeps the demo directly testable from your portfolio.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                {metrics.map((metric) => (
                  <div key={metric.label} className="rounded-2xl border border-border/60 bg-muted/20 p-4 text-center">
                    <div className="text-lg font-bold text-primary">{metric.value}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{metric.label}</div>
                  </div>
                ))}
              </div>

              <div className="space-y-3 rounded-2xl border border-border/60 bg-muted/20 p-5">
                <div className="flex items-center gap-2 font-semibold">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  Secure runtime
                </div>
                <p className="text-sm text-muted-foreground">
                  Gemini is called through the website proxy. The interactive page uses the server-side key and does not
                  require exposing secrets in the browser.
                </p>
              </div>

              <div className="space-y-3 rounded-2xl border border-border/60 bg-muted/20 p-5">
                <div className="flex items-center gap-2 font-semibold">
                  <FolderKanban className="h-4 w-4 text-primary" />
                  Demo coverage
                </div>
                <p className="text-sm text-muted-foreground">
                  This page bundles ingestion, QA, reporting, exports, and LLM interpretation as a portfolio-ready
                  product showcase instead of leaving the demo buried in a section.
                </p>
              </div>

              <div className="space-y-3 rounded-2xl border border-border/60 bg-muted/20 p-5">
                <div className="flex items-center gap-2 font-semibold">
                  <FileSpreadsheet className="h-4 w-4 text-primary" />
                  Test path
                </div>
                <p className="text-sm text-muted-foreground">
                  Upload an Excel tracker or PDF brief, review the mapping audit, export the report pack, and generate an
                  interpretive summary on the same page.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.45 }}
          className="mt-10"
        >
          <React.Suspense
            fallback={
              <div className="rounded-2xl border border-border bg-card/60 p-8 text-center text-muted-foreground">
                Loading interactive project demo...
              </div>
            }
          >
            <ProjectPortfolioDataDemo />
          </React.Suspense>
        </motion.section>
      </main>
    </div>
  )
}
