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
      if (error) throw error
      return (data as StrikeReport) ?? null
    },
  })
}

export function useMarkStrike() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { mr_id: string; strike_date?: string }) => {
      if (!supabase) throw new Error('Supabase not configured')
      const { error } = await supabase.from('strike_reports').insert({
        mr_id: payload.mr_id,
        strike_date: payload.strike_date ?? todayInputDate(),
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['today-strike'] })
      queryClient.invalidateQueries({ queryKey: ['dcr-daily-status'] })
    },
  })
}
