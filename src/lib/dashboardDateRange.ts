import { todayInputDate, startOfMonthIstYmd, startOfWeekIstYmd, startOfYearIstYmd } from '@/lib/dateUtils'
import type { ManagerStatsFilter } from '@/hooks/useDashboardStats'

export function managerFilterDateRange(filter: ManagerStatsFilter): {
  from: string
  to: string
} {
  const to = todayInputDate()
  let from = to
  if (filter === 'This Week') from = startOfWeekIstYmd()
  else if (filter === 'This Month') from = startOfMonthIstYmd()
  else if (filter === 'This Year') from = startOfYearIstYmd()
  return { from, to }
}

export const MANAGER_FILTER_OPTIONS: { id: ManagerStatsFilter; label: string }[] = [
  { id: 'This Week', label: 'Week' },
  { id: 'This Month', label: 'Month' },
  { id: 'This Year', label: 'Year' },
]

/** Team rankings: week / month / year only */
export const TEAM_RANKING_FILTER_OPTIONS: { id: ManagerStatsFilter; label: string }[] = [
  { id: 'This Week', label: 'Week' },
  { id: 'This Month', label: 'Month' },
  { id: 'This Year', label: 'Year' },
]
