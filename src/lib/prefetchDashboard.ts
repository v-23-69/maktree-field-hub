import type { UserRole } from '@/types/database.types'

/** Warm the role dashboard chunk after login for faster first paint. */
export function prefetchRoleDashboard(role: UserRole): void {
  if (role === 'mr') void import('@/pages/mr/Dashboard')
  else if (role === 'manager') void import('@/pages/manager/Dashboard')
  else void import('@/pages/admin/Dashboard')
}
