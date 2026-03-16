import { memo, useMemo } from "react"
import {
  Bar,
  BarChart,
  Cell,
  Label,
  LabelList,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Order } from "../../data/orderTrackerData"

interface ChartsProps {
  orders: Order[]
}

const PRIMARY_BAR_FILL = "hsl(var(--primary))"

const statusColors: Record<Order["status"], string> = {
  Delivered: "#22C55E",
  "In Transit": "#3B82F6",
  "In Production": "#A855F7",
  "At Customs": "#F59E0B",
  Delayed: "#EF4444",
  Received: "#94A3B8",
}

const statusOrder: Order["status"][] = [
  "In Transit",
  "In Production",
  "At Customs",
  "Delayed",
  "Received",
  "Delivered",
]

const axisStyle = {
  fontSize: 12,
  fill: "hsl(var(--muted-foreground))",
}

const labelValueStyle = {
  fill: "hsl(var(--foreground))",
  fontSize: 12,
  fontWeight: 600,
}

const legendStyle = {
  fontSize: "12px",
  color: "hsl(var(--muted-foreground))",
  paddingTop: "12px",
}

const centerLabel = ({
  viewBox,
  value,
}: {
  viewBox?: unknown
  value: number
}) => {
  if (
    !viewBox ||
    typeof viewBox !== "object" ||
    !("cx" in viewBox) ||
    !("cy" in viewBox) ||
    typeof viewBox.cx !== "number" ||
    typeof viewBox.cy !== "number"
  ) {
    return null
  }

  return (
    <g>
      <text x={viewBox.cx} y={viewBox.cy - 4} textAnchor="middle" fill="hsl(var(--foreground))" fontSize="20" fontWeight="700">
        {value}
      </text>
      <text x={viewBox.cx} y={viewBox.cy + 16} textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize="11" fontWeight="500">
        Active
      </text>
    </g>
  )
}

export const Charts = memo(function Charts({ orders }: ChartsProps) {
  const activeOrders = useMemo(() => orders.filter(order => !order.actualDelivery), [orders])

  const ordersByRegion = useMemo(() => {
    const counts = activeOrders.reduce<Record<string, number>>((accumulator, order) => {
      accumulator[order.region] = (accumulator[order.region] ?? 0) + 1
      return accumulator
    }, {})

    return Object.entries(counts)
      .map(([region, count]) => ({ region, count }))
      .sort((left, right) => right.count - left.count || left.region.localeCompare(right.region))
  }, [activeOrders])

  const statusDistribution = useMemo(() => {
    const counts = activeOrders.reduce<Record<string, number>>((accumulator, order) => {
      accumulator[order.status] = (accumulator[order.status] ?? 0) + 1
      return accumulator
    }, {})

    return statusOrder
      .filter(status => (counts[status] ?? 0) > 0)
      .map(status => ({
        name: status,
        value: counts[status] ?? 0,
        color: statusColors[status],
      }))
  }, [activeOrders])

  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      <Card className="flex-1 bg-card/60 backdrop-blur supports-[backdrop-filter]:bg-card/50">
        <CardHeader className="pb-3">
          <div className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Orders by Region
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="h-60 md:h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={ordersByRegion}
                layout="vertical"
                margin={{ top: 8, right: 24, left: 8, bottom: 4 }}
              >
                <XAxis
                  type="number"
                  allowDecimals={false}
                  axisLine={false}
                  tickLine={false}
                  tick={axisStyle}
                />
                <YAxis
                  type="category"
                  dataKey="region"
                  axisLine={false}
                  tickLine={false}
                  tick={axisStyle}
                  width={90}
                />
                <Bar dataKey="count" fill={PRIMARY_BAR_FILL} radius={[0, 8, 8, 0]}>
                  <LabelList dataKey="count" position="right" offset={8} style={labelValueStyle} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="flex-1 bg-card/60 backdrop-blur supports-[backdrop-filter]:bg-card/50">
        <CardHeader className="pb-3">
          <div className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Status Distribution
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="h-60 md:h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusDistribution}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={2}
                  stroke="transparent"
                >
                  {statusDistribution.map(entry => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                  <Label content={props => centerLabel({ viewBox: props.viewBox, value: activeOrders.length })} />
                </Pie>
                <Legend verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={legendStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
})

Charts.displayName = "Charts"
