import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Target, TargetAchievement } from '@/types/database.types'

type TargetWithAchievement = Target & {
  achievement?: TargetAchievement | null
}

export function useMrTargets(mrId: string) {
  return useQuery({
    queryKey: ['mr-targets', mrId],
    enabled: !!mrId && !!supabase,
    queryFn: async (): Promise<TargetAchievement[]> => {
      if (!supabase) throw new Error('Supabase not configured')
      const { data, error } = await supabase
        .from('v_target_achievement')
        .select('*')
        .eq('mr_id', mrId)
        .order('end_date', { ascending: true })
      if (error) throw error
      return (data ?? []) as TargetAchievement[]
    },
  })
}

export function useManagerTargets(managerId: string) {
  return useQuery({
    queryKey: ['manager-targets', managerId],
    enabled: !!managerId && !!supabase,
    queryFn: async (): Promise<TargetWithAchievement[]> => {
      if (!supabase) throw new Error('Supabase not configured')

      const { data: targets, error: tErr } = await supabase
        .from('targets')
        .select('*')
        .eq('set_by', managerId)
        .order('created_at', { ascending: false })
      if (tErr) throw tErr

      const rows = (targets ?? []) as Target[]
      if (rows.length === 0) return []

      const targetIds = rows.map(r => r.id)
      const { data: ach, error: aErr } = await supabase
        .from('v_target_achievement')
        .select('*')
        .in('target_id', targetIds)
      if (aErr) throw aErr

      const achByTargetId = new Map<string, TargetAchievement>()
      for (const a of (ach ?? []) as TargetAchievement[]) {
        achByTargetId.set(a.target_id, a)
      }

      return rows.map(t => ({
        ...t,
        achievement: achByTargetId.get(t.id) ?? null,
      }))
    },
  })
}

export function useAllTargets() {
  return useQuery({
    queryKey: ['all-targets'],
    enabled: !!supabase,
    queryFn: async (): Promise<TargetWithAchievement[]> => {
      if (!supabase) throw new Error('Supabase not configured')

      const { data: targets, error: tErr } = await supabase
        .from('targets')
        .select('*')
        .order('created_at', { ascending: false })
      if (tErr) throw tErr

      const rows = (targets ?? []) as Target[]
      if (rows.length === 0) return []

      const targetIds = rows.map(r => r.id)
      const { data: ach, error: aErr } = await supabase
        .from('v_target_achievement')
        .select('*')
        .in('target_id', targetIds)
      if (aErr) throw aErr

      const achByTargetId = new Map<string, TargetAchievement>()
      for (const a of (ach ?? []) as TargetAchievement[]) {
        achByTargetId.set(a.target_id, a)
      }

      return rows.map(t => ({
        ...t,
        achievement: achByTargetId.get(t.id) ?? null,
      }))
    },
  })
}

export function useCreateTarget() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      id?: string
      mr_id: string
      product_id: string
      sub_area_id: string | null
      target_qty: number
      start_date: string
      end_date: string
      set_by: string
    }): Promise<void> => {
      if (!supabase) throw new Error('Supabase not configured')

      if (payload.id) {
        const { error } = await supabase
          .from('targets')
          .update({
            mr_id: payload.mr_id,
            product_id: payload.product_id,
            sub_area_id: payload.sub_area_id,
            target_qty: payload.target_qty,
            start_date: payload.start_date,
            end_date: payload.end_date,
            set_by: payload.set_by,
          })
          .eq('id', payload.id)
        if (error) throw error
        return
      }

      const { error } = await supabase
        .from('targets')
        .insert({
          mr_id: payload.mr_id,
          product_id: payload.product_id,
          sub_area_id: payload.sub_area_id,
          target_qty: payload.target_qty,
          start_date: payload.start_date,
          end_date: payload.end_date,
          set_by: payload.set_by,
        })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manager-targets'] })
      queryClient.invalidateQueries({ queryKey: ['all-targets'] })
      queryClient.invalidateQueries({ queryKey: ['mr-targets'] })
    },
  })
}

export function useDeleteTarget() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (targetId: string): Promise<void> => {
      if (!supabase) throw new Error('Supabase not configured')
      const { error } = await supabase.from('targets').delete().eq('id', targetId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manager-targets'] })
      queryClient.invalidateQueries({ queryKey: ['all-targets'] })
      queryClient.invalidateQueries({ queryKey: ['mr-targets'] })
    },
  })
}

