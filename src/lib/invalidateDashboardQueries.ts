import type { QueryClient } from '@tanstack/react-query'

/** Query prefixes invalidated when specific Postgres tables change (realtime). */
export const DASHBOARD_QUERY_PREFIXES_BY_TABLE = {
  daily_reports: [
    'allowed-report-dates',
    'dcr-daily-status',
    'mr-dashboard-stats',
    'manager-dashboard-stats',
    'dcr-monthly-summary',
    'doctor-alerts',
    'calls-speciality-analytics',
    'visit-frequency-progress',
    'manager-mr-today-report-status',
    'admin-recent-reports',
    'monthly-support-manager-team',
    'monthly-support-aggregate',
    'pending-dcr-imports',
    'dcr-import-detail',
  ],
  expense_reports: ['expense-report', 'manager-mr-today-expense-status'],
  leave_requests: ['mr-leaves', 'manager-leaves', 'manager-pending-counts'],
  tour_programs: [
    'tp-status',
    'today-tp-plan',
    'team-mrs-tp-month',
    'manager-pending-tour-programs',
    'manager-pending-counts',
    'tp-deletion-requests-manager',
  ],
  report_unlock_requests: ['manager-unlock-requests', 'manager-pending-counts'],
  block_complaints: ['admin-pending-complaints-count'],
  birthday_wishes: ['employees-birthday-today', 'birthday-wishes-today'],
} as const satisfies Record<string, readonly string[]>

/** Prefixes not tied to a single realtime table — refreshed on tab focus / full invalidation. */
const SHARED_DASHBOARD_QUERY_PREFIXES = [
  'admin-dashboard-stats',
  'admin-paused-users',
  'doctor-deletion-requests-mgr',
] as const

const ALL_TABLE_NAMES = Object.keys(
  DASHBOARD_QUERY_PREFIXES_BY_TABLE,
) as (keyof typeof DASHBOARD_QUERY_PREFIXES_BY_TABLE)[]

function invalidateQueryPrefixes(queryClient: QueryClient, prefixes: Iterable<string>) {
  const seen = new Set<string>()
  for (const key of prefixes) {
    if (seen.has(key)) continue
    seen.add(key)
    void queryClient.invalidateQueries({ queryKey: [key] })
  }
}

/** Invalidate dashboard caches affected by one or more table changes (deduped). */
export function invalidateDashboardQueriesForTables(
  queryClient: QueryClient,
  tables: Iterable<string>,
) {
  const prefixes: string[] = []
  for (const table of tables) {
    const keys =
      DASHBOARD_QUERY_PREFIXES_BY_TABLE[
        table as keyof typeof DASHBOARD_QUERY_PREFIXES_BY_TABLE
      ]
    if (keys) prefixes.push(...keys)
  }
  invalidateQueryPrefixes(queryClient, prefixes)
}

/**
 * Invalidate all dashboard-related React Query caches (mutations, tab focus, manual refresh).
 * Realtime uses {@link invalidateDashboardQueriesForTables} for narrower invalidation.
 */
export function invalidateDashboardQueries(queryClient: QueryClient) {
  invalidateDashboardQueriesForTables(queryClient, ALL_TABLE_NAMES)
  invalidateQueryPrefixes(queryClient, SHARED_DASHBOARD_QUERY_PREFIXES)
}
