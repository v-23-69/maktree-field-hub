import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { todayInputDate } from '@/lib/dateUtils'
import { DASHBOARD_QUERY_OPTIONS, LIVE_QUERY_OPTIONS } from '@/lib/liveQueryOptions'
import type { Doctor } from '@/types/database.types'

export type MrTodayReportStatus = { mrId: string; submitted: boolean; reportId: string | null }
export type MrTodayExpenseStatus = { mrId: string; status: 'none' | 'draft' | 'submitted' }

export function useTeamMrsTodayReportStatus(mrIds: string[], today = todayInputDate()) {
  return useQuery({
    queryKey: ['manager-mr-today-report-status', mrIds, today],
    enabled: mrIds.length > 0 && !!supabase,
    ...LIVE_QUERY_OPTIONS,
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
    ...DASHBOARD_QUERY_OPTIONS,
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
    ...DASHBOARD_QUERY_OPTIONS,
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

export type TeamMrChemistRow = {
  id: string
  name: string
  sub_area_id: string
  sub_area_name: string
  area_name: string
}

export function useTeamMrMasterData(mrId: string) {
  return useQuery({
    queryKey: ['team-mr-master', mrId],
    enabled: !!mrId && !!supabase,
    ...DASHBOARD_QUERY_OPTIONS,
    queryFn: async (): Promise<{
      subAreaIds: string[]
      doctors: Array<Doctor & { sub_area_name: string; area_name: string }>
      chemists: TeamMrChemistRow[]
    }> => {
      if (!supabase) throw new Error('Supabase not configured')

      const { data: access, error: accErr } = await supabase
        .from('mr_sub_area_access')
        .select('sub_area_id, sub_area:sub_areas(id, name, area:areas(id, name))')
        .eq('mr_id', mrId)
      if (accErr) throw accErr

      const subAreaIds = (access ?? []).map(r => r.sub_area_id as string)
      if (subAreaIds.length === 0) {
        return { subAreaIds: [], doctors: [], chemists: [] }
      }

      const subAreaMeta = new Map<string, { sub_area_name: string; area_name: string }>()
      for (const row of access ?? []) {
        const sa = row.sub_area as { id?: string; name?: string; area?: { name?: string } } | null
        if (!sa?.id) continue
        subAreaMeta.set(row.sub_area_id as string, {
          sub_area_name: sa.name ?? '—',
          area_name: sa.area?.name ?? '—',
        })
      }

      const { data: doctorsRaw, error: docErr } = await supabase
        .from('doctors')
        .select('*')
        .in('sub_area_id', subAreaIds)
        .eq('is_active', true)
        .order('full_name')
      if (docErr) throw docErr

      const doctors = (doctorsRaw ?? []).map(d => {
        const meta = subAreaMeta.get(d.sub_area_id as string)
        return {
          ...(d as Doctor),
          sub_area_name: meta?.sub_area_name ?? '—',
          area_name: meta?.area_name ?? '—',
        }
      })

      const { data: chemistsRaw, error: chemErr } = await supabase
        .from('chemists')
        .select('id, name, sub_area_id')
        .in('sub_area_id', subAreaIds)
        .eq('is_active', true)
        .order('name')
      if (chemErr) throw chemErr

      const chemists: TeamMrChemistRow[] = (chemistsRaw ?? []).map(c => {
        const meta = subAreaMeta.get(c.sub_area_id as string)
        return {
          id: c.id as string,
          name: c.name as string,
          sub_area_id: c.sub_area_id as string,
          sub_area_name: meta?.sub_area_name ?? '—',
          area_name: meta?.area_name ?? '—',
        }
      })

      return { subAreaIds, doctors, chemists }
    },
  })
}

export function useManagerDeactivateDoctor() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (p: { doctorId: string; mrId: string }) => {
      if (!supabase) throw new Error('Supabase not configured')
      const { error } = await supabase.from('doctors').update({ is_active: false }).eq('id', p.doctorId)
      if (error) throw error
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ['team-mr-master', v.mrId] })
      qc.invalidateQueries({ queryKey: ['mr-doctors'] })
      qc.invalidateQueries({ queryKey: ['master-list-completion'] })
    },
  })
}

export function useManagerDeactivateChemist() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (p: { chemistId: string; mrId: string }) => {
      if (!supabase) throw new Error('Supabase not configured')
      const { error } = await supabase.from('chemists').update({ is_active: false }).eq('id', p.chemistId)
      if (error) throw error
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ['team-mr-master', v.mrId] })
      qc.invalidateQueries({ queryKey: ['chemists-by-subarea'] })
    },
  })
}
