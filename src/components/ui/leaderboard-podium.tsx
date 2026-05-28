import { cn } from '@/lib/utils'
import { Trophy } from 'lucide-react'

export type LeaderboardRanking = {
  userId: string
  userName: string
  rank: 1 | 2 | 3
  value: number
}

const podiumOrder: (1 | 2 | 3)[] = [2, 1, 3]

const rankStyles: Record<
  1 | 2 | 3,
  { bar: string; badge: string; height: string }
> = {
  1: { bar: 'bg-primary', badge: 'bg-primary text-primary-foreground', height: 'h-28' },
  2: { bar: 'bg-sky-500', badge: 'bg-sky-500 text-white', height: 'h-20' },
  3: { bar: 'bg-violet-500', badge: 'bg-violet-500 text-white', height: 'h-16' },
}

function initials(name: string) {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

type Props = {
  rankings: LeaderboardRanking[]
  className?: string
  valueLabel?: string
}

export function LeaderboardPodium({ rankings, className, valueLabel = 'doctors' }: Props) {
  if (rankings.length === 0) return null

  const byRank = new Map(rankings.map(r => [r.rank, r]))

  return (
    <div className={cn('flex items-end justify-center gap-3 sm:gap-5 px-2', className)}>
      {podiumOrder.map(rank => {
        const entry = byRank.get(rank)
        if (!entry) {
          return <div key={rank} className="w-[30%] max-w-[100px]" />
        }
        const style = rankStyles[rank]
        return (
          <div
            key={entry.userId}
            className="flex flex-col items-center w-[30%] max-w-[110px]"
          >
            <div
              className={cn(
                'mb-2 flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold ring-2 ring-background shadow-sm',
                style.badge,
              )}
            >
              {rank === 1 ? <Trophy className="h-5 w-5" /> : initials(entry.userName)}
            </div>
            <p className="text-xs font-semibold text-foreground text-center line-clamp-2 min-h-[2rem]">
              {entry.userName}
            </p>
            <p className="text-[10px] text-muted-foreground tabular-nums mb-2">
              {entry.value} {valueLabel}
            </p>
            <div
              className={cn(
                'w-full rounded-t-xl flex items-end justify-center pb-2',
                style.bar,
                style.height,
              )}
            >
              <span className="text-lg font-bold text-white/95">#{rank}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
