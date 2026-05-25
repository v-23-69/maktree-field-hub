import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface TerritoryVacancySubArea {
  id: string
  name: string
  code: string
  is_assigned: boolean
}

export interface TerritoryVacancySnapshot {
  area_id: string
  area_name: string
  area_code: string
  has_coverage: boolean
  total_sub_areas: number
  assigned_sub_areas: number
  sub_areas: TerritoryVacancySubArea[]
}

export interface SubAreaAssignee {
  sub_area_id: string
  mr_id: string
  full_name: string
}

export type SubAreaAssignmentRow = {
  area_id: string
  area_name: string
  sub_area_id: string
  sub_area_name: string
  user_id: string
  user_full_name: string
  user_role: string
}

export type TerritoryAssignmentDetail = {
  area_id: string
  area_name: string
  sub_areas: Array<{
    id: string
    name: string
    is_assigned: boolean
    assignees: Array<{ user_id: string; full_name: string; role: string; role_label: string }>
  }>
}

function roleLabel(role: string): string {
  if (role === 'manager') return 'Manager'
  if (role === 'mr') return 'MR'
  if (role === 'admin') return 'Admin'
  return role
}

/** System-wide territory coverage (green = any sub-area assigned). */
export function useTerritoryVacancySnapshot() {
  return useQuery({
    queryKey: ['territory-vacancy-snapshot'],
    queryFn: async (): Promise<TerritoryVacancySnapshot[]> => {
      if (!supabase) throw new Error('Supabase not configured')
      const { data, error } = await supabase.rpc('list_territory_vacancy_snapshot')
      if (error) throw new Error(error.message ?? 'Failed to load territory status')
      const rows = (data ?? []) as TerritoryVacancySnapshot[]
      return rows.sort((a, b) => a.area_name.localeCompare(b.area_name))
    },
    enabled: !!supabase,
    staleTime: 30_000,
  })
}

/** Assignees visible to the manager (self + team MRs). */
export function useManagerVisibleSubAreaAssignees(
  managerId: string,
  teamMrs: { id: string; full_name?: string | null }[],
  managerName: string,
) {
  const visibleIds = [managerId, ...teamMrs.map(m => m.id)].filter(Boolean)
  return useQuery({
    queryKey: [
      'manager-sub-area-assignees',
      managerId,
      managerName,
      ...teamMrs.map(m => `${m.id}:${m.full_name ?? ''}`).sort(),
    ],
    queryFn: async (): Promise<SubAreaAssignee[]> => {
      if (!supabase || visibleIds.length === 0) return []
      const nameById = new Map<string, string>()
      nameById.set(managerId, managerName)
      for (const m of teamMrs) nameById.set(m.id, m.full_name ?? 'MR')
      const { data, error } = await supabase
        .from('mr_sub_area_access')
        .select('sub_area_id, mr_id')
        .in('mr_id', visibleIds)
      if (error) throw new Error(error.message ?? 'Failed to load assignments')
      return (data ?? [])
        .filter(r => r.sub_area_id && r.mr_id)
        .map(r => ({
          sub_area_id: r.sub_area_id as string,
          mr_id: r.mr_id as string,
          full_name: nameById.get(r.mr_id as string) ?? 'Unknown',
        }))
    },
    enabled: !!supabase && !!managerId && visibleIds.length > 0,
    staleTime: 15_000,
  })
}

/** All sub-area assignments with assignee names and roles (manager dashboard). */
export function useTerritoryAssignmentDetails() {
  return useQuery({
    queryKey: ['territory-assignment-details'],
    queryFn: async (): Promise<TerritoryAssignmentDetail[]> => {
      if (!supabase) throw new Error('Supabase not configured')

      const [snapRes, assignRes] = await Promise.all([
        supabase.rpc('list_territory_vacancy_snapshot'),
        supabase.rpc('list_sub_area_assignments_for_manager'),
      ])
      if (snapRes.error) throw new Error(snapRes.error.message ?? 'Failed to load territories')
      if (assignRes.error) throw new Error(assignRes.error.message ?? 'Failed to load assignments')

      const assignBySubArea = new Map<
        string,
        Array<{ user_id: string; full_name: string; role: string; role_label: string }>
      >()
      for (const r of (assignRes.data ?? []) as SubAreaAssignmentRow[]) {
        const list = assignBySubArea.get(r.sub_area_id) ?? []
        list.push({
          user_id: r.user_id,
          full_name: r.user_full_name?.trim() || 'Unknown',
          role: r.user_role,
          role_label: roleLabel(r.user_role),
        })
        assignBySubArea.set(r.sub_area_id, list)
      }

      const territories = ((snapRes.data ?? []) as TerritoryVacancySnapshot[]).sort((a, b) =>
        a.area_name.localeCompare(b.area_name),
      )
      return territories.map(t => ({
        area_id: t.area_id,
        area_name: t.area_name,
        sub_areas: (t.sub_areas ?? []).map(sa => ({
          id: sa.id,
          name: sa.name,
          is_assigned: sa.is_assigned,
          assignees: assignBySubArea.get(sa.id) ?? [],
        })),
      }))
    },
    enabled: !!supabase,
    staleTime: 30_000,
  })
}

export function useInvalidateTerritoryVacancy() {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({ queryKey: ['territory-vacancy-snapshot'] })
    queryClient.invalidateQueries({ queryKey: ['territory-assignment-details'] })
    queryClient.invalidateQueries({ queryKey: ['manager-sub-area-assignees'] })
    queryClient.invalidateQueries({ queryKey: ['mr-access'] })
    queryClient.invalidateQueries({ queryKey: ['mr-sub-areas'] })
    queryClient.invalidateQueries({ queryKey: ['all-areas'] })
  }
}
