import * as React from 'react'
import { cn } from '@/lib/utils'
import {
  LeaderboardPodium,
  type LeaderboardRanking as LeaderboardPodiumRanking,
} from '@/components/ui/leaderboard-podium'
import {
  LeaderboardRankings,
  type LeaderboardRankingItem,
} from '@/components/ui/leaderboard-rankings'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { dashboardPanelClass } from '@/components/dashboard/dashboard-shell'

export interface LeaderboardRunOption {
  id: string
  label: string
}

export interface LeaderboardCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  fromDate: string | Date
  toDate: string | Date
  podiumRankings: LeaderboardPodiumRanking[]
  rankings: LeaderboardRankingItem[]
  currentUserId?: string
  runOptions?: LeaderboardRunOption[]
  selectedRunId?: string
  onRunChange?: (runId: string) => void
  valueLabel?: string
  /** When false, hides the date line under the title (parent section may already show the range). */
  showDateRange?: boolean
}

function formatRangeDate(date: string | Date) {
  const parsed = date instanceof Date ? date : new Date(`${String(date).slice(0, 10)}T12:00:00`)
  if (Number.isNaN(parsed.getTime())) return ''
  return parsed.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export const LeaderboardCard = React.forwardRef<HTMLDivElement, LeaderboardCardProps>(
  (
    {
      className,
      title = 'Leaderboard',
      fromDate,
      toDate,
      podiumRankings,
      rankings,
      currentUserId,
      runOptions,
      selectedRunId,
      onRunChange,
      valueLabel = 'doctors',
      showDateRange = true,
      ...props
    },
    ref,
  ) => {
    const fromLabel = formatRangeDate(fromDate)
    const toLabel = formatRangeDate(toDate)
    const resolvedRunId = selectedRunId ?? runOptions?.[0]?.id ?? ''

    return (
      <div ref={ref} className={cn(dashboardPanelClass('p-5 md:p-6'), className)} {...props}>
        <div className="mb-5 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="space-y-0.5">
            <h3 className="text-base font-semibold text-foreground">{title}</h3>
            {showDateRange && (
              <p className="text-muted-foreground text-xs">
                {fromLabel} – {toLabel}
              </p>
            )}
          </div>

          {runOptions && runOptions.length > 0 && onRunChange ? (
            <Select value={resolvedRunId} onValueChange={onRunChange}>
              <SelectTrigger className="w-full sm:w-[140px] h-9 rounded-lg text-xs">
                <SelectValue placeholder="Period" />
              </SelectTrigger>
              <SelectContent>
                {runOptions.map(option => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
        </div>

        <LeaderboardPodium rankings={podiumRankings} className="mb-5" valueLabel={valueLabel} />

        <LeaderboardRankings
          rankings={rankings}
          currentUserId={currentUserId}
          showPagination
          defaultPageSize={8}
        />
      </div>
    )
  },
)

LeaderboardCard.displayName = 'LeaderboardCard'
