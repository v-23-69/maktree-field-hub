import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { todayInputDate } from '@/lib/dateUtils'

export type FieldCall = {
  call_id: string
  doctor_id: string
  doctor_name: string
  speciality: string | null
  sub_area_id: string
  sub_area_name: string | null
  area_name: string | null
  source: 'daily' | 'priority_call'
  outcome: 'planned' | 'visited' | 'unavailable'
  has_location: boolean
  latitude: number | null
  longitude: number | null
}

export type FieldDayBoard = {
  date: string
  role: string
  plan_status: 'none' | 'pending' | 'approved' | 'rejected' | 'missed'
  plan_id: string | null
  approval_mode: 'manual' | 'auto' | null
  working_with_ids: string[]
  submitted_at: string | null
  calls: FieldCall[]
}

export type TeamPlanCall = {
  id: string
  doctor_id: string
  outcome: string
  sort_order: number
  doctor: { full_name: string; speciality: string | null } | { full_name: string; speciality: string | null }[] | null
}

export type TeamFieldPlan = {
  id: string
  user_id: string
  plan_date: string
  kind: 'daily' | 'priority_call'
  status: 'pending' | 'approved' | 'rejected' | 'missed'
  note: string | null
  submitted_at: string | null
  approval_mode: 'manual' | 'auto' | null
  working_with_ids: string[]
  replaces_doctor_id: string | null
  user: { full_name: string } | { full_name: string }[] | null
  calls: TeamPlanCall[] | null
}

export type ActivityPoint = {
  id: string
  at: string
  lat: number | null
  lng: number | null
  accuracy: number | null
  event: string
  doctor_id: string | null
  doctor_name: string | null
  flagged: boolean
  flag_reason: string | null
  metadata: Record<string, unknown>
}

export type ActivityVisit = {
  doctor_id: string
  doctor_name: string
  at: string
  unavailable: boolean
  note: string | null
  lat: number | null
  lng: number | null
  waived: boolean
  products: string[]
}

export type FieldActivityDay = {
  user_id: string
  user_name: string
  date: string
  plan_status: string
  plan_submitted_at: string | null
  first_dcr_at: string | null
  points: ActivityPoint[]
  visits: ActivityVisit[]
}

export type FieldMonthSummary = {
  user_id: string
  month: string
  plans_approved: number
  plans_missed: number
  priority_calls: number
  calls_done: number
  unavailable: number
  days: { date: string; plan_status: string; visits: number; pings: number }[]
}

function embedOne<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null
  return Array.isArray(value) ? value[0] ?? null : value
}

export function doctorNameOf(call: TeamPlanCall): string {
  return embedOne(call.doctor)?.full_name ?? 'Doctor'
}

export function useFieldDayBoard(date: string) {
  return useQuery({
    queryKey: ['field-day-board', date],
    enabled: !!date && !!supabase,
    queryFn: async (): Promise<FieldDayBoard> => {
      if (!supabase) throw new Error('Supabase not configured')
      const { data, error } = await supabase.rpc('field_day_board', { p_date: date })
      if (error) throw error
      const board = (data ?? {}) as FieldDayBoard
      return { ...board, calls: board.calls ?? [], working_with_ids: board.working_with_ids ?? [] }
    },
  })
}

export function useTeamFieldPlans(date: string, enabled: boolean) {
  return useQuery({
    queryKey: ['team-field-plans', date],
    enabled: enabled && !!date && !!supabase,
    queryFn: async (): Promise<TeamFieldPlan[]> => {
      if (!supabase) throw new Error('Supabase not configured')
      const { data, error } = await supabase
        .from('field_plans')
        .select(`
          id, user_id, plan_date, kind, status, note, submitted_at, approval_mode, working_with_ids, replaces_doctor_id,
          user:users!field_plans_user_id_fkey(full_name),
          calls:field_plan_calls(
            id, doctor_id, outcome, sort_order,
            doctor:doctors(full_name, speciality)
          )
        `)
        .eq('plan_date', date)
        .order('submitted_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as TeamFieldPlan[]
    },
  })
}

export function usePlanAutoApproveSettings(enabled: boolean) {
  return useQuery({
    queryKey: ['plan-auto-approve'],
    enabled: enabled && !!supabase,
    queryFn: async (): Promise<Record<string, boolean>> => {
      if (!supabase) throw new Error('Supabase not configured')
      const { data, error } = await supabase.from('mr_plan_settings').select('mr_id, auto_approve')
      if (error) throw error
      const out: Record<string, boolean> = {}
      for (const row of data ?? []) out[row.mr_id as string] = row.auto_approve === true
      return out
    },
  })
}

export function useSubmitFieldPlan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      planDate: string
      kind: 'daily' | 'priority_call'
      workingWithIds: string[]
      doctorIds: string[]
      note?: string
      replacesDoctorId?: string | null
    }) => {
      if (!supabase) throw new Error('Supabase not configured')
      const { data, error } = await supabase.rpc('submit_field_plan', {
        p_plan_date: input.planDate,
        p_kind: input.kind,
        p_working_with: input.workingWithIds,
        p_doctor_ids: input.doctorIds,
        p_note: input.note ?? null,
        p_replaces_doctor_id: input.replacesDoctorId ?? null,
      })
      if (error) throw error
      return data as string
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['field-day-board'] })
      queryClient.invalidateQueries({ queryKey: ['team-field-plans'] })
    },
  })
}

export function useReviewFieldPlan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: { planId: string; approve: boolean; note?: string }) => {
      if (!supabase) throw new Error('Supabase not configured')
      const { error } = await supabase.rpc('review_field_plan', {
        p_plan_id: input.planId,
        p_approve: input.approve,
        p_note: input.note ?? null,
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-field-plans'] })
      queryClient.invalidateQueries({ queryKey: ['field-day-board'] })
    },
  })
}

export function useSetPlanAutoApprove() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: { mrId: string; enabled: boolean }) => {
      if (!supabase) throw new Error('Supabase not configured')
      const { error } = await supabase.rpc('set_mr_plan_auto_approve', {
        p_mr_id: input.mrId,
        p_enabled: input.enabled,
      })
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['plan-auto-approve'] }),
  })
}

export function useLocatedDoctorIds(doctorIds: string[]) {
  const key = [...doctorIds].sort().join(',')
  return useQuery({
    queryKey: ['doctor-locations', key],
    enabled: doctorIds.length > 0 && !!supabase,
    queryFn: async () => {
      if (!supabase) return new Set<string>()
      const { data, error } = await supabase
        .from('doctor_locations')
        .select('doctor_id')
        .in('doctor_id', doctorIds)
      if (error) throw error
      return new Set((data ?? []).map(row => row.doctor_id as string))
    },
  })
}

export type TeamClinicLocation = {
  doctor_id: string
  doctor_name: string
  captured_by_name: string | null
  captured_at: string
}

export function useTeamClinicLocations(enabled: boolean) {
  return useQuery({
    queryKey: ['team-clinic-locations'],
    enabled: enabled && !!supabase,
    queryFn: async (): Promise<TeamClinicLocation[]> => {
      if (!supabase) return []
      const { data, error } = await supabase.rpc('team_clinic_locations')
      if (error) throw error
      return (Array.isArray(data) ? data : []) as TeamClinicLocation[]
    },
  })
}

export function useClearDoctorLocation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (doctorId: string) => {
      if (!supabase) throw new Error('Supabase not configured')
      const { error } = await supabase.rpc('clear_doctor_location', { p_doctor_id: doctorId })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-clinic-locations'] })
      queryClient.invalidateQueries({ queryKey: ['doctor-locations'] })
      queryClient.invalidateQueries({ queryKey: ['field-day-board'] })
      queryClient.invalidateQueries({ queryKey: ['team-field-plans'] })
    },
  })
}

export function useCaptureDoctorLocation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: { doctorId: string; lat: number; lng: number; accuracy: number }) => {
      if (!supabase) throw new Error('Supabase not configured')
      const { error } = await supabase.rpc('capture_doctor_location', {
        p_doctor_id: input.doctorId,
        p_lat: input.lat,
        p_lng: input.lng,
        p_accuracy: input.accuracy,
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['field-day-board'] })
      queryClient.invalidateQueries({ queryKey: ['doctor-locations'] })
    },
  })
}

export function useFieldActivityDay(userId: string, date: string, live = false) {
  return useQuery({
    queryKey: ['field-activity', userId, date],
    enabled: !!userId && !!date && !!supabase,
    refetchInterval: live ? 20_000 : false,
    refetchIntervalInBackground: false,
    queryFn: async (): Promise<FieldActivityDay> => {
      if (!supabase) throw new Error('Supabase not configured')
      const { data, error } = await supabase.rpc('field_activity_day', {
        p_user_id: userId,
        p_date: date,
      })
      if (error) throw error
      const day = (data ?? {}) as FieldActivityDay
      return { ...day, points: day.points ?? [], visits: day.visits ?? [] }
    },
  })
}

export function useFieldMonthSummary(userId: string, monthYmd: string) {
  return useQuery({
    queryKey: ['field-month', userId, monthYmd],
    enabled: !!userId && !!monthYmd && !!supabase,
    queryFn: async (): Promise<FieldMonthSummary> => {
      if (!supabase) throw new Error('Supabase not configured')
      const { data, error } = await supabase.rpc('field_month_summary', {
        p_user_id: userId,
        p_month: monthYmd,
      })
      if (error) throw error
      const month = (data ?? {}) as FieldMonthSummary
      return { ...month, days: month.days ?? [] }
    },
  })
}

export function planPathForRole(role: string | undefined): string {
  return role === 'manager' ? '/manager/plan' : '/mr/plan'
}

export function activityDateOrToday(date: string | null): string {
  return date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : todayInputDate()
}
