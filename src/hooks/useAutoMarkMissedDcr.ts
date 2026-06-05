import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

/** Runs once per session: auto-marks missed DCRs (outside 2-day window) as leave without pay. */
export function useAutoMarkMissedDcrLeave(mrId: string) {
  const qc = useQueryClient()
  const ranRef = useRef(false)

  useEffect(() => {
    if (!mrId || !supabase || ranRef.current) return
    ranRef.current = true

    void supabase
      .rpc('auto_mark_missed_dcr_leave_without_pay', { p_mr_id: mrId })
      .then(({ data }) => {
        const marked = (data as { marked_count?: number } | null)?.marked_count ?? 0
        if (marked > 0) {
          void qc.invalidateQueries({ queryKey: ['mr-reports'] })
          void qc.invalidateQueries({ queryKey: ['allowed-report-dates'] })
        }
      })
      .catch(() => {
        ranRef.current = false
      })
  }, [mrId, qc])
}
