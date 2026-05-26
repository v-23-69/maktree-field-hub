import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export type PeriodPreset = 'daily' | 'weekly' | 'monthly' | 'all'

function boundsForPreset(preset: PeriodPreset, anchorYmd: string): { from: string; to: string } {
  const to = anchorYmd
  if (preset === 'daily') return { from: to, to }
  if (preset === 'all') return { from: '2000-01-01', to }
  const t = new Date(to + 'T12:00:00')
  if (preset === 'weekly') {
    const s = new Date(t)
    s.setDate(s.getDate() - 6)
    const from = `${s.getFullYear()}-${String(s.getMonth() + 1).padStart(2, '0')}-${String(s.getDate()).padStart(2, '0')}`
    return { from, to }
  }
  const from = `${to.slice(0, 7)}-01`
  return { from, to }
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
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not configured')
      const { data: reports, error: rErr } = await supabase
        .from('daily_reports')
        .select('id, report_date, report_kind')
        .in('mr_id', mrIds)
        .eq('status', 'submitted')
        .gte('report_date', from)
        .lte('report_date', to)
      if (rErr) throw rErr
      const repList = (reports ?? []) as { id: string; report_date: string; report_kind?: string | null }[]
      const fieldReportIds = repList.filter(r => (r.report_kind ?? 'field') === 'field').map(r => r.id)
      if (fieldReportIds.length === 0) {
        return {
          totalCalls: 0,
          daysWithReports: 0,
          byDay: [] as { date: string; calls: number }[],
          bySpeciality: [] as { speciality: string; visits: number }[],
          avgPerDay: 0,
        }
      }
      const { data: visits, error: vErr } = await supabase
        .from('report_visits')
        .select('id, report_id, doctor_id')
        .in('report_id', fieldReportIds)
      if (vErr) throw vErr
      const visitRows = (visits ?? []) as { report_id: string; doctor_id: string }[]
      const totalCalls = visitRows.length

      const reportMeta = new Map(repList.map(r => [r.id, r.report_date]))
      const byDate = new Map<string, number>()
      for (const v of visitRows) {
        const d = reportMeta.get(v.report_id)
        if (!d) continue
        byDate.set(d, (byDate.get(d) ?? 0) + 1)
      }
      const byDay = [...byDate.entries()]
        .map(([date, calls]) => ({ date, calls }))
        .sort((a, b) => a.date.localeCompare(b.date))
      const daysWithReports = byDate.size
      const avgPerDay = daysWithReports > 0 ? totalCalls / daysWithReports : 0

      const doctorIds = [...new Set(visitRows.map(v => v.doctor_id))]
      let bySpeciality: { speciality: string; visits: number }[] = []
      if (doctorIds.length > 0) {
        const { data: docs, error: dErr } = await supabase
          .from('doctors')
          .select('id, speciality')
          .in('id', doctorIds)
        if (!dErr && docs) {
          const specByDoctor = new Map(
            (docs as { id: string; speciality: string | null }[]).map(d => [d.id, d.speciality]),
          )
          const specCount = new Map<string, number>()
          for (const v of visitRows) {
            const s = (specByDoctor.get(v.doctor_id) ?? '').trim() || 'Unknown'
            specCount.set(s, (specCount.get(s) ?? 0) + 1)
          }
          bySpeciality = [...specCount.entries()]
            .map(([speciality, visits]) => ({ speciality, visits }))
            .sort((a, b) => b.visits - a.visits)
        }
      }

      return { totalCalls, daysWithReports, byDay, bySpeciality, avgPerDay }
    },
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
