import type { UserRole } from '@/types/database.types'

/** Warm the role dashboard chunk after login for faster first paint. */
export function prefetchRoleDashboard(role: UserRole): void {
  if (role === 'mr') void import('@/pages/mr/Dashboard')
  else if (role === 'manager') {
    void import('@/pages/manager/Dashboard')
    void import('@/pages/manager/TeamHub')
    void import('@/pages/manager/Analytics')
    void import('@/pages/manager/Reports')
  } else void import('@/pages/admin/Dashboard')
}

/** Prefetch common manager tabs when dashboard mounts. */
export function prefetchManagerTabs(): void {
  void import('@/pages/manager/TeamHub')
  void import('@/pages/manager/Analytics')
  void import('@/pages/manager/Reports')
  void import('@/pages/profile/Profile')
}
