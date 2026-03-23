import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { ReportUnlockRequest } from '@/types/database.types'

type UnlockRequestRow = ReportUnlockRequest & {
  mr_full_name?: string
}

export function useManagerUnlockRequests(managerId: string) {
  return useQuery({
    queryKey: ['manager-unlock-requests', managerId],
    enabled: !!managerId && !!supabase,
    queryFn: async (): Promise<{
      pending: UnlockRequestRow[]
      resolved: UnlockRequestRow[]
    }> => {
      if (!supabase) throw new Error('Supabase not configured')

      const { data: maps, error: mapErr } = await supabase
        .from('mr_manager_map')
        .select('mr_id')
        .eq('manager_id', managerId)

      if (mapErr) throw mapErr
      const mrIds = [...new Set((maps ?? []).map(m => m.mr_id).filter(Boolean))]
      if (mrIds.length === 0) {
        return { pending: [], resolved: [] }
      }

      const { data: reqs, error: reqErr } = await supabase
        .from('report_unlock_requests')
        .select('*')
        .eq('manager_id', managerId)
        .in('mr_id', mrIds)
        .order('created_at', { ascending: false })

      if (reqErr) throw reqErr

      const { data: users, error: uErr } = await supabase
        .from('users')
        .select('id, full_name')
        .in('id', mrIds)

      if (uErr) throw uErr

      const mrNameById = new Map<string, string>()
      for (const u of users ?? []) mrNameById.set((u as any).id, (u as any).full_name ?? '')

      const rows = (reqs ?? []) as ReportUnlockRequest[]
      const withNames = rows.map(
        r => ({ ...(r as any), mr_full_name: mrNameById.get(r.mr_id) } as UnlockRequestRow),
      )

      const pending = withNames.filter(r => r.status === 'pending')

      const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      const resolved = withNames
        .filter(r => r.status !== 'pending' && !!r.resolved_at)
        .filter(r => new Date(r.resolved_at ?? 0) >= cutoff)
        .sort((a, b) =>
          (b.resolved_at ?? '').localeCompare(a.resolved_at ?? ''),
        )

      return { pending, resolved }
    },
  })
}

export function useResolveUnlockRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (p: {
      requestId: string
      action: 'approved' | 'rejected'
      managerComment?: string
    }): Promise<void> => {
      if (!supabase) throw new Error('Supabase not configured')

      const { error } = await supabase
        .from('report_unlock_requests')
        .update({
          status: p.action,
          manager_comment:
            p.action === 'rejected'
              ? p.managerComment?.trim() || null
              : null,
          resolved_at: new Date().toISOString(),
        })
        .eq('id', p.requestId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manager-unlock-requests'] })
    },
  })
}

