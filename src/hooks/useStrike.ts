import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { todayInputDate } from '@/lib/dateUtils'
import type { StrikeReport } from '@/types/database.types'

export function useTodayStrike(mrId: string) {
  const today = todayInputDate()
  return useQuery({
    queryKey: ['today-strike', mrId, today],
    enabled: !!mrId && !!supabase,
    queryFn: async (): Promise<StrikeReport | null> => {
      if (!supabase) throw new Error('Supabase not configured')
      const { data, error } = await supabase
        .from('strike_reports')
        .select('*')
        .eq('mr_id', mrId)
        .eq('strike_date', today)
        .maybeSingle()
      if (error) {
        // If RLS blocks this row for current role/session, do not break dashboard render.
        if (error.code === '42501' || /forbidden/i.test(error.message)) return null
        throw error
      }
      return (data as StrikeReport) ?? null
    },
    retry: false,
  })
}

export function useMarkStrike() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { mr_id: string; strike_date?: string; reason?: string }) => {
      if (!supabase) throw new Error('Supabase not configured')
      const { error } = await supabase.from('strike_reports').insert({
        mr_id: payload.mr_id,
        strike_date: payload.strike_date ?? todayInputDate(),
        reason: payload.reason ?? null,
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['today-strike'] })
      queryClient.invalidateQueries({ queryKey: ['dcr-daily-status'] })
    },
  })
}

export function useStrikeCount(mrId: string) {
  return useQuery({
    queryKey: ['strike-count', mrId],
    enabled: !!mrId && !!supabase,
    queryFn: async (): Promise<number> => {
      if (!supabase) return 0
      const year = new Date().getFullYear()
      const { count, error } = await supabase
        .from('strike_reports')
        .select('id', { count: 'exact', head: true })
        .eq('mr_id', mrId)
        .gte('strike_date', `${year}-01-01`)
        .lte('strike_date', `${year}-12-31`)
      if (error) return 0
      return count ?? 0
    },
    retry: false,
  })
}
