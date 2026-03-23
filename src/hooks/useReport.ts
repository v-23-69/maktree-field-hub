import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { SupabaseClient } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { DailyReport, ReportVisit } from '@/types/database.types'

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
    const { data: chemist, error: chemErr } = await client
      .from('chemists')
      .upsert(
        { sub_area_id: doctorSubAreaId, name: chemistName },
        { onConflict: 'sub_area_id,name', ignoreDuplicates: false },
      )
      .select('id')
      .single()

    if (chemErr) throw chemErr
    if (!chemist?.id) throw new Error('Chemist upsert failed')

    const { error: mapErr } = await client.from('chemist_doctor_map').upsert(
      { chemist_id: chemist.id, doctor_id: doctorId },
      { onConflict: 'chemist_id,doctor_id', ignoreDuplicates: true },
    )
    if (mapErr) throw mapErr

    const { error: upv } = await client
      .from('report_visits')
      .update({ chemist_id: chemist.id })
      .eq('id', visitId)
    if (upv) throw upv
  } else {
    const { error: upv } = await client
      .from('report_visits')
      .update({ chemist_id: null })
      .eq('id', visitId)
    if (upv) throw upv
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
            manager:users!daily_reports_manager_id_fkey(*),
            visits:report_visits(
              *,
              doctor:doctors(*, sub_area:sub_areas(name)),
              chemist:chemists(*),
              promoted_products(*, product:products(*)),
              competitor_entries(*),
              monthly_support_entries(*, product:products(*))
            )
          `)
          .eq('id', reportId)
          .single()
        if (error) throw error
        return data as DailyReport & { visits: ReportVisit[] }
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
            manager:users!daily_reports_manager_id_fkey(*),
            visits:report_visits(
              *,
              doctor:doctors(*, sub_area:sub_areas(name)),
              chemist:chemists(*),
              promoted_products(*, product:products(*)),
              competitor_entries(*),
              monthly_support_entries(*, product:products(*))
            )
          `)
          .eq('mr_id', mrId)
          .eq('report_date', reportDate)
          .maybeSingle()
        if (error) throw error
        return data as (DailyReport & { visits: ReportVisit[] }) | null
      } catch (e) {
        const message =
          e instanceof Error ? e.message : 'Failed to load report'
        throw new Error(message)
      }
    },
    enabled: !!mrId && !!reportDate && !!supabase,
  })
}
