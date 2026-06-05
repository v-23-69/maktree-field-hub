/** Hash-router paths for notification deep links (no leading #). */
export const NOTIFICATION_ROUTES = {
  mrDcrNew: '/mr/report/new',
  mrDoctors: '/mr/master-list',
  mrHistory: '/mr/report/history',
  managerRequests: '/manager/requests',
  managerLeaves: '/manager/leaves',
  managerReports: '/manager/reports',
  profile: '/profile',
} as const

export function normalizeNotificationUrl(url: string | null | undefined): string {
  const raw = (url ?? '/').trim()
  if (!raw || raw === '/') return '/'
  if (raw.startsWith('#')) return raw.slice(1) || '/'
  if (raw.startsWith('/')) return raw
  return `/${raw}`
}
