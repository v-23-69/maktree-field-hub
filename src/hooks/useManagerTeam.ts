import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { User } from '@/types/database.types'

/** Stable sort + one row per MR (duplicate mr_manager_map rows or RPC oddities). */
function dedupeManagersMrs(rows: User[]): User[] {
  const seen = new Set<string>()
  const out: User[] = []
  for (const r of rows) {
    if (!r?.id || seen.has(r.id)) continue
    seen.add(r.id)
    out.push(r)
  }
  out.sort((a, b) => (a.full_name ?? '').localeCompare(b.full_name ?? '', undefined, { sensitivity: 'base' }))
  return out
}

/** MRs assigned to the current manager via mr_manager_map. */
export function useManagerMrs(managerId: string) {
  return useQuery({
    queryKey: ['manager-mrs', managerId],
    queryFn: async (): Promise<User[]> => {
      if (!supabase) throw new Error('Supabase not configured')
      try {
        // Preferred path: security-definer RPC, robust against RLS joins.
        const rpcRes = await supabase.rpc('list_mrs_for_manager')
        if (!rpcRes.error) {
          const rows = dedupeManagersMrs((rpcRes.data ?? []) as User[])
          const ids = rows.map(r => r.id).filter(Boolean)
          if (ids.length === 0) return rows
          const { data: extras, error: exErr } = await supabase
            .from('users')
            .select('id, profile_photo_url, is_paused, pause_reason')
            .in('id', ids)
          if (exErr) return rows
          const byId = new Map((extras ?? []).map(u => [u.id as string, u]))
          return rows.map(r => {
            const x = byId.get(r.id)
            if (!x) return r
            return {
              ...r,
              profile_photo_url: x.profile_photo_url ?? r.profile_photo_url,
              is_paused: x.is_paused ?? r.is_paused,
              pause_reason: x.pause_reason ?? r.pause_reason,
            }
          })
        }

        // Fallback path for environments where migration isn't applied yet.
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
        return dedupeManagersMrs((users ?? []) as User[])
      } catch (e) {
        const message =
          e instanceof Error ? e.message : 'Failed to load medical representatives'
        throw new Error(message)
      }
    },
    enabled: !!managerId && !!supabase,
  })
}
