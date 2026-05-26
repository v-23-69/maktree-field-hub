export type ReportHistoryLinkMode = 'mr' | 'manager-self' | 'manager-team'

export function historyReportHref(
  mode: ReportHistoryLinkMode,
  report: { id: string; report_date: string },
  subjectMrId: string,
): string {
  if (mode === 'manager-team') {
    return `/manager/reports?mrId=${encodeURIComponent(subjectMrId)}&date=${encodeURIComponent(report.report_date)}&view=1`
  }
  if (mode === 'manager-self') return `/manager/report/${report.id}`
  return `/mr/report/${report.id}`
}
