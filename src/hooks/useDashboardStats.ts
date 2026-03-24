import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

function toDateInput(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function startOfMonthStr(): string {
  const now = new Date()
  return toDateInput(new Date(now.getFullYear(), now.getMonth(), 1))
}

function startOfWeekStr(): string {
  const now = new Date()
  const day = now.getDay()
  const diff = (day + 6) % 7 // Monday start
  const start = new Date(now)
  start.setDate(now.getDate() - diff)
  return toDateInput(start)
}

function todayStr(): string {
  return toDateInput(new Date())
}

export function useMrDashboardStats(mrId: string) {
  return useQuery({
    queryKey: ['mr-dashboard-stats', mrId],
    enabled: !!mrId && !!supabase,
    queryFn: async (): Promise<{
      reportsThisMonth: number
      doctorsThisWeek: number
    }> => {
      if (!supabase) throw new Error('Supabase not configured')
      const startMonth = startOfMonthStr()
      const startWeek = startOfWeekStr()
      const today = todayStr()

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

      const doctorSet = new Set<string>()
      for (const r of reportsWeekRes.data ?? []) {
        for (const v of (r as any).report_visits ?? []) {
          if (v?.doctor_id) doctorSet.add(v.doctor_id)
        }
      }

      return {
        reportsThisMonth: reportsRes.count ?? 0,
        doctorsThisWeek: doctorSet.size,
      }
    },
  })
}

export function useManagerDashboardStats(managerId: string, mrIds: string[]) {
  return useQuery({
    queryKey: ['manager-dashboard-stats', managerId, mrIds],
    enabled: !!managerId && mrIds.length > 0 && !!supabase,
    queryFn: async (): Promise<{
      reportsToday: number
      reportsThisMonth: number
      doctorsVisitedThisMonth: number
    }> => {
      if (!supabase) throw new Error('Supabase not configured')
      const startMonth = startOfMonthStr()
      const today = todayStr()

      const [todayRes, monthRes, visitsRes] = await Promise.all([
        supabase
          .from('daily_reports')
          .select('id', { count: 'exact', head: true })
          .in('mr_id', mrIds)
          .eq('status', 'submitted')
          .eq('report_date', today),
        supabase
          .from('daily_reports')
          .select('id', { count: 'exact', head: true })
          .in('mr_id', mrIds)
          .eq('status', 'submitted')
          .gte('report_date', startMonth)
          .lte('report_date', today),
        supabase
          .from('daily_reports')
          .select('id, report_visits(doctor_id)')
          .in('mr_id', mrIds)
          .eq('status', 'submitted')
          .gte('report_date', startMonth)
          .lte('report_date', today),
      ])

      if (todayRes.error) throw todayRes.error
      if (monthRes.error) throw monthRes.error
      if (visitsRes.error) throw visitsRes.error

      const doctorSet = new Set<string>()
      for (const r of visitsRes.data ?? []) {
        for (const v of (r as any).report_visits ?? []) {
          if (v?.doctor_id) doctorSet.add(v.doctor_id)
        }
      }

      return {
        reportsToday: todayRes.count ?? 0,
        reportsThisMonth: monthRes.count ?? 0,
        doctorsVisitedThisMonth: doctorSet.size,
      }
    },
  })
}

export function useAdminDashboardStats() {
  return useQuery({
    queryKey: ['admin-dashboard-stats'],
    enabled: !!supabase,
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

