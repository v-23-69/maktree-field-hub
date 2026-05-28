import { useMemo } from 'react'
import { LabelList, Pie, PieChart } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'

const SLICE_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
]

export type DonutSlice = { key: string; label: string; value: number }

type Props = {
  title?: string
  data: DonutSlice[]
  valueLabel?: string
  className?: string
  maxHeightPx?: number
}

export default function AnalyticsDonutPie({
  title,
  data,
  valueLabel = 'Total',
  className,
  maxHeightPx = 260,
}: Props) {
  const chartData = useMemo(
    () =>
      data.map((row, i) => ({
        key: row.key,
        label: row.label,
        value: row.value,
        fill: `var(--color-slice-${i})`,
      })),
    [data],
  )

  const chartConfig = useMemo(() => {
    const cfg: ChartConfig = {
      value: { label: valueLabel },
    }
    data.forEach((row, i) => {
      cfg[`slice-${i}`] = { label: row.label, color: SLICE_COLORS[i % SLICE_COLORS.length] }
    })
    return cfg
  }, [data, valueLabel])

  if (chartData.length === 0) return null

  return (
    <div className={className}>
      {title && (
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          {title}
        </p>
      )}
      <ChartContainer
        config={chartConfig}
        className="mx-auto aspect-square w-full [&_.recharts-text]:fill-foreground"
        style={{ maxHeight: maxHeightPx }}
      >
        <PieChart>
          <ChartTooltip content={<ChartTooltipContent nameKey="label" hideLabel />} />
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="label"
            innerRadius="42%"
            outerRadius="78%"
            cornerRadius={6}
            paddingAngle={3}
          >
            <LabelList
              dataKey="value"
              stroke="none"
              fontSize={11}
              fontWeight={500}
              fill="currentColor"
              formatter={(v: number) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v))}
            />
          </Pie>
        </PieChart>
      </ChartContainer>
    </div>
  )
}
