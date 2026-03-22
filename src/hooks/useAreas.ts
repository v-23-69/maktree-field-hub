import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Area, SubArea } from '@/types/database.types'

export function useMrSubAreas(mrId: string) {
  return useQuery({
    queryKey: ['mr-sub-areas', mrId],
    queryFn: async (): Promise<SubArea[]> => {
      if (!supabase) throw new Error('Supabase not configured')
      const { data, error } = await supabase
        .from('mr_sub_area_access')
        .select('sub_area:sub_areas(*, area:areas(*))')
        .eq('mr_id', mrId)
      if (error) throw error
      return (data as any[]).map(d => d.sub_area).filter(Boolean) as SubArea[]
    },
    enabled: !!mrId && !!supabase,
  })
}

export function useAllAreas() {
  return useQuery({
    queryKey: ['all-areas'],
    queryFn: async (): Promise<(Area & { sub_areas: SubArea[] })[]> => {
      if (!supabase) throw new Error('Supabase not configured')
      const { data, error } = await supabase
        .from('areas')
        .select('*, sub_areas(*)')
        .eq('is_active', true)
        .order('name')
      if (error) throw error
      return data as (Area & { sub_areas: SubArea[] })[]
    },
    enabled: !!supabase,
  })
}
