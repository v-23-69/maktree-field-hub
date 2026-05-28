import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { boundsForPreset, previousBounds } from '@/lib/analyticsPeriodCompare'
import { ANALYTICS_QUERY_OPTIONS } from '@/lib/analyticsQueryOptions'
import {
  fetchCallsAnalyticsForRange,
  fetchCallsComparison,
  type CallsAnalyticsResult,
} from '@/lib/fetchCallsAnalytics'

export type PeriodPreset = 'weekly' | 'monthly' | 'yearly'

export { boundsForPreset }

export function useCallsForDateRange(
  mrIds: string[],
  from: string,
  to: string,
  enabled: boolean,
) {
  return useQuery({
    queryKey: ['calls-date-range-analytics', mrIds.slice().sort().join(','), from, to],
    enabled: enabled && mrIds.length > 0 && !!from && !!to && !!supabase,
    ...ANALYTICS_QUERY_OPTIONS,
    queryFn: () => fetchCallsAnalyticsForRange(mrIds, from, to),
  })
}

/** Single fetch for current period + optional previous period (2× fewer DB round-trips). */
export function useCallsComparisonAnalytics(
  mrIds: string[],
  preset: PeriodPreset,
  anchorYmd: string,
  compareEnabled: boolean,
  enabled: boolean,
) {
  const periodBounds = boundsForPreset(preset, anchorYmd)
  const prevBounds = previousBounds(periodBounds.from, periodBounds.to)

  return useQuery({
    queryKey: [
      'calls-comparison-analytics',
      mrIds.slice().sort().join(','),
      preset,
      anchorYmd,
      compareEnabled,
    ],
    enabled: enabled && mrIds.length > 0 && !!supabase,
    ...ANALYTICS_QUERY_OPTIONS,
    queryFn: async (): Promise<{
      current: CallsAnalyticsResult
      previous: CallsAnalyticsResult | null
    }> => {
      if (!compareEnabled) {
        const current = await fetchCallsAnalyticsForRange(
          mrIds,
          periodBounds.from,
          periodBounds.to,
        )
        return { current, previous: null }
      }
      const { current, previous } = await fetchCallsComparison(
        mrIds,
        periodBounds.from,
        periodBounds.to,
        prevBounds.from,
        prevBounds.to,
      )
      return { current, previous }
    },
  })
}

export function useCallsRangeComparison(
  mrIds: string[],
  fromDate: string,
  toDate: string,
  enabled: boolean,
) {
  const prevBounds = previousBounds(fromDate, toDate)

  return useQuery({
    queryKey: [
      'calls-range-comparison',
      mrIds.slice().sort().join(','),
      fromDate,
      toDate,
    ],
    enabled: enabled && mrIds.length > 0 && !!fromDate && !!toDate && !!supabase,
    ...ANALYTICS_QUERY_OPTIONS,
    queryFn: () =>
      fetchCallsComparison(mrIds, fromDate, toDate, prevBounds.from, prevBounds.to),
  })
}

/** Calls = doctor visits on submitted field DCRs (one visit = one call). */
export function useCallsAndSpecialityAnalytics(
  mrIds: string[],
  preset: PeriodPreset,
  anchorYmd: string,
  enabled: boolean,
) {
  const { from, to } = boundsForPreset(preset, anchorYmd)
  return useQuery({
    queryKey: ['calls-speciality-analytics', mrIds.slice().sort().join(','), preset, from, to],
    enabled: enabled && mrIds.length > 0 && !!supabase,
    ...ANALYTICS_QUERY_OPTIONS,
    queryFn: () => fetchCallsAnalyticsForRange(mrIds, from, to),
  })
}

export type VisitFrequencyDoctorRow = {
  doctorId: string
  name: string
  subAreaId: string
  subArea: string
  areaId: string
  areaName: string
  target: number
  done: number
}

export function useVisitFrequencyProgress(mrId: string, monthYmd: string, enabled: boolean) {
  const month = monthYmd.slice(0, 7)
  const monthStart = `${month}-01`
  const lastDay = new Date(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0).getDate()
  const monthEnd = `${month}-${String(lastDay).padStart(2, '0')}`

  return useQuery({
    queryKey: ['visit-frequency-progress', mrId, month],
    enabled: !!mrId && !!supabase && enabled,
    ...ANALYTICS_QUERY_OPTIONS,
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not configured')
      const { data: access, error: aErr } = await supabase
        .from('mr_sub_area_access')
        .select('sub_area_id')
        .eq('mr_id', mrId)
      if (aErr) throw aErr
      const subIds = (access ?? []).map((r: { sub_area_id: string }) => r.sub_area_id)
      if (subIds.length === 0) {
        return {
          doctors: [] as VisitFrequencyDoctorRow[],
          totalTarget: 0,
          totalDone: 0,
        }
      }
      const { data: doctors, error: dErr } = await supabase
        .from('doctors')
        .select('id, full_name, sub_area_id, monthly_visit_target, sub_area:sub_areas(name, area_id, area:areas(id, name))')
        .in('sub_area_id', subIds)
        .eq('is_active', true)
      if (dErr) throw dErr
      const docRows = doctors as {
        id: string
        full_name: string
        sub_area_id: string
        monthly_visit_target: number | null
        sub_area?: { name?: string; area_id?: string; area?: { id?: string; name?: string } | null } | null
      }[]

      const { data: reports, error: rErr } = await supabase
        .from('daily_reports')
        .select('id, report_kind')
        .eq('mr_id', mrId)
        .eq('status', 'submitted')
        .gte('report_date', monthStart)
        .lte('report_date', monthEnd)
      if (rErr) throw rErr
      const fieldIds = ((reports ?? []) as { id: string; report_kind?: string | null }[])
        .filter(r => (r.report_kind ?? 'field') === 'field')
        .map(r => r.id)

      const visitCounts = new Map<string, number>()
      if (fieldIds.length > 0) {
        const { data: visits, error: vErr } = await supabase
          .from('report_visits')
          .select('doctor_id')
          .in('report_id', fieldIds)
        if (vErr) throw vErr
        for (const v of (visits ?? []) as { doctor_id: string }[]) {
          visitCounts.set(v.doctor_id, (visitCounts.get(v.doctor_id) ?? 0) + 1)
        }
      }

      let totalTarget = 0
      let totalDone = 0
      const out = docRows.map(d => {
        const target = typeof d.monthly_visit_target === 'number' ? d.monthly_visit_target : 2
        const rawDone = visitCounts.get(d.id) ?? 0
        totalTarget += target
        totalDone += Math.min(rawDone, target)
        const areaId = d.sub_area?.area?.id ?? d.sub_area?.area_id ?? ''
        const areaName = d.sub_area?.area?.name ?? 'Territory'
        return {
          doctorId: d.id,
          name: d.full_name,
          subAreaId: d.sub_area_id,
          subArea: d.sub_area?.name ?? '—',
          areaId,
          areaName,
          target,
          done: rawDone,
        }
      })
      out.sort((a, b) => {
        const areaCmp = a.areaName.localeCompare(b.areaName)
        if (areaCmp !== 0) return areaCmp
        const subCmp = a.subArea.localeCompare(b.subArea)
        if (subCmp !== 0) return subCmp
        return a.name.localeCompare(b.name)
      })
      return { doctors: out, totalTarget, totalDone }
    },
  })
}
