import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { LIVE_QUERY_OPTIONS } from '@/lib/liveQueryOptions'
import type { StockistMeet } from '@/types/database.types'

function monthBounds(year: number, monthIndex0: number): { from: string; to: string } {
  const from = new Date(Date.UTC(year, monthIndex0, 1, 12, 0, 0))
  const to = new Date(Date.UTC(year, monthIndex0 + 1, 0, 12, 0, 0))
  const fmt = (d: Date) =>
    `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(
      d.getUTCDate(),
    ).padStart(2, '0')}`
  return { from: fmt(from), to: fmt(to) }
}

export function useStockistMeetsByMonth(userId: string, year: number, monthIndex0: number) {
  const { from, to } = monthBounds(year, monthIndex0)
  return useQuery({
    queryKey: ['stockist-meets', userId, from, to],
    enabled: !!userId && !!supabase,
    ...LIVE_QUERY_OPTIONS,
    queryFn: async (): Promise<StockistMeet[]> => {
      if (!supabase) throw new Error('Supabase not configured')
      const { data, error } = await supabase
        .from('stockist_meets')
        .select(
          `
          id, user_id, meet_date, meet_time, area_id, stockist_id, notes, created_at, updated_at,
          stockist:stockists(id, name),
          area:areas(id, name)
        `,
        )
        .eq('user_id', userId)
        .gte('meet_date', from)
        .lte('meet_date', to)
        .order('meet_date', { ascending: true })
      if (error) throw error
      return (data ?? []) as StockistMeet[]
    },
  })
}

export function useUpsertStockistMeet() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (p: {
      userId: string
      meetDate: string
      meetTime?: string | null
      stockistId: string
      notes?: string | null
    }) => {
      if (!supabase) throw new Error('Supabase not configured')
      // Use RPC so the database enforces "MR can only pick own HQ stockists".
      const { data, error } = await supabase.rpc('upsert_my_stockist_meet', {
        p_meet_date: p.meetDate,
        p_stockist_id: p.stockistId,
        p_meet_time: p.meetTime ?? null,
        p_notes: p.notes ?? null,
      })
      if (error) throw error
      return data as string
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ['stockist-meets', v.userId] })
      qc.invalidateQueries({ queryKey: ['stockist-meets'] })
    },
  })
}

