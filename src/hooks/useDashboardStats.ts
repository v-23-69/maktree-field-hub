import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import {
  todayInputDate,
  startOfMonthIstYmd,
  startOfWeekIstYmd,
} from '@/lib/dateUtils'
import { DASHBOARD_QUERY_OPTIONS, LIVE_QUERY_OPTIONS } from '@/lib/liveQueryOptions'

export type ManagerStatsFilter = 'Today' | 'This Week' | 'This Month'

function uniqueDoctorsFromReports(
  rows: Array<{ report_visits?: Array<{ doctor_id?: string | null }> }>,
): number {
  const doctorSet = new Set<string>()
  for (const r of rows) {
    for (const v of r.report_visits ?? []) {
      if (v?.doctor_id) doctorSet.add(v.doctor_id)
    }
  }
  return doctorSet.size
}

export function useMrDashboardStats(mrId: string) {
  const today = todayInputDate()
  const startMonth = startOfMonthIstYmd()
  const startWeek = startOfWeekIstYmd()

  return useQuery({
    queryKey: ['mr-dashboard-stats', mrId, today],
    enabled: !!mrId && !!supabase,
    ...DASHBOARD_QUERY_OPTIONS,
    queryFn: async (): Promise<{
      reportsThisMonth: number
      doctorsThisWeek: number
    }> => {
      if (!supabase) throw new Error('Supabase not configured')

      const [reportsRes, reportsWeekRes] = await Promise.all([
        supabase
          .from('daily_reports')
          .select('id', { count: 'exact', head: true })
          .eq('mr_id', mrId)
          .eq('status', 'submitted')
          .gte('report_date', startMonth)
          .lte('report_date', today),
        supabase
          .from('daily_reports')
          .select('id, report_visits(doctor_id)')
          .eq('mr_id', mrId)
          .eq('status', 'submitted')
          .gte('report_date', startWeek)
          .lte('report_date', today),
      ])

      if (reportsRes.error) throw reportsRes.error
      if (reportsWeekRes.error) throw reportsWeekRes.error

      return {
        reportsThisMonth: reportsRes.count ?? 0,
        doctorsThisWeek: uniqueDoctorsFromReports(reportsWeekRes.data ?? []),
      }
    },
  })
}

export function useManagerDashboardStats(
  managerId: string,
  mrIds: string[],
  filter: ManagerStatsFilter = 'Today',
) {
  const today = todayInputDate()
  const startMonth = startOfMonthIstYmd()
  const startWeek = startOfWeekIstYmd()

  return useQuery({
    queryKey: ['manager-dashboard-stats', managerId, mrIds, filter, today],
    enabled: !!managerId && mrIds.length > 0 && !!supabase,
    ...(filter === 'Today' ? LIVE_QUERY_OPTIONS : DASHBOARD_QUERY_OPTIONS),
    queryFn: async (): Promise<{
      reportCount: number
      doctorCount: number
    }> => {
      if (!supabase) throw new Error('Supabase not configured')

      let rangeStart = today
      let rangeEnd = today
      if (filter === 'This Week') {
        rangeStart = startWeek
        rangeEnd = today
      } else if (filter === 'This Month') {
        rangeStart = startMonth
        rangeEnd = today
      }

      const [countRes, visitsRes] = await Promise.all([
        supabase
          .from('daily_reports')
          .select('id', { count: 'exact', head: true })
          .in('mr_id', mrIds)
          .eq('status', 'submitted')
          .gte('report_date', rangeStart)
          .lte('report_date', rangeEnd),
        supabase
          .from('daily_reports')
          .select('id, report_visits(doctor_id)')
          .in('mr_id', mrIds)
          .eq('status', 'submitted')
          .gte('report_date', rangeStart)
          .lte('report_date', rangeEnd),
      ])

      if (countRes.error) throw countRes.error
      if (visitsRes.error) throw visitsRes.error

      return {
        reportCount: countRes.count ?? 0,
        doctorCount: uniqueDoctorsFromReports(visitsRes.data ?? []),
      }
    },
  })
}

export function useAdminDashboardStats() {
  return useQuery({
    queryKey: ['admin-dashboard-stats'],
    enabled: !!supabase,
    ...DASHBOARD_QUERY_OPTIONS,
    queryFn: async (): Promise<{
      totalMrs: number
      totalManagers: number
      totalDoctors: number
      totalAreas: number
    }> => {
      if (!supabase) throw new Error('Supabase not configured')

      const [mrsRes, mgrRes, docRes, areaRes] = await Promise.all([
        supabase
          .from('users')
          .select('id', { count: 'exact', head: true })
          .eq('role', 'mr')
          .eq('is_active', true),
        supabase
          .from('users')
          .select('id', { count: 'exact', head: true })
          .eq('role', 'manager')
          .eq('is_active', true),
        supabase
          .from('doctors')
          .select('id', { count: 'exact', head: true })
          .eq('is_active', true),
        supabase
          .from('areas')
          .select('id', { count: 'exact', head: true })
          .eq('is_active', true),
      ])

      if (mrsRes.error) throw mrsRes.error
      if (mgrRes.error) throw mgrRes.error
      if (docRes.error) throw docRes.error
      if (areaRes.error) throw areaRes.error

      return {
        totalMrs: mrsRes.count ?? 0,
        totalManagers: mgrRes.count ?? 0,
        totalDoctors: docRes.count ?? 0,
        totalAreas: areaRes.count ?? 0,
      }
    },
  })
}
