import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { ReportIssue } from '@/types/database.types'

type IssueRowWithMr = ReportIssue & {
  mr_full_name?: string
}

export function useManagerReportIssues(managerId: string) {
  return useQuery({
    queryKey: ['manager-report-issues', managerId],
    enabled: !!managerId && !!supabase,
    queryFn: async (): Promise<IssueRowWithMr[]> => {
      if (!supabase) throw new Error('Supabase not configured')
      const rpc = await supabase.rpc('list_report_issues_for_manager')
      if (rpc.error) throw rpc.error
      return (rpc.data ?? []) as IssueRowWithMr
    },
  })
}

export function useUpdateReportIssue() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (p: {
      issueId: string
      status: 'reviewed' | 'resolved'
      managerNote: string
    }): Promise<void> => {
      if (!supabase) throw new Error('Supabase not configured')
      const { error } = await supabase
        .from('report_issues')
        .update({
          status: p.status,
          manager_note: p.managerNote.trim() || null,
        })
        .eq('id', p.issueId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manager-report-issues'] })
    },
  })
}

