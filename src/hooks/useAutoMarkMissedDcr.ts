import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { abortSignalTimeout } from '@/lib/asyncTimeout'

/** Runs once per session: auto-marks missed DCRs (outside 2-day window) as leave without pay. */
export function useAutoMarkMissedDcrLeave(mrId: string) {
  const qc = useQueryClient()
  const ranRef = useRef(false)

  useEffect(() => {
    if (!mrId || !supabase || ranRef.current) return
    const client = supabase

    const timer = window.setTimeout(() => {
      if (ranRef.current) return
      ranRef.current = true

      void client
        .rpc('auto_mark_missed_dcr_leave_without_pay', { p_mr_id: mrId })
        .abortSignal(abortSignalTimeout(15_000))
        .then(({ data, error }) => {
          if (error) {
            ranRef.current = false
            return
          }
          const marked = (data as { marked_count?: number } | null)?.marked_count ?? 0
          if (marked > 0) {
            void qc.invalidateQueries({ queryKey: ['mr-reports'] })
            void qc.invalidateQueries({ queryKey: ['allowed-report-dates'] })
          }
        })
        .catch(() => {
          ranRef.current = false
        })
    }, 20_000)

    return () => window.clearTimeout(timer)
  }, [mrId, qc])
}
