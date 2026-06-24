import { Cell, Pie, PieChart, Tooltip } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer } from "@/components/ui/chart"

const PALETTE = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "#a78bfa",
  "#34d399",
  "#fb923c",
  "#60a5fa",
  "#f472b6",
]

export type PieEntry = { name: string; value: number }

export default function PieChartCard({ title, data }: { title: string; data: PieEntry[] }) {
  const config = Object.fromEntries(data.map((d) => [d.name, { label: d.name }]))

  return (
    <Card>
      <CardHeader className="pt-0 pb-2">
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-3 pb-4">
        <ChartContainer config={config} className="h-[180px] w-full">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={false}>
              {data.map((_, i) => (
                <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value, name) => [value, name]} contentStyle={{ fontSize: 12 }} />
          </PieChart>
        </ChartContainer>
        <div className="flex flex-wrap justify-center gap-x-3 gap-y-1">
          {data.map((d, i) => (
            <span key={d.name} className="flex items-center gap-1 text-xs text-muted-foreground">
              <span className="inline-block size-2 rounded-full" style={{ background: PALETTE[i % PALETTE.length] }} />
              {d.name}
              <span className="font-medium text-foreground">{d.value}</span>
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
