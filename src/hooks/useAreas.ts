import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Area, SubArea } from '@/types/database.types'

type MrAccessRow = {
  sub_area_id: string
  sub_areas:
    | {
        id: string
        name: string
        code: string
        is_active: boolean
        areas: { id: string; name: string; code: string } | null
      }
    | {
        id: string
        name: string
        code: string
        is_active: boolean
        areas: { id: string; name: string; code: string } | null
      }[]
    | null
}

function normalizeSubAreaEmbed(
  embed: MrAccessRow['sub_areas'],
): {
  id: string
  name: string
  code: string
  is_active: boolean
  areas: { id: string; name: string; code: string } | null
} | null {
  if (!embed) return null
  return Array.isArray(embed) ? embed[0] ?? null : embed
}

/** MR: sub-areas from mr_sub_area_access, grouped by parent area (for chip UI). */
export function useMrSubAreas(mrId: string) {
  return useQuery({
    queryKey: ['mr-sub-areas', mrId],
    queryFn: async (): Promise<SubArea[]> => {
      if (!supabase) throw new Error('Supabase not configured')
      try {
        const { data, error } = await supabase
          .from('mr_sub_area_access')
          .select(`
            sub_area_id,
            sub_areas (
              id,
              name,
              code,
              is_active,
              areas (
                id,
                name,
                code
              )
            )
          `)
          .eq('mr_id', mrId)
        if (error) throw error
        const rows = (data ?? []) as MrAccessRow[]
        const list: SubArea[] = []
        for (const r of rows) {
          const sa = normalizeSubAreaEmbed(r.sub_areas)
          if (!sa || sa.is_active === false) continue
          const ar = sa.areas
          list.push({
            id: sa.id,
            area_id: ar?.id ?? '',
            name: sa.name,
            code: sa.code,
            is_active: sa.is_active,
            created_at: '',
            area: ar
              ? {
                  id: ar.id,
                  name: ar.name,
                  code: ar.code,
                  is_active: true,
                  created_at: '',
                }
              : undefined,
          })
        }
        list.sort((a, b) => {
          const an = a.area?.name ?? ''
          const bn = b.area?.name ?? ''
          if (an !== bn) return an.localeCompare(bn)
          return a.name.localeCompare(b.name)
        })
        return list
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Failed to load areas'
        throw new Error(message)
      }
    },
    enabled: !!mrId && !!supabase,
  })
}

/** Shape returned by useMrSubAreasGrouped — areas with nested sub-areas for MR Step 2. */
export interface MrAreaGroup {
  area: { id: string; name: string }
  sub_areas: { id: string; name: string; code: string }[]
}

export function buildMrAreaGroups(subAreas: SubArea[]): MrAreaGroup[] {
  const map = new Map<string, MrAreaGroup>()
  for (const sa of subAreas) {
    const area = sa.area
    if (!area) continue
    let g = map.get(area.id)
    if (!g) {
      g = { area: { id: area.id, name: area.name }, sub_areas: [] }
      map.set(area.id, g)
    }
    g.sub_areas.push({ id: sa.id, name: sa.name, code: sa.code })
  }
  return Array.from(map.values()).sort((a, b) =>
    a.area.name.localeCompare(b.area.name),
  )
}

/** MR Step 2: same data as useMrSubAreas, grouped by parent area. */
export function useMrSubAreasGrouped(mrId: string) {
  const q = useMrSubAreas(mrId)
  const grouped = buildMrAreaGroups(q.data ?? [])
  return {
    ...q,
    data: grouped,
  }
}

/** Group MR sub-areas by area for Step 2 chips. */
export function groupSubAreasByArea(subAreas: SubArea[]): { area: Area; subAreas: SubArea[] }[] {
  const map = new Map<string, { area: Area; subAreas: SubArea[] }>()
  for (const sa of subAreas) {
    const area = sa.area
    if (!area) continue
    const existing = map.get(area.id)
    if (existing) {
      existing.subAreas.push(sa)
    } else {
      map.set(area.id, { area, subAreas: [sa] })
    }
  }
  return Array.from(map.values()).sort((a, b) =>
    a.area.name.localeCompare(b.area.name),
  )
}

/** Admin / manager: all active areas with active sub-areas (nested). */
export function useAllAreas() {
  return useQuery({
    queryKey: ['all-areas'],
    queryFn: async (): Promise<(Area & { sub_areas: SubArea[] })[]> => {
      if (!supabase) throw new Error('Supabase not configured')
      try {
        const { data, error } = await supabase
          .from('areas')
          .select('*, sub_areas(*)')
          .eq('is_active', true)
          .order('name')
        if (error) throw error
        const areas = (data ?? []) as (Area & { sub_areas: SubArea[] })[]
        return areas.map(a => ({
          ...a,
          sub_areas: (a.sub_areas ?? []).filter(sa => sa.is_active),
        }))
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Failed to load areas'
        throw new Error(message)
      }
    },
    enabled: !!supabase,
  })
}
