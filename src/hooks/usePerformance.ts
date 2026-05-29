import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { LIVE_QUERY_OPTIONS } from '@/lib/liveQueryOptions'

export type MrPerformanceMetrics = {
  from: string
  to: string
  doctor_calls: number
  doctor_call_avg: number
  chemist_meets: number
  stockist_meets: number
  field_work_days: number
  sundays: number
  holidays: number
  leaves: number
  strikes: number
  expense_submitted_days: number
}

export function useMrPerformanceMetrics(mrId: string, from?: string, to?: string) {
  return useQuery({
    queryKey: ['mr-performance', mrId, from ?? null, to ?? null],
    enabled: !!mrId && !!supabase,
    ...LIVE_QUERY_OPTIONS,
    queryFn: async (): Promise<MrPerformanceMetrics> => {
      if (!supabase) throw new Error('Supabase not configured')
      const { data, error } = await supabase.rpc('get_mr_performance_metrics', {
        p_mr_id: mrId,
        p_from: from ?? null,
        p_to: to ?? null,
      })
      if (error) throw error
      return data as MrPerformanceMetrics
    },
  })
}

