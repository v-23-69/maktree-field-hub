import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { LeaveRequest } from '@/types/database.types'

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
      return (data ?? []) as LeaveRequest[]
    },
  })
}

export function useManagerLeaves(managerId: string) {
  return useQuery({
    queryKey: ['manager-leaves', managerId],
    enabled: !!managerId && !!supabase,
    queryFn: async (): Promise<LeaveRequest[]> => {
      if (!supabase) throw new Error('Supabase not configured')
      const { data, error } = await supabase
        .from('leave_requests')
        .select('*')
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
      reason: string
    }) => {
      if (!supabase) throw new Error('Supabase not configured')
      const { error } = await supabase.from('leave_requests').insert(payload)
      if (error) throw error
    },
    onSuccess: (_data, vars) => queryClient.invalidateQueries({ queryKey: ['mr-leaves', vars.mr_id] }),
  })
}

export function useResolveLeave() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { leaveId: string; status: 'approved' | 'rejected'; managerNote?: string }) => {
      if (!supabase) throw new Error('Supabase not configured')
      const { error } = await supabase
        .from('leave_requests')
        .update({
          status: payload.status,
          manager_note: payload.managerNote ?? null,
          resolved_at: new Date().toISOString(),
        })
        .eq('id', payload.leaveId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manager-leaves'] })
      queryClient.invalidateQueries({ queryKey: ['mr-leaves'] })
    },
  })
}
