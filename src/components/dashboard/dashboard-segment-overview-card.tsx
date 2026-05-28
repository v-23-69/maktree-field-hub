import { Link } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export type SegmentRow = {
  code: string
  label: string
  percent: number
  colorClass: string
}

type Props = {
  title: string
  subtitle?: string
  headline: string
  headlineDelta?: string
  deltaPositive?: boolean
  segments: SegmentRow[]
  actionLabel?: string
  actionHref?: string
  actionIcon?: LucideIcon
  onAction?: () => void
  className?: string
}

export default function DashboardSegmentOverviewCard({
  title,
  subtitle,
  headline,
  headlineDelta,
  deltaPositive = true,
  segments,
  actionLabel,
  actionHref,
  actionIcon: ActionIcon,
  onAction,
  className,
}: Props) {
  const actionButton =
    actionLabel && (actionHref || onAction) ? (
      actionHref ? (
        <Button asChild variant="outline" size="sm" className="shrink-0 rounded-lg">
          <Link to={actionHref}>
            {ActionIcon && <ActionIcon className="h-4 w-4" />}
            {actionLabel}
          </Link>
        </Button>
      ) : (
        <Button type="button" variant="outline" size="sm" className="shrink-0 rounded-lg" onClick={onAction}>
          {ActionIcon && <ActionIcon className="h-4 w-4" />}
          {actionLabel}
        </Button>
      )
    ) : null

  return (
    <Card className={cn('rounded-2xl border-border/80 shadow-sm overflow-hidden border-border/80', className)}>
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-2 pt-5 px-5">
        <div className="min-w-0">
          <CardTitle className="text-base font-semibold text-foreground">{title}</CardTitle>
          {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        </div>
        {actionButton}
      </CardHeader>
      <CardContent className="px-5 pb-5 pt-0">
        <div className="flex items-end gap-2 mb-4">
          <span className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground tabular-nums">
            {headline}
          </span>
          {headlineDelta != null && (
            <span
              className={cn(
                'text-sm font-medium mb-0.5',
                deltaPositive ? 'text-emerald-600' : 'text-red-600',
              )}
            >
              {headlineDelta}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 w-full mb-4">
          {segments.map(seg => (
            <div
              key={seg.code}
              className={cn('h-2 rounded-sm transition-all', seg.colorClass)}
              style={{ width: `${Math.max(seg.percent, 0)}%` }}
              title={`${seg.label} ${seg.percent}%`}
            />
          ))}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {segments.map(seg => (
            <div key={seg.code} className="min-w-0">
              <p className="text-xs text-muted-foreground font-medium truncate">{seg.label}</p>
              <p className="text-sm font-semibold text-foreground tabular-nums">{seg.percent}%</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
