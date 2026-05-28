import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { analyticsTooltipContent, barTooltipCursor } from '@/components/charts/analyticsChartTheme'
import AnalyticsDonutPie from '@/components/charts/AnalyticsDonutPie'

type AreaRow = { area: string; qty: number }
type TrendRow = { month: string; label: string; qty: number }

type Props = {
  areaPerformance: AreaRow[]
  areaMonthlyTrend: TrendRow[]
}

export default function TerritoryPerformanceCharts({
  areaPerformance,
  areaMonthlyTrend,
}: Props) {
  const topAreas = areaPerformance.slice(0, 8)
  const donutData = topAreas.map(row => ({
    key: row.area,
    label: row.area,
    value: row.qty,
  }))

  return (
    <div className="space-y-5">
      {areaMonthlyTrend.length > 0 && (
        <div className="rounded-xl border border-border/80 bg-card p-4 shadow-sm">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Quantity trend by month
          </p>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={areaMonthlyTrend} margin={{ left: 4, right: 12, top: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} width={36} />
                <Tooltip {...analyticsTooltipContent} />
                <Line
                  type="monotone"
                  dataKey="qty"
                  name="Quantity"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: 'hsl(var(--primary))' }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {donutData.length > 0 && (
          <div className="rounded-xl border border-border/80 bg-card p-4 shadow-sm">
            <AnalyticsDonutPie title="Share by territory" data={donutData} valueLabel="Qty" />
          </div>
        )}

        {topAreas.length > 0 && (
          <div className="rounded-xl border border-border/80 bg-card p-4 shadow-sm">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Territory ranking
            </p>
            <div className="min-w-0 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topAreas} layout="vertical" margin={{ left: 0, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="area" type="category" tick={{ fontSize: 10 }} width={88} />
                  <Tooltip {...analyticsTooltipContent} cursor={barTooltipCursor} />
                  <Bar dataKey="qty" name="Quantity" fill="hsl(210, 90%, 45%)" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
