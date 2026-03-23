import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { User } from '@/types/database.types'

/** Managers list for "Working With" — only columns needed by the UI. */
export type ManagerRow = Pick<User, 'id' | 'full_name' | 'employee_code' | 'role'>

/**
 * Loads managers for the MR "Working With" dropdown.
 * Uses RPC `list_managers_for_mr` (SECURITY DEFINER) so rows are visible under RLS.
 * Prefers managers linked in `mr_manager_map`; if none, returns all active managers.
 */
export function useManagers() {
  return useQuery({
    queryKey: ['managers'],
    queryFn: async (): Promise<ManagerRow[]> => {
      if (!supabase) throw new Error('Supabase not configured')
      try {
        const { data, error } = await supabase.rpc('list_managers_for_mr')
        if (error) throw error
        return (data ?? []) as ManagerRow[]
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Failed to load managers'
        throw new Error(message)
      }
    },
    enabled: !!supabase,
  })
}
