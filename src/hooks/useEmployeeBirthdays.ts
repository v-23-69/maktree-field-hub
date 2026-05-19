import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { todayInputDate } from '@/lib/dateUtils'
import { LIVE_QUERY_OPTIONS } from '@/lib/liveQueryOptions'
import type { EmployeeBirthdayToday, BirthdayWishRow } from '@/types/database.types'

const todayKey = () => todayInputDate()

export function useEmployeesBirthdayToday(enabled = true) {
  const istToday = todayKey()
  return useQuery({
    queryKey: ['employees-birthday-today', istToday],
    enabled: enabled && !!supabase,
    ...LIVE_QUERY_OPTIONS,
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<EmployeeBirthdayToday[]> => {
      if (!supabase) return []
      const { data, error } = await supabase.rpc('get_employees_birthday_today')
      if (error) throw error
      return (data ?? []) as EmployeeBirthdayToday[]
    },
  })
}

export function useBirthdayWishesToday(recipientId: string | undefined) {
  const istToday = todayKey()
  return useQuery({
    queryKey: ['birthday-wishes-today', recipientId, istToday],
    enabled: !!supabase && !!recipientId,
    ...LIVE_QUERY_OPTIONS,
    staleTime: 30_000,
    queryFn: async (): Promise<BirthdayWishRow[]> => {
      if (!supabase || !recipientId) return []
      const { data, error } = await supabase.rpc('get_birthday_wishes_today', {
        p_recipient_id: recipientId,
      })
      if (error) throw error
      return (data ?? []) as BirthdayWishRow[]
    },
  })
}

export function useSendBirthdayWish() {
  const queryClient = useQueryClient()
  const istToday = todayKey()
  return useMutation({
    mutationFn: async (payload: {
      recipientId: string
      message: string
    }) => {
      if (!supabase) throw new Error('Supabase not configured')
      const message = payload.message.trim()
      if (!message) throw new Error('Please write a wish')
      const { error } = await supabase.rpc('send_birthday_wish', {
        p_recipient_id: payload.recipientId,
        p_message: message,
      })
      if (error) throw error
    },
    onSuccess: (_data, vars) => {
      void queryClient.invalidateQueries({
        queryKey: ['birthday-wishes-today', vars.recipientId, istToday],
      })
    },
  })
}
