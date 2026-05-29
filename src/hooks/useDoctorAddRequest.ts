import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { LIVE_QUERY_OPTIONS } from '@/lib/liveQueryOptions'
import type { DoctorAddRequest, DoctorChemistPayload } from '@/types/database.types'

export type DoctorAddPayload = {
  doctor: {
    full_name: string
    speciality: string
    qualification: string | null
    address: string | null
    city: string | null
    mobile: string | null
    birthday: string | null
    marriage_anniversary: string | null
    visit_frequency: 'weekly' | 'fortnightly' | 'monthly' | null
    monthly_visit_target: number
  }
  chemists: DoctorChemistPayload[]
}

export function usePendingDoctorAddRequests(mrId: string, subAreaId: string | null) {
  return useQuery({
    queryKey: ['doctor-add-requests-mr', mrId, subAreaId],
    enabled: !!mrId && !!subAreaId && !!supabase,
    ...LIVE_QUERY_OPTIONS,
    queryFn: async (): Promise<DoctorAddRequest[]> => {
      if (!supabase || !subAreaId) throw new Error('Supabase not configured')
      const { data, error } = await supabase
        .from('doctor_add_requests')
        .select('*')
        .eq('mr_id', mrId)
        .eq('sub_area_id', subAreaId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as DoctorAddRequest[]
    },
  })
}

export function useManagerDoctorAddRequests(managerId: string) {
  return useQuery({
    queryKey: ['doctor-add-requests-mgr', managerId],
    enabled: !!managerId && !!supabase,
    ...LIVE_QUERY_OPTIONS,
    queryFn: async (): Promise<DoctorAddRequest[]> => {
      if (!supabase) throw new Error('Supabase not configured')
      const { data, error } = await supabase
        .from('doctor_add_requests')
        .select(
          `
          *,
          mr:users!doctor_add_requests_mr_id_fkey(id, full_name, employee_code),
          sub_area:sub_areas(id, name, code, area:areas(id, name))
        `,
        )
        .eq('status', 'pending')
        .eq('manager_id', managerId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as DoctorAddRequest[]
    },
  })
}

export function useSubmitDoctorAddRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (p: {
      mr_id: string
      sub_area_id: string
      manager_id: string | null
      payload: DoctorAddPayload
    }) => {
      if (!supabase) throw new Error('Supabase not configured')
      const { data, error } = await supabase.rpc('submit_doctor_add_request', {
        p_mr_id: p.mr_id,
        p_sub_area_id: p.sub_area_id,
        p_manager_id: p.manager_id,
        p_payload: p.payload,
      })
      if (error) {
        const msg = error.message ?? 'Could not submit doctor request'
        if (error.code === '23505' || msg.includes('doctor_add_one_pending')) {
          throw new Error('A request to add this doctor is already pending approval.')
        }
        throw new Error(msg)
      }
      return data as string
    },
    onSuccess: (_id, v) => {
      qc.invalidateQueries({ queryKey: ['doctor-add-requests-mr', v.mr_id] })
      qc.invalidateQueries({ queryKey: ['doctor-add-requests-mgr'] })
      qc.invalidateQueries({ queryKey: ['manager-pending-counts'] })
      qc.invalidateQueries({ queryKey: ['user-notifications'] })
    },
  })
}

export function useResolveDoctorAddRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (p: {
      requestId: string
      status: 'approved' | 'rejected'
      managerNote?: string
    }) => {
      if (!supabase) throw new Error('Supabase not configured')
      const { error } = await supabase.rpc('resolve_doctor_add_request', {
        p_request_id: p.requestId,
        p_status: p.status,
        p_manager_note: p.managerNote?.trim() || null,
      })
      if (error) {
        const msg = error.message ?? 'Could not resolve doctor request'
        if (error.code === '23505' || msg.includes('chemists_sub_area_id_name_key')) {
          throw new Error(
            'Could not approve: a chemist with this name already exists in the area. Please try again.',
          )
        }
        throw new Error(msg)
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['doctor-add-requests-mgr'] })
      qc.invalidateQueries({ queryKey: ['doctor-add-requests-mr'] })
      qc.invalidateQueries({ queryKey: ['mr-doctors'] })
      qc.invalidateQueries({ queryKey: ['master-list-completion'] })
      qc.invalidateQueries({ queryKey: ['manager-pending-counts'] })
      qc.invalidateQueries({ queryKey: ['user-notifications'] })
    },
  })
}
