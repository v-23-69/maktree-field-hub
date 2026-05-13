import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { User } from '@/types/database.types'

/** Managers list for "Working With" — includes profile photo for UI. */
export type ManagerRow = Pick<User, 'id' | 'full_name' | 'employee_code' | 'role' | 'profile_photo_url'>

/** Options for daily report Step 1 (RPC list_working_with_options_for_report). `team_mr` is manager-only. */
export type WorkingWithOptionKind = 'linked_manager' | 'team_mr' | 'peer_manager'

export type WorkingWithOption = {
  id: string
  full_name: string
  employee_code: string
  role: string
  option_kind: WorkingWithOptionKind
  profile_photo_url?: string | null
}

function isForbidden(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false
  return error.code === '42501' || /forbidden/i.test(error.message ?? '')
}

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
        if (error) {
          if (isForbidden(error)) return []
          throw error
        }
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
    retry: false,
  })
}

/** Managers mapped to a specific MR id (first one used for leave flow). */
/**
 * Working-with dropdown for daily report: MR sees managers; manager sees team MRs + peer managers.
 * Falls back to list_managers_for_mr when the newer RPC is not deployed.
 */
export function useWorkingWithReportOptions(userId: string | undefined, viewerRole?: string | null) {
  return useQuery({
    queryKey: ['working-with-report-options', userId, viewerRole ?? ''],
    enabled: !!supabase && !!userId,
    queryFn: async (): Promise<WorkingWithOption[]> => {
      if (!supabase) throw new Error('Supabase not configured')
      const { data, error } = await supabase.rpc('list_working_with_options_for_report')
      if (!error && Array.isArray(data)) {
        let rows = (data as WorkingWithOption[]).map(r => ({
          ...r,
          option_kind: r.option_kind as WorkingWithOptionKind,
        }))
        if (viewerRole === 'mr') {
          rows = rows.filter(o => o.option_kind !== 'team_mr')
        }
        return rows
      }
      const rpcMsg = [error?.message, error?.details].filter(Boolean).join(' ')
      const rpcMissing =
        error?.code === 'PGRST202' ||
        error?.code === '42883' ||
        /not found|404|does not exist|could not find/i.test(rpcMsg)

      if (!rpcMissing && error) throw new Error(error.message ?? 'Failed to load working-with options')

      const { data: mgrs, error: e2 } = await supabase.rpc('list_managers_for_mr')
      if (e2) throw new Error(e2.message ?? 'Failed to load managers')
      return ((mgrs ?? []) as Pick<User, 'id' | 'full_name' | 'employee_code' | 'role'>[]).map(
        m => ({
          id: m.id,
          full_name: m.full_name ?? '',
          employee_code: m.employee_code ?? '',
          role: typeof m.role === 'string' ? m.role : String(m.role ?? ''),
          option_kind: 'linked_manager' as WorkingWithOptionKind,
        }),
      )
    },
    retry: false,
  })
}

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
      if (error) {
        if (isForbidden(error)) return []
        throw error
      }
      return (data ?? [])
        .map((r: { manager: ManagerRow | null }) => r.manager)
        .filter(Boolean) as ManagerRow[]
    },
  })
}
