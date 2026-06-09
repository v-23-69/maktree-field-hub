import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useMarkMrResigned() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (mrId: string) => {
      if (!supabase) throw new Error('Supabase not configured')
      const { error } = await supabase.rpc('mark_mr_resigned', { p_mr_id: mrId })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] })
      qc.invalidateQueries({ queryKey: ['manager-mrs'] })
    },
  })
}

export function useReinstateMr() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (mrId: string) => {
      if (!supabase) throw new Error('Supabase not configured')
      const { error } = await supabase.rpc('reinstate_mr', { p_mr_id: mrId })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] })
      qc.invalidateQueries({ queryKey: ['manager-mrs'] })
    },
  })
}
