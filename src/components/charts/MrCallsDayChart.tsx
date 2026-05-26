import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatShortDateIst } from '@/lib/dateUtils'

type Point = { date: string; calls: number }

export default function MrCallsDayChart({ data }: { data: Point[] }) {
  if (data.length === 0) return null

  const chartData = data.map(d => ({
    date: d.date,
    calls: d.calls,
    label: formatShortDateIst(d.date),
  }))

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={chartData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
        <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
        <YAxis allowDecimals={false} tick={{ fontSize: 10 }} width={28} />
        <Tooltip
          contentStyle={{
            borderRadius: 8,
            border: '1px solid hsl(var(--border))',
            background: 'hsl(var(--card))',
            fontSize: 12,
          }}
          labelFormatter={(_, items) => {
            const row = items?.[0]?.payload as { date?: string } | undefined
            return row?.date ? formatShortDateIst(row.date) : ''
          }}
        />
        <Bar dataKey="calls" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
