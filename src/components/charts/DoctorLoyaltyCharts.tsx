import { useMemo } from 'react'
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

export type DoctorLoyaltyRow = {
  doctor_name: string
  product_name: string
  area: string
  months_written: number
  total_qty: number
}

type Props = {
  rows: DoctorLoyaltyRow[]
}

export default function DoctorLoyaltyCharts({ rows }: Props) {
  const productSlices = useMemo(() => {
    const m = new Map<string, number>()
    for (const r of rows) {
      const key = r.product_name || 'Product'
      m.set(key, (m.get(key) ?? 0) + r.total_qty)
    }
    return Array.from(m.entries())
      .map(([label, value]) => ({ key: label, label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6)
  }, [rows])

  const topDoctors = useMemo(
    () =>
      [...rows]
        .sort((a, b) => b.months_written - a.months_written)
        .slice(0, 12)
        .map(r => ({
          doctor: r.doctor_name,
          months: r.months_written,
          qty: r.total_qty,
        })),
    [rows],
  )

  const scatterTrend = useMemo(
    () =>
      [...rows]
        .filter(r => r.months_written > 0)
        .sort((a, b) => a.months_written - b.months_written)
        .slice(0, 40)
        .map(r => ({
          doctor: r.doctor_name.length > 18 ? `${r.doctor_name.slice(0, 16)}…` : r.doctor_name,
          months: r.months_written,
          qty: r.total_qty,
        })),
    [rows],
  )

  return (
    <div className="space-y-5">
      <div className="grid gap-4 lg:grid-cols-2">
        {productSlices.length > 0 && (
          <div className="rounded-xl border border-border/80 bg-card p-4 shadow-sm">
            <AnalyticsDonutPie title="Quantity by product" data={productSlices} valueLabel="Qty" />
          </div>
        )}

        {topDoctors.length > 0 && (
          <div className="rounded-xl border border-border/80 bg-card p-4 shadow-sm">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Top doctors (months written)
            </p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topDoctors} layout="vertical" margin={{ left: 0, right: 12 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="doctor" type="category" tick={{ fontSize: 9 }} width={100} />
                  <Tooltip {...analyticsTooltipContent} cursor={barTooltipCursor} />
                  <Bar dataKey="months" name="Months" fill="hsl(150, 62%, 36%)" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {scatterTrend.length > 0 && (
        <div className="rounded-xl border border-border/80 bg-card p-4 shadow-sm">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Loyalty depth (months vs quantity)
          </p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={scatterTrend} margin={{ left: 8, right: 12, top: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="months" name="Months" tick={{ fontSize: 11 }} />
                <YAxis dataKey="qty" name="Qty" tick={{ fontSize: 11 }} width={40} />
                <Tooltip
                  {...analyticsTooltipContent}
                  labelFormatter={(_, payload) => {
                    const p = payload?.[0]?.payload as { doctor?: string } | undefined
                    return p?.doctor ?? 'Doctor'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="qty"
                  name="Quantity"
                  stroke="hsl(262, 83%, 58%)"
                  strokeWidth={2}
                  dot={{ r: 3, fill: 'hsl(262, 83%, 58%)' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  )
}
