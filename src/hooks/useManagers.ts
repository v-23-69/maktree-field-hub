import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { User } from '@/types/database.types'

/** Managers list for "Working With" — includes profile photo for UI. */
export type ManagerRow = Pick<User, 'id' | 'full_name' | 'employee_code' | 'role' | 'profile_photo_url'>

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
        const managers = (data ?? []) as ManagerRow[]
        const managerIds = managers.map(m => m.id).filter(Boolean)
        if (managerIds.length === 0) return managers

        const { data: photoRows } = await supabase
          .from('users')
          .select('id, profile_photo_url')
          .in('id', managerIds)

        const photoById = new Map<string, string | null>(
          (photoRows ?? []).map((r: { id: string; profile_photo_url: string | null }) => [r.id, r.profile_photo_url]),
        )

        return managers.map(m => ({ ...m, profile_photo_url: photoById.get(m.id) ?? null }))
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Failed to load managers'
        throw new Error(message)
      }
    },
    enabled: !!supabase,
  })
}

/** Managers mapped to a specific MR id (first one used for leave flow). */
export function useManagersForMr(mrId: string) {
  return useQuery({
    queryKey: ['managers-for-mr', mrId],
    enabled: !!mrId && !!supabase,
    queryFn: async (): Promise<ManagerRow[]> => {
      if (!supabase) throw new Error('Supabase not configured')
      const { data, error } = await supabase
        .from('mr_manager_map')
        .select('manager:users!mr_manager_map_manager_id_fkey(id, full_name, employee_code, role, profile_photo_url)')
        .eq('mr_id', mrId)
        .order('assigned_at', { ascending: true })
      if (error) throw error
      return (data ?? [])
        .map((r: { manager: ManagerRow | null }) => r.manager)
        .filter(Boolean) as ManagerRow[]
    },
  })
}
