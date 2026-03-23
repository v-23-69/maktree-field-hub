import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

function codeFromName(name: string, max = 8): string {
  const alnum = name.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
  const slice = alnum.slice(0, Math.min(Math.max(3, alnum.length), max))
  return slice || 'AREA'
}

export function useAddArea() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (name: string) => {
      if (!supabase) throw new Error('Supabase not configured')
      try {
        const trimmed = name.trim()
        if (!trimmed) throw new Error('Area name is required')
        const code = codeFromName(trimmed)
        const { error } = await supabase.from('areas').insert({
          name: trimmed,
          code,
          is_active: true,
        })
        if (error) throw error
      } catch (e) {
        const message =
          e instanceof Error ? e.message : 'Could not add area'
        throw new Error(message)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-areas'] })
    },
  })
}

export function useAddSubArea() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (p: { areaId: string; name: string }) => {
      if (!supabase) throw new Error('Supabase not configured')
      try {
        const trimmed = p.name.trim()
        if (!trimmed) throw new Error('Sub-area name is required')
        const code = codeFromName(trimmed, 8)
        const { error } = await supabase.from('sub_areas').insert({
          area_id: p.areaId,
          name: trimmed,
          code,
          is_active: true,
        })
        if (error) throw error
      } catch (e) {
        const message =
          e instanceof Error ? e.message : 'Could not add sub-area'
        throw new Error(message)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-areas'] })
      queryClient.invalidateQueries({ queryKey: ['mr-sub-areas'] })
    },
  })
}
