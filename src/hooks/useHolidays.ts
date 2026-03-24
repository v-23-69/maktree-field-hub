import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Holiday, MrHoliday } from '@/types/database.types'

export function useHolidays() {
  return useQuery({
    queryKey: ['holidays'],
    enabled: !!supabase,
    queryFn: async (): Promise<Holiday[]> => {
      if (!supabase) throw new Error('Supabase not configured')
      const { data, error } = await supabase
        .from('holidays')
        .select('*')
        .order('holiday_date', { ascending: true })
      if (error) throw error
      return (data ?? []) as Holiday[]
    },
  })
}

export function useMrHolidays(mrId: string) {
  return useQuery({
    queryKey: ['mr-holidays', mrId],
    enabled: !!mrId && !!supabase,
    queryFn: async (): Promise<MrHoliday[]> => {
      if (!supabase) throw new Error('Supabase not configured')
      const { data, error } = await supabase
        .from('mr_holidays')
        .select('*, holiday:holidays(*)')
        .eq('mr_id', mrId)
      if (error) throw error
      return (data ?? []) as MrHoliday[]
    },
  })
}

export function useCreateHoliday() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      name: string
      holiday_date: string
      holiday_type: 'national' | 'company'
      created_by: string
    }) => {
      if (!supabase) throw new Error('Supabase not configured')
      const { error } = await supabase.from('holidays').insert(payload)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['holidays'] }),
  })
}

export function useAssignHolidayToMr() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { mrId: string; holidayId: string; assignedBy: string }) => {
      if (!supabase) throw new Error('Supabase not configured')
      const { error } = await supabase.rpc('assign_holiday_to_mr', {
        p_mr_id: payload.mrId,
        p_holiday_id: payload.holidayId,
        p_assigned_by: payload.assignedBy,
      })
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mr-holidays'] }),
  })
}
