import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type {
  Doctor,
  MasterListCompletion,
} from '@/types/database.types'

export function useMasterListByMr(mrId: string) {
  return useQuery({
    queryKey: ['master-list-completion', mrId],
    queryFn: async (): Promise<MasterListCompletion[]> => {
      if (!supabase) throw new Error('Supabase not configured')
      const { data, error } = await supabase
        .from('v_master_list_completion')
        .select('*')
        .eq('mr_id', mrId)
        .order('area')
        .order('sub_area')
      if (error) throw error
      return (data ?? []) as MasterListCompletion[]
    },
    enabled: !!mrId && !!supabase,
  })
}

export function useDoctorDetail(doctorId: string | null) {
  return useQuery({
    queryKey: ['doctor-detail', doctorId],
    queryFn: async (): Promise<Doctor | null> => {
      if (!supabase) throw new Error('Supabase not configured')
      if (!doctorId) return null
      const { data, error } = await supabase
        .from('doctors')
        .select('*')
        .eq('id', doctorId)
        .maybeSingle()
      if (error) throw error
      return (data ?? null) as Doctor | null
    },
    enabled: !!doctorId && !!supabase,
  })
}

function normalizeNullableString(v: string): string | null {
  const t = v.trim()
  return t ? t : null
}

export function useUpdateDoctorDetail() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (p: {
      doctorId: string
      qualification: string
      address: string
      city: string
      mobile: string
      birthday: string
      marriage_anniversary: string
      visit_frequency: 'weekly' | 'fortnightly' | 'monthly' | null
      speciality: string
    }) => {
      if (!supabase) throw new Error('Supabase not configured')

      const { error } = await supabase.from('doctors').update({
        qualification: normalizeNullableString(p.qualification),
        address: normalizeNullableString(p.address),
        city: normalizeNullableString(p.city),
        mobile: normalizeNullableString(p.mobile),
        birthday: p.birthday ? p.birthday : null,
        marriage_anniversary: p.marriage_anniversary ? p.marriage_anniversary : null,
        visit_frequency: p.visit_frequency,
        speciality: normalizeNullableString(p.speciality),
      }).eq('id', p.doctorId)

      if (error) throw error
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['doctor-detail', vars.doctorId] })
      queryClient.invalidateQueries({ queryKey: ['master-list-completion'] })
      queryClient.invalidateQueries({ queryKey: ['mr-doctors'] })
    },
  })
}

export function useAddDoctorToSubArea() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (p: {
      mrId: string
      subAreaId: string
      fullName: string
      speciality: string
      qualification: string
      address: string
      city: string
      mobile: string
      birthday: string
      marriage_anniversary: string
      visit_frequency: 'weekly' | 'fortnightly' | 'monthly' | null
    }): Promise<{ id: string }> => {
      if (!supabase) throw new Error('Supabase not configured')

      const { data: inserted, error: insErr } = await supabase
        .from('doctors')
        .insert({
          sub_area_id: p.subAreaId,
          full_name: p.fullName.trim(),
          speciality: normalizeNullableString(p.speciality),
          qualification: normalizeNullableString(p.qualification),
          address: normalizeNullableString(p.address),
          city: normalizeNullableString(p.city),
          mobile: normalizeNullableString(p.mobile),
          birthday: p.birthday ? p.birthday : null,
          marriage_anniversary: p.marriage_anniversary ? p.marriage_anniversary : null,
          visit_frequency: p.visit_frequency,
          doctor_code: '',
          is_active: true,
        })
        .select('id')
        .single()

      if (insErr) throw insErr
      const id = (inserted as { id: string }).id

      // Ensure MR already has access to the sub-area (should exist, but make it idempotent).
      const { data: existingAccess, error: exErr } = await supabase
        .from('mr_sub_area_access')
        .select('id')
        .eq('mr_id', p.mrId)
        .eq('sub_area_id', p.subAreaId)
        .maybeSingle()
      if (exErr) throw exErr

      if (!existingAccess?.id) {
        const { error: aErr } = await supabase
          .from('mr_sub_area_access')
          .insert({ mr_id: p.mrId, sub_area_id: p.subAreaId })
        if (aErr) throw aErr
      }

      return { id }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['master-list-completion'] })
      queryClient.invalidateQueries({ queryKey: ['mr-doctors'] })
    },
  })
}

