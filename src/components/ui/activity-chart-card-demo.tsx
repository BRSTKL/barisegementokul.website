import { ActivityChartCard } from "@/components/ui/activity-chart-card"

const demoDatasets = {
  Production: {
    totalValue: "12.4 MWh",
    description: "Higher output appears from late spring through midsummer for this sample site.",
    data: [
      { label: "Jan", value: 420 },
      { label: "Feb", value: 510 },
      { label: "Mar", value: 760 },
      { label: "Apr", value: 980 },
      { label: "May", value: 1170 },
      { label: "Jun", value: 1210 },
      { label: "Jul", value: 1185 },
      { label: "Aug", value: 1090 },
      { label: "Sep", value: 890 },
      { label: "Oct", value: 690 },
      { label: "Nov", value: 470 },
      { label: "Dec", value: 360 },
    ],
  },
  Irradiance: {
    totalValue: "1,340 kWh/m2",
    description: "The same interface can also show the irradiance baseline that drives yield estimates.",
    data: [
      { label: "Jan", value: 28 },
      { label: "Feb", value: 44 },
      { label: "Mar", value: 83 },
      { label: "Apr", value: 112 },
      { label: "May", value: 138 },
      { label: "Jun", value: 151 },
      { label: "Jul", value: 147 },
      { label: "Aug", value: 130 },
      { label: "Sep", value: 92 },
      { label: "Oct", value: 64 },
      { label: "Nov", value: 35 },
      { label: "Dec", value: 24 },
    ],
  },
}

export default function ActivityChartCardDemo() {
  return (
    <div className="flex min-h-[400px] w-full items-center justify-center bg-background p-4">
      <ActivityChartCard title="Monthly output" datasets={demoDatasets} className="max-w-3xl" />
    </div>
  )
}
