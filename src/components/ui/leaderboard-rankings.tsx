import * as React from 'react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export type LeaderboardRankingItem = {
  userId: string
  rank: number
  userName: string
  byline?: string
  value: number
  valueLabel?: string
  displayed?: boolean
}

type Props = {
  rankings: LeaderboardRankingItem[]
  currentUserId?: string
  showPagination?: boolean
  defaultPageSize?: number
  className?: string
}

function initials(name: string) {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export function LeaderboardRankings({
  rankings,
  currentUserId,
  showPagination = false,
  defaultPageSize = 10,
  className,
}: Props) {
  const visible = rankings.filter(r => r.displayed !== false)
  const [page, setPage] = React.useState(0)
  const pageSize = defaultPageSize
  const pageCount = Math.max(1, Math.ceil(visible.length / pageSize))
  const safePage = Math.min(page, pageCount - 1)
  const slice = showPagination
    ? visible.slice(safePage * pageSize, safePage * pageSize + pageSize)
    : visible

  React.useEffect(() => {
    setPage(0)
  }, [rankings.length, defaultPageSize])

  if (visible.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-6">
        No activity in this period yet.
      </p>
    )
  }

  return (
    <div className={cn('space-y-2', className)}>
      <ul className="space-y-1.5">
        {slice.map(item => {
          const isYou = currentUserId === item.userId
          return (
            <li
              key={item.userId}
              className={cn(
                'flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors',
                isYou
                  ? 'border-primary/30 bg-primary/5'
                  : 'border-border/60 bg-muted/20',
              )}
            >
              <span className="w-6 text-center text-xs font-bold text-muted-foreground tabular-nums">
                {item.rank}
              </span>
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-[10px] bg-secondary">
                  {initials(item.userName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {item.userName}
                  {isYou && (
                    <span className="ml-1.5 text-[10px] font-semibold text-primary">(you)</span>
                  )}
                </p>
                {item.byline && (
                  <p className="text-[11px] text-muted-foreground truncate">{item.byline}</p>
                )}
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-semibold tabular-nums text-foreground">{item.value}</p>
                <p className="text-[10px] text-muted-foreground">{item.valueLabel ?? 'pts'}</p>
              </div>
            </li>
          )
        })}
      </ul>

      {showPagination && pageCount > 1 && (
        <div className="flex items-center justify-between pt-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 rounded-lg"
            disabled={safePage <= 0}
            onClick={() => setPage(p => Math.max(0, p - 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs text-muted-foreground tabular-nums">
            {safePage + 1} / {pageCount}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 rounded-lg"
            disabled={safePage >= pageCount - 1}
            onClick={() => setPage(p => Math.min(pageCount - 1, p + 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
