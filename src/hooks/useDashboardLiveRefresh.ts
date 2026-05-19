import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { invalidateDashboardQueries } from '@/lib/invalidateDashboardQueries'

/** Refetch dashboard-related queries when the tab becomes visible again. */
export function useDashboardLiveRefresh(enabled: boolean) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!enabled) return

    const onVisible = () => {
      if (document.visibilityState !== 'visible') return
      invalidateDashboardQueries(queryClient)
    }

    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [enabled, queryClient])
}
