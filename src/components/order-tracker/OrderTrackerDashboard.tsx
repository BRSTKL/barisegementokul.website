import { useMemo, useState } from "react"

import {
  MOCK_ORDERS,
  type Order,
  calculateKPIs,
  filterOrders,
} from "../../data/orderTrackerData"
import { AlertPanel } from "./AlertPanel"
import { Charts } from "./Charts"
import { FilterBar } from "./FilterBar"
import { KPICards } from "./KPICards"
import { OrderDetailModal } from "./OrderDetailModal"
import { OrderTable } from "./OrderTable"

type FilterState = {
  status: string
  region: string
  priority: string
  search: string
}

export function OrderTrackerDashboard() {
  const [filters, setFilters] = useState<FilterState>({
    status: "",
    region: "",
    priority: "",
    search: "",
  })
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  const filteredOrders = useMemo(() => filterOrders(MOCK_ORDERS, filters), [filters])
  const kpis = useMemo(() => calculateKPIs(MOCK_ORDERS), [])

  return (
    <>
      <section className="rounded-xl border bg-card text-card-foreground shadow-sm">
        <header className="rounded-t-xl border-b border-border bg-slate-900 px-6 py-5 text-slate-50">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="font-mono text-xl font-bold text-white">
                Smart Order Tracker
              </h2>
              <p className="hidden mt-1 text-sm text-slate-300">
                Siemens Energy · Gas Services
              </p>
              <p className="mt-1 text-sm text-slate-300">
                Siemens Energy {"\u00b7"} Gas Services
              </p>
            </div>
            <div className="inline-flex items-center gap-2 self-start rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-emerald-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Demo
            </div>
          </div>
        </header>

        <div className="space-y-6 p-6">
          <KPICards kpis={kpis} />

          <FilterBar
            filters={filters}
            onFilterChange={setFilters}
            totalCount={MOCK_ORDERS.length}
            filteredCount={filteredOrders.length}
            orders={MOCK_ORDERS}
          />

          <div className="grid gap-6 xl:grid-cols-3">
            <div className="xl:col-span-2">
              <OrderTable
                orders={filteredOrders}
                onOrderClick={setSelectedOrder}
              />
            </div>
            <div className="xl:col-span-1">
              <AlertPanel orders={MOCK_ORDERS} />
            </div>
          </div>

          <Charts orders={MOCK_ORDERS} />
        </div>

        <footer className="border-t border-border px-6 py-4 text-center text-xs text-transparent">
          Concept project · Siemens Energy Order Management · 2024
          <span className="text-muted-foreground">
            Concept project {"\u00b7"} Siemens Energy Order Management {"\u00b7"} 2024
          </span>
        </footer>
      </section>

      {selectedOrder ? (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      ) : null}
    </>
  )
}
