import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { invalidateDashboardQueries } from '@/lib/invalidateDashboardQueries'

const WATCH_TABLES = [
  'daily_reports',
  'expense_reports',
  'leave_requests',
  'tour_programs',
  'report_unlock_requests',
  'block_complaints',
  'birthday_wishes',
] as const

/**
 * Supabase Realtime (free tier): invalidate dashboard queries when team data changes.
 */
export function useSupabaseRealtimeDashboard(enabled: boolean) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!enabled || !supabase) return

    let debounceTimer: ReturnType<typeof setTimeout> | null = null
    const scheduleInvalidate = () => {
      if (debounceTimer) clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => {
        invalidateDashboardQueries(queryClient)
      }, 400)
    }

    const channel = supabase.channel('maktree-dashboard-realtime')

    for (const table of WATCH_TABLES) {
      channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        scheduleInvalidate,
      )
    }

    void channel.subscribe()

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer)
      void supabase.removeChannel(channel)
    }
  }, [enabled, queryClient])
}
