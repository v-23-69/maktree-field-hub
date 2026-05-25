import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { generateDoctorCode } from '@/lib/doctorCode'
import { DOCTOR_DETAIL_COLUMNS } from '@/lib/doctorQueryColumns'
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
        .select(
          'mr_id, mr_name, area, sub_area, sub_area_id, total_doctors, complete_doctors, incomplete_doctors, completion_pct',
        )
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
        .select(DOCTOR_DETAIL_COLUMNS)
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

function normalizeOptionalDateYmd(v: string): string | null {
  const t = v.trim()
  return t ? t : null
}

function formatDoctorInsertError(err: { code?: string; message?: string }): string {
  if (err.code === '23505') {
    return 'Could not save this doctor because of a duplicate record. Try again; if it keeps happening, contact support.'
  }
  return err.message || 'Could not add doctor'
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
      monthly_visit_target: number
      speciality: string
    }) => {
      if (!supabase) throw new Error('Supabase not configured')

      const { error } = await supabase.from('doctors').update({
        qualification: normalizeNullableString(p.qualification),
        address: normalizeNullableString(p.address),
        city: normalizeNullableString(p.city),
        mobile: normalizeNullableString(p.mobile),
        birthday: normalizeOptionalDateYmd(p.birthday),
        marriage_anniversary: normalizeOptionalDateYmd(p.marriage_anniversary),
        visit_frequency: p.visit_frequency,
        monthly_visit_target: Math.min(99, Math.max(1, Math.round(p.monthly_visit_target))),
        speciality: normalizeNullableString(p.speciality),
      }).eq('id', p.doctorId)

      if (error) throw error
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['doctor-detail', vars.doctorId] })
      queryClient.invalidateQueries({ queryKey: ['master-list-completion'] })
      queryClient.invalidateQueries({ queryKey: ['mr-doctors'] })
      queryClient.invalidateQueries({ queryKey: ['visit-frequency-progress'] })
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
      monthly_visit_target: number
    }): Promise<{ id: string }> => {
      if (!supabase) throw new Error('Supabase not configured')

      const { data: inserted, error: insErr } = await supabase
        .from('doctors')
        .insert({
          sub_area_id: p.subAreaId,
          doctor_code: generateDoctorCode(),
          full_name: p.fullName.trim(),
          speciality: normalizeNullableString(p.speciality),
          qualification: normalizeNullableString(p.qualification),
          address: normalizeNullableString(p.address),
          city: normalizeNullableString(p.city),
          mobile: normalizeNullableString(p.mobile),
          birthday: normalizeOptionalDateYmd(p.birthday),
          marriage_anniversary: normalizeOptionalDateYmd(p.marriage_anniversary),
          visit_frequency: p.visit_frequency,
          monthly_visit_target: Math.min(99, Math.max(1, Math.round(p.monthly_visit_target))),
          is_active: true,
        })
        .select('id')
        .single()

      if (insErr) throw new Error(formatDoctorInsertError(insErr))

      const id = (inserted as { id: string }).id

      const { error: aErr } = await supabase.rpc('assign_sub_area_to_mr', {
        p_mr_id: p.mrId,
        p_sub_area_id: p.subAreaId,
      })
      if (aErr) throw aErr

      return { id }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['master-list-completion'] })
      queryClient.invalidateQueries({ queryKey: ['mr-doctors'] })
      queryClient.invalidateQueries({ queryKey: ['visit-frequency-progress'] })
    },
  })
}

export type DoctorChemistRowInput = {
  chemistId?: string
  name: string
  ownerName: string
  ownerContact: string
}

export function useSyncDoctorChemists() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (p: {
      doctorId: string
      subAreaId: string
      rows: DoctorChemistRowInput[]
    }) => {
      if (!supabase) throw new Error('Supabase not configured')

      const { data: maps, error: mapErr } = await supabase
        .from('chemist_doctor_map')
        .select('chemist_id')
        .eq('doctor_id', p.doctorId)
      if (mapErr) throw mapErr
      const previousIds = new Set((maps ?? []).map((m: { chemist_id: string }) => m.chemist_id))
      const keptIds = new Set<string>()

      const nonEmpty = p.rows.filter(r => r.name.trim().length > 0)

      for (const row of nonEmpty) {
        const name = row.name.trim()
        const ownerName = normalizeNullableString(row.ownerName)
        const ownerContact = normalizeNullableString(row.ownerContact)

        if (row.chemistId) {
          const { error: uErr } = await supabase
            .from('chemists')
            .update({
              name,
              owner_name: ownerName,
              owner_contact: ownerContact,
            })
            .eq('id', row.chemistId)
            .eq('sub_area_id', p.subAreaId)
          if (uErr) throw uErr
          keptIds.add(row.chemistId)
        } else {
          const { data: inserted, error: insErr } = await supabase
            .from('chemists')
            .insert({
              sub_area_id: p.subAreaId,
              name,
              owner_name: ownerName,
              owner_contact: ownerContact,
              is_active: true,
            })
            .select('id')
            .single()
          if (insErr) throw insErr
          const cid = (inserted as { id: string }).id
          const { error: linkErr } = await supabase.from('chemist_doctor_map').insert({
            chemist_id: cid,
            doctor_id: p.doctorId,
          })
          if (linkErr) throw linkErr
          keptIds.add(cid)
        }
      }

      for (const cid of previousIds) {
        if (keptIds.has(cid)) continue
        const { error: delErr } = await supabase
          .from('chemist_doctor_map')
          .delete()
          .eq('doctor_id', p.doctorId)
          .eq('chemist_id', cid)
        if (delErr) throw delErr
      }
    },
    onSuccess: (_d, vars) => {
      queryClient.invalidateQueries({ queryKey: ['chemists-by-doctor', vars.doctorId] })
      queryClient.invalidateQueries({ queryKey: ['chemists-by-subarea', vars.subAreaId] })
    },
  })
}

