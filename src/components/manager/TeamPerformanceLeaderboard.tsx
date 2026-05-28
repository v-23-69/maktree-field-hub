import { useMemo } from 'react'
import { ActionToolbar } from '@/components/ui/action-toolbar'
import { LeaderboardCard } from '@/components/ui/leaderboard-card'
import { DashboardSection } from '@/components/dashboard/dashboard-shell'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import { buildMrLeaderboard } from '@/lib/buildMrLeaderboard'
import { TEAM_RANKING_FILTER_OPTIONS, managerFilterDateRange } from '@/lib/dashboardDateRange'
import { formatDisplayDate } from '@/lib/dateUtils'
import type { ManagerStatsFilter, ManagerTeamActivityData } from '@/hooks/useDashboardStats'

type Props = {
  managerId: string
  mrCount: number
  activeFilter: ManagerStatsFilter
  onFilterChange: (filter: ManagerStatsFilter) => void
  activity: ManagerTeamActivityData | undefined
  loading: boolean
}

export default function TeamPerformanceLeaderboard({
  managerId,
  mrCount,
  activeFilter,
  onFilterChange,
  activity,
  loading,
}: Props) {
  const leaderboard = useMemo(
    () => buildMrLeaderboard(activity, managerId),
    [activity, managerId],
  )

  const range = useMemo(() => managerFilterDateRange(activeFilter), [activeFilter])

  const rangeLabel = `${formatDisplayDate(range.from)} – ${formatDisplayDate(range.to)}`

  if (mrCount === 0) return null

  return (
    <DashboardSection
      title="MR performance"
      description={rangeLabel}
    >
      <ActionToolbar
        className="w-full"
        activeId={activeFilter}
        onActiveChange={id => onFilterChange(id as ManagerStatsFilter)}
        buttons={TEAM_RANKING_FILTER_OPTIONS.map(opt => ({
          id: opt.id,
          label: opt.label,
        }))}
      />
      {loading ? (
        <LoadingSpinner />
      ) : (
        <LeaderboardCard
          title="Rankings"
          showDateRange={false}
          fromDate={range.from}
          toDate={range.to}
          podiumRankings={leaderboard.podium}
          rankings={leaderboard.rankings.map(r => ({
            ...r,
            valueLabel: 'doctors',
          }))}
          valueLabel="doctors"
          className="border-0 shadow-none"
        />
      )}
    </DashboardSection>
  )
}
