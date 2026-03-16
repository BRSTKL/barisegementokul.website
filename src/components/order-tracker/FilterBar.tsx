import React from "react"
import { Search, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { type Order } from "../../data/orderTrackerData"

interface FilterBarProps {
  filters: { status: string; region: string; priority: string; search: string }
  onFilterChange: (filters: FilterBarProps["filters"]) => void
  totalCount: number
  filteredCount: number
  orders: Order[]
}

const STATUS_ORDER: Order["status"][] = [
  "Received",
  "In Production",
  "In Transit",
  "At Customs",
  "Delivered",
  "Delayed",
]

const PRIORITY_OPTIONS: Array<Order["priority"]> = ["Critical", "High", "Medium", "Low"]

export function FilterBar({
  filters,
  onFilterChange,
  totalCount,
  filteredCount,
  orders,
}: FilterBarProps) {
  const statusCounts = React.useMemo(() => {
    const counts = new Map<Order["status"], number>()

    orders.forEach((order) => {
      counts.set(order.status, (counts.get(order.status) ?? 0) + 1)
    })

    return counts
  }, [orders])

  const statusOptions = React.useMemo(
    () => STATUS_ORDER.filter((status) => statusCounts.has(status)),
    [statusCounts]
  )

  const regionOptions = React.useMemo(
    () => Array.from(new Set(orders.map((order) => order.region))).sort((left, right) => left.localeCompare(right)),
    [orders]
  )

  const hasActiveFilters = Boolean(
    filters.status || filters.region || filters.priority || filters.search
  )

  const baseControlClassName =
    "h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 placeholder:text-muted-foreground dark:bg-background dark:text-foreground"

  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-card/60 p-4 text-card-foreground shadow-sm supports-[backdrop-filter]:bg-card/50 lg:flex-row lg:items-center lg:justify-between">
      <div className="grid gap-3 lg:flex lg:flex-1 lg:flex-wrap lg:items-center">
        <div className="relative min-w-0 lg:w-[300px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={filters.search}
            onChange={(event) =>
              onFilterChange({
                ...filters,
                search: event.target.value,
              })
            }
            placeholder="Search orders, customers, parts..."
            className={`${baseControlClassName} pl-9 pr-9`}
          />
          {filters.search ? (
            <button
              type="button"
              onClick={() =>
                onFilterChange({
                  ...filters,
                  search: "",
                })
              }
              className="absolute right-2 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        <select
          value={filters.status}
          onChange={(event) =>
            onFilterChange({
              ...filters,
              status: event.target.value,
            })
          }
          className={`${baseControlClassName} lg:w-[190px]`}
        >
          <option value="">All Statuses</option>
          {statusOptions.map((status) => (
            <option key={status} value={status}>
              {status} ({statusCounts.get(status) ?? 0})
            </option>
          ))}
        </select>

        <select
          value={filters.region}
          onChange={(event) =>
            onFilterChange({
              ...filters,
              region: event.target.value,
            })
          }
          className={`${baseControlClassName} lg:w-[170px]`}
        >
          <option value="">All Regions</option>
          {regionOptions.map((region) => (
            <option key={region} value={region}>
              {region}
            </option>
          ))}
        </select>

        <select
          value={filters.priority}
          onChange={(event) =>
            onFilterChange({
              ...filters,
              priority: event.target.value,
            })
          }
          className={`${baseControlClassName} lg:w-[170px]`}
        >
          <option value="">All Priorities</option>
          {PRIORITY_OPTIONS.map((priority) => (
            <option key={priority} value={priority}>
              {priority}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="text-sm text-muted-foreground">
          Showing {filteredCount} of {totalCount} orders
        </div>
        {hasActiveFilters ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9"
            onClick={() =>
              onFilterChange({
                status: "",
                region: "",
                priority: "",
                search: "",
              })
            }
          >
            Clear filters
          </Button>
        ) : null}
      </div>
    </div>
  )
}
