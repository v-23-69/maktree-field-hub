import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Doctor, SubArea, Area } from '@/types/database.types'

export type DoctorWithArea = Doctor & {
  sub_area?: SubArea & { area?: Area | null }
}

export function useAdminDoctorsList() {
  return useQuery({
    queryKey: ['admin-doctors'],
    queryFn: async (): Promise<DoctorWithArea[]> => {
      if (!supabase) throw new Error('Supabase not configured')
      try {
        const { data, error } = await supabase
          .from('doctors')
          .select('*, sub_area:sub_areas(*, area:areas(*))')
          .eq('is_active', true)
          .order('full_name')
        if (error) throw error
        return (data ?? []) as DoctorWithArea[]
      } catch (e) {
        const message =
          e instanceof Error ? e.message : 'Failed to load doctors'
        throw new Error(message)
      }
    },
    enabled: !!supabase,
  })
}

export function useAddDoctor() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (p: {
      sub_area_id: string
      full_name: string
      speciality: string
    }) => {
      if (!supabase) throw new Error('Supabase not configured')
      try {
        const { error } = await supabase.from('doctors').insert({
          sub_area_id: p.sub_area_id,
          full_name: p.full_name.trim(),
          speciality: p.speciality.trim() || null,
          doctor_code: '',
          is_active: true,
        })
        if (error) throw error
      } catch (e) {
        const message =
          e instanceof Error ? e.message : 'Could not add doctor'
        throw new Error(message)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-doctors'] })
      queryClient.invalidateQueries({ queryKey: ['doctors-by-sub-areas'] })
    },
  })
}

export function useUpdateDoctor() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (p: {
      id: string
      full_name: string
      speciality: string
    }) => {
      if (!supabase) throw new Error('Supabase not configured')
      try {
        const { error } = await supabase
          .from('doctors')
          .update({
            full_name: p.full_name.trim(),
            speciality: p.speciality.trim() || null,
          })
          .eq('id', p.id)
        if (error) throw error
      } catch (e) {
        const message =
          e instanceof Error ? e.message : 'Could not update doctor'
        throw new Error(message)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-doctors'] })
      queryClient.invalidateQueries({ queryKey: ['doctors-by-sub-areas'] })
    },
  })
}

export function useDeactivateDoctor() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (doctorId: string) => {
      if (!supabase) throw new Error('Supabase not configured')
      try {
        const { error } = await supabase
          .from('doctors')
          .update({ is_active: false })
          .eq('id', doctorId)
        if (error) throw error
      } catch (e) {
        const message =
          e instanceof Error ? e.message : 'Could not deactivate doctor'
        throw new Error(message)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-doctors'] })
      queryClient.invalidateQueries({ queryKey: ['doctors-by-sub-areas'] })
    },
  })
}
