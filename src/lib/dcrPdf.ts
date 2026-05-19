import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { DailyReport, ReportVisit } from '@/types/database.types'
import { formatDisplayDate } from '@/lib/dateUtils'

const MARGIN = 36
const HEADER_FILL: [number, number, number] = [15, 118, 110]

const VISIT_TABLE_HEAD = [
  '#',
  'Doctor',
  'Speciality',
  'Territory',
  'Area',
  'Chemist',
  'Products promoted',
  'Monthly support',
  'Competitors',
] as const

type JsPdfWithAutoTable = jsPDF & { lastAutoTable?: { finalY: number } }

function territoryName(v: ReportVisit): string {
  const area = (v.doctor?.sub_area as { area?: { name?: string } } | undefined)?.area?.name
  return area?.trim() || '—'
}

function formatProducts(v: ReportVisit): string {
  const names = (v.promoted_products ?? [])
    .map(p => p.product?.name)
    .filter(Boolean) as string[]
  return names.length ? names.join(', ') : '—'
}

function formatMonthlySupport(v: ReportVisit): string {
  const lines = (v.monthly_support_entries ?? []).map(m => {
    const saved = Number((m as { amount_inr?: number | null }).amount_inr ?? 0)
    const ptr = (m.product as { ptr?: number } | undefined)?.ptr ?? 0
    const fallback = Math.round(ptr * (m.quantity || 0) * 100) / 100
    const rupee = saved > 0 ? saved : fallback
    const name = m.product?.name ?? 'Product'
    return rupee > 0
      ? `${name} (qty ${m.quantity ?? 0}, Rs ${rupee})`
      : `${name} (qty ${m.quantity ?? 0})`
  })
  return lines.length ? lines.join('\n') : '—'
}

function formatCompetitors(v: ReportVisit): string {
  const lines = (v.competitor_entries ?? []).map(c => `${c.brand_name} (${c.quantity})`)
  return lines.length ? lines.join('\n') : '—'
}

function visitToRow(index: number, v: ReportVisit): string[] {
  return [
    String(index),
    v.doctor?.full_name ?? '—',
    v.doctor?.speciality ?? '—',
    territoryName(v),
    v.doctor?.sub_area?.name ?? '—',
    v.chemist?.name ?? '—',
    formatProducts(v),
    formatMonthlySupport(v),
    formatCompetitors(v),
  ]
}

function sortedVisits(visits: ReportVisit[]): ReportVisit[] {
  return [...visits].sort((a, b) =>
    (a.doctor?.full_name ?? '').localeCompare(b.doctor?.full_name ?? '', undefined, {
      sensitivity: 'base',
    }),
  )
}

function getPageMetrics(doc: jsPDF) {
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  return { pageW, pageH, maxW: pageW - MARGIN * 2 }
}

function ensureSpace(doc: jsPDF, y: number, needed: number): number {
  const { pageH } = getPageMetrics(doc)
  if (y + needed <= pageH - MARGIN) return y
  doc.addPage()
  return MARGIN
}

function drawDocumentHeader(
  doc: jsPDF,
  y: number,
  title: string,
  mr?: { full_name?: string; employee_code?: string },
): number {
  const { maxW } = getPageMetrics(doc)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(20, 20, 20)
  const titleLines = doc.splitTextToSize(title, maxW)
  doc.text(titleLines, MARGIN, y)
  y += (Array.isArray(titleLines) ? titleLines.length : 1) * 16 + 4

  if (mr?.full_name) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text(
      `MR: ${mr.full_name}${mr.employee_code ? ` (${mr.employee_code})` : ''}`,
      MARGIN,
      y,
    )
    y += 14
  }

  doc.setDrawColor(200, 200, 200)
  doc.setLineWidth(0.5)
  doc.line(MARGIN, y, MARGIN + maxW, y)
  return y + 12
}

function drawDayBanner(doc: jsPDF, y: number, lines: string[]): number {
  let cursor = ensureSpace(doc, y, 28)
  const { maxW } = getPageMetrics(doc)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(30, 30, 30)
  for (const line of lines) {
    cursor = ensureSpace(doc, cursor, 14)
    const wrapped = doc.splitTextToSize(line, maxW)
    doc.text(wrapped, MARGIN, cursor)
    cursor += (Array.isArray(wrapped) ? wrapped.length : 1) * 12
  }
  return cursor + 4
}

function drawVisitTable(doc: JsPdfWithAutoTable, y: number, body: string[][]): number {
  if (body.length === 0) {
    autoTable(doc, {
      body: [['—', 'No doctor visits recorded for this day.', '', '', '', '', '', '', '', '']],
      startY: y,
      margin: { left: MARGIN, right: MARGIN },
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 4, font: 'helvetica', fontStyle: 'italic' },
      columnStyles: { 0: { cellWidth: 22 }, 1: { cellWidth: 'auto' } },
    })
    return (doc.lastAutoTable?.finalY ?? y) + 14
  }

  autoTable(doc, {
    head: [VISIT_TABLE_HEAD as unknown as string[]],
    body,
    startY: y,
    margin: { left: MARGIN, right: MARGIN },
    theme: 'grid',
    styles: {
      fontSize: 7,
      cellPadding: 3,
      overflow: 'linebreak',
      valign: 'top',
      lineColor: [210, 210, 210],
      lineWidth: 0.4,
    },
    headStyles: {
      fillColor: HEADER_FILL,
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'center',
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 22, halign: 'center' },
      1: { cellWidth: 78 },
      2: { cellWidth: 48 },
      3: { cellWidth: 62 },
      4: { cellWidth: 72 },
      5: { cellWidth: 64 },
      6: { cellWidth: 88 },
      7: { cellWidth: 102 },
      8: { cellWidth: 72 },
    },
    didDrawPage: data => {
      if (data.pageNumber > 1) {
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8)
        doc.setTextColor(120, 120, 120)
        doc.text(
          `Page ${data.pageNumber}`,
          doc.internal.pageSize.getWidth() - MARGIN,
          doc.internal.pageSize.getHeight() - 16,
          { align: 'right' },
        )
      }
    },
  })

  return (doc.lastAutoTable?.finalY ?? y) + 16
}

function drawSummaryTable(doc: JsPdfWithAutoTable, y: number, body: string[][]): number {
  autoTable(doc, {
    head: [['Date', 'Type', 'Status', 'Details']],
    body,
    startY: y,
    margin: { left: MARGIN, right: MARGIN },
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 4, overflow: 'linebreak', valign: 'top' },
    headStyles: {
      fillColor: HEADER_FILL,
      textColor: 255,
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 90 },
      1: { cellWidth: 70 },
      2: { cellWidth: 60 },
      3: { cellWidth: 'auto' },
    },
  })
  return (doc.lastAutoTable?.finalY ?? y) + 16
}

/** Save one or more submitted DCRs (each with visits) as a single tabular PDF download. */
export function saveDcrReportsPdf(
  reports: Array<DailyReport & { visits: ReportVisit[] }>,
  options: { fileName: string; documentTitle: string },
): void {
  if (reports.length === 0) return

  const doc = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'landscape' }) as JsPdfWithAutoTable
  const mr = reports[0].mr as { full_name?: string; employee_code?: string } | undefined

  let y = MARGIN
  y = drawDocumentHeader(doc, y, options.documentTitle, mr)

  const summaryRows: string[][] = []
  const fieldReports: Array<DailyReport & { visits: ReportVisit[] }> = []

  for (const report of reports) {
    const rk = (report.report_kind ?? 'field') as string
    if (rk === 'leave' || rk === 'sunday') {
      const type = rk === 'leave' ? 'Leave DCR' : 'Sunday DCR'
      let details =
        rk === 'sunday'
          ? 'Non-field Sunday; no doctor visits recorded.'
          : 'Approved leave day; no field doctor visits.'
      if (rk === 'leave') {
        const cat = report.leave_dcr_category === 'sick' ? 'Sick leave' : 'Casual leave'
        const remark = report.leave_dcr_remark?.trim()
        details = `${cat}${remark ? ` — ${remark}` : ''}`
      }
      summaryRows.push([
        formatDisplayDate(report.report_date),
        type,
        report.status,
        details,
      ])
    } else {
      fieldReports.push(report)
    }
  }

  if (summaryRows.length > 0) {
    y = drawDayBanner(doc, y, ['Non-field days (leave / Sunday)'])
    y = drawSummaryTable(doc, y, summaryRows)
  }

  for (const report of fieldReports) {
    const mgr = report.manager as { full_name?: string } | undefined
    const visits = sortedVisits(report.visits)
    const banner = [
      `DCR — ${formatDisplayDate(report.report_date)}`,
      `Status: ${report.status}${mgr?.full_name ? `  |  Working with: ${mgr.full_name}` : ''}  |  Visits: ${visits.length}`,
    ]
    y = ensureSpace(doc, y, 40)
    y = drawDayBanner(doc, y, banner)
    const body = visits.map((v, i) => visitToRow(i + 1, v))
    y = drawVisitTable(doc, y, body)
  }

  const safe = options.fileName.replace(/[^\w.-]+/g, '_')
  doc.save(safe.endsWith('.pdf') ? safe : `${safe}.pdf`)
}
