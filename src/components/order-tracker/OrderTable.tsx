import React from "react"
import { ArrowUpDown } from "lucide-react"

import {
  type Order,
  getDaysUntilDelivery,
  isDelayed,
} from "../../data/orderTrackerData"

interface OrderTableProps {
  orders: Order[]
  onOrderClick: (order: Order) => void
}

type SortKey =
  | "id"
  | "customer"
  | "part"
  | "estimatedDelivery"
  | "daysLeft"
  | "status"
  | "priority"

type SortDirection = "asc" | "desc"

const PRIORITY_ORDER: Record<Order["priority"], number> = {
  Low: 0,
  Medium: 1,
  High: 2,
  Critical: 3,
}

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

export function OrderTable({ orders, onOrderClick }: OrderTableProps) {
  const [sortKey, setSortKey] = React.useState<SortKey>("daysLeft")
  const [sortDirection, setSortDirection] = React.useState<SortDirection>("asc")

  const sortedOrders = React.useMemo(() => {
    const nextOrders = [...orders]

    nextOrders.sort((left, right) => {
      const directionFactor = sortDirection === "asc" ? 1 : -1

      switch (sortKey) {
        case "id":
          return left.id.localeCompare(right.id) * directionFactor
        case "customer":
          return left.customer.localeCompare(right.customer) * directionFactor
        case "part":
          return left.part.localeCompare(right.part) * directionFactor
        case "estimatedDelivery":
          return (
            (new Date(left.estimatedDelivery).getTime() -
              new Date(right.estimatedDelivery).getTime()) *
            directionFactor
          )
        case "daysLeft":
          return (getDaysUntilDelivery(left) - getDaysUntilDelivery(right)) * directionFactor
        case "status":
          return left.status.localeCompare(right.status) * directionFactor
        case "priority":
          return (
            (PRIORITY_ORDER[left.priority] - PRIORITY_ORDER[right.priority]) * directionFactor
          )
        default:
          return 0
      }
    })

    return nextOrders
  }, [orders, sortDirection, sortKey])

  const handleSort = React.useCallback((nextSortKey: SortKey) => {
    setSortDirection((currentDirection) => {
      if (nextSortKey !== sortKey) {
        return "asc"
      }

      return currentDirection === "asc" ? "desc" : "asc"
    })
    setSortKey(nextSortKey)
  }, [sortKey])

  return (
    <div className="space-y-2">
      <div className="px-1 text-xs text-muted-foreground sm:hidden">
        Swipe horizontally to view the full order table.
      </div>
      <div className="overflow-x-auto">
        <div className="max-h-[420px] overflow-y-auto rounded-lg border bg-card text-card-foreground shadow-sm">
          <table className="w-full min-w-[840px] text-sm">
          <thead className="sticky top-0 z-10 bg-card">
            <tr className="border-b">
              <SortableHeader
                label="Order ID"
                sortKey="id"
                activeSortKey={sortKey}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
              <SortableHeader
                label="Customer"
                sortKey="customer"
                activeSortKey={sortKey}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
              <SortableHeader
                label="Part"
                sortKey="part"
                activeSortKey={sortKey}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
              <SortableHeader
                label="Est. Delivery"
                sortKey="estimatedDelivery"
                activeSortKey={sortKey}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
              <SortableHeader
                label="Days Left"
                sortKey="daysLeft"
                activeSortKey={sortKey}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
              <SortableHeader
                label="Status"
                sortKey="status"
                activeSortKey={sortKey}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
              <SortableHeader
                label="Priority"
                sortKey="priority"
                activeSortKey={sortKey}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
            </tr>
          </thead>
          <tbody>
            {sortedOrders.map((order) => {
              const daysLeft = getDaysUntilDelivery(order)
              const delayed = isDelayed(order)

              return (
                <tr
                  key={order.id}
                  className={`cursor-pointer border-b transition-colors hover:bg-muted/40 ${
                    delayed ? "bg-red-50 dark:bg-red-950/20" : ""
                  }`}
                  onClick={() => onOrderClick(order)}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {order.priority === "Critical" ? (
                        <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                      ) : null}
                      <span className="font-mono text-sm text-primary underline underline-offset-4">
                        {order.id}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">{order.customer}</td>
                  <td className="px-4 py-3">{order.part}</td>
                  <td className="px-4 py-3">{formatOrderDate(order.estimatedDelivery)}</td>
                  <td className={`px-4 py-3 font-medium ${daysLeftColorClassName(daysLeft)}`}>
                    {formatDaysLeft(daysLeft)}
                  </td>
                  <td className="px-4 py-3">
                    <BadgePill className={STATUS_BADGE_CLASSNAMES[order.status]}>
                      {order.status}
                    </BadgePill>
                  </td>
                  <td className="px-4 py-3">
                    <BadgePill className={PRIORITY_BADGE_CLASSNAMES[order.priority]}>
                      {order.priority}
                    </BadgePill>
                  </td>
                </tr>
              )
            })}
          </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function SortableHeader({
  label,
  sortKey,
  activeSortKey,
  sortDirection,
  onSort,
}: {
  label: string
  sortKey: SortKey
  activeSortKey: SortKey
  sortDirection: SortDirection
  onSort: (sortKey: SortKey) => void
}) {
  return (
    <th className="px-4 py-3 text-left">
      <button
        type="button"
        className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
        onClick={() => onSort(sortKey)}
      >
        <span>{label}</span>
        <ArrowUpDown className="h-3.5 w-3.5" />
        {activeSortKey === sortKey ? (
          <span className="text-[10px]">{sortDirection === "asc" ? "ASC" : "DESC"}</span>
        ) : null}
      </button>
    </th>
  )
}

function BadgePill({
  className,
  children,
}: {
  className: string
  children: React.ReactNode
}) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${className}`}>
      {children}
    </span>
  )
}

function formatOrderDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value))
}

function formatDaysLeft(daysLeft: number) {
  if (daysLeft < 0) {
    return `${Math.abs(daysLeft)}d overdue`
  }

  return `${daysLeft}d`
}

function daysLeftColorClassName(daysLeft: number) {
  if (daysLeft > 7) {
    return "text-emerald-600 dark:text-emerald-300"
  }

  if (daysLeft >= 1) {
    return "text-amber-600 dark:text-amber-300"
  }

  return "text-rose-600 dark:text-rose-300"
}
