import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Doctor, Chemist } from '@/types/database.types'

export function useDoctorsBySubAreas(subAreaIds: string[]) {
  return useQuery({
    queryKey: ['doctors-by-sub-areas', subAreaIds],
    queryFn: async (): Promise<Doctor[]> => {
      if (!supabase) throw new Error('Supabase not configured')
      const { data, error } = await supabase
        .from('doctors')
        .select('*, sub_area:sub_areas(*)')
        .in('sub_area_id', subAreaIds)
        .eq('is_active', true)
        .order('full_name')
      if (error) throw error
      return data as Doctor[]
    },
    enabled: subAreaIds.length > 0 && !!supabase,
  })
}

export function useChemistsByDoctor(doctorId: string) {
  return useQuery({
    queryKey: ['chemists-by-doctor', doctorId],
    queryFn: async (): Promise<Chemist[]> => {
      if (!supabase) throw new Error('Supabase not configured')
      const { data, error } = await supabase
        .from('chemist_doctor_maps')
        .select('chemist:chemists(*)')
        .eq('doctor_id', doctorId)
      if (error) throw error
      return (data as any[]).map(d => d.chemist).filter(Boolean) as Chemist[]
    },
    enabled: !!doctorId && !!supabase,
  })
}
