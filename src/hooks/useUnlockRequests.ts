import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { LIVE_QUERY_OPTIONS } from '@/lib/liveQueryOptions'
import type { ReportUnlockRequest } from '@/types/database.types'

type UnlockRequestRow = ReportUnlockRequest & {
  mr_full_name?: string
}

export function useManagerUnlockRequests(managerId: string) {
  return useQuery({
    queryKey: ['manager-unlock-requests', managerId],
    enabled: !!managerId && !!supabase,
    ...LIVE_QUERY_OPTIONS,
    queryFn: async (): Promise<{
      pending: UnlockRequestRow[]
      resolved: UnlockRequestRow[]
    }> => {
      if (!supabase) throw new Error('Supabase not configured')

      const rpc = await supabase.rpc('list_unlock_requests_for_manager')
      if (rpc.error) throw rpc.error
      const withNames = (rpc.data ?? []) as UnlockRequestRow[]

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

      const { error } = await supabase.rpc('resolve_report_unlock_request', {
        p_request_id: p.requestId,
        p_action: p.action,
        p_manager_comment: p.managerComment?.trim() || null,
      })

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manager-unlock-requests'] })
      queryClient.invalidateQueries({ queryKey: ['manager-pending-counts'] })
      queryClient.invalidateQueries({ queryKey: ['user-notifications'] })
      queryClient.invalidateQueries({ queryKey: ['allowed-report-dates'] })
    },
  })
}

