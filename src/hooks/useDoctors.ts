import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useMrSubAreas } from '@/hooks/useAreas'
import type { Doctor, Chemist, SubArea } from '@/types/database.types'

function isForbidden(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false
  return error.code === '42501' || /forbidden/i.test(error.message ?? '')
}

export function intersectSubAreaIds(
  selectedSubAreaIds: string[],
  assignedSubAreas: SubArea[],
): string[] {
  const allowed = new Set(assignedSubAreas.map(sa => sa.id))
  return [...new Set(selectedSubAreaIds.filter(id => allowed.has(id)))]
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

/** DCR visits: only doctors in sub-areas assigned to this MR/manager and selected for today. */
export function useDoctorsForMrDcr(mrId: string, selectedSubAreaIds: string[]) {
  const { data: assignedSubAreas = [], isLoading: areasLoading } = useMrSubAreas(mrId)
  const allowedSubAreaIds = useMemo(
    () => intersectSubAreaIds(selectedSubAreaIds, assignedSubAreas),
    [selectedSubAreaIds, assignedSubAreas],
  )

  const query = useQuery({
    queryKey: ['doctors-for-mr-dcr', mrId, allowedSubAreaIds],
    queryFn: async (): Promise<Doctor[]> => {
      if (!supabase) throw new Error('Supabase not configured')
      try {
        const { data, error } = await supabase.rpc('list_doctors_for_mr_dcr', {
          p_mr_id: mrId,
          p_sub_area_ids: allowedSubAreaIds,
        })
        if (!error && Array.isArray(data)) {
          const subAreaById = new Map(assignedSubAreas.map(sa => [sa.id, sa]))
          return (data as Doctor[]).map(d => ({
            ...d,
            sub_area: subAreaById.get(d.sub_area_id) ?? null,
          }))
        }
        if (error?.code !== 'PGRST202' && error?.code !== '42883') {
          if (isForbidden(error)) return []
          throw error
        }
        const { data: fallback, error: fbErr } = await supabase
          .from('doctors')
          .select('*, sub_area:sub_areas(*)')
          .in('sub_area_id', allowedSubAreaIds)
          .eq('is_active', true)
          .order('sub_area_id', { ascending: true })
          .order('full_name', { ascending: true })
        if (fbErr) {
          if (isForbidden(fbErr)) return []
          throw fbErr
        }
        return (fallback ?? []) as Doctor[]
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Failed to load doctors'
        throw new Error(message)
      }
    },
    enabled: !!mrId && allowedSubAreaIds.length > 0 && !!supabase,
    retry: false,
  })

  return {
    ...query,
    isLoading: areasLoading || query.isLoading,
    allowedSubAreaIds,
  }
}

type ChemistMapRow = {
  chemist_id: string
  chemists: {
    id: string
    name: string
    sub_area_id: string
    owner_name?: string | null
    owner_contact?: string | null
    address?: string | null
    city?: string | null
    mobile?: string | null
  } | null
}

export function useChemistsByDoctor(doctorId: string) {
  return useQuery({
    queryKey: ['chemists-by-doctor', doctorId],
    queryFn: async (): Promise<Chemist[]> => {
      if (!supabase) throw new Error('Supabase not configured')
      try {
        const { data, error } = await supabase
          .from('chemist_doctor_map')
          .select('chemist_id, chemists(id, name, sub_area_id, owner_name, owner_contact, address, city, mobile)')
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
            owner_name: c.owner_name ?? null,
            owner_contact: c.owner_contact ?? null,
            address: c.address ?? null,
            city: c.city ?? null,
            mobile: c.mobile ?? null,
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

export function useChemistsBySubArea(subAreaId: string) {
  return useQuery({
    queryKey: ['chemists-by-subarea', subAreaId],
    queryFn: async (): Promise<Chemist[]> => {
      if (!supabase) throw new Error('Supabase not configured')
      try {
        const { data, error } = await supabase
          .from('chemists')
          .select('id, name, sub_area_id')
          .eq('sub_area_id', subAreaId)
          .eq('is_active', true)
          .order('name')
          .limit(100)
        if (error) {
          if (isForbidden(error)) return []
          throw error
        }
        return (data ?? []).map(c => ({
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
    enabled: !!subAreaId && !!supabase,
    retry: false,
  })
}
