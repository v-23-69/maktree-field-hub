import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { ArrowDownRight, ArrowRight, ArrowUpRight } from 'lucide-react'
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
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
  current: { label: 'Current', color: 'hsl(var(--chart-1))' },
  previous: { label: 'Previous', color: 'hsl(var(--chart-3))' },
} satisfies ChartConfig

export default function PeriodComparisonBarChart({
  title,
  icon,
  mainValue,
  changeValue,
  changeDescription = 'vs previous period',
  chartData,
  className,
}: Props) {
  const rows = useMemo(
    () =>
      chartData.map(d => ({
        label: d.label,
        current: d.currentValue,
        previous: d.previousValue,
      })),
    [chartData],
  )

  const ChangeIcon =
    changeValue > 0 ? ArrowUpRight : changeValue < 0 ? ArrowDownRight : ArrowRight
  const changeColor =
    changeValue > 0
      ? 'text-emerald-600'
      : changeValue < 0
        ? 'text-red-600'
        : 'text-muted-foreground'

  if (rows.length === 0) return null

  return (
    <div className={cn(dashboardPanelClass('p-4 space-y-3'), className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          {icon && <span className="text-primary shrink-0">{icon}</span>}
          <div>
            <p className="text-sm font-semibold text-foreground">{title}</p>
            <p className="text-2xl font-bold tabular-nums mt-0.5">{mainValue}</p>
          </div>
        </div>
        <div className={cn('flex items-center gap-1 text-sm font-semibold shrink-0', changeColor)}>
          <ChangeIcon className="h-4 w-4" />
          <span>{changeValue > 0 ? '+' : ''}{changeValue}%</span>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">{changeDescription}</p>
      <ChartContainer config={chartConfig} className="h-[200px] w-full">
        <BarChart data={rows} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/50" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 10 }} width={28} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
          <Bar dataKey="current" fill="var(--color-current)" radius={[4, 4, 0, 0]} maxBarSize={28} />
          <Bar dataKey="previous" fill="var(--color-previous)" radius={[4, 4, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ChartContainer>
    </div>
  )
}
