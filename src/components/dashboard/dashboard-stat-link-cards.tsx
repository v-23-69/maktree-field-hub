import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { dashboardPanelClass } from '@/components/dashboard/dashboard-shell'

export type DashboardStatLinkItem = {
  name: string
  value: string | number
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
  href: string
  linkLabel?: string
}

type Props = {
  items: DashboardStatLinkItem[]
  className?: string
  columns?: 1 | 2 | 3 | 4
}

export default function DashboardStatLinkCards({
  items,
  className,
  columns = 3,
}: Props) {
  if (items.length === 0) return null

  const gridCols =
    columns === 1
      ? 'grid-cols-1'
      : columns === 2
        ? 'grid-cols-1 sm:grid-cols-2'
        : columns === 4
          ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
          : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'

  return (
    <dl
      className={cn(
        'grid gap-3 md:gap-4',
        gridCols,
        columns === 3 && 'max-md:!grid-cols-3 max-md:gap-2',
        className,
      )}
    >
      {items.map(item => (
        <Card key={item.name} className={dashboardPanelClass('overflow-hidden p-0 gap-0')}>
          <CardContent className="p-4 md:p-5 max-md:p-2.5 max-md:pb-2">
            <dd className="flex items-start justify-between gap-1 max-md:gap-0.5">
              <span className="truncate text-sm max-md:text-[9px] max-md:leading-tight max-md:font-medium text-muted-foreground">
                {item.name}
              </span>
              {item.change != null && (
                <span
                  className={cn(
                    'shrink-0 text-xs max-md:text-[8px] font-medium tabular-nums',
                    item.changeType === 'positive' && 'text-emerald-600',
                    item.changeType === 'negative' && 'text-red-600',
                    item.changeType === 'neutral' && 'text-muted-foreground',
                  )}
                >
                  {item.change}
                </span>
              )}
            </dd>
            <dd className="mt-1.5 max-md:mt-0.5 text-2xl md:text-3xl max-md:text-lg font-semibold tracking-tight text-foreground tabular-nums">
              {item.value}
            </dd>
          </CardContent>
          <CardFooter className="flex justify-end border-t border-border p-0 max-md:border-t-0">
            <Link
              to={item.href}
              className="w-full px-4 py-2.5 max-md:px-1.5 max-md:py-1.5 text-sm max-md:text-[8px] max-md:leading-tight font-medium text-primary hover:text-primary/90 hover:bg-muted/40 transition-colors text-right max-md:text-center"
            >
              <span className="max-md:hidden">{item.linkLabel ?? 'View more →'}</span>
              <ChevronRight className="hidden max-md:block h-5 w-5 mx-auto" aria-hidden />
            </Link>
          </CardFooter>
        </Card>
      ))}
    </dl>
  )
}
