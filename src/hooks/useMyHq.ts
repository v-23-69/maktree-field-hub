import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { LIVE_QUERY_OPTIONS } from '@/lib/liveQueryOptions'

export type MyHqArea = { area_id: string; area_name: string }

export function useMyHqAreas(userId: string) {
  return useQuery({
    queryKey: ['my-hq-areas', userId],
    enabled: !!userId && !!supabase,
    ...LIVE_QUERY_OPTIONS,
    queryFn: async (): Promise<MyHqArea[]> => {
      if (!supabase) throw new Error('Supabase not configured')
      const { data, error } = await supabase.rpc('list_my_hq_areas')
      if (error) throw error
      return (data ?? []) as MyHqArea[]
    },
  })
}

