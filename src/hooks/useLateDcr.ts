import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { LIVE_QUERY_OPTIONS } from '@/lib/liveQueryOptions'
import { invalidateDashboardQueries } from '@/lib/invalidateDashboardQueries'
import type { LateDcrFillRequest } from '@/types/database.types'

export type ActiveLateSlot = { slot_id: string; report_date: string }

export function useActiveLateSlotCount(mrId: string) {
  return useQuery({
    queryKey: ['active-late-slots', mrId],
    enabled: !!mrId && !!supabase,
    ...LIVE_QUERY_OPTIONS,
    queryFn: async (): Promise<number> => {
      if (!supabase) return 0
      const { data, error } = await supabase.rpc('count_active_late_fill_slots', {
        p_mr_id: mrId,
      })
      if (error) throw error
      return (data as number) ?? 0
    },
  })
}

export function useNextMissedLateBatchDates(mrId: string) {
  return useQuery({
    queryKey: ['next-missed-late-batch', mrId],
    enabled: !!mrId && !!supabase,
    ...LIVE_QUERY_OPTIONS,
    queryFn: async (): Promise<string[]> => {
      if (!supabase) throw new Error('Supabase not configured')
      const { data, error } = await supabase.rpc('get_next_missed_late_batch_dates', {
        p_mr_id: mrId,
        p_limit: 15,
      })
      if (error) throw error
      return ((data ?? []) as string[]).map(String).sort()
    },
  })
}

export function useActiveLateSlots(mrId: string) {
  return useQuery({
    queryKey: ['active-late-slots-list', mrId],
    enabled: !!mrId && !!supabase,
    ...LIVE_QUERY_OPTIONS,
    queryFn: async (): Promise<ActiveLateSlot[]> => {
      if (!supabase) throw new Error('Supabase not configured')
      const { data, error } = await supabase.rpc('list_active_late_fill_slots', {
        p_mr_id: mrId,
      })
      if (error) throw error
      return (data ?? []) as ActiveLateSlot[]
    },
  })
}

export function useManagerLateDcrRequests(managerId: string) {
  return useQuery({
    queryKey: ['manager-late-dcr-requests', managerId],
    enabled: !!managerId && !!supabase,
    ...LIVE_QUERY_OPTIONS,
    queryFn: async (): Promise<LateDcrFillRequest[]> => {
      if (!supabase) throw new Error('Supabase not configured')
      const { data, error } = await supabase.rpc('list_late_dcr_fill_requests_for_manager')
      if (error) throw error
      return (data ?? []) as LateDcrFillRequest[]
    },
  })
}

export function useGrantLateDcrFill() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (p: { mrId: string; dates: string[] }) => {
      if (!supabase) throw new Error('Supabase not configured')
      const { data, error } = await supabase.rpc('grant_late_dcr_fill', {
        p_mr_id: p.mrId,
        p_dates: p.dates,
      })
      if (error) throw error
      return data as { granted_count: number; granted_dates: string[] }
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['active-late-slots', vars.mrId] })
      queryClient.invalidateQueries({ queryKey: ['active-late-slots-list', vars.mrId] })
      queryClient.invalidateQueries({ queryKey: ['allowed-report-dates', vars.mrId] })
      queryClient.invalidateQueries({ queryKey: ['manager-late-dcr-requests'] })
      queryClient.invalidateQueries({ queryKey: ['user-notifications', vars.mrId] })
      queryClient.invalidateQueries({ queryKey: ['user-notifications'] })
      invalidateDashboardQueries(queryClient)
    },
  })
}

export function useRevokeLateDcrFill() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (p: { mrId: string; dates: string[] }) => {
      if (!supabase) throw new Error('Supabase not configured')
      const { data, error } = await supabase.rpc('revoke_late_dcr_fill_slots', {
        p_mr_id: p.mrId,
        p_dates: p.dates,
      })
      if (error) throw error
      return data as { revoked_count: number }
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['active-late-slots', vars.mrId] })
      queryClient.invalidateQueries({ queryKey: ['active-late-slots-list', vars.mrId] })
      queryClient.invalidateQueries({ queryKey: ['allowed-report-dates', vars.mrId] })
      invalidateDashboardQueries(queryClient)
    },
  })
}

export function useRequestLateDcrFill() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (dates: string[]) => {
      if (!supabase) throw new Error('Supabase not configured')
      const { data, error } = await supabase.rpc('request_late_dcr_fill', {
        p_dates: dates,
      })
      if (error) throw error
      return data as string
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manager-late-dcr-requests'] })
      queryClient.invalidateQueries({ queryKey: ['manager-pending-counts'] })
      queryClient.invalidateQueries({ queryKey: ['allowed-report-dates'] })
      queryClient.invalidateQueries({ queryKey: ['active-late-slots'] })
      queryClient.invalidateQueries({ queryKey: ['user-notifications'] })
    },
  })
}

export function useResolveLateDcrRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (p: {
      requestId: string
      action: 'approved' | 'rejected'
      managerComment?: string
      mrId?: string
    }) => {
      if (!supabase) throw new Error('Supabase not configured')
      const { error } = await supabase.rpc('resolve_late_dcr_fill_request', {
        p_request_id: p.requestId,
        p_action: p.action,
        p_manager_comment: p.managerComment ?? null,
      })
      if (error) throw error
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['manager-late-dcr-requests'] })
      queryClient.invalidateQueries({ queryKey: ['manager-pending-counts'] })
      if (vars.mrId) {
        queryClient.invalidateQueries({ queryKey: ['active-late-slots', vars.mrId] })
        queryClient.invalidateQueries({ queryKey: ['active-late-slots-list', vars.mrId] })
        queryClient.invalidateQueries({ queryKey: ['allowed-report-dates', vars.mrId] })
        queryClient.invalidateQueries({ queryKey: ['user-notifications', vars.mrId] })
      }
      queryClient.invalidateQueries({ queryKey: ['user-notifications'] })
      invalidateDashboardQueries(queryClient)
    },
  })
}
