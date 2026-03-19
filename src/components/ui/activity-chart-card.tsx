import * as React from "react"
import { motion } from "framer-motion"
import { ChevronDown, TrendingUp } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export interface ActivityDataPoint {
  label: string
  value: number
}

export interface ActivityDataset {
  totalValue: string
  description?: string
  data: ActivityDataPoint[]
}

interface ActivityChartCardProps {
  title?: string
  datasets: Record<string, ActivityDataset>
  className?: string
}

export function ActivityChartCard({
  title = "Activity",
  datasets,
  className,
}: ActivityChartCardProps) {
  const datasetNames = React.useMemo(() => Object.keys(datasets), [datasets])
  const [selectedRange, setSelectedRange] = React.useState(datasetNames[0] ?? "")

  React.useEffect(() => {
    if (!datasetNames.length) {
      setSelectedRange("")
      return
    }

    if (!datasets[selectedRange]) {
      setSelectedRange(datasetNames[0])
    }
  }, [datasetNames, datasets, selectedRange])

  const activeDataset = datasets[selectedRange] ?? datasets[datasetNames[0] ?? ""]
  const maxValue = React.useMemo(
    () => activeDataset?.data.reduce((max, item) => (item.value > max ? item.value : max), 0) ?? 0,
    [activeDataset],
  )

  const chartVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.06,
      },
    },
  }

  const barVariants = {
    hidden: { scaleY: 0, opacity: 0, transformOrigin: "bottom" },
    visible: {
      scaleY: 1,
      opacity: 1,
      transformOrigin: "bottom",
      transition: {
        duration: 0.45,
        ease: [0.4, 0, 0.2, 1],
      },
    },
  }

  return (
    <Card
      className={cn(
        "w-full overflow-hidden rounded-[22px] border-0 bg-[linear-gradient(180deg,rgba(13,25,40,0.98),rgba(6,12,21,0.96))] text-slate-50 shadow-[0_24px_90px_-42px_rgba(56,189,248,0.5)] sm:rounded-[28px]",
        className,
      )}
      aria-labelledby="activity-card-title"
    >
      <CardHeader className="pb-4 sm:pb-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="inline-flex rounded-full bg-white/6 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-100/85">
              Monthly view
            </div>
            <CardTitle id="activity-card-title" className="text-xl font-semibold tracking-tight text-slate-50">
              {title}
            </CardTitle>
          </div>

          {datasetNames.length > 1 ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 self-start rounded-full bg-white/6 px-3 text-sm text-slate-200 hover:bg-white/10 hover:text-white"
                  aria-haspopup="true"
                >
                  {selectedRange}
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="border-0 bg-slate-950/95 text-slate-100 shadow-[0_20px_60px_-24px_rgba(15,23,42,0.85)] backdrop-blur-xl"
              >
                {datasetNames.map((option) => (
                  <DropdownMenuItem
                    key={option}
                    onSelect={() => setSelectedRange(option)}
                    className="cursor-pointer rounded-md focus:bg-white/10 focus:text-white"
                  >
                    {option}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>
      </CardHeader>

      <CardContent className="space-y-5 sm:space-y-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-3xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">
              {activeDataset?.totalValue ?? "--"}
            </p>
            <CardDescription className="flex max-w-sm items-center gap-2 text-sm leading-6 text-slate-300">
              <TrendingUp className="h-4 w-4 text-sky-300" />
              {activeDataset?.description ?? "Data appears once the estimator resolves a climate profile."}
            </CardDescription>
          </div>

          <motion.div
            key={selectedRange}
            className="flex h-32 w-full items-end justify-between gap-1.5 sm:h-40 sm:gap-2.5"
            variants={chartVariants}
            initial="hidden"
            animate="visible"
            aria-label={`${title} chart`}
          >
            {(activeDataset?.data ?? []).map((item) => (
              <div
                key={`${selectedRange}-${item.label}`}
                className="flex h-full w-full flex-col items-center justify-end gap-3"
                role="presentation"
              >
                <motion.div
                  className="w-full rounded-[12px] bg-[linear-gradient(180deg,rgba(125,211,252,0.95),rgba(37,99,235,0.92))] shadow-[0_16px_32px_-20px_rgba(96,165,250,0.8)] sm:rounded-[16px]"
                  style={{
                    height: `${maxValue > 0 ? (item.value / maxValue) * 100 : 0}%`,
                  }}
                  variants={barVariants}
                  aria-label={`${item.label}: ${item.value}`}
                />
                <span className="text-[11px] font-medium text-slate-400 sm:text-xs">{item.label}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </CardContent>
    </Card>
  )
}
