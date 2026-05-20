import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { LIVE_QUERY_OPTIONS } from '@/lib/liveQueryOptions'
import type { LeaveRequest, ManagerLeaveEntry } from '@/types/database.types'

export function useMrLeaves(mrId: string) {
  return useQuery({
    queryKey: ['mr-leaves', mrId],
    enabled: !!mrId && !!supabase,
    queryFn: async (): Promise<LeaveRequest[]> => {
      if (!supabase) throw new Error('Supabase not configured')
      const { data, error } = await supabase
        .from('leave_requests')
        .select('*')
        .eq('mr_id', mrId)
        .order('leave_date', { ascending: false })
      if (error) throw error
      const rows = (data ?? []) as LeaveRequest[]
      const approverIds = [...new Set(rows.map(r => r.approved_by).filter(Boolean))] as string[]
      if (approverIds.length === 0) return rows
      const { data: users, error: uErr } = await supabase
        .from('users')
        .select('id, full_name')
        .in('id', approverIds)
      if (uErr) return rows
      const nameById = new Map((users ?? []).map((u: { id: string; full_name: string }) => [u.id, u.full_name]))
      return rows.map(r => ({
        ...r,
        approver: r.approved_by
          ? { id: r.approved_by, full_name: nameById.get(r.approved_by) ?? 'Manager' }
          : null,
      }))
    },
  })
}

export function useManagerLeaves(managerId: string) {
  return useQuery({
    queryKey: ['manager-leaves', managerId],
    enabled: !!managerId && !!supabase,
    ...LIVE_QUERY_OPTIONS,
    queryFn: async (): Promise<LeaveRequest[]> => {
      if (!supabase) throw new Error('Supabase not configured')
      const { data, error } = await supabase
        .from('leave_requests')
        .select(
          `
          *,
          mr:users!leave_requests_mr_id_fkey(id, full_name, employee_code)
        `,
        )
        .eq('manager_id', managerId)
        .order('leave_date', { ascending: false })
      if (error) throw error
      return (data ?? []) as LeaveRequest[]
    },
  })
}

export function useApplyLeave() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      mr_id: string
      manager_id: string | null
      leave_date: string
      leave_type: 'full' | 'half_morning' | 'half_afternoon'
      leave_category: 'casual' | 'sick'
      reason: string
    }) => {
      if (!supabase) throw new Error('Supabase not configured')
      const { error } = await supabase.from('leave_requests').insert({
        mr_id: payload.mr_id,
        manager_id: payload.manager_id,
        leave_date: payload.leave_date,
        leave_type: payload.leave_type,
        leave_category: payload.leave_category,
        reason: payload.reason,
      })
      if (error) throw error
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['mr-leaves', vars.mr_id] })
      queryClient.invalidateQueries({ queryKey: ['manager-leaves'] })
      queryClient.invalidateQueries({ queryKey: ['manager-pending-counts'] })
    },
  })
}

export function useResolveLeave() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      leaveId: string
      status: 'approved' | 'rejected'
      managerNote?: string
      resolverUserId: string
    }) => {
      if (!supabase) throw new Error('Supabase not configured')
      const { error } = await supabase
        .from('leave_requests')
        .update({
          status: payload.status,
          manager_note: payload.managerNote ?? null,
          resolved_at: new Date().toISOString(),
          approved_by: payload.status === 'approved' ? payload.resolverUserId : null,
        })
        .eq('id', payload.leaveId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manager-leaves'] })
      queryClient.invalidateQueries({ queryKey: ['mr-leaves'] })
      queryClient.invalidateQueries({ queryKey: ['manager-pending-counts'] })
    },
  })
}

export function useManagerOwnLeaves(managerId: string) {
  return useQuery({
    queryKey: ['manager-own-leaves', managerId],
    enabled: !!managerId && !!supabase,
    queryFn: async (): Promise<ManagerLeaveEntry[]> => {
      if (!supabase) throw new Error('Supabase not configured')
      const { data, error } = await supabase
        .from('manager_leave_entries')
        .select('*')
        .eq('manager_id', managerId)
        .order('leave_date', { ascending: false })
      if (error) throw error
      return (data ?? []) as ManagerLeaveEntry[]
    },
  })
}

export function useUpsertManagerOwnLeave() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (p: {
      manager_id: string
      leave_date: string
      leave_category: 'casual' | 'sick'
      remark: string
    }) => {
      if (!supabase) throw new Error('Supabase not configured')
      const { error } = await supabase.from('manager_leave_entries').upsert(
        {
          manager_id: p.manager_id,
          leave_date: p.leave_date,
          leave_category: p.leave_category,
          remark: p.remark.trim() || null,
        },
        { onConflict: 'manager_id,leave_date' },
      )
      if (error) throw error
    },
    onSuccess: (_d, v) => {
      queryClient.invalidateQueries({ queryKey: ['manager-own-leaves', v.manager_id] })
    },
  })
}
