import { useId, useMemo } from 'react'
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

function DottedBackgroundPattern({ patternId }: { patternId: string }) {
  return (
    <pattern id={patternId} x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
      <circle className="text-muted/50" cx="2" cy="2" r="1" fill="currentColor" />
    </pattern>
  )
}

function HatchedBar(
  props: React.SVGProps<SVGRectElement> & { dataKey?: string; fill?: string },
) {
  const { fill, x, y, width, height, dataKey } = props
  const patternId = `hatched-${dataKey ?? 'bar'}`
  if (x == null || y == null || width == null || height == null) return null

  return (
    <>
      <defs>
        <pattern
          id={patternId}
          x="0"
          y="0"
          width="5"
          height="5"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(-45)"
        >
          <rect width="10" height="10" opacity={0.45} fill={fill} />
          <rect width="1" height="10" fill={fill} />
        </pattern>
      </defs>
      <rect x={x} y={y} width={width} height={height} rx={4} fill={`url(#${patternId})`} />
    </>
  )
}

export default function HatchedComparisonBarChart({
  title,
  icon,
  mainValue,
  changeValue,
  changeDescription = 'vs previous period',
  chartData,
  className,
}: Props) {
  const dotPatternId = useId().replace(/:/g, '')
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
          <span>
            {changeValue > 0 ? '+' : ''}
            {changeValue}%
          </span>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">{changeDescription}</p>
      <ChartContainer config={chartConfig} className="h-[210px] w-full aspect-auto">
        <BarChart data={rows} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <defs>
            <DottedBackgroundPattern patternId={dotPatternId} />
          </defs>
          <rect x="0" y="0" width="100%" height="88%" fill={`url(#${dotPatternId})`} />
          <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/40" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 10 }} width={28} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
          <Bar
            dataKey="current"
            fill="var(--color-current)"
            maxBarSize={26}
            shape={<HatchedBar dataKey="current" />}
          />
          <Bar
            dataKey="previous"
            fill="var(--color-previous)"
            maxBarSize={26}
            radius={[4, 4, 0, 0]}
            opacity={0.55}
          />
        </BarChart>
      </ChartContainer>
    </div>
  )
}
