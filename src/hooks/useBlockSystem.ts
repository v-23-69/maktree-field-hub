import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { BlockComplaint } from '@/types/database.types'

export function useBlockUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { userId: string; reason: string; adminUserId: string }) => {
      if (!supabase) throw new Error('Supabase not configured')
      const { error: updateErr } = await supabase
        .from('users')
        .update({
          is_blocked: true,
          block_reason: payload.reason,
          blocked_at: new Date().toISOString(),
          blocked_by: payload.adminUserId,
        })
        .eq('id', payload.userId)
      if (updateErr) throw updateErr
      const { error: logErr } = await supabase.from('account_block_log').insert({
        user_id: payload.userId,
        action: 'blocked',
        reason: payload.reason,
        performed_by: payload.adminUserId,
      })
      if (logErr) throw logErr
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  })
}

export function useUnblockUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { userId: string; adminUserId: string }) => {
      if (!supabase) throw new Error('Supabase not configured')
      const { error: updateErr } = await supabase
        .from('users')
        .update({ is_blocked: false, block_reason: null, blocked_at: null, blocked_by: null })
        .eq('id', payload.userId)
      if (updateErr) throw updateErr
      const { error: logErr } = await supabase.from('account_block_log').insert({
        user_id: payload.userId,
        action: 'unblocked',
        performed_by: payload.adminUserId,
      })
      if (logErr) throw logErr
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  })
}

export function useBlockComplaints() {
  return useQuery({
    queryKey: ['block-complaints'],
    enabled: !!supabase,
    queryFn: async (): Promise<BlockComplaint[]> => {
      if (!supabase) throw new Error('Supabase not configured')
      const { data, error } = await supabase
        .from('block_complaints')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as BlockComplaint[]
    },
  })
}

export function useResolveComplaint() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      complaintId: string
      status: 'approved' | 'rejected'
      adminNote: string | null
      resolvedBy: string
      userId: string
    }) => {
      if (!supabase) throw new Error('Supabase not configured')
      const now = new Date().toISOString()
      const { error: complaintErr } = await supabase
        .from('block_complaints')
        .update({
          status: payload.status,
          admin_note: payload.adminNote,
          resolved_by: payload.resolvedBy,
          resolved_at: now,
        })
        .eq('id', payload.complaintId)
      if (complaintErr) throw complaintErr

      if (payload.status === 'approved') {
        const { error: unErr } = await supabase
          .from('users')
          .update({ is_blocked: false, block_reason: null, blocked_at: null, blocked_by: null })
          .eq('id', payload.userId)
        if (unErr) throw unErr
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['block-complaints'] })
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
  })
}
