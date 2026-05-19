import { useDashboardLiveRefresh } from '@/hooks/useDashboardLiveRefresh'
import { useSupabaseRealtimeDashboard } from '@/hooks/useSupabaseRealtimeDashboard'

/** Tab visibility + Supabase Realtime auto-refresh for dashboards. */
export function useDashboardRefresh(enabled: boolean) {
  useDashboardLiveRefresh(enabled)
  useSupabaseRealtimeDashboard(enabled)
}
