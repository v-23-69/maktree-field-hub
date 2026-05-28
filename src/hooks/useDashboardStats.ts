import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import {
  todayInputDate,
  startOfMonthIstYmd,
  startOfWeekIstYmd,
  startOfYearIstYmd,
} from '@/lib/dateUtils'
import { DASHBOARD_QUERY_OPTIONS, LIVE_QUERY_OPTIONS } from '@/lib/liveQueryOptions'

export type ManagerStatsFilter = 'Today' | 'This Week' | 'This Month' | 'This Year'

export type ManagerActivityReportRow = {
  id: string
  report_date: string
  mr_id: string
  person_name: string
  is_manager: boolean
  visit_count: number
}

export type ManagerActivityPersonDoctors = {
  user_id: string
  full_name: string
  is_manager: boolean
  doctor_count: number
  doctors: { id: string; full_name: string; speciality: string | null }[]
}

export type ManagerTeamActivityData = {
  reportCount: number
  doctorCount: number
  mrDoctorCount: number
  selfDoctorCount: number
  reports: ManagerActivityReportRow[]
  doctorsByPerson: ManagerActivityPersonDoctors[]
}

function statsDateRange(filter: ManagerStatsFilter) {
  const today = todayInputDate()
  let rangeStart = today
  const rangeEnd = today
  if (filter === 'This Week') rangeStart = startOfWeekIstYmd()
  else if (filter === 'This Month') rangeStart = startOfMonthIstYmd()
  else if (filter === 'This Year') rangeStart = startOfYearIstYmd()
  return { rangeStart, rangeEnd }
}

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

type ReportVisitRow = {
  doctor_id?: string | null
  doctor?: { id: string; full_name: string; speciality: string | null } | null
}

type ActivityReportDbRow = {
  id: string
  mr_id: string
  report_date: string
  mr?: { id: string; full_name: string | null; role?: string } | null
  report_visits?: ReportVisitRow[] | null
}

function buildTeamActivityData(
  rows: ActivityReportDbRow[],
  managerId: string,
  managerName: string,
  mrs: { id: string; full_name: string | null }[],
): ManagerTeamActivityData {
  const reports: ManagerActivityReportRow[] = rows.map(r => {
    const isManager = r.mr_id === managerId
    const person_name = isManager
      ? managerName
      : (r.mr?.full_name ?? mrs.find(m => m.id === r.mr_id)?.full_name ?? 'MR')
    return {
      id: r.id,
      report_date: r.report_date,
      mr_id: r.mr_id,
      person_name,
      is_manager: isManager,
      visit_count: (r.report_visits ?? []).filter(v => v?.doctor_id).length,
    }
  })

  const totalDoctorIds = new Set<string>()
  const mrDoctorIds = new Set<string>()
  const selfDoctorIds = new Set<string>()
  const doctorsByUser = new Map<
    string,
    { full_name: string; is_manager: boolean; doctors: Map<string, { id: string; full_name: string; speciality: string | null }> }
  >()

  const ensurePerson = (userId: string, fullName: string, isManager: boolean) => {
    if (!doctorsByUser.has(userId)) {
      doctorsByUser.set(userId, { full_name: fullName, is_manager: isManager, doctors: new Map() })
    }
    return doctorsByUser.get(userId)!
  }

  for (const r of rows) {
    const isManager = r.mr_id === managerId
    const personName = isManager
      ? managerName
      : (r.mr?.full_name ?? mrs.find(m => m.id === r.mr_id)?.full_name ?? 'MR')
    const bucket = ensurePerson(r.mr_id, personName, isManager)

    for (const v of r.report_visits ?? []) {
      const docId = v?.doctor_id
      if (!docId) continue
      totalDoctorIds.add(docId)
      if (isManager) selfDoctorIds.add(docId)
      else mrDoctorIds.add(docId)
      const doc = v.doctor
      if (doc) bucket.doctors.set(docId, doc)
    }
  }

  const doctorsByPerson: ManagerActivityPersonDoctors[] = [...doctorsByUser.entries()]
    .map(([user_id, v]) => ({
      user_id,
      full_name: v.full_name,
      is_manager: v.is_manager,
      doctor_count: v.doctors.size,
      doctors: [...v.doctors.values()].sort((a, b) =>
        a.full_name.localeCompare(b.full_name, undefined, { sensitivity: 'base' }),
      ),
    }))
    .sort((a, b) => {
      if (a.is_manager !== b.is_manager) return a.is_manager ? -1 : 1
      return a.full_name.localeCompare(b.full_name, undefined, { sensitivity: 'base' })
    })

  return {
    reportCount: reports.length,
    doctorCount: totalDoctorIds.size,
    mrDoctorCount: mrDoctorIds.size,
    selfDoctorCount: selfDoctorIds.size,
    reports: reports.sort((a, b) => b.report_date.localeCompare(a.report_date)),
    doctorsByPerson,
  }
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
  teamMemberIds: string[],
  filter: ManagerStatsFilter = 'Today',
  managerName = 'Manager',
  mrs: { id: string; full_name: string | null }[] = [],
) {
  const today = todayInputDate()

  return useQuery({
    queryKey: ['manager-dashboard-stats', managerId, teamMemberIds, filter, today],
    enabled: !!managerId && teamMemberIds.length > 0 && !!supabase,
    ...(filter === 'Today' ? LIVE_QUERY_OPTIONS : DASHBOARD_QUERY_OPTIONS),
    queryFn: async (): Promise<ManagerTeamActivityData> => {
      if (!supabase) throw new Error('Supabase not configured')

      const { rangeStart, rangeEnd } = statsDateRange(filter)

      const { data, error } = await supabase
        .from('daily_reports')
        .select(
          `
          id,
          mr_id,
          report_date,
          mr:users!daily_reports_mr_id_fkey(id, full_name, role),
          report_visits(
            doctor_id,
            doctor:doctors(id, full_name, speciality)
          )
        `,
        )
        .in('mr_id', teamMemberIds)
        .eq('status', 'submitted')
        .gte('report_date', rangeStart)
        .lte('report_date', rangeEnd)
        .order('report_date', { ascending: false })

      if (error) throw error

      return buildTeamActivityData(
        (data ?? []) as ActivityReportDbRow[],
        managerId,
        managerName,
        mrs,
      )
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
