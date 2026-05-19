import { useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useDashboardLiveRefresh } from '@/hooks/useDashboardLiveRefresh'
import { useSupabaseRealtimeDashboard } from '@/hooks/useSupabaseRealtimeDashboard'
import { invalidateDashboardQueries } from '@/lib/invalidateDashboardQueries'

/** Tab visibility + Supabase Realtime + manual refresh for dashboards. */
export function useDashboardRefresh(enabled: boolean) {
  const queryClient = useQueryClient()
  useDashboardLiveRefresh(enabled)
  useSupabaseRealtimeDashboard(enabled)

  const refresh = useCallback(async () => {
    invalidateDashboardQueries(queryClient)
    await queryClient.refetchQueries({ type: 'active' })
  }, [queryClient])

  return { refresh }
}
