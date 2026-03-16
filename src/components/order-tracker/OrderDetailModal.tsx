import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Order, getDaysUntilDelivery, isDelayed } from "../../data/orderTrackerData"

interface OrderDetailModalProps {
  order: Order
  onClose: () => void
}

const STEP_ORDER = [
  "Received",
  "In Production",
  "In Transit",
  "At Customs",
  "Delivered",
] as const

const STATUS_BADGE_CLASSNAMES: Record<Order["status"], string> = {
  Delivered: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  "In Transit": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  "At Customs": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  Delayed: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  "In Production": "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  Received: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
}

const PRIORITY_BADGE_CLASSNAMES: Record<Order["priority"], string> = {
  Critical: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-200",
  High: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-200",
  Medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-200",
  Low: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
}

const STATUS_TO_STEP_INDEX: Record<Exclude<Order["status"], "Delayed">, number> = {
  Received: 0,
  "In Production": 1,
  "In Transit": 2,
  "At Customs": 3,
  Delivered: 4,
}

export function OrderDetailModal({ order, onClose }: OrderDetailModalProps) {
  const delivered = Boolean(order.actualDelivery)
  const delayed = isDelayed(order) || order.status === "Delayed"
  const daysUntilDelivery = getDaysUntilDelivery(order)

  const currentStepIndex = delivered
    ? null
    : order.status === "Delayed"
      ? 4
      : STATUS_TO_STEP_INDEX[order.status]

  const completedStepIndex = delivered
    ? 4
    : order.status === "Delayed"
      ? 3
      : Math.max((currentStepIndex ?? 0) - 1, -1)

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg rounded-xl border bg-background p-0 shadow-xl">
        <DialogHeader className="border-b border-border px-6 py-5 pr-12">
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <DialogTitle className="font-mono text-xl font-bold text-foreground">
                {order.id}
              </DialogTitle>
              <div className="mt-2">
                <Badge className={STATUS_BADGE_CLASSNAMES[order.status]}>{order.status}</Badge>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 px-6 py-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <InfoItem label="Customer" value={order.customer} />
            <InfoItem label="Order Date" value={formatDate(order.orderDate)} />
            <InfoItem label="Part Name" value={order.part} />
            <InfoItem label="Estimated Delivery" value={formatDate(order.estimatedDelivery)} />
            <InfoItem label="Region" value={order.region} />
            <InfoItem
              label="Actual Delivery"
              value={order.actualDelivery ? formatDate(order.actualDelivery) : "Pending"}
              muted={!order.actualDelivery}
            />
            <div>
              <div className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Priority
              </div>
              <div className="mt-2">
                <Badge className={PRIORITY_BADGE_CLASSNAMES[order.priority]}>
                  {order.priority}
                </Badge>
              </div>
            </div>
            <InfoItem label="Value" value={formatCurrency(order.value)} />
          </div>

          <div className="space-y-4">
            <div className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Delivery Progress
            </div>
            <div className="grid grid-cols-5 gap-2">
              {STEP_ORDER.map((step, index) => {
                const isCompleted = index <= completedStepIndex
                const isCurrent = currentStepIndex === index
                const isFuture = !isCompleted && !isCurrent
                const delayedCurrent = delayed && isCurrent
                const connectorFilled = index < completedStepIndex

                return (
                  <div key={step} className="relative flex flex-col items-center text-center">
                    {index < STEP_ORDER.length - 1 ? (
                      <div
                        className={`absolute left-[calc(50%+0.9rem)] top-4 h-0.5 w-[calc(100%-1.8rem)] ${
                          connectorFilled ? "bg-sky-500" : "bg-border"
                        }`}
                      />
                    ) : null}
                    <div
                      className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 text-[11px] font-semibold ${
                        isCompleted
                          ? "border-sky-500 bg-sky-500 text-white"
                          : delayedCurrent
                            ? "border-red-500 bg-red-500 text-white ring-4 ring-red-500/20 animate-pulse"
                            : isCurrent
                              ? "border-sky-500 bg-sky-500 text-white ring-4 ring-sky-500/20 animate-pulse"
                              : "border-slate-300 bg-background text-slate-400 dark:border-slate-700 dark:text-slate-500"
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div
                      className={`mt-3 text-[11px] font-medium leading-tight ${
                        isFuture ? "text-muted-foreground" : "text-foreground"
                      }`}
                    >
                      {step}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="rounded-lg border bg-muted/20 px-4 py-4">
            <div className={`text-lg font-semibold ${getSummaryTone(order)}`}>
              {getSummaryText(order, daysUntilDelivery)}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function InfoItem({
  label,
  value,
  muted = false,
}: {
  label: string
  value: string
  muted?: boolean
}) {
  return (
    <div>
      <div className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <div className={`mt-2 text-sm font-medium ${muted ? "text-muted-foreground" : "text-foreground"}`}>
        {value}
      </div>
    </div>
  )
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value))
}

function formatCurrency(value: number) {
  return `\u20ac ${new Intl.NumberFormat("en-GB").format(value)}`
  return `€ ${new Intl.NumberFormat("en-GB").format(value)}`
}

function getSummaryText(order: Order, daysUntilDelivery: number) {
  if (order.actualDelivery) {
    const deliveredDelta = Math.round(
      (new Date(order.actualDelivery).getTime() - new Date(order.estimatedDelivery).getTime()) /
        (1000 * 60 * 60 * 24)
    )

    if (deliveredDelta <= 0) {
      return "Delivered on time"
    }

    return `Delivered ${deliveredDelta} days late`
  }

  if (order.status === "Delayed" || isDelayed(order)) {
    return `${Math.abs(daysUntilDelivery)} days overdue`
  }

  return `${daysUntilDelivery} days remaining`
}

function getSummaryTone(order: Order) {
  if (order.actualDelivery) {
    const deliveredDelta = Math.round(
      (new Date(order.actualDelivery).getTime() - new Date(order.estimatedDelivery).getTime()) /
        (1000 * 60 * 60 * 24)
    )

    return deliveredDelta <= 0 ? "text-emerald-600 dark:text-emerald-300" : "text-amber-600 dark:text-amber-300"
  }

  if (order.status === "Delayed" || isDelayed(order)) {
    return "text-red-600 dark:text-red-300"
  }

  return "text-emerald-600 dark:text-emerald-300"
}
