import {
  RadialBar,
  RadialBarChart,
  PolarAngleAxis,
} from 'recharts'
import { Card, CardContent } from '@/components/ui/card'
import { ChartContainer, type ChartConfig } from '@/components/ui/chart'
import { cn } from '@/lib/utils'

export type DashboardRadialMetricItem = {
  name: string
  percent: number
  detail: string
  colorKey: string
}

const chartConfig = {
  metric: {
    label: 'Progress',
    color: 'hsl(var(--primary))',
  },
  background: {
    label: 'Background',
    theme: {
      light: 'hsl(220 14% 92%)',
      dark: 'hsl(220 14% 22%)',
    },
  },
  a: { label: 'A', color: 'hsl(221 83% 53%)' },
  b: { label: 'B', color: 'hsl(215 16% 47%)' },
  c: { label: 'C', color: 'hsl(199 89% 48%)' },
  d: { label: 'D', color: 'hsl(262 83% 58%)' },
} satisfies ChartConfig

const colorByKey: Record<string, string> = {
  a: 'var(--color-a)',
  b: 'var(--color-b)',
  c: 'var(--color-c)',
  d: 'var(--color-d)',
  metric: 'var(--color-metric)',
}

type Props = {
  title?: string
  description?: string
  items: DashboardRadialMetricItem[]
  className?: string
}

export default function DashboardRadialMetrics({
  title,
  description,
  items,
  className,
}: Props) {
  if (items.length === 0) return null

  return (
    <section className={cn('space-y-3', className)}>
      {(title || description) && (
        <div>
          {title && <h2 className="text-sm font-semibold text-foreground tracking-tight">{title}</h2>}
          {description && (
            <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">{description}</p>
          )}
        </div>
      )}
      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {items.map(item => {
          const pct = Math.max(0, Math.min(100, Math.round(item.percent)))
          const fill = colorByKey[item.colorKey] ?? 'var(--color-metric)'
          const chartRow = [{ name: item.name, capacity: pct, fill }]

          return (
            <Card key={item.name} className="border-border/80 shadow-sm">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="relative flex h-[72px] w-[72px] shrink-0 items-center justify-center">
                  <ChartContainer config={chartConfig} className="h-[72px] w-[72px]">
                    <RadialBarChart
                      data={chartRow}
                      innerRadius={26}
                      outerRadius={34}
                      barSize={7}
                      startAngle={90}
                      endAngle={-270}
                    >
                      <PolarAngleAxis type="number" domain={[0, 100]} tick={false} axisLine={false} />
                      <RadialBar
                        dataKey="capacity"
                        background={{ fill: 'var(--color-background)' }}
                        cornerRadius={8}
                        fill={fill}
                      />
                    </RadialBarChart>
                  </ChartContainer>
                  <span className="absolute text-sm font-semibold tabular-nums text-foreground">
                    {pct}%
                  </span>
                </div>
                <div className="min-w-0">
                  <dt className="text-sm font-medium text-foreground truncate">{item.name}</dt>
                  <dd className="text-xs text-muted-foreground mt-0.5">{item.detail}</dd>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </dl>
    </section>
  )
}
