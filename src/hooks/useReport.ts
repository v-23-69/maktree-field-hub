import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { SupabaseClient } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type {
  AllowedReportDate,
  DailyReport,
  ReportBlockStatus,
  ReportUnlockRequest,
  ReportVisit,
} from '@/types/database.types'

async function loadReportVisits(
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

  let chemists: any[] = []
  if (chemistIds.length > 0) {
    const { data: chemData, error: chemErr } = await client
      .from('chemists')
      .select('id, name, sub_area_id, is_active, created_at')
      .in('id', chemistIds)
    if (chemErr) throw chemErr
    chemists = (chemData ?? []) as any[]
  }

  const doctorById = new Map<string, (typeof doctors)[number]>()
  for (const d of doctors ?? []) doctorById.set((d as any).id, d as any)

  const chemistById = new Map<string, (typeof chemists)[number]>()
  for (const c of chemists ?? []) chemistById.set((c as any).id, c as any)

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
    .select('id, visit_id, product_id, quantity')
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
  }>

  const productIds = [
    ...new Set([
      ...promoted.map(r => r.product_id),
      ...monthly.map(r => r.product_id),
    ]),
  ]

  let products: Array<{ id: string; name: string }> = []
  if (productIds.length > 0) {
    const { data: prodData, error: productsErr } = await client
      .from('products')
      .select('id, name')
      .in('id', productIds)
    if (productsErr) throw productsErr
    products = (prodData ?? []) as Array<{ id: string; name: string }>
  }

  const productById = new Map<string, { id: string; name: string }>()
  for (const p of products ?? []) productById.set((p as any).id, p as any)

  // Assemble final shape expected by the UI.
  return v.map(visit => {
    const doctor = doctorById.get(visit.doctor_id)
    const chemist = visit.chemist_id ? chemistById.get(visit.chemist_id) : undefined

    return {
      ...visit,
      doctor: doctor as any,
      chemist: chemist as any,
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
          product: productById.get(m.product_id)
            ? { ...productById.get(m.product_id)!, is_active: true }
            : undefined,
        })),
    } as ReportVisit
  })
}

/** Check for an existing daily report for MR + date (draft or submitted). */
export async function findExistingDailyReport(
  client: SupabaseClient,
  mrId: string,
  reportDate: string,
): Promise<{ id: string; status: string } | null> {
  const { data, error } = await client
    .from('daily_reports')
    .select('id, status')
    .eq('mr_id', mrId)
    .eq('report_date', reportDate)
    .maybeSingle()
  if (error) throw error
  return data as { id: string; status: string } | null
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
    const { error: me } = await client.from('monthly_support_entries').insert(
      monthly.map(m => ({
        visit_id: visitId,
        product_id: m.productId,
        quantity: Number(m.quantity) || 0,
      })),
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
      reportDate: string
    }) => {
      if (!supabase) throw new Error('Supabase not configured')
      try {
        const { data, error } = await supabase
          .from('daily_reports')
          .insert({
            mr_id: p.mrId,
            manager_id: p.managerId || null,
            report_date: p.reportDate,
            status: 'draft',
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
