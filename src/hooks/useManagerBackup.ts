import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export type MonthNeedingBackup = { month_start: string; month_label: string }

export function useMonthsNeedingBackup(managerId: string) {
  return useQuery({
    queryKey: ['manager-backup-reminder', managerId],
    enabled: !!managerId && !!supabase,
    staleTime: 60_000,
    queryFn: async (): Promise<MonthNeedingBackup[]> => {
      if (!supabase) return []
      const { data, error } = await supabase.rpc('manager_months_needing_backup', {
        p_months_back: 6,
      })
      if (error) {
        if (error.code === 'PGRST202') return []
        throw error
      }
      return (data ?? []) as MonthNeedingBackup[]
    },
  })
}

export function useLogManagerBackup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (p: {
      periodStart: string
      periodEnd: string
      subjectUserIds: string[]
      fileName: string
      backupLabel?: string
    }) => {
      if (!supabase) throw new Error('Supabase not configured')
      const { data, error } = await supabase.rpc('log_manager_backup', {
        p_period_start: p.periodStart,
        p_period_end: p.periodEnd,
        p_subject_user_ids: p.subjectUserIds,
        p_file_name: p.fileName,
        p_backup_label: p.backupLabel ?? null,
      })
      if (error) {
        if (error.code === 'PGRST202') return null
        throw error
      }
      return data as string | null
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manager-backup-reminder'] })
    },
  })
}
