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

      const { data: maps, error: mapErr } = await supabase
        .from('mr_manager_map')
        .select('mr_id')
        .eq('manager_id', managerId)
      if (mapErr) throw mapErr

      const mrIds = [...new Set((maps ?? []).map(m => m.mr_id).filter(Boolean))]
      if (mrIds.length === 0) return []

      const { data: issues, error: issuesErr } = await supabase
        .from('report_issues')
        .select('*')
        .in('mr_id', mrIds)
        .in('status', ['open', 'reviewed'])
        .order('created_at', { ascending: false })
      if (issuesErr) throw issuesErr

      const { data: users, error: uErr } = await supabase
        .from('users')
        .select('id, full_name')
        .in('id', mrIds)
      if (uErr) throw uErr

      const nameById = new Map<string, string>()
      for (const u of users ?? []) nameById.set((u as any).id, (u as any).full_name ?? '')

      return (issues ?? []).map(
        r =>
          ({
            ...(r as any),
            mr_full_name: nameById.get((r as any).mr_id),
          }) as IssueRowWithMr,
      )
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

