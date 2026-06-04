import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { LIVE_QUERY_OPTIONS } from '@/lib/liveQueryOptions'

export type ManagerCustomArea = {
  custom_area_id: string
  name: string
  sub_area_id: string
  territory_area_id: string | null
  territory_name: string | null
  doctor_count: number
  visit_count: number
  created_at: string
}

export type ManagerCustomAreasSummary = {
  area_count: number
  doctor_count: number
  visit_count: number
}

export function useManagerCustomAreas() {
  return useQuery({
    queryKey: ['manager-custom-areas'],
    ...LIVE_QUERY_OPTIONS,
    enabled: !!supabase,
    queryFn: async (): Promise<ManagerCustomArea[]> => {
      if (!supabase) throw new Error('Supabase not configured')
      const { data, error } = await supabase.rpc('list_manager_custom_areas')
      if (error) throw error
      return (data ?? []) as ManagerCustomArea[]
    },
  })
}

export function useManagerCustomAreasSummary() {
  return useQuery({
    queryKey: ['manager-custom-areas-summary'],
    ...LIVE_QUERY_OPTIONS,
    enabled: !!supabase,
    queryFn: async (): Promise<ManagerCustomAreasSummary> => {
      if (!supabase) throw new Error('Supabase not configured')
      const { data, error } = await supabase.rpc('get_manager_custom_areas_summary')
      if (error) throw error
      const row = data as ManagerCustomAreasSummary | null
      return row ?? { area_count: 0, doctor_count: 0, visit_count: 0 }
    },
  })
}

export function useCreateManagerCustomArea() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (name: string) => {
      if (!supabase) throw new Error('Supabase not configured')
      const { data, error } = await supabase.rpc('create_manager_custom_area', { p_name: name })
      if (error) throw error
      return data as string
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['manager-custom-areas'] })
      qc.invalidateQueries({ queryKey: ['manager-custom-areas-summary'] })
      qc.invalidateQueries({ queryKey: ['mr-sub-areas'] })
    },
  })
}

export function useAddDoctorToCustomArea() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (p: {
      customAreaId: string
      fullName: string
      speciality?: string
      mobile?: string
    }) => {
      if (!supabase) throw new Error('Supabase not configured')
      const { data, error } = await supabase.rpc('add_doctor_to_manager_custom_area', {
        p_custom_area_id: p.customAreaId,
        p_full_name: p.fullName,
        p_speciality: p.speciality ?? null,
        p_mobile: p.mobile ?? null,
      })
      if (error) throw error
      return data as string
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['manager-custom-areas'] })
      qc.invalidateQueries({ queryKey: ['manager-custom-areas-summary'] })
      qc.invalidateQueries({ queryKey: ['doctors'] })
    },
  })
}

export function useAssignCustomAreasToTerritory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (p: { customAreaIds: string[]; territoryAreaId: string }) => {
      if (!supabase) throw new Error('Supabase not configured')
      const { data, error } = await supabase.rpc('assign_manager_custom_areas_to_territory', {
        p_custom_area_ids: p.customAreaIds,
        p_territory_area_id: p.territoryAreaId,
      })
      if (error) throw error
      return data as number
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['manager-custom-areas'] })
      qc.invalidateQueries({ queryKey: ['mr-sub-areas'] })
      qc.invalidateQueries({ queryKey: ['all-areas'] })
    },
  })
}

export function useCreateTerritoryWithSubAreas() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (p: {
      territoryName: string
      subAreaIds: string[]
      assignMrIds?: string[]
    }) => {
      if (!supabase) throw new Error('Supabase not configured')
      const { data, error } = await supabase.rpc('create_territory_with_sub_areas', {
        p_territory_name: p.territoryName,
        p_sub_area_ids: p.subAreaIds,
        p_assign_mr_ids: p.assignMrIds ?? [],
      })
      if (error) throw error
      return data as string
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['manager-custom-areas'] })
      qc.invalidateQueries({ queryKey: ['mr-sub-areas'] })
      qc.invalidateQueries({ queryKey: ['all-areas'] })
    },
  })
}

export function useReportImportMrNames(mrId: string) {
  return useQuery({
    queryKey: ['report-import-mr-names', mrId],
    enabled: !!mrId && !!supabase,
    queryFn: async (): Promise<Map<string, string[]>> => {
      if (!supabase) throw new Error('Supabase not configured')
      const { data, error } = await supabase.rpc('list_report_import_mr_names', {
        p_mr_id: mrId,
      })
      if (error) throw error
      const map = new Map<string, string[]>()
      for (const row of (data ?? []) as { report_id: string; mr_names: string[] }[]) {
        map.set(row.report_id, row.mr_names ?? [])
      }
      return map
    },
  })
}
