import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { User } from '@/types/database.types'

/** MRs assigned to the current manager via mr_manager_map. */
export function useManagerMrs(managerId: string) {
  return useQuery({
    queryKey: ['manager-mrs', managerId],
    queryFn: async (): Promise<User[]> => {
      if (!supabase) throw new Error('Supabase not configured')
      try {
        const { data: maps, error } = await supabase
          .from('mr_manager_map')
          .select('mr_id')
          .eq('manager_id', managerId)
        if (error) throw error
        const ids = [...new Set((maps ?? []).map(m => m.mr_id).filter(Boolean))]
        if (ids.length === 0) return []
        const { data: users, error: uErr } = await supabase
          .from('users')
          .select('*')
          .in('id', ids)
          .eq('is_active', true)
          .order('full_name')
        if (uErr) throw uErr
        return (users ?? []) as User[]
      } catch (e) {
        const message =
          e instanceof Error ? e.message : 'Failed to load medical representatives'
        throw new Error(message)
      }
    },
    enabled: !!managerId && !!supabase,
  })
}
