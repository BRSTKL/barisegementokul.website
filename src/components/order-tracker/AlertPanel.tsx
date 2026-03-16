import { memo, useMemo } from "react"
import { AlertTriangle, CheckCircle2, Clock } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Order, getDaysUntilDelivery, isDelayed } from "../../data/orderTrackerData"

interface AlertPanelProps {
  orders: Order[]
}

type AlertSeverity = "critical" | "delayed" | "dueSoon"

interface OrderAlert {
  order: Order
  severity: AlertSeverity
  daysUntilDelivery: number
}

const statusBadgeClassNames: Record<Order["status"], string> = {
  Delivered: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  "In Transit": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  "At Customs": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  Delayed: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  "In Production": "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  Received: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
}

const severityStyles: Record<
  AlertSeverity,
  {
    container: string
    iconClassName: string
    metaClassName: string
  }
> = {
  critical: {
    container: "border-l-red-500 bg-red-50/80 dark:border-l-red-400 dark:bg-red-950/20",
    iconClassName: "text-red-500 dark:text-red-400",
    metaClassName: "text-red-600 dark:text-red-300",
  },
  delayed: {
    container: "border-l-red-500 bg-red-50/80 dark:border-l-red-400 dark:bg-red-950/20",
    iconClassName: "text-red-500 dark:text-red-400",
    metaClassName: "text-red-600 dark:text-red-300",
  },
  dueSoon: {
    container: "border-l-amber-500 bg-amber-50/80 dark:border-l-amber-400 dark:bg-amber-950/20",
    iconClassName: "text-amber-500 dark:text-amber-400",
    metaClassName: "text-amber-700 dark:text-amber-300",
  },
}

const formatEstimatedDate = (date: string) =>
  new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date))

const getDeliveryMeta = (alert: OrderAlert) => {
  if (alert.daysUntilDelivery < 0) {
    const overdueDays = Math.abs(alert.daysUntilDelivery)
    return `${overdueDays} ${overdueDays === 1 ? "day" : "days"} overdue`
  }

  if (alert.daysUntilDelivery === 0) {
    return "due today"
  }

  if (alert.daysUntilDelivery === 1) {
    return "due tomorrow"
  }

  if (alert.daysUntilDelivery <= 3) {
    return `due in ${alert.daysUntilDelivery} days`
  }

  return "priority escalation"
}

export const AlertPanel = memo(function AlertPanel({ orders }: AlertPanelProps) {
  const { alerts, totalAlerts } = useMemo(() => {
    const activeOrders = orders.filter(order => !order.actualDelivery)

    const criticalOrders: OrderAlert[] = activeOrders
      .filter(order => order.priority === "Critical")
      .map(order => ({
        order,
        severity: "critical" as const,
        daysUntilDelivery: getDaysUntilDelivery(order),
      }))
      .sort((left, right) => left.daysUntilDelivery - right.daysUntilDelivery)

    const excludedIds = new Set(criticalOrders.map(alert => alert.order.id))

    const delayedOrders: OrderAlert[] = activeOrders
      .filter(order => !excludedIds.has(order.id) && isDelayed(order))
      .map(order => ({
        order,
        severity: "delayed" as const,
        daysUntilDelivery: getDaysUntilDelivery(order),
      }))
      .sort((left, right) => left.daysUntilDelivery - right.daysUntilDelivery)

    delayedOrders.forEach(alert => excludedIds.add(alert.order.id))

    const dueSoonOrders: OrderAlert[] = activeOrders
      .filter(order => {
        if (excludedIds.has(order.id)) {
          return false
        }

        const daysUntilDelivery = getDaysUntilDelivery(order)
        return daysUntilDelivery >= 0 && daysUntilDelivery <= 3
      })
      .map(order => ({
        order,
        severity: "dueSoon" as const,
        daysUntilDelivery: getDaysUntilDelivery(order),
      }))
      .sort((left, right) => left.daysUntilDelivery - right.daysUntilDelivery)

    const combined = [...criticalOrders, ...delayedOrders, ...dueSoonOrders]

    return {
      alerts: combined.slice(0, 8),
      totalAlerts: combined.length,
    }
  }, [orders])

  return (
    <Card className="bg-card/60 backdrop-blur supports-[backdrop-filter]:bg-card/50">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="text-lg">Active Alerts</CardTitle>
          <div className="mt-1 text-sm text-muted-foreground">
            Prioritized operational exceptions across the active order queue.
          </div>
        </div>
        <Badge className="rounded-full bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-200">
          {totalAlerts}
        </Badge>
      </CardHeader>
      <CardContent className="pt-0">
        {alerts.length === 0 ? (
          <div className="flex min-h-40 items-center justify-center rounded-lg border border-dashed border-emerald-500/30 bg-emerald-50/60 px-6 py-10 text-center dark:border-emerald-500/20 dark:bg-emerald-950/10">
            <div className="flex flex-col items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-emerald-500 dark:text-emerald-400" />
              <div className="text-base font-medium text-foreground">All orders on track</div>
              <div className="max-w-sm text-sm text-muted-foreground">
                No critical, delayed, or due-soon orders need immediate attention.
              </div>
            </div>
          </div>
        ) : (
          <div className="max-h-[380px] space-y-3 overflow-y-auto pr-1">
            {alerts.map(alert => {
              const styles = severityStyles[alert.severity]
              const Icon = alert.severity === "dueSoon" ? Clock : AlertTriangle

              return (
                <div
                  key={`${alert.severity}-${alert.order.id}`}
                  className={`flex w-full items-start gap-3 rounded-lg border border-border/60 border-l-4 px-4 py-3 text-left shadow-sm transition-colors hover:bg-accent/40 ${styles.container}`}
                >
                  <Icon className={`mt-0.5 h-4 w-4 flex-shrink-0 ${styles.iconClassName}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="font-mono text-sm font-semibold text-foreground">
                        {alert.order.id}
                      </span>
                      <span className="truncate text-sm text-muted-foreground">
                        {alert.order.customer}
                      </span>
                    </div>
                    <div className="mt-1 truncate text-xs text-muted-foreground">
                      {alert.order.part} {"\u00b7"} Est. {formatEstimatedDate(alert.order.estimatedDelivery)}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge className={statusBadgeClassNames[alert.order.status]}>
                      {alert.order.status}
                    </Badge>
                    <div className={`text-right text-xs font-medium ${styles.metaClassName}`}>
                      {getDeliveryMeta(alert)}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
})

AlertPanel.displayName = "AlertPanel"
