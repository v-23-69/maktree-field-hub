import type { DailyReport, ReportVisit } from '@/types/database.types'

type DcrPdfModule = typeof import('@/lib/dcrPdf')

let dcrPdfModulePromise: Promise<DcrPdfModule> | null = null

export function loadDcrPdfModule(): Promise<DcrPdfModule> {
  if (!dcrPdfModulePromise) {
    dcrPdfModulePromise = import('@/lib/dcrPdf')
  }
  return dcrPdfModulePromise
}

export type SaveDcrReportsPdfOptions = {
  fileName: string
  documentTitle: string
}

/** Loads jspdf bundle on demand, then generates the PDF (same behavior as sync saveDcrReportsPdf). */
export async function saveDcrReportsPdf(
  reports: Array<DailyReport & { visits?: ReportVisit[] }>,
  options: SaveDcrReportsPdfOptions,
): Promise<void> {
  const mod = await loadDcrPdfModule()
  mod.saveDcrReportsPdf(reports, options)
}

export type PdfGenerationProgressOptions = {
  initialToastId?: string | number
  startedMessage?: string
}

/**
 * Loads jspdf on demand, then runs PDF generation with progress toasts.
 * Pass a callback that receives the loaded PDF API (keeps generation synchronous inside the toast flow).
 */
export async function withPdfGenerationProgress(
  generatePdf: (pdf: Pick<DcrPdfModule, 'saveDcrReportsPdf'>) => void,
  options?: PdfGenerationProgressOptions,
): Promise<void> {
  const mod = await loadDcrPdfModule()
  return mod.withPdfGenerationProgress(() => generatePdf(mod), options)
}
