import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { DOCTOR_LIST_COLUMNS } from '@/lib/doctorQueryColumns'
import type { Doctor } from '@/types/database.types'

export const MR_DOCTORS_PAGE_SIZE = 80

export type MrDoctorsPageResult = {
  rows: Doctor[]
  totalCount: number
  page: number
  pageSize: number
  hasMore: boolean
}

function escapeIlike(term: string): string {
  return term.replace(/[%_\\]/g, ch => `\\${ch}`)
}

export function useMrDoctorsPaginated(
  mrId: string,
  subAreaId: string | null,
  search: string,
  page: number,
) {
  return useQuery({
    queryKey: ['mr-doctors', mrId, subAreaId, search, page],
    enabled: !!mrId && !!subAreaId && !!supabase,
    placeholderData: previous => previous,
    queryFn: async (): Promise<MrDoctorsPageResult> => {
      if (!supabase || !subAreaId) throw new Error('Supabase not configured')

      let q = supabase
        .from('doctors')
        .select(DOCTOR_LIST_COLUMNS, { count: 'exact' })
        .eq('sub_area_id', subAreaId)
        .eq('is_active', true)

      const term = search.trim()
      if (term) {
        const t = escapeIlike(term)
        q = q.or(`full_name.ilike.%${t}%,speciality.ilike.%${t}%`)
      }

      const from = page * MR_DOCTORS_PAGE_SIZE
      const to = from + MR_DOCTORS_PAGE_SIZE - 1

      const { data, error, count } = await q.order('full_name', { ascending: true }).range(from, to)
      if (error) throw error

      const totalCount = count ?? 0
      const rows = (data ?? []) as Doctor[]

      return {
        rows,
        totalCount,
        page,
        pageSize: MR_DOCTORS_PAGE_SIZE,
        hasMore: from + rows.length < totalCount,
      }
    },
  })
}
