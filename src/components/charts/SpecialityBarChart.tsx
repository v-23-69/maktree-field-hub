import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps,
} from 'recharts'
import type { SpecialityChartRow } from '@/components/charts/chartTypes'
import { barTooltipCursor } from '@/components/charts/analyticsChartTheme'

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#64748b']

function SpecialityTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null
  const visits = payload[0]?.value
  if (visits == null) return null

  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2.5 shadow-lg z-50 min-w-[128px] pointer-events-none">
      <p className="text-xs font-semibold text-popover-foreground leading-snug">{String(label ?? '')}</p>
      <p className="text-sm font-bold tabular-nums text-popover-foreground mt-1">
        {visits} {visits === 1 ? 'call' : 'calls'}
      </p>
    </div>
  )
}

export type SpecialityBarChartProps = {
  data: SpecialityChartRow[]
  heightPx?: number
}

export default function SpecialityBarChart({ data, heightPx = 240 }: SpecialityBarChartProps) {
  const chartHeight = Math.max(heightPx, data.length * 36 + 24)

  return (
    <div className="w-full" style={{ height: chartHeight }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 16, left: 4, bottom: 4 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" horizontal={false} />
          <XAxis
            type="number"
            allowDecimals={false}
            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
          />
          <YAxis
            type="category"
            dataKey="speciality"
            width={88}
            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
            tickFormatter={(v: string) => (v.length > 14 ? `${v.slice(0, 13)}…` : v)}
          />
          <Tooltip content={<SpecialityTooltip />} cursor={barTooltipCursor} />
          <Bar
            dataKey="visits"
            radius={[0, 4, 4, 0]}
            maxBarSize={22}
            activeBar={{ fillOpacity: 0.9, stroke: 'hsl(var(--foreground))', strokeWidth: 1 }}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
