import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { LIVE_QUERY_OPTIONS } from '@/lib/liveQueryOptions'
import type { Stockist } from '@/types/database.types'

export function useStockists(areaId?: string) {
  return useQuery({
    queryKey: ['stockists', areaId ?? 'all'],
    enabled: !!supabase,
    ...LIVE_QUERY_OPTIONS,
    queryFn: async (): Promise<Stockist[]> => {
      if (!supabase) throw new Error('Supabase not configured')
      const { data, error } = await supabase.rpc('list_stockists', {
        p_area_id: areaId ?? null,
      })
      if (error) throw error
      return (data ?? []) as Stockist[]
    },
  })
}

export function useCreateStockist() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (p: { areaId: string; name: string }) => {
      if (!supabase) throw new Error('Supabase not configured')
      const { data, error } = await supabase.rpc('create_stockist', {
        p_area_id: p.areaId,
        p_name: p.name,
      })
      if (error) throw error
      return data as string
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stockists'] })
    },
  })
}

