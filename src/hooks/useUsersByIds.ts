import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export type UserNameRow = {
  id: string
  full_name: string | null
  role: string
  employee_code?: string | null
}

export function useUsersByIds(ids: string[]) {
  const key = [...ids].sort().join(',')
  return useQuery({
    queryKey: ['users-by-ids', key],
    enabled: ids.length > 0 && !!supabase,
    queryFn: async (): Promise<UserNameRow[]> => {
      if (!supabase || ids.length === 0) return []
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, role, employee_code')
        .in('id', ids)
      if (error) throw error
      return (data ?? []) as UserNameRow[]
    },
  })
}
