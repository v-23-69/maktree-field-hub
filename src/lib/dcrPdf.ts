import { jsPDF } from 'jspdf'
import type { DailyReport, ReportVisit } from '@/types/database.types'
import { formatDisplayDate } from '@/lib/dateUtils'

function visitBlockText(v: ReportVisit): string {
  const d = v.doctor
  const territory =
    (d?.sub_area as { area?: { name?: string } } | undefined)?.area?.name ?? '—'
  const lines: string[] = [
    `Doctor: ${d?.full_name ?? '—'}`,
    `Speciality: ${d?.speciality ?? '—'}`,
    `Territory: ${territory} | Area: ${d?.sub_area?.name ?? '—'}`,
    `Chemist: ${v.chemist?.name ?? '—'}`,
  ]
  const products = (v.promoted_products ?? [])
    .map(p => p.product?.name)
    .filter(Boolean) as string[]
  if (products.length) lines.push(`Products promoted: ${products.join(', ')}`)
  const ms = (v.monthly_support_entries ?? []).map(m => {
    const saved = Number((m as { amount_inr?: number | null }).amount_inr ?? 0)
    const ptr = (m.product as { ptr?: number } | undefined)?.ptr ?? 0
    const fallback = Math.round(ptr * (m.quantity || 0) * 100) / 100
    const rupee = saved > 0 ? saved : fallback
    return `${m.product?.name ?? ''} (qty ${m.quantity ?? 0}${rupee > 0 ? `, Rs ${rupee}` : ''})`
  })
  if (ms.length) lines.push(`Monthly support: ${ms.join('; ')}`)
  const comp = (v.competitor_entries ?? []).map(c => `${c.brand_name} (${c.quantity})`)
  if (comp.length) lines.push(`Competitors: ${comp.join('; ')}`)
  return lines.join('\n')
}

/** Save one or more submitted DCRs (each with visits) as a single PDF download. */
export function saveDcrReportsPdf(
  reports: Array<DailyReport & { visits: ReportVisit[] }>,
  options: { fileName: string; documentTitle: string },
): void {
  if (reports.length === 0) return

  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const margin = 40
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const maxW = pageW - margin * 2
  const bodyLine = 13
  let y = margin

  const ensureSpace = (h: number) => {
    if (y + h > pageH - margin) {
      doc.addPage()
      y = margin
    }
  }

  const writeLines = (text: string, fontSize: number, bold: boolean) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal')
    doc.setFontSize(fontSize)
    const parts = doc.splitTextToSize(text, maxW)
    const lines = Array.isArray(parts) ? parts : [parts]
    for (const line of lines) {
      ensureSpace(bodyLine)
      doc.text(line, margin, y)
      y += bodyLine
    }
  }

  writeLines(options.documentTitle, 14, true)
  y += 4

  const mr = reports[0].mr as { full_name?: string; employee_code?: string } | undefined
  if (mr?.full_name) {
    writeLines(
      `MR: ${mr.full_name}${mr.employee_code ? ` (${mr.employee_code})` : ''}`,
      10,
      false,
    )
    y += 6
  }

  for (const report of reports) {
    const isLeave = (report.report_kind ?? 'field') === 'leave'

    if (isLeave) {
      writeLines(`Leave DCR — ${formatDisplayDate(report.report_date)}`, 12, true)
      writeLines(`Status: ${report.status}`, 10, false)
      writeLines('Record type: approved leave day (no field doctor visits).', 9, false)
      const cat = report.leave_dcr_category === 'sick' ? 'Sick leave' : 'Casual leave'
      writeLines(`Leave category: ${cat}`, 10, false)
      const remark = report.leave_dcr_remark?.trim()
      if (remark) {
        writeLines('Remark:', 10, true)
        writeLines(remark, 9, false)
      } else {
        writeLines('Remark: —', 9, false)
      }
      y += 10
      continue
    }

    writeLines(`DCR — ${formatDisplayDate(report.report_date)}`, 12, true)
    const mgr = report.manager as { full_name?: string } | undefined
    writeLines(
      `Status: ${report.status}${mgr?.full_name ? ` | Working with: ${mgr.full_name}` : ''}`,
      10,
      false,
    )
    y += 4

    const sorted = [...report.visits].sort((a, b) =>
      (a.doctor?.full_name ?? '').localeCompare(b.doctor?.full_name ?? '', undefined, {
        sensitivity: 'base',
      }),
    )

    writeLines(`Doctor visits (${sorted.length})`, 11, true)
    y += 2

    sorted.forEach((v, idx) => {
      writeLines(`Visit ${idx + 1}`, 10, true)
      writeLines(visitBlockText(v), 9, false)
      y += 6
    })

    y += 10
  }

  const safe = options.fileName.replace(/[^\w.-]+/g, '_')
  doc.save(safe.endsWith('.pdf') ? safe : `${safe}.pdf`)
}
