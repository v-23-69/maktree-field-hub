import type { SupabaseClient } from '@supabase/supabase-js'
import { aggregateMonthlySupportForMrInMonth } from '@/hooks/useReport'
import { formatDisplayDate } from '@/lib/dateUtils'

type XlsxModule = typeof import('xlsx')

export type BackupScope = 'month' | 'range'

export type BackupSubject = {
  id: string
  name: string
  isSelf?: boolean
}

export type BackupOptions = {
  scope: BackupScope
  monthYyyyMm?: string
  fromDate?: string
  toDate?: string
  subjects: BackupSubject[]
  onProgress?: (message: string, pct: number) => void
}

function monthBounds(yyyyMm: string): { start: string; end: string } {
  const [y, m] = yyyyMm.split('-').map(Number)
  const last = new Date(y, m, 0).getDate()
  return {
    start: `${yyyyMm}-01`,
    end: `${yyyyMm}-${String(last).padStart(2, '0')}`,
  }
}

function resolvePeriod(opts: BackupOptions): { start: string; end: string; label: string } {
  if (opts.scope === 'month' && opts.monthYyyyMm) {
    const b = monthBounds(opts.monthYyyyMm)
    return { start: b.start, end: b.end, label: opts.monthYyyyMm }
  }
  const start = opts.fromDate ?? opts.monthYyyyMm ?? ''
  const end = opts.toDate ?? start
  return { start, end, label: `${start}_to_${end}` }
}

function safeSheetName(name: string, used: Set<string>): string {
  const base = name.replace(/[\\/?*[\]:]/g, ' ').trim().slice(0, 28) || 'Sheet'
  let candidate = base
  let i = 2
  while (used.has(candidate)) {
    candidate = `${base.slice(0, 24)} ${i}`
    i += 1
  }
  used.add(candidate)
  return candidate
}

async function fetchDcrRows(
  client: SupabaseClient,
  userId: string,
  start: string,
  end: string,
) {
  const { data, error } = await client
    .from('daily_reports')
    .select('report_date, status, report_kind, submitted_at, is_late_submission, report_visits(count)')
    .eq('mr_id', userId)
    .gte('report_date', start)
    .lte('report_date', end)
    .order('report_date')
  if (error) throw error
  return (data ?? []).map(r => ({
    Date: r.report_date as string,
    Status: r.status as string,
    Kind: (r.report_kind as string) ?? '',
    Submitted: r.submitted_at ? String(r.submitted_at).slice(0, 19) : '',
    Late: r.is_late_submission ? 'Yes' : 'No',
    Visits: (r.report_visits as { count: number }[] | null)?.[0]?.count ?? 0,
  }))
}

async function fetchDoctorAdds(
  client: SupabaseClient,
  userId: string,
  start: string,
  end: string,
) {
  const { data, error } = await client
    .from('doctor_add_requests')
    .select('created_at, status, payload, sub_area:sub_areas(name, area:areas(name))')
    .eq('mr_id', userId)
    .gte('created_at', `${start}T00:00:00`)
    .lte('created_at', `${end}T23:59:59`)
    .order('created_at')
  if (error) throw error
  return (data ?? []).map(r => {
    const payload = r.payload as { doctor?: { full_name?: string; speciality?: string } } | null
    const sub = r.sub_area as { name?: string; area?: { name?: string } } | null
    return {
      Date: String(r.created_at).slice(0, 10),
      Status: r.status as string,
      Doctor: payload?.doctor?.full_name ?? '',
      Speciality: payload?.doctor?.speciality ?? '',
      Area: sub?.area?.name ?? '',
      'Sub area': sub?.name ?? '',
    }
  })
}

async function fetchChemistAdds(
  client: SupabaseClient,
  userId: string,
  start: string,
  end: string,
) {
  const { data, error } = await client
    .from('doctor_add_requests')
    .select('created_at, status, payload, sub_area:sub_areas(name, area:areas(name))')
    .eq('mr_id', userId)
    .gte('created_at', `${start}T00:00:00`)
    .lte('created_at', `${end}T23:59:59`)
    .order('created_at')
  if (error) throw error
  const rows: Record<string, string>[] = []
  for (const r of data ?? []) {
    const payload = r.payload as { chemists?: Array<{ name?: string; owner_name?: string }> } | null
    const chemists = payload?.chemists ?? []
    if (chemists.length === 0) continue
    const sub = r.sub_area as { name?: string; area?: { name?: string } } | null
    for (const c of chemists) {
      rows.push({
        Date: String(r.created_at).slice(0, 10),
        Status: r.status as string,
        Chemist: c.name ?? '',
        Owner: c.owner_name ?? '',
        Area: sub?.area?.name ?? '',
        'Sub area': sub?.name ?? '',
      })
    }
  }
  return rows
}

async function fetchMonthlySupportSheet(
  client: SupabaseClient,
  userId: string,
  monthYyyyMm: string,
) {
  const agg = await aggregateMonthlySupportForMrInMonth(client, userId, monthYyyyMm)
  return agg.lines.map(l => ({
    Doctor: l.doctor_name,
    Product: l.product_name,
    Quantity: l.quantity,
    'Amount (INR)': l.amount_inr,
  }))
}

async function fetchTourProgramRows(
  client: SupabaseClient,
  userId: string,
  monthStart: string,
) {
  const { data: tp, error } = await client
    .from('tour_programs')
    .select('id, status, month')
    .eq('mr_id', userId)
    .eq('month', monthStart)
    .maybeSingle()
  if (error) throw error
  if (!tp?.id) return []
  const { data: entries, error: eErr } = await client
    .from('tour_program_entries')
    .select('work_date, day_type, sub_area:sub_areas(name, area:areas(name))')
    .eq('tour_program_id', tp.id)
    .order('work_date')
  if (eErr) throw eErr
  return (entries ?? []).map(e => {
    const sub = e.sub_area as { name?: string; area?: { name?: string } } | null
    return {
      Date: e.work_date as string,
      'Day type': e.day_type as string,
      Area: sub?.area?.name ?? '',
      'Sub area': sub?.name ?? '',
      'TP status': tp.status as string,
    }
  })
}

function appendSheet(
  XLSX: XlsxModule,
  wb: XLSX.WorkBook,
  used: Set<string>,
  title: string,
  rows: Record<string, string | number>[],
) {
  const ws = XLSX.utils.json_to_sheet(rows.length > 0 ? rows : [{ Note: 'No records in this period' }])
  XLSX.utils.book_append_sheet(wb, ws, safeSheetName(title, used))
}

export async function buildManagerBackupWorkbook(
  client: SupabaseClient,
  opts: BackupOptions,
): Promise<{ wb: import('xlsx').WorkBook; fileName: string; periodStart: string; periodEnd: string }> {
  const XLSX = await import('xlsx')
  const { start, end, label } = resolvePeriod(opts)
  const wb = XLSX.utils.book_new()
  const used = new Set<string>()
  const total = opts.subjects.length
  let done = 0

  for (const subject of opts.subjects) {
    opts.onProgress?.(`Loading ${subject.name}…`, Math.round((done / total) * 90))
    const prefix = subject.isSelf ? 'Self' : subject.name

    appendSheet(XLSX, wb, used, `${prefix} DCRs`, await fetchDcrRows(client, subject.id, start, end))
    appendSheet(XLSX, wb, used, `${prefix} Doctors`, await fetchDoctorAdds(client, subject.id, start, end))
    appendSheet(XLSX, wb, used, `${prefix} Chemists`, await fetchChemistAdds(client, subject.id, start, end))

    if (opts.scope === 'month' && opts.monthYyyyMm) {
      appendSheet(
        XLSX,
        wb,
        used,
        `${prefix} Support`,
        await fetchMonthlySupportSheet(client, subject.id, opts.monthYyyyMm),
      )
      appendSheet(
        XLSX,
        wb,
        used,
        `${prefix} Tour plan`,
        await fetchTourProgramRows(client, subject.id, `${opts.monthYyyyMm}-01`),
      )
    }

    done += 1
  }

  const summary = [
    {
      Period: `${formatDisplayDate(start)} – ${formatDisplayDate(end)}`,
      Subjects: opts.subjects.map(s => s.name).join(', '),
      Generated: new Date().toISOString().slice(0, 19),
    },
  ]
  appendSheet(XLSX, wb, used, 'Summary', summary)

  const fileName = `MakTree_Backup_${label}_${opts.subjects.length}people.xlsx`.replace(/\s+/g, '_')
  opts.onProgress?.('Preparing download…', 100)
  return { wb, fileName, periodStart: start, periodEnd: end }
}

export async function downloadWorkbook(wb: import('xlsx').WorkBook, fileName: string) {
  const XLSX = await import('xlsx')
  XLSX.writeFile(wb, fileName)
}

/** Manager-only — block MR role from calling Excel export paths. */
export function assertManagerExcelExport(role: string | undefined) {
  if (role !== 'manager' && role !== 'admin') {
    throw new Error('Excel backup is available to managers only. MR users can download PDF reports.')
  }
}
