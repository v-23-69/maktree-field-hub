import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'

/** Refetch dashboard-related queries when the tab becomes visible again. */
export function useDashboardLiveRefresh(enabled: boolean) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!enabled) return

    const onVisible = () => {
      if (document.visibilityState !== 'visible') return
      void queryClient.invalidateQueries({ queryKey: ['allowed-report-dates'] })
      void queryClient.invalidateQueries({ queryKey: ['dcr-daily-status'] })
      void queryClient.invalidateQueries({ queryKey: ['tp-status'] })
      void queryClient.invalidateQueries({ queryKey: ['today-tp-plan'] })
      void queryClient.invalidateQueries({ queryKey: ['manager-unlock-requests'] })
      void queryClient.invalidateQueries({ queryKey: ['tp-deletion-requests-manager'] })
      void queryClient.invalidateQueries({ queryKey: ['manager-pending-tour-programs'] })
      void queryClient.invalidateQueries({ queryKey: ['manager-leaves'] })
      void queryClient.invalidateQueries({ queryKey: ['doctor-deletion-requests-mgr'] })
    }

    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [enabled, queryClient])
}
