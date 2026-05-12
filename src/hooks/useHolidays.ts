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
      if (error) {
        if (error.code === '42501' || /forbidden/i.test(error.message)) return []
        throw error
      }
      return (data ?? []) as Holiday[]
    },
    retry: false,
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
      if (error) {
        if (error.code === '42501' || /forbidden/i.test(error.message)) return []
        throw error
      }
      return (data ?? []) as MrHoliday[]
    },
    retry: false,
  })
}

export function useMrHolidayCount(mrId: string) {
  return useQuery({
    queryKey: ['mr-holiday-count', mrId],
    enabled: !!mrId && !!supabase,
    queryFn: async (): Promise<number> => {
      if (!supabase) return 0
      const year = new Date().getFullYear()
      const { count, error } = await supabase
        .from('mr_holidays')
        .select('id', { count: 'exact', head: true })
        .eq('mr_id', mrId)
        .eq('year', year)
      if (error) return 0
      return count ?? 0
    },
    retry: false,
  })
}

export function useMarkMrHoliday() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { mrId: string; holidayDate: string; reason: string; createdBy: string }) => {
      if (!supabase) throw new Error('Supabase not configured')
      const year = new Date(payload.holidayDate).getFullYear()
      const { data: holiday, error: hErr } = await supabase
        .from('holidays')
        .insert({
          name: payload.reason || 'Personal Holiday',
          holiday_date: payload.holidayDate,
          holiday_type: 'company' as const,
          created_by: payload.createdBy,
        })
        .select('id')
        .single()
      if (hErr) throw hErr
      const { error } = await supabase
        .from('mr_holidays')
        .insert({
          mr_id: payload.mrId,
          holiday_id: holiday.id,
          assigned_by: payload.createdBy,
          year,
          counts_as_leave: true,
        })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mr-holidays'] })
      queryClient.invalidateQueries({ queryKey: ['mr-holiday-count'] })
      queryClient.invalidateQueries({ queryKey: ['dcr-daily-status'] })
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
