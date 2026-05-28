import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DcrPdfDownloadCard from '@/components/mr/DcrPdfDownloadCard'
import EmptyState from '@/components/shared/EmptyState'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import { useMrReportsWithVisitCounts, useDeleteReport, useReportVisitDaySummary } from '@/hooks/useReport'
import { historyReportHref, type ReportHistoryLinkMode } from '@/lib/reportHistoryLinks'
import { CheckCircle2, Clock, ChevronRight, ChevronLeft, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDisplayDate, isSundayYmd } from '@/lib/dateUtils'
import { Button } from '@/components/ui/button'
import DcrDaySummaryScreen from '@/components/mr/DcrDaySummaryScreen'
import { toast } from 'sonner'

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function getMonthDays(year: number, month: number) {
  const first = new Date(year, month, 1)
  const last = new Date(year, month + 1, 0)
  const days: { date: string; day: number; isSunday: boolean }[] = []
  for (let d = 1; d <= last.getDate(); d++) {
    const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    days.push({ date: iso, day: d, isSunday: isSundayYmd(iso) })
  }
  const startPad = (first.getDay() + 6) % 7
  return { days, startPad }
}

type Props = {
  subjectMrId: string
  subjectName: string
  linkMode: ReportHistoryLinkMode
  showPdfCard?: boolean
  emptyMessage?: string
}

export default function ReportHistoryView({
  subjectMrId,
  subjectName,
  linkMode,
  showPdfCard = false,
  emptyMessage = 'No reports yet for this period.',
}: Props) {
  const navigate = useNavigate()
  const { data: reports = [], isLoading, isError } = useMrReportsWithVisitCounts(subjectMrId)
  const deleteReport = useDeleteReport()
  const canManagerDelete = linkMode === 'manager-team' || linkMode === 'manager-self'
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  const [viewMonth, setViewMonth] = useState(() => {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() }
  })
  const [view, setView] = useState<'calendar' | 'list'>('calendar')
  const [summaryReportId, setSummaryReportId] = useState<string | null>(null)
  const [summaryDateLabel, setSummaryDateLabel] = useState('')

  const { data: daySummary, isFetching: summaryLoading } = useReportVisitDaySummary(summaryReportId)

  const { days, startPad } = useMemo(
    () => getMonthDays(viewMonth.year, viewMonth.month),
    [viewMonth],
  )

  const submittedDates = useMemo(() => {
    const set = new Set<string>()
    for (const r of reports) {
      if (r.status === 'submitted') set.add(r.report_date)
    }
    return set
  }, [reports])

  const todayStr = useMemo(() => {
    const n = new Date()
    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`
  }, [])

  const monthLabel = new Date(viewMonth.year, viewMonth.month).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  })

  const prevMonth = () =>
    setViewMonth(p => (p.month === 0 ? { year: p.year - 1, month: 11 } : { year: p.year, month: p.month - 1 }))
  const nextMonth = () =>
    setViewMonth(p => (p.month === 11 ? { year: p.year + 1, month: 0 } : { year: p.year, month: p.month + 1 }))

  const monthReports = useMemo(() => {
    const prefix = `${viewMonth.year}-${String(viewMonth.month + 1).padStart(2, '0')}`
    return reports.filter(r => r.report_date.startsWith(prefix))
  }, [reports, viewMonth])

  const submittedCount = monthReports.filter(r => r.status === 'submitted').length
  const workingDays = days.filter(d => !d.isSunday && d.date <= todayStr).length

  const closeSummary = () => {
    setSummaryReportId(null)
    setSummaryDateLabel('')
  }

  const openReport = (report: { id: string; report_date: string }) => {
    navigate(historyReportHref(linkMode, report, subjectMrId))
  }

  const openDaySummary = (report: { id: string; report_date: string }) => {
    setSummaryReportId(report.id)
    setSummaryDateLabel(formatDisplayDate(report.report_date))
  }

  const requestDelete = (reportId: string) => {
    if (summaryReportId === reportId) closeSummary()
    setDeleteTargetId(reportId)
  }

  const handleDeleteReport = async () => {
    if (!deleteTargetId) return
    const reportId = deleteTargetId
    try {
      await deleteReport.mutateAsync(reportId)
      toast.success('DCR deleted — it can be filled again for this date')
      if (summaryReportId === reportId) closeSummary()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not delete DCR')
      throw e
    }
  }

  return (
    <>
      {summaryReportId && (
        <DcrDaySummaryScreen
          dateLabel={summaryDateLabel}
          loading={summaryLoading}
          summary={daySummary}
          onBack={closeSummary}
          onOpenFullReport={() => {
            const rep = reports.find(r => r.id === summaryReportId)
            if (rep) openReport(rep)
            closeSummary()
          }}
          onDelete={
            canManagerDelete && summaryReportId
              ? () => requestDelete(summaryReportId)
              : undefined
          }
        />
      )}

      <ConfirmDialog
        open={!!deleteTargetId}
        onOpenChange={open => {
          if (!open) setDeleteTargetId(null)
        }}
        title="Delete this DCR?"
        description="Permanently removes this report and all visits for the date. The MR (or you, for your own DCR) can submit a new report for that day."
        onConfirm={handleDeleteReport}
        confirmLabel={deleteReport.isPending ? 'Deleting…' : 'Delete DCR'}
        destructive
        confirmDisabled={deleteReport.isPending || !deleteTargetId}
      />

      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Showing history for <span className="font-semibold text-foreground">{subjectName}</span>
        </p>

        {showPdfCard && subjectMrId && (
          <DcrPdfDownloadCard mrId={subjectMrId} mrName={subjectName} />
        )}

        <div className="flex gap-2">
          <Button
            variant={view === 'calendar' ? 'default' : 'outline'}
            className="flex-1 touch-target rounded-lg text-xs"
            onClick={() => setView('calendar')}
          >
            Calendar
          </Button>
          <Button
            variant={view === 'list' ? 'default' : 'outline'}
            className="flex-1 touch-target rounded-lg text-xs"
            onClick={() => setView('list')}
          >
            List
          </Button>
        </div>

        {view === 'calendar' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <button type="button" onClick={prevMonth} className="p-2 rounded-lg active:bg-muted">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <p className="text-sm font-semibold text-foreground">{monthLabel}</p>
              <button type="button" onClick={nextMonth} className="p-2 rounded-lg active:bg-muted">
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            <div className="rounded-xl bg-card p-3 shadow-sm border border-border/60">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-muted-foreground">
                  {submittedCount} / {workingDays} working days submitted
                </p>
                <span
                  className={cn(
                    'text-xs font-semibold rounded-full px-2 py-0.5',
                    submittedCount >= workingDays
                      ? 'bg-emerald-600/15 text-emerald-800'
                      : 'bg-amber-500/15 text-amber-900',
                  )}
                >
                  {submittedCount >= workingDays && workingDays > 0
                    ? 'All Done'
                    : `${workingDays - submittedCount} pending`}
                </span>
              </div>

              <div className="grid grid-cols-7 gap-1">
                {DAY_LABELS.map(d => (
                  <div key={d} className="text-center text-[10px] font-medium text-muted-foreground py-1">
                    {d}
                  </div>
                ))}

                {Array.from({ length: startPad }).map((_, i) => (
                  <div key={`pad-${i}`} />
                ))}

                {days.map(d => {
                  const isSubmitted = submittedDates.has(d.date)
                  const isPast = d.date <= todayStr
                  const isToday = d.date === todayStr
                  const isFuture = d.date > todayStr
                  const notSubmitted = isPast && !isSubmitted && !d.isSunday

                  return (
                    <button
                      key={d.date}
                      type="button"
                      disabled={isFuture}
                      onClick={() => {
                        const rep = reports.find(r => r.report_date === d.date)
                        if (!rep) return
                        if (rep.status === 'submitted') {
                          setSummaryReportId(rep.id)
                          setSummaryDateLabel(formatDisplayDate(d.date))
                        } else {
                          openReport(rep)
                        }
                      }}
                      className={cn(
                        'aspect-square flex flex-col items-center justify-center rounded-lg text-xs transition-all',
                        isToday && 'ring-2 ring-primary/50',
                        isSubmitted && 'bg-emerald-600/15 text-emerald-800 font-semibold',
                        notSubmitted && 'bg-red-500/10 text-red-700',
                        d.isSunday && !isSubmitted && 'text-muted-foreground/50',
                        isFuture && 'opacity-30',
                        !isSubmitted && !notSubmitted && !isFuture && !d.isSunday && 'text-foreground',
                      )}
                    >
                      <span>{d.day}</span>
                      {isSubmitted && <CheckCircle2 className="h-2.5 w-2.5 mt-0.5" />}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="flex flex-wrap gap-3 text-[10px] text-muted-foreground justify-center">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-emerald-600/15" /> Submitted (tap for summary)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-red-500/10" /> Not Submitted
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-muted/50" /> Sunday
              </span>
            </div>
          </div>
        )}

        {view === 'list' && (
          <div className="space-y-3">
            {isLoading && <LoadingSpinner />}
            {isError && (
              <p className="text-sm text-destructive text-center py-6">Could not load report history</p>
            )}
            {!isLoading && !isError && reports.length === 0 && <EmptyState message={emptyMessage} />}
            {!isLoading &&
              !isError &&
              reports.map((report, i) => (
                <div
                  key={report.id}
                  className="w-full rounded-xl bg-card p-4 shadow-sm animate-fade-in-up flex items-center gap-3 border border-border/60"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <button
                    type="button"
                    onClick={() =>
                      report.status === 'submitted' ? openDaySummary(report) : openReport(report)
                    }
                    className="flex-1 min-w-0 text-left active:scale-[0.99] transition-transform flex items-center gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground">{formatDisplayDate(report.report_date)}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {report.visit_count} doctor visit{report.visit_count === 1 ? '' : 's'}
                        {report.status === 'submitted' ? ' · Tap for day summary' : ''}
                      </p>
                    </div>
                    <span
                      className={cn(
                        'flex items-center gap-1 text-xs font-medium rounded-full px-2.5 py-1 shrink-0',
                        report.status === 'submitted'
                          ? 'bg-emerald-600/15 text-emerald-800'
                          : 'bg-amber-500/15 text-amber-900',
                      )}
                    >
                      {report.status === 'submitted' ? (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      ) : (
                        <Clock className="h-3.5 w-3.5" />
                      )}
                      {report.status === 'submitted' ? 'Submitted' : 'Draft'}
                    </span>
                    <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                  </button>
                  {canManagerDelete && (
                    <button
                      type="button"
                      aria-label="Delete DCR"
                      className="shrink-0 p-2 rounded-lg text-destructive hover:bg-destructive/10"
                      onClick={e => {
                        e.stopPropagation()
                        requestDelete(report.id)
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
          </div>
        )}
      </div>
    </>
  )
}
