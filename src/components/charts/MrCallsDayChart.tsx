import { useId, useMemo } from 'react'
import { Area, AreaChart, CartesianGrid, Tooltip, XAxis, YAxis } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { formatShortDateIst } from '@/lib/dateUtils'

type Point = { date: string; calls: number }

const chartConfig = {
  calls: { label: 'Field calls', color: 'hsl(var(--primary))' },
} satisfies ChartConfig

export default function MrCallsDayChart({ data }: { data: Point[] }) {
  const uid = useId().replace(/:/g, '')
  const gradientId = `mr-calls-fill-${uid}`

  const chartData = useMemo(
    () =>
      data.map(d => ({
        date: d.date,
        calls: d.calls,
        label: formatShortDateIst(d.date),
      })),
    [data],
  )

  if (chartData.length === 0) return null

  return (
    <ChartContainer config={chartConfig} className="h-[220px] w-full">
      <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/40" />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tick={{ fontSize: 10 }}
          interval="preserveStartEnd"
        />
        <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} tick={{ fontSize: 10 }} />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={(_, payload) => {
                const row = payload?.[0]?.payload as { date?: string } | undefined
                return row?.date ? formatShortDateIst(row.date) : ''
              }}
            />
          }
        />
        <Area
          type="monotone"
          dataKey="calls"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          fill={`url(#${gradientId})`}
          dot={{ r: 3, fill: 'hsl(var(--primary))', strokeWidth: 0 }}
          activeDot={{ r: 5 }}
        />
      </AreaChart>
    </ChartContainer>
  )
}
