import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { sleep } from '@/lib/asyncTimeout'
import { invalidateDashboardQueriesForTables } from '@/lib/invalidateDashboardQueries'

const WATCH_TABLES = [
  'daily_reports',
  'expense_reports',
  'leave_requests',
  'tour_programs',
  'report_unlock_requests',
  'block_complaints',
  'birthday_wishes',
  'user_notifications',
  'doctor_add_requests',
  'doctor_deletion_requests',
  'stockist_meets',
] as const

const REALTIME_DEBOUNCE_MS = 350

/**
 * Supabase Realtime: invalidate only query caches related to changed tables (debounced).
 */
export function useSupabaseRealtimeDashboard(enabled: boolean) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!enabled || !supabase) return
    const client = supabase

    let cancelled = false
    let channel: ReturnType<typeof client.channel> | null = null
    const pendingTables = new Set<string>()
    let debounceTimer: ReturnType<typeof setTimeout> | null = null

    const flushInvalidation = () => {
      if (pendingTables.size === 0) return
      const tables = [...pendingTables]
      pendingTables.clear()
      invalidateDashboardQueriesForTables(queryClient, tables)
    }

    const scheduleInvalidate = (table: string) => {
      pendingTables.add(table)
      if (debounceTimer) clearTimeout(debounceTimer)
      debounceTimer = setTimeout(flushInvalidation, REALTIME_DEBOUNCE_MS)
    }

    void (async () => {
      await sleep(12_000)
      if (cancelled) return

      const { data: { session } } = await client.auth.getSession()
      if (cancelled || !session) return

      channel = client.channel('maktree-dashboard-realtime')

      for (const table of WATCH_TABLES) {
        channel.on(
          'postgres_changes',
          { event: '*', schema: 'public', table },
          () => scheduleInvalidate(table),
        )
      }

      void channel.subscribe()
    })()

    return () => {
      cancelled = true
      if (debounceTimer) clearTimeout(debounceTimer)
      pendingTables.clear()
      if (channel) void client.removeChannel(channel)
    }
  }, [enabled, queryClient])
}
