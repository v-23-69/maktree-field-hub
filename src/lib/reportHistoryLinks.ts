export type ReportHistoryLinkMode = 'mr' | 'manager-self' | 'manager-team'

export function historyReportHref(
  mode: ReportHistoryLinkMode,
  report: { id: string; report_date: string },
  subjectMrId: string,
): string {
  if (mode === 'manager-team') {
    return `/manager/report/${report.id}`
  }
  if (mode === 'manager-self') return `/manager/report/${report.id}`
  return `/mr/report/${report.id}`
}
