import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { todayInputDate } from '@/lib/dateUtils'

export type MrTodayReportStatus = { mrId: string; submitted: boolean; reportId: string | null }
export type MrTodayExpenseStatus = { mrId: string; status: 'none' | 'draft' | 'submitted' }

export function useTeamMrsTodayReportStatus(mrIds: string[], today = todayInputDate()) {
  return useQuery({
    queryKey: ['manager-mr-today-report-status', mrIds, today],
    enabled: mrIds.length > 0 && !!supabase,
    queryFn: async (): Promise<MrTodayReportStatus[]> => {
      if (!supabase) throw new Error('Supabase not configured')
      const { data, error } = await supabase
        .from('daily_reports')
        .select('id, mr_id, status, report_date')
        .in('mr_id', mrIds)
        .eq('report_date', today)
      if (error) throw error

      const byMr = new Map<string, { submitted: boolean; reportId: string | null }>()
      for (const id of mrIds) byMr.set(id, { submitted: false, reportId: null })
      for (const r of data ?? []) {
        const prev = byMr.get(r.mr_id)
        const submitted = r.status === 'submitted' || !!prev?.submitted
        const reportId =
          r.status === 'submitted' ? r.id : prev?.reportId ?? r.id
        byMr.set(r.mr_id, { submitted, reportId })
      }
      return mrIds.map(id => ({ mrId: id, ...(byMr.get(id) ?? { submitted: false, reportId: null }) }))
    },
  })
}

export function useTeamMrsTodayExpenseStatus(mrIds: string[], today = todayInputDate()) {
  return useQuery({
    queryKey: ['manager-mr-today-expense-status', mrIds, today],
    enabled: mrIds.length > 0 && !!supabase,
    queryFn: async (): Promise<MrTodayExpenseStatus[]> => {
      if (!supabase) throw new Error('Supabase not configured')
      const byMr = new Map<string, 'none' | 'draft' | 'submitted'>()
      for (const id of mrIds) byMr.set(id, 'none')

      const { data: rpcData, error: rpcErr } = await supabase.rpc('get_manager_team_expense_report_statuses', {
        p_report_date: today,
      })
      let rows: Array<{ mr_id: string; status: string }> = []
      if (!rpcErr && rpcData != null) {
        rows = (Array.isArray(rpcData) ? rpcData : []) as Array<{ mr_id: string; status: string }>
      } else {
        const { data, error } = await supabase
          .from('expense_reports')
          .select('mr_id, status')
          .in('mr_id', mrIds)
          .eq('report_date', today)
        if (error) throw error
        rows = (data ?? []) as Array<{ mr_id: string; status: string }>
      }
      for (const r of rows) {
        const st = r.status === 'submitted' ? 'submitted' : 'draft'
        const prev = byMr.get(r.mr_id)
        if (prev === 'submitted' || st === 'submitted') byMr.set(r.mr_id, 'submitted')
        else byMr.set(r.mr_id, 'draft')
      }
      return mrIds.map(id => ({ mrId: id, status: byMr.get(id) ?? 'none' }))
    },
  })
}

export function useTeamMrsTourProgramsForMonth(mrIds: string[], monthYyyyMm01: string) {
  const month = monthYyyyMm01.slice(0, 7)
  return useQuery({
    queryKey: ['team-mrs-tp-month', mrIds, month],
    enabled: mrIds.length > 0 && !!month && !!supabase,
    queryFn: async (): Promise<Array<{ mr_id: string; status: string; id: string }>> => {
      if (!supabase) throw new Error('Supabase not configured')
      const monthStart = `${month}-01`
      const { data, error } = await supabase
        .from('tour_programs')
        .select('id, mr_id, status, month')
        .in('mr_id', mrIds)
        .eq('month', monthStart)
      if (error) throw error
      return (data ?? []).map(r => ({
        id: r.id as string,
        mr_id: r.mr_id as string,
        status: r.status as string,
      }))
    },
  })
}
