import { supabase } from '@/lib/supabase'

export type CallsAnalyticsResult = {
  totalCalls: number
  daysWithReports: number
  byDay: { date: string; calls: number }[]
  bySpeciality: { speciality: string; visits: number }[]
  avgPerDay: number
}

const EMPTY: CallsAnalyticsResult = {
  totalCalls: 0,
  daysWithReports: 0,
  byDay: [],
  bySpeciality: [],
  avgPerDay: 0,
}

type VisitRow = { report_id: string; doctor_id: string }

function aggregateCalls(
  repList: { id: string; report_date: string }[],
  visitRows: VisitRow[],
  from: string,
  to: string,
): CallsAnalyticsResult {
  const reportMeta = new Map(repList.map(r => [r.id, r.report_date]))
  const byDate = new Map<string, number>()
  const filteredVisits: VisitRow[] = []

  for (const v of visitRows) {
    const d = reportMeta.get(v.report_id)
    if (!d || d < from || d > to) continue
    filteredVisits.push(v)
    byDate.set(d, (byDate.get(d) ?? 0) + 1)
  }

  const totalCalls = filteredVisits.length
  const byDay = [...byDate.entries()]
    .map(([date, calls]) => ({ date, calls }))
    .sort((a, b) => a.date.localeCompare(b.date))
  const daysWithReports = byDate.size
  const avgPerDay = daysWithReports > 0 ? totalCalls / daysWithReports : 0

  return { totalCalls, daysWithReports, byDay, bySpeciality: [], avgPerDay }
}

async function loadSpecialities(visitRows: VisitRow[]): Promise<{ speciality: string; visits: number }[]> {
  const doctorIds = [...new Set(visitRows.map(v => v.doctor_id))]
  if (doctorIds.length === 0 || !supabase) return []

  const { data: docs, error } = await supabase
    .from('doctors')
    .select('id, speciality')
    .in('id', doctorIds)
  if (error || !docs) return []

  const specByDoctor = new Map(
    (docs as { id: string; speciality: string | null }[]).map(d => [d.id, d.speciality]),
  )
  const specCount = new Map<string, number>()
  for (const v of visitRows) {
    const s = (specByDoctor.get(v.doctor_id) ?? '').trim() || 'Unknown'
    specCount.set(s, (specCount.get(s) ?? 0) + 1)
  }
  return [...specCount.entries()]
    .map(([speciality, visits]) => ({ speciality, visits }))
    .sort((a, b) => b.visits - a.visits)
}

/** One round-trip for reports + visits, then aggregate (optionally split by period). */
export async function fetchCallsAnalyticsForRange(
  mrIds: string[],
  from: string,
  to: string,
  options?: { includeSpeciality?: boolean },
): Promise<CallsAnalyticsResult> {
  if (!supabase || mrIds.length === 0 || !from || !to) return { ...EMPTY }

  const { data: reports, error: rErr } = await supabase
    .from('daily_reports')
    .select('id, report_date, report_kind')
    .in('mr_id', mrIds)
    .eq('status', 'submitted')
    .gte('report_date', from)
    .lte('report_date', to)
  if (rErr) throw rErr

  const repList = ((reports ?? []) as { id: string; report_date: string; report_kind?: string | null }[]).filter(
    r => (r.report_kind ?? 'field') === 'field',
  )
  if (repList.length === 0) return { ...EMPTY }

  const fieldReportIds = repList.map(r => r.id)
  const { data: visits, error: vErr } = await supabase
    .from('report_visits')
    .select('report_id, doctor_id')
    .in('report_id', fieldReportIds)
  if (vErr) throw vErr

  const visitRows = (visits ?? []) as VisitRow[]
  const base = aggregateCalls(repList, visitRows, from, to)

  if (options?.includeSpeciality !== false) {
    const reportMeta = new Map(repList.map(r => [r.id, r.report_date]))
    const inRange = visitRows.filter(v => {
      const d = reportMeta.get(v.report_id)
      return d && d >= from && d <= to
    })
    base.bySpeciality = await loadSpecialities(inRange)
  }

  return base
}

export async function fetchCallsComparison(
  mrIds: string[],
  currentFrom: string,
  currentTo: string,
  previousFrom: string,
  previousTo: string,
): Promise<{ current: CallsAnalyticsResult; previous: CallsAnalyticsResult }> {
  const spanFrom = previousFrom < currentFrom ? previousFrom : currentFrom
  const spanTo = currentTo > previousTo ? currentTo : previousTo

  if (!supabase || mrIds.length === 0) {
    return { current: { ...EMPTY }, previous: { ...EMPTY } }
  }

  const { data: reports, error: rErr } = await supabase
    .from('daily_reports')
    .select('id, report_date, report_kind')
    .in('mr_id', mrIds)
    .eq('status', 'submitted')
    .gte('report_date', spanFrom)
    .lte('report_date', spanTo)
  if (rErr) throw rErr

  const repList = ((reports ?? []) as { id: string; report_date: string; report_kind?: string | null }[]).filter(
    r => (r.report_kind ?? 'field') === 'field',
  )
  if (repList.length === 0) {
    return { current: { ...EMPTY }, previous: { ...EMPTY } }
  }

  const { data: visits, error: vErr } = await supabase
    .from('report_visits')
    .select('report_id, doctor_id')
    .in('report_id', repList.map(r => r.id))
  if (vErr) throw vErr

  const visitRows = (visits ?? []) as VisitRow[]
  const current = aggregateCalls(repList, visitRows, currentFrom, currentTo)
  const previous = aggregateCalls(repList, visitRows, previousFrom, previousTo)

  const reportMeta = new Map(repList.map(r => [r.id, r.report_date]))
  const currentVisits = visitRows.filter(v => {
    const d = reportMeta.get(v.report_id)
    return d && d >= currentFrom && d <= currentTo
  })
  current.bySpeciality = await loadSpecialities(currentVisits)

  return { current, previous }
}
