import { memo } from "react"
import { AlertCircle, Clock, Package, TrendingUp } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { calculateKPIs } from "../../data/orderTrackerData"

interface KPICardsProps {
  kpis: ReturnType<typeof calculateKPIs>
}

export const KPICards = memo(function KPICards({ kpis }: KPICardsProps) {
  const onTimeTone =
    kpis.onTimeRate >= 85
      ? "text-emerald-600 dark:text-emerald-300"
      : kpis.onTimeRate >= 70
        ? "text-amber-600 dark:text-amber-300"
        : "text-rose-600 dark:text-rose-300"
  const delayedTone =
    kpis.delayedCount > 0 ? "text-rose-600 dark:text-rose-300" : "text-emerald-600 dark:text-emerald-300"

  const cards = [
    {
      label: "Active Orders",
      value: String(kpis.totalActive),
      subtitle: `${kpis.criticalCount} critical in queue`,
      valueClassName: "text-sky-600 dark:text-sky-300",
      Icon: Package,
    },
    {
      label: "On-Time Rate",
      value: `${kpis.onTimeRate}%`,
      subtitle: "target: 85%",
      valueClassName: onTimeTone,
      Icon: TrendingUp,
    },
    {
      label: "Delayed",
      value: String(kpis.delayedCount),
      subtitle: kpis.delayedCount > 0 ? "requires escalation" : "no overdue shipments",
      valueClassName: delayedTone,
      Icon: AlertCircle,
    },
    {
      label: "Avg. Processing",
      value: `${kpis.avgProcessingDays} days`,
      subtitle: "delivered order baseline",
      valueClassName: "text-slate-700 dark:text-slate-300",
      Icon: Clock,
    },
  ] as const

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map(({ label, value, subtitle, valueClassName, Icon }) => (
        <Card key={label} className="bg-card/60 backdrop-blur supports-[backdrop-filter]:bg-card/50">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  {label}
                </div>
                <div className={`mt-3 text-2xl font-bold font-mono sm:text-3xl ${valueClassName}`}>{value}</div>
                <div className="mt-2 text-xs text-muted-foreground">{subtitle}</div>
              </div>
              <Icon className="h-[18px] w-[18px] flex-shrink-0 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
})

KPICards.displayName = "KPICards"
