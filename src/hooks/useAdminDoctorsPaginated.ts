import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { DOCTOR_LIST_WITH_SUBAREA } from '@/lib/doctorQueryColumns'
import type { DoctorWithArea } from '@/hooks/useAdminDoctors'

export const ADMIN_DOCTORS_PAGE_SIZE = 50

export type AdminDoctorsPageParams = {
  areaId: string
  subAreaId: string
  search: string
  page: number
  subAreaIdsForArea: string[]
}

export type AdminDoctorsPageResult = {
  rows: DoctorWithArea[]
  totalCount: number
  page: number
  pageSize: number
  hasMore: boolean
}

function escapeIlike(term: string): string {
  return term.replace(/[%_\\]/g, ch => `\\${ch}`)
}

export function useAdminDoctorsPaginated(params: AdminDoctorsPageParams) {
  const { areaId, subAreaId, search, page, subAreaIdsForArea } = params

  return useQuery({
    queryKey: ['admin-doctors', areaId, subAreaId, search, page, subAreaIdsForArea],
    queryFn: async (): Promise<AdminDoctorsPageResult> => {
      if (!supabase) throw new Error('Supabase not configured')

      let q = supabase
        .from('doctors')
        .select(DOCTOR_LIST_WITH_SUBAREA, { count: 'exact' })
        .eq('is_active', true)

      if (subAreaId) {
        q = q.eq('sub_area_id', subAreaId)
      } else if (areaId) {
        if (subAreaIdsForArea.length === 0) {
          return {
            rows: [],
            totalCount: 0,
            page,
            pageSize: ADMIN_DOCTORS_PAGE_SIZE,
            hasMore: false,
          }
        }
        q = q.in('sub_area_id', subAreaIdsForArea)
      }

      const term = search.trim()
      if (term) {
        const t = escapeIlike(term)
        q = q.or(
          `full_name.ilike.%${t}%,speciality.ilike.%${t}%,doctor_code.ilike.%${t}%`,
        )
      }

      const from = page * ADMIN_DOCTORS_PAGE_SIZE
      const to = from + ADMIN_DOCTORS_PAGE_SIZE - 1

      const { data, error, count } = await q.order('full_name', { ascending: true }).range(from, to)
      if (error) throw error

      const totalCount = count ?? 0
      const rows = (data ?? []) as DoctorWithArea[]

      return {
        rows,
        totalCount,
        page,
        pageSize: ADMIN_DOCTORS_PAGE_SIZE,
        hasMore: from + rows.length < totalCount,
      }
    },
    enabled: !!supabase,
    placeholderData: previous => previous,
  })
}
