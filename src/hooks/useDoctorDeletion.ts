import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { LIVE_QUERY_OPTIONS } from '@/lib/liveQueryOptions'
import type { DoctorDeletionRequest } from '@/types/database.types'

export function useMyDoctorDeletionRequests(mrId: string) {
  return useQuery({
    queryKey: ['doctor-deletion-requests-mr', mrId],
    enabled: !!mrId && !!supabase,
    queryFn: async (): Promise<DoctorDeletionRequest[]> => {
      if (!supabase) throw new Error('Supabase not configured')
      const { data, error } = await supabase
        .from('doctor_deletion_requests')
        .select(
          `
          *,
          doctor:doctors(id, full_name, speciality, sub_area_id)
        `,
        )
        .eq('mr_id', mrId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as DoctorDeletionRequest[]
    },
  })
}

export function useManagerDoctorDeletionRequests(managerId: string) {
  return useQuery({
    queryKey: ['doctor-deletion-requests-mgr', managerId],
    enabled: !!managerId && !!supabase,
    ...LIVE_QUERY_OPTIONS,
    queryFn: async (): Promise<DoctorDeletionRequest[]> => {
      if (!supabase) throw new Error('Supabase not configured')
      const { data, error } = await supabase
        .from('doctor_deletion_requests')
        .select(
          `
          *,
          mr:users!doctor_deletion_requests_mr_id_fkey(id, full_name, employee_code),
          doctor:doctors(id, full_name, speciality, sub_area_id)
        `,
        )
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as DoctorDeletionRequest[]
    },
  })
}

export function useRequestDoctorDeletion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (p: { mr_id: string; doctor_id: string; manager_id: string | null; reason: string }) => {
      if (!supabase) throw new Error('Supabase not configured')
      const { error } = await supabase.from('doctor_deletion_requests').insert({
        mr_id: p.mr_id,
        doctor_id: p.doctor_id,
        manager_id: p.manager_id,
        reason: p.reason.trim() || null,
        status: 'pending',
      })
      if (error) throw error
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ['doctor-deletion-requests-mr', v.mr_id] })
      qc.invalidateQueries({ queryKey: ['doctor-deletion-requests-mgr'] })
      qc.invalidateQueries({ queryKey: ['manager-pending-counts'] })
    },
  })
}

export function useResolveDoctorDeletion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (p: {
      requestId: string
      status: 'approved' | 'rejected'
      managerNote?: string
      resolverUserId: string
      doctorId: string
    }) => {
      if (!supabase) throw new Error('Supabase not configured')
      const now = new Date().toISOString()
      const { error: u1 } = await supabase
        .from('doctor_deletion_requests')
        .update({
          status: p.status,
          manager_note: p.managerNote?.trim() || null,
          approved_by: p.status === 'approved' ? p.resolverUserId : null,
          resolved_at: now,
        })
        .eq('id', p.requestId)
      if (u1) throw u1
      if (p.status === 'approved') {
        const { error: u2 } = await supabase.from('doctors').update({ is_active: false }).eq('id', p.doctorId)
        if (u2) throw u2
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['doctor-deletion-requests-mgr'] })
      qc.invalidateQueries({ queryKey: ['doctor-deletion-requests-mr'] })
      qc.invalidateQueries({ queryKey: ['mr-doctors'] })
      qc.invalidateQueries({ queryKey: ['master-list-completion'] })
      qc.invalidateQueries({ queryKey: ['doctor-detail'] })
      qc.invalidateQueries({ queryKey: ['manager-pending-counts'] })
    },
  })
}
