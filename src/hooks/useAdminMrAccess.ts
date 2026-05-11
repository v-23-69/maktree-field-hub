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

/** Assign many sub-areas in one go (RPC batch); falls back to repeated assign_sub_area_to_mr. */
export function useAssignSubAreasToMrBatch() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (p: { mrId: string; subAreaIds: string[] }) => {
      if (!supabase) throw new Error('Supabase not configured')
      const ids = [...new Set(p.subAreaIds)].filter(Boolean)
      if (ids.length === 0) throw new Error('Select at least one sub-area')

      const { error } = await supabase.rpc('assign_sub_areas_to_mr', {
        p_mr_id: p.mrId,
        p_sub_area_ids: ids,
      })
      if (!error) return

      const rpcMsg = [error.message, error.details].filter(Boolean).join(' ')
      const batchMissing =
        error.code === 'PGRST202' ||
        error.code === '42883' ||
        /not found|404|does not exist|could not find/i.test(rpcMsg)

      if (!batchMissing) throw new Error(error.message ?? 'Could not assign sub-areas')

      for (const sub_area_id of ids) {
        const { error: one } = await supabase.rpc('assign_sub_area_to_mr', {
          p_mr_id: p.mrId,
          p_sub_area_id: sub_area_id,
        })
        if (one) throw new Error(one.message ?? 'Could not assign sub-area')
      }
    },
    onSuccess: (_d, vars) => {
      queryClient.invalidateQueries({ queryKey: ['mr-access'] })
      queryClient.invalidateQueries({ queryKey: ['mr-sub-areas', vars.mrId] })
      queryClient.invalidateQueries({ queryKey: ['mr-sub-areas'] })
      queryClient.invalidateQueries({ queryKey: ['all-areas'] })
    },
  })
}

export function useAssignSubAreaToMr() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (p: { mrId: string; subAreaId: string }) => {
      if (!supabase) throw new Error('Supabase not configured')
      try {
        const { data: existing, error: exErr } = await supabase
          .from('mr_sub_area_access')
          .select('id')
          .eq('mr_id', p.mrId)
          .eq('sub_area_id', p.subAreaId)
          .maybeSingle()
        if (exErr) throw exErr
        if (existing?.id) return

        const { error: rpcErr } = await supabase.rpc('assign_sub_area_to_mr', {
          p_mr_id: p.mrId,
          p_sub_area_id: p.subAreaId,
        })
        if (!rpcErr) return

        const rpcMsg = [
          rpcErr.message,
          typeof rpcErr.details === 'string' ? rpcErr.details : '',
          typeof rpcErr.hint === 'string' ? rpcErr.hint : '',
        ]
          .filter(Boolean)
          .join(' ')
        const rpcMissing =
          rpcErr.code === 'PGRST202' ||
          rpcErr.code === '42883' ||
          /not found|404|does not exist|could not find.*function/i.test(rpcMsg)

        if (rpcMissing) {
          throw new Error(
            'Database function assign_sub_area_to_mr is missing (404). In Supabase → SQL Editor, run the script supabase/scripts/assign_sub_area_to_mr_rpc.sql from this repo, then try again.',
          )
        }

        throw new Error(rpcMsg.trim() || 'Could not assign sub-area')
      } catch (e) {
        const message =
          e instanceof Error ? e.message : 'Could not assign sub-area'
        throw new Error(message)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mr-access'] })
      queryClient.invalidateQueries({ queryKey: ['mr-sub-areas'] })
      queryClient.invalidateQueries({ queryKey: ['all-areas'] })
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
