import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { SupabaseClient } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { monthDateRangeForSql, todayInputDate } from '@/lib/dateUtils'
import { LIVE_QUERY_OPTIONS } from '@/lib/liveQueryOptions'
import type {
  AllowedReportDate,
  Chemist,
  DailyReport,
  Doctor,
  ReportBlockStatus,
  ReportUnlockRequest,
  ReportVisit,
} from '@/types/database.types'

export async function loadReportVisits(
  client: SupabaseClient,
  reportId: string,
): Promise<ReportVisit[]> {
  // Keep this query robust: avoid deep nested embeds that can produce PostgREST
  // 400 errors depending on relationship naming / RLS / join configuration.
  const {
    data: visits,
    error: visitsErr,
  } = await client
    .from('report_visits')
    .select('id, report_id, doctor_id, chemist_id, visited_at')
    .eq('report_id', reportId)
    .order('visited_at', { ascending: true })

  if (visitsErr) throw visitsErr
  const v = (visits ?? []) as ReportVisit[]
  if (v.length === 0) return []

  const visitIds = v.map(r => r.id)
  const doctorIds = [...new Set(v.map(r => r.doctor_id))]
  const chemistIds = [...new Set(v.map(r => r.chemist_id).filter(Boolean))] as string[]

  const { data: doctors, error: docErr } = await client
    .from('doctors')
    .select('*, sub_area:sub_areas(*)')
    .in('id', doctorIds)
  if (docErr) throw docErr

  let chemists: Chemist[] = []
  if (chemistIds.length > 0) {
    const { data: chemData, error: chemErr } = await client
      .from('chemists')
      .select('id, name, sub_area_id, is_active, created_at')
      .in('id', chemistIds)
    if (chemErr) throw chemErr
    chemists = (chemData ?? []) as Chemist[]
  }

  const doctorById = new Map<string, Doctor>()
  for (const d of (doctors ?? []) as Doctor[]) doctorById.set(d.id, d)

  const chemistById = new Map<string, Chemist>()
  for (const c of chemists) chemistById.set(c.id, c)

  const { data: promotedRows, error: promotedErr } = await client
    .from('promoted_products')
    .select('id, visit_id, product_id')
    .in('visit_id', visitIds)
  if (promotedErr) throw promotedErr

  const { data: competitorRows, error: competitorErr } = await client
    .from('competitor_entries')
    .select('id, visit_id, brand_name, quantity')
    .in('visit_id', visitIds)
  if (competitorErr) throw competitorErr

  const { data: monthlyRows, error: monthlyErr } = await client
    .from('monthly_support_entries')
    .select('id, visit_id, product_id, quantity, amount_inr')
    .in('visit_id', visitIds)
  if (monthlyErr) throw monthlyErr

  const promoted = (promotedRows ?? []) as Array<{
    id: string
    visit_id: string
    product_id: string
  }>
  const competitors = (competitorRows ?? []) as Array<{
    id: string
    visit_id: string
    brand_name: string
    quantity: number
  }>
  const monthly = (monthlyRows ?? []) as Array<{
    id: string
    visit_id: string
    product_id: string
    quantity: number
    amount_inr: number | null
  }>

  const productIds = [
    ...new Set([
      ...promoted.map(r => r.product_id),
      ...monthly.map(r => r.product_id),
    ]),
  ]

  let products: Array<{ id: string; name: string; ptr: number }> = []
  if (productIds.length > 0) {
    const { data: prodData, error: productsErr } = await client
      .from('products')
      .select('id, name, ptr')
      .in('id', productIds)
    if (productsErr) throw productsErr
    products = (prodData ?? []) as Array<{ id: string; name: string; ptr: number }>
  }

  const productById = new Map<string, { id: string; name: string; ptr: number }>()
  for (const p of products) productById.set(p.id, p)

  // Assemble final shape expected by the UI.
  return v.map(visit => {
    const doctor = doctorById.get(visit.doctor_id)
    const chemist = visit.chemist_id ? chemistById.get(visit.chemist_id) : undefined

    return {
      ...visit,
      doctor,
      chemist,
      promoted_products: promoted
        .filter(pp => pp.visit_id === visit.id)
        .map(pp => ({
          id: pp.id,
          visit_id: pp.visit_id,
          product_id: pp.product_id,
          product: productById.get(pp.product_id)
            ? { ...productById.get(pp.product_id)!, is_active: true }
            : undefined,
        })),
      competitor_entries: competitors.filter(c => c.visit_id === visit.id),
      monthly_support_entries: monthly
        .filter(m => m.visit_id === visit.id)
        .map(m => ({
          id: m.id,
          visit_id: m.visit_id,
          product_id: m.product_id,
          quantity: m.quantity,
          amount_inr: m.amount_inr ?? null,
          product: productById.get(m.product_id)
            ? { ...productById.get(m.product_id)!, is_active: true }
            : undefined,
        })),
    } as ReportVisit
  })
}

/** Submitted DCRs for an MR in a calendar date range (inclusive), with visits loaded. */
export async function fetchSubmittedReportsWithVisitsForMrInDateRange(
  client: SupabaseClient,
  mrId: string,
  fromDate: string,
  toDate: string,
): Promise<Array<DailyReport & { visits: ReportVisit[] }>> {
  const { data: reports, error } = await client
    .from('daily_reports')
    .select(
      `
      *,
      mr:users!daily_reports_mr_id_fkey(*),
      manager:users!daily_reports_manager_id_fkey(*)
    `,
    )
    .eq('mr_id', mrId)
    .eq('status', 'submitted')
    .gte('report_date', fromDate)
    .lte('report_date', toDate)
    .order('report_date', { ascending: true })
  if (error) throw error
  const rows = (reports ?? []) as DailyReport[]
  const out: Array<DailyReport & { visits: ReportVisit[] }> = []
  for (const report of rows) {
    const visits = await loadReportVisits(client, report.id)
    out.push({ ...report, visits })
  }
  return out
}

/** Check for an existing daily report for MR + date (draft or submitted). */
export async function findExistingDailyReport(
  client: SupabaseClient,
  mrId: string,
  reportDate: string,
): Promise<{ id: string; status: string; report_kind?: string | null; leave_dcr_category?: string | null; leave_dcr_remark?: string | null } | null> {
  const { data, error } = await client
    .from('daily_reports')
    .select('id, status, report_kind, leave_dcr_category, leave_dcr_remark')
    .eq('mr_id', mrId)
    .eq('report_date', reportDate)
    .maybeSingle()
  if (error) throw error
  return data as {
    id: string
    status: string
    report_kind?: string | null
    leave_dcr_category?: string | null
    leave_dcr_remark?: string | null
  } | null
}

export interface SaveVisitInput {
  reportId: string
  doctorId: string
  doctorSubAreaId: string
  visit: {
    productsPromoted: string[]
    chemistName: string
    competitors: { brandName: string; quantity: number }[]
    monthlySupport: { productId: string; quantity: number }[]
  }
}

async function ensureVisitId(
  client: SupabaseClient,
  reportId: string,
  doctorId: string,
): Promise<string> {
  const visitedAt = new Date().toISOString()
  const upsert = await client
    .from('report_visits')
    .upsert(
      {
        report_id: reportId,
        doctor_id: doctorId,
        visited_at: visitedAt,
      },
      { onConflict: 'report_id,doctor_id' },
    )
    .select('id')
    .maybeSingle()

  if (!upsert.error && upsert.data?.id) return upsert.data.id

  const { data, error } = await client
    .from('report_visits')
    .select('id')
    .eq('report_id', reportId)
    .eq('doctor_id', doctorId)
    .maybeSingle()

  if (error) throw error
  if (data?.id) return data.id

  const { data: inserted, error: insErr } = await client
    .from('report_visits')
    .insert({
      report_id: reportId,
      doctor_id: doctorId,
      visited_at: visitedAt,
    })
    .select('id')
    .single()

  if (insErr) throw insErr
  return inserted.id
}

export async function saveReportVisit(
  client: SupabaseClient,
  input: SaveVisitInput,
): Promise<void> {
  const { reportId, doctorId, doctorSubAreaId, visit } = input
  const visitId = await ensureVisitId(client, reportId, doctorId)

  const { error: dp } = await client
    .from('promoted_products')
    .delete()
    .eq('visit_id', visitId)
  if (dp) throw dp

  if (visit.productsPromoted.length > 0) {
    const { error: pp } = await client.from('promoted_products').insert(
      visit.productsPromoted.map(product_id => ({
        visit_id: visitId,
        product_id,
      })),
    )
    if (pp) throw pp
  }

  const { error: dc } = await client
    .from('competitor_entries')
    .delete()
    .eq('visit_id', visitId)
  if (dc) throw dc

  const competitors = visit.competitors.filter(c => c.brandName.trim())
  if (competitors.length > 0) {
    const { error: ce } = await client.from('competitor_entries').insert(
      competitors.map(c => ({
        visit_id: visitId,
        brand_name: c.brandName.trim(),
        quantity: Number(c.quantity) || 0,
      })),
    )
    if (ce) throw ce
  }

  const { error: dm } = await client
    .from('monthly_support_entries')
    .delete()
    .eq('visit_id', visitId)
  if (dm) throw dm

  const monthly = visit.monthlySupport.filter(m => m.productId)
  if (monthly.length > 0) {
    const productIds = [...new Set(monthly.map(m => m.productId))]
    const { data: ptrRows, error: ptrErr } = await client.from('products').select('id, ptr').in('id', productIds)
    if (ptrErr) throw ptrErr
    const ptrById = new Map<string, number>(
      (ptrRows ?? []).map((r: { id: string; ptr: number | null }) => [
        r.id,
        Math.round(Number(r.ptr ?? 0) * 100) / 100,
      ]),
    )
    const { error: me } = await client.from('monthly_support_entries').insert(
      monthly.map(m => {
        const qty = Number(m.quantity) || 0
        const ptr = ptrById.get(m.productId) ?? 0
        const amount = Math.round(ptr * qty * 100) / 100
        return {
          visit_id: visitId,
          product_id: m.productId,
          quantity: qty,
          amount_inr: amount,
        }
      }),
    )
    if (me) throw me
  }

  const chemistName = visit.chemistName.trim()
  if (chemistName) {
    const rpc = await client.rpc('upsert_chemist_for_visit', {
      p_visit_id: visitId,
      p_doctor_id: doctorId,
      p_doctor_sub_area_id: doctorSubAreaId,
      p_chemist_name: chemistName,
    })
    if (rpc.error) throw rpc.error
  } else {
    const rpc = await client.rpc('upsert_chemist_for_visit', {
      p_visit_id: visitId,
      p_doctor_id: doctorId,
      p_doctor_sub_area_id: doctorSubAreaId,
      p_chemist_name: '',
    })
    if (rpc.error) throw rpc.error
  }
}

export function useDailyReport(reportId: string) {
  return useQuery({
    queryKey: ['daily-report', reportId],
    queryFn: async (): Promise<DailyReport & { visits: ReportVisit[] }> => {
      if (!supabase) throw new Error('Supabase not configured')
      try {
        const { data, error } = await supabase
          .from('daily_reports')
          .select(`
            *,
            mr:users!daily_reports_mr_id_fkey(*),
            manager:users!daily_reports_manager_id_fkey(*)
          `)
          .eq('id', reportId)
          .single()
        if (error) throw error
        const visits = await loadReportVisits(supabase, reportId)
        return { ...(data as DailyReport), visits }
      } catch (e) {
        const message =
          e instanceof Error ? e.message : 'Failed to load daily report'
        throw new Error(message)
      }
    },
    enabled: !!reportId && !!supabase,
  })
}

export function useCreateReport() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (p: {
      mrId: string
      managerId: string | null
      workingWithIds?: string[]
      reportDate: string
      reportKind?: 'field' | 'leave' | 'sunday'
      leaveDcrCategory?: 'casual' | 'sick' | null
      leaveDcrRemark?: string | null
    }) => {
      if (!supabase) throw new Error('Supabase not configured')
      try {
        const { data, error } = await supabase
          .from('daily_reports')
          .insert({
            mr_id: p.mrId,
            manager_id: p.managerId || null,
            working_with_ids: p.workingWithIds ?? [],
            report_date: p.reportDate,
            status: 'draft',
            report_kind: p.reportKind ?? 'field',
            leave_dcr_category: p.leaveDcrCategory ?? null,
            leave_dcr_remark: p.leaveDcrRemark?.trim() || null,
          })
          .select()
          .single()
        if (error) throw error
        return data as DailyReport
      } catch (e) {
        const message =
          e instanceof Error ? e.message : 'Could not create report'
        throw new Error(message)
      }
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['mr-reports', vars.mrId] })
    },
  })
}

export function useSaveVisit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: SaveVisitInput) => {
      if (!supabase) throw new Error('Supabase not configured')
      try {
        await saveReportVisit(supabase, input)
      } catch (e) {
        const message =
          e instanceof Error ? e.message : 'Could not save visit'
        throw new Error(message)
      }
    },
    onSuccess: (_data, input) => {
      queryClient.invalidateQueries({ queryKey: ['daily-report', input.reportId] })
      queryClient.invalidateQueries({ queryKey: ['mr-reports'] })
      queryClient.invalidateQueries({ queryKey: ['monthly-support-aggregate'] })
      queryClient.invalidateQueries({ queryKey: ['monthly-support-manager-team'] })
    },
  })
}

export function useSubmitReport() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (reportId: string) => {
      if (!supabase) throw new Error('Supabase not configured')
      try {
        const { data, error } = await supabase
          .from('daily_reports')
          .update({
            status: 'submitted',
            submitted_at: new Date().toISOString(),
          })
          .eq('id', reportId)
          .select()
          .single()
        if (error) throw error
        return data as DailyReport
      } catch (e) {
        const message =
          e instanceof Error ? e.message : 'Could not submit report'
        throw new Error(message)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mr-reports'] })
      queryClient.invalidateQueries({ queryKey: ['daily-report'] })
      queryClient.invalidateQueries({ queryKey: ['allowed-report-dates'] })
      queryClient.invalidateQueries({ queryKey: ['dcr-daily-status'] })
      queryClient.invalidateQueries({ queryKey: ['visit-frequency-progress'] })
      queryClient.invalidateQueries({ queryKey: ['calls-speciality-analytics'] })
      queryClient.invalidateQueries({ queryKey: ['monthly-support-aggregate'] })
      queryClient.invalidateQueries({ queryKey: ['monthly-support-manager-team'] })
    },
  })
}

export function useMrReports(mrId: string) {
  return useQuery({
    queryKey: ['mr-reports', mrId],
    queryFn: async (): Promise<DailyReport[]> => {
      if (!supabase) throw new Error('Supabase not configured')
      try {
        const { data, error } = await supabase
          .from('daily_reports')
          .select('*')
          .eq('mr_id', mrId)
          .order('report_date', { ascending: false })
        if (error) throw error
        return (data ?? []) as DailyReport[]
      } catch (e) {
        const message =
          e instanceof Error ? e.message : 'Failed to load reports'
        throw new Error(message)
      }
    },
    enabled: !!mrId && !!supabase,
  })
}

export type DailyReportRowWithVisitCount = DailyReport & { visit_count: number }

export function useMrReportsWithVisitCounts(mrId: string) {
  return useQuery({
    queryKey: ['mr-reports-counts', mrId],
    queryFn: async (): Promise<DailyReportRowWithVisitCount[]> => {
      if (!supabase) throw new Error('Supabase not configured')
      try {
        const { data, error } = await supabase
          .from('daily_reports')
          .select('*, report_visits(count)')
          .eq('mr_id', mrId)
          .order('report_date', { ascending: false })
        if (error) throw error
        const rows = (data ?? []) as (DailyReport & {
          report_visits: { count: number }[] | null
        })[]
        return rows.map(r => ({
          ...r,
          visit_count: r.report_visits?.[0]?.count ?? 0,
        }))
      } catch (e) {
        const message =
          e instanceof Error ? e.message : 'Failed to load reports'
        throw new Error(message)
      }
    },
    enabled: !!mrId && !!supabase,
  })
}

/** MR report for a date — relational load (same shape as daily report detail). */
export function useManagerReportByMrAndDate(mrId: string, reportDate: string) {
  return useQuery({
    queryKey: ['manager-report', mrId, reportDate],
    queryFn: async (): Promise<(DailyReport & { visits: ReportVisit[] }) | null> => {
      if (!supabase) throw new Error('Supabase not configured')
      try {
        const { data, error } = await supabase
          .from('daily_reports')
          .select(`
            *,
            mr:users!daily_reports_mr_id_fkey(*),
            manager:users!daily_reports_manager_id_fkey(*)
          `)
          .eq('mr_id', mrId)
          .eq('report_date', reportDate)
          .maybeSingle()
        if (error) throw error
        if (!data) return null
        const report = data as DailyReport
        const visits = await loadReportVisits(supabase, report.id)
        return { ...report, visits }
      } catch (e) {
        const message =
          e instanceof Error ? e.message : 'Failed to load report'
        throw new Error(message)
      }
    },
    enabled: !!mrId && !!reportDate && !!supabase,
  })
}

export function useManagerMrReportDates(mrId: string) {
  return useQuery({
    queryKey: ['manager-mr-report-dates', mrId],
    enabled: !!mrId && !!supabase,
    queryFn: async (): Promise<string[]> => {
      if (!supabase) throw new Error('Supabase not configured')
      const { data, error } = await supabase
        .from('daily_reports')
        .select('report_date')
        .eq('mr_id', mrId)
        .eq('status', 'submitted')
        .order('report_date', { ascending: false })
        .limit(60)
      if (error) throw error
      return (data ?? []).map(r => r.report_date as string)
    },
  })
}

export function useAllowedReportDates(mrId: string) {
  return useQuery({
    queryKey: ['allowed-report-dates', mrId],
    ...LIVE_QUERY_OPTIONS,
    queryFn: async (): Promise<AllowedReportDate[]> => {
      if (!supabase) throw new Error('Supabase not configured')
      const { data, error } = await supabase.rpc('get_allowed_report_dates', {
        p_mr_id: mrId,
      })
      if (error) throw error
      return (data ?? []) as AllowedReportDate[]
    },
    enabled: !!mrId && !!supabase,
  })
}

export function useReportBlockStatus(mrId: string) {
  return useQuery({
    queryKey: ['report-block-status', mrId],
    queryFn: async (): Promise<ReportBlockStatus> => {
      if (!supabase) throw new Error('Supabase not configured')
      const { data, error } = await supabase.rpc('check_report_block_status', {
        p_mr_id: mrId,
      })
      if (error) throw error
      return data as ReportBlockStatus
    },
    enabled: !!mrId && !!supabase,
  })
}

export function useRequestReportUnlock() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (p: { mrId: string; reason: string }): Promise<void> => {
      if (!supabase) throw new Error('Supabase not configured')
      const mrId = p.mrId.trim()

      const { data: managerRow, error: mErr } = await supabase
        .from('mr_manager_map')
        .select('manager_id')
        .eq('mr_id', mrId)
        .order('assigned_at', { ascending: true })
        .maybeSingle()
      if (mErr) throw mErr
      const managerId = (managerRow?.manager_id ?? null) as string | null
      if (!managerId) throw new Error('No manager assigned to this MR')

      const { error: insErr } = await supabase
        .from('report_unlock_requests')
        .insert({
          mr_id: mrId,
          manager_id: managerId,
          reason: p.reason.trim(),
          requested_date: new Date().toISOString(),
        })
      if (insErr) throw insErr
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['report-block-status', vars.mrId] })
    },
  })
}

/** Saved monthly support totals for an MR in a calendar month (submitted DCRs only). */
export type MonthlySupportMonthAggregate = {
  month: string
  total_inr: number
  byDoctor: Array<{ doctor_id: string; full_name: string; total_inr: number }>
}

export async function aggregateMonthlySupportForMrInMonth(
  client: SupabaseClient,
  mrId: string,
  monthYyyyMm: string,
): Promise<MonthlySupportMonthAggregate> {
  const { startInclusive, endExclusive } = monthDateRangeForSql(monthYyyyMm)
  const { data: reports, error } = await client
    .from('daily_reports')
    .select('id')
    .eq('mr_id', mrId)
    .eq('status', 'submitted')
    .gte('report_date', startInclusive)
    .lt('report_date', endExclusive)
  if (error) throw error
  const reportIds = (reports ?? []).map(r => r.id as string)
  if (reportIds.length === 0) {
    return { month: monthYyyyMm, total_inr: 0, byDoctor: [] }
  }
  const { data: visits, error: vErr } = await client
    .from('report_visits')
    .select('id, doctor_id')
    .in('report_id', reportIds)
  if (vErr) throw vErr
  const visitRows = (visits ?? []) as Array<{ id: string; doctor_id: string }>
  const visitIds = visitRows.map(v => v.id)
  const doctorByVisit = new Map(visitRows.map(v => [v.id, v.doctor_id]))
  if (visitIds.length === 0) {
    return { month: monthYyyyMm, total_inr: 0, byDoctor: [] }
  }
  const { data: mse, error: mErr } = await client
    .from('monthly_support_entries')
    .select('visit_id, amount_inr')
    .in('visit_id', visitIds)
  if (mErr) throw mErr
  const doctorTotals = new Map<string, number>()
  for (const row of (mse ?? []) as Array<{ visit_id: string; amount_inr: number | null }>) {
    const docId = doctorByVisit.get(row.visit_id)
    if (!docId) continue
    const amt = Number(row.amount_inr ?? 0)
    doctorTotals.set(docId, (doctorTotals.get(docId) ?? 0) + amt)
  }
  const doctorIds = [...doctorTotals.keys()]
  const names = new Map<string, string>()
  if (doctorIds.length > 0) {
    const { data: docs, error: dErr } = await client.from('doctors').select('id, full_name').in('id', doctorIds)
    if (dErr) throw dErr
    for (const d of (docs ?? []) as Array<{ id: string; full_name: string | null }>) {
      names.set(d.id, d.full_name?.trim() || 'Doctor')
    }
  }
  let totalSum = 0
  const byDoctor = [...doctorTotals.entries()]
    .map(([doctor_id, raw]) => {
      const line = Math.round(raw * 100) / 100
      return { doctor_id, full_name: names.get(doctor_id) ?? 'Doctor', total_inr: line }
    })
    .sort((a, b) => a.full_name.localeCompare(b.full_name, undefined, { sensitivity: 'base' }))
  for (const r of byDoctor) totalSum += r.total_inr
  return { month: monthYyyyMm, total_inr: Math.round(totalSum * 100) / 100, byDoctor }
}

export type ManagerTeamMonthlySupportAggregate = {
  month: string
  total_inr: number
  byMr: Array<{ mr_id: string; full_name: string; total_inr: number }>
}

/** Team MRs from `list_mrs_for_manager` (session); sums each MR's submitted monthly support for the month. */
export async function aggregateMonthlySupportForManagerTeamInMonth(
  client: SupabaseClient,
  monthYyyyMm: string,
): Promise<ManagerTeamMonthlySupportAggregate> {
  const { data: team, error } = await client.rpc('list_mrs_for_manager')
  if (error) throw error
  const rows = (team ?? []) as Array<{ id: string; full_name: string | null }>
  if (rows.length === 0) {
    return { month: monthYyyyMm, total_inr: 0, byMr: [] }
  }
  const aggs = await Promise.all(rows.map(mr => aggregateMonthlySupportForMrInMonth(client, mr.id, monthYyyyMm)))
  let total_inr = 0
  const byMr: ManagerTeamMonthlySupportAggregate['byMr'] = []
  for (let i = 0; i < rows.length; i++) {
    const agg = aggs[i]
    total_inr += agg.total_inr
    if (agg.total_inr > 0) {
      byMr.push({
        mr_id: rows[i].id,
        full_name: rows[i].full_name?.trim() || 'MR',
        total_inr: agg.total_inr,
      })
    }
  }
  byMr.sort((a, b) => a.full_name.localeCompare(b.full_name, undefined, { sensitivity: 'base' }))
  return { month: monthYyyyMm, total_inr: Math.round(total_inr * 100) / 100, byMr }
}

export function useMonthlySupportAggregateForMr(mrId: string, monthYyyyMm: string) {
  return useQuery({
    queryKey: ['monthly-support-aggregate', mrId, monthYyyyMm],
    queryFn: () => {
      if (!supabase) throw new Error('Supabase not configured')
      return aggregateMonthlySupportForMrInMonth(supabase, mrId, monthYyyyMm)
    },
    enabled: !!mrId && !!supabase && !!monthYyyyMm,
  })
}

export function useMonthlySupportAggregateForManagerTeam(managerId: string, monthYyyyMm: string) {
  return useQuery({
    queryKey: ['monthly-support-manager-team', managerId, monthYyyyMm],
    queryFn: () => {
      if (!supabase) throw new Error('Supabase not configured')
      return aggregateMonthlySupportForManagerTeamInMonth(supabase, monthYyyyMm)
    },
    enabled: !!managerId && !!supabase && !!monthYyyyMm,
  })
}

export type ReportVisitDaySummary = {
  visit_count: number
  doctors: Array<{ id: string; name: string }>
  visits: ReportVisit[]
}

export function useReportVisitDaySummary(reportId: string | null) {
  return useQuery({
    queryKey: ['report-visit-day-summary', reportId],
    enabled: !!reportId && !!supabase,
    queryFn: async (): Promise<ReportVisitDaySummary> => {
      if (!supabase || !reportId) throw new Error('Supabase not configured')
      const visits = await loadReportVisits(supabase, reportId)
      const doctors = visits.map(v => ({
        id: v.doctor_id,
        name: v.doctor?.full_name?.trim() || 'Doctor',
      }))
      return { visit_count: visits.length, doctors, visits }
    },
  })
}

export function useMarkSundayDcr() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (reportDate?: string) => {
      if (!supabase) throw new Error('Supabase not configured')
      const d = reportDate ?? todayInputDate()
      const { data, error } = await supabase.rpc('mark_sunday_dcr', { p_report_date: d })
      if (error) throw error
      return data as string
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mr-reports'] })
      queryClient.invalidateQueries({ queryKey: ['daily-report'] })
      queryClient.invalidateQueries({ queryKey: ['allowed-report-dates'] })
      queryClient.invalidateQueries({ queryKey: ['dcr-daily-status'] })
      queryClient.invalidateQueries({ queryKey: ['visit-frequency-progress'] })
    },
  })
}
