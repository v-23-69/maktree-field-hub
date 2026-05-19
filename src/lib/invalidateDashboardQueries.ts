import type { QueryClient } from '@tanstack/react-query'

const DASHBOARD_QUERY_PREFIXES = [
  'allowed-report-dates',
  'dcr-daily-status',
  'tp-status',
  'today-tp-plan',
  'mr-dashboard-stats',
  'manager-dashboard-stats',
  'dcr-monthly-summary',
  'doctor-alerts',
  'calls-speciality-analytics',
  'visit-frequency-progress',
  'manager-mr-today-report-status',
  'manager-mr-today-expense-status',
  'team-mrs-tp-month',
  'monthly-support-manager-team',
  'monthly-support-aggregate',
  'manager-pending-counts',
  'manager-unlock-requests',
  'tp-deletion-requests-manager',
  'manager-pending-tour-programs',
  'manager-leaves',
  'doctor-deletion-requests-mgr',
  'admin-recent-reports',
  'admin-paused-users',
  'admin-pending-complaints-count',
  'admin-dashboard-stats',
  'mr-leaves',
  'expense-report',
  'employees-birthday-today',
  'birthday-wishes-today',
] as const

/** Invalidate all dashboard-related React Query caches (after submit, realtime, or manual refresh). */
export function invalidateDashboardQueries(queryClient: QueryClient) {
  for (const key of DASHBOARD_QUERY_PREFIXES) {
    void queryClient.invalidateQueries({ queryKey: [key] })
  }
}
