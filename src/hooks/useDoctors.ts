import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Doctor, Chemist } from '@/types/database.types'

function isForbidden(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false
  return error.code === '42501' || /forbidden/i.test(error.message ?? '')
}

export function useDoctorsBySubAreas(subAreaIds: string[]) {
  return useQuery({
    queryKey: ['doctors-by-sub-areas', subAreaIds],
    queryFn: async (): Promise<Doctor[]> => {
      if (!supabase) throw new Error('Supabase not configured')
      try {
        const { data, error } = await supabase
          .from('doctors')
          .select('*, sub_area:sub_areas(*)')
          .in('sub_area_id', subAreaIds)
          .eq('is_active', true)
          .order('sub_area_id', { ascending: true })
          .order('full_name', { ascending: true })
        if (error) {
          if (isForbidden(error)) return []
          throw error
        }
        return (data ?? []) as Doctor[]
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Failed to load doctors'
        throw new Error(message)
      }
    },
    enabled: subAreaIds.length > 0 && !!supabase,
    retry: false,
  })
}

type ChemistMapRow = {
  chemist_id: string
  chemists: { id: string; name: string; sub_area_id: string } | null
}

export function useChemistsByDoctor(doctorId: string) {
  return useQuery({
    queryKey: ['chemists-by-doctor', doctorId],
    queryFn: async (): Promise<Chemist[]> => {
      if (!supabase) throw new Error('Supabase not configured')
      try {
        const { data, error } = await supabase
          .from('chemist_doctor_map')
          .select('chemist_id, chemists(id, name, sub_area_id)')
          .eq('doctor_id', doctorId)
        if (error) {
          if (isForbidden(error)) return []
          throw error
        }
        const rows = (data ?? []) as ChemistMapRow[]
        return rows
          .map(r => r.chemists)
          .filter((c): c is NonNullable<typeof c> => !!c)
          .map(c => ({
            id: c.id,
            sub_area_id: c.sub_area_id,
            name: c.name,
            is_active: true,
            created_at: '',
          }))
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Failed to load chemists'
        throw new Error(message)
      }
    },
    enabled: !!doctorId && !!supabase,
    retry: false,
  })
}
