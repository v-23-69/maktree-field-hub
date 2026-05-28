import { useId, useMemo } from 'react'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { ArrowDownRight, ArrowRight, ArrowUpRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { dashboardPanelClass } from '@/components/dashboard/dashboard-shell'
import { cn } from '@/lib/utils'
import type { ChartDataPoint } from '@/components/ui/activity-stats-card'

type Props = {
  title: string
  icon?: React.ReactNode
  mainValue: string
  changeValue: number
  changeDescription?: string
  chartData: ChartDataPoint[]
  className?: string
}

const chartConfig = {
  calls: { label: 'Field calls', color: 'hsl(var(--primary))' },
} satisfies ChartConfig

export default function TeamFieldCallsChart({
  title,
  icon,
  mainValue,
  changeValue,
  changeDescription = 'vs previous period',
  chartData,
  className,
}: Props) {
  const uid = useId().replace(/:/g, '')
  const gradientId = `calls-fill-${uid}`
  const shadowId = `calls-shadow-${uid}`
  const dotGridId = `calls-dots-${uid}`

  const rows = useMemo(
    () =>
      chartData.map(d => ({
        day: d.label,
        calls: d.currentValue,
      })),
    [chartData],
  )

  const peakDay = useMemo(() => {
    if (rows.length === 0) return null
    return rows.reduce((best, row) => (row.calls > best.calls ? row : best), rows[0])
  }, [rows])

  const ChangeIcon =
    changeValue > 0 ? ArrowUpRight : changeValue < 0 ? ArrowDownRight : ArrowRight
  const isPositive = changeValue > 0
  const isNegative = changeValue < 0

  if (rows.length === 0) return null

  return (
    <div className={cn(dashboardPanelClass('overflow-hidden'), className)}>
      <div className="p-4 md:p-5 border-b border-border/60">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {icon && (
              <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                {icon}
              </div>
            )}
            <div>
              <p className="text-sm font-semibold text-foreground">{title}</p>
              <p className="text-3xl font-bold tabular-nums tracking-tight mt-0.5">{mainValue}</p>
            </div>
          </div>
          <Badge
            variant="outline"
            className={cn(
              'text-xs font-semibold border-none gap-1 px-2.5 py-1',
              isPositive && 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
              isNegative && 'bg-red-500/10 text-red-700 dark:text-red-400',
              !isPositive && !isNegative && 'bg-muted text-muted-foreground',
            )}
          >
            <ChangeIcon className="h-3.5 w-3.5" />
            {changeValue > 0 ? '+' : ''}
            {changeValue}%
          </Badge>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
          <p className="text-xs text-muted-foreground">{changeDescription}</p>
          {peakDay && peakDay.calls > 0 && (
            <p className="text-xs text-muted-foreground">
              Peak{' '}
              <span className="font-semibold text-foreground tabular-nums">
                {peakDay.calls}
              </span>{' '}
              on {peakDay.day}
            </p>
          )}
        </div>
      </div>

      <div className="p-3 md:p-4 bg-gradient-to-b from-muted/15 to-card">
        <ChartContainer
          config={chartConfig}
          className="h-[220px] md:h-[250px] w-full aspect-auto [&_.recharts-curve.recharts-tooltip-cursor]:stroke-primary/30"
        >
          <AreaChart data={rows} margin={{ top: 12, right: 12, left: -6, bottom: 4 }}>
            <defs>
              <pattern id={dotGridId} x="0" y="0" width="18" height="18" patternUnits="userSpaceOnUse">
                <circle cx="1" cy="1" r="0.75" fill="hsl(var(--muted-foreground))" fillOpacity="0.12" />
              </pattern>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
              <filter id={shadowId} x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow
                  dx="0"
                  dy="4"
                  stdDeviation="6"
                  floodColor="hsl(var(--primary))"
                  floodOpacity="0.25"
                />
              </filter>
            </defs>

            <rect
              x="28"
              y="0"
              width="100%"
              height="88%"
              fill={`url(#${dotGridId})`}
              style={{ pointerEvents: 'none' }}
            />

            <CartesianGrid vertical={false} strokeDasharray="4 8" className="stroke-border/35" />
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              tickMargin={10}
              interval="preserveStartEnd"
            />
            <YAxis
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              width={32}
            />
            <ChartTooltip
              cursor={{ strokeDasharray: '4 4', stroke: 'hsl(var(--primary))', strokeOpacity: 0.4 }}
              content={<ChartTooltipContent indicator="line" />}
            />
            <Area
              type="monotone"
              dataKey="calls"
              stroke="hsl(var(--primary))"
              strokeWidth={2.5}
              fill={`url(#${gradientId})`}
              filter={`url(#${shadowId})`}
              dot={false}
              activeDot={{
                r: 6,
                fill: 'hsl(var(--primary))',
                stroke: 'hsl(var(--background))',
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ChartContainer>
      </div>
    </div>
  )
}
