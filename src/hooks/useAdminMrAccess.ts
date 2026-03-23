import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useMrSubAreaAccess(mrId: string) {
  return useQuery({
    queryKey: ['mr-access', mrId],
    queryFn: async (): Promise<string[]> => {
      if (!supabase) throw new Error('Supabase not configured')
      try {
        const { data, error } = await supabase
          .from('mr_sub_area_access')
          .select('sub_area_id')
          .eq('mr_id', mrId)
        if (error) throw error
        return (data ?? []).map(r => r.sub_area_id as string)
      } catch (e) {
        const message =
          e instanceof Error ? e.message : 'Failed to load access'
        throw new Error(message)
      }
    },
    enabled: !!mrId && !!supabase,
  })
}

export function useSaveMrSubAreaAccess() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (p: { mrId: string; subAreaIds: string[] }) => {
      if (!supabase) throw new Error('Supabase not configured')
      try {
        const { error: dErr } = await supabase
          .from('mr_sub_area_access')
          .delete()
          .eq('mr_id', p.mrId)
        if (dErr) throw dErr

        if (p.subAreaIds.length > 0) {
          const { error: iErr } = await supabase
            .from('mr_sub_area_access')
            .insert(
              p.subAreaIds.map(sub_area_id => ({
                mr_id: p.mrId,
                sub_area_id,
              })),
            )
          if (iErr) throw iErr
        }
      } catch (e) {
        const message =
          e instanceof Error ? e.message : 'Could not save access'
        throw new Error(message)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mr-access'] })
      queryClient.invalidateQueries({ queryKey: ['mr-sub-areas'] })
    },
  })
}

export function useAdminMrsList() {
  return useQuery({
    queryKey: ['admin-mrs'],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not configured')
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('role', 'mr')
          .eq('is_active', true)
          .order('full_name')
        if (error) throw error
        return data ?? []
      } catch (e) {
        const message =
          e instanceof Error ? e.message : 'Failed to load MR users'
        throw new Error(message)
      }
    },
    enabled: !!supabase,
  })
}
