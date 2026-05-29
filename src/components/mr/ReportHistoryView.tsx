import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DcrPdfDownloadCard from '@/components/mr/DcrPdfDownloadCard'
import EmptyState from '@/components/shared/EmptyState'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import { useMrReportsWithVisitCounts, useDeleteReport, useReportVisitDaySummary } from '@/hooks/useReport'
import {
  useActiveLateSlotCount,
  useNextMissedLateBatchDates,
  useRequestLateDcrFill,
} from '@/hooks/useLateDcr'
import { historyReportHref, type ReportHistoryLinkMode } from '@/lib/reportHistoryLinks'
import { CheckCircle2, Clock, ChevronRight, ChevronLeft, Trash2, Send, Store, Receipt } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDisplayDate, isOutsideDefaultDcrWindow, isSundayYmd, todayInputDate } from '@/lib/dateUtils'
import { isDateInLateRequestPool, MAX_LATE_DCR_BATCH } from '@/lib/lateDcrEligibility'
import { Button } from '@/components/ui/button'
import DcrDaySummaryScreen from '@/components/mr/DcrDaySummaryScreen'
import { toast } from 'sonner'
import { useStockistMeetsByMonth } from '@/hooks/useStockistMeets'
import StockistMeetDayScreen from '@/components/stockist/StockistMeetDayScreen'
import type { StockistMeet } from '@/types/database.types'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { LIVE_QUERY_OPTIONS } from '@/lib/liveQueryOptions'

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
  /** MR only: multi-select missed days to request late DCR approval from manager */
  enableLateRequest?: boolean
  /** Open request picker on load (e.g. from dashboard link). */
  initialRequestLateMode?: boolean
  emptyMessage?: string
}

export default function ReportHistoryView({
  subjectMrId,
  subjectName,
  linkMode,
  showPdfCard = false,
  enableLateRequest = false,
  initialRequestLateMode = false,
  emptyMessage = 'No reports yet for this period.',
}: Props) {
  const navigate = useNavigate()
  const { data: reports = [], isLoading, isError } = useMrReportsWithVisitCounts(subjectMrId)
  const { data: activeLateSlots = 0 } = useActiveLateSlotCount(enableLateRequest ? subjectMrId : '')
  const { data: requestPool = [], isLoading: requestPoolLoading } = useNextMissedLateBatchDates(
    enableLateRequest ? subjectMrId : '',
  )
  const requestLate = useRequestLateDcrFill()
  const deleteReport = useDeleteReport()
  const canManagerDelete = linkMode === 'manager-team' || linkMode === 'manager-self'
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  const [viewMonth, setViewMonth] = useState(() => {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() }
  })
  const [view, setView] = useState<'calendar' | 'list'>('calendar')
  const [selectMode, setSelectMode] = useState(false)
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set())
  const [summaryReportId, setSummaryReportId] = useState<string | null>(null)
  const [summaryDateLabel, setSummaryDateLabel] = useState('')
  const [stockistDay, setStockistDay] = useState<{ date: string; label: string; meets: StockistMeet[] } | null>(
    null,
  )

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

  const todayStr = todayInputDate()

  const requestPoolSet = useMemo(() => new Set(requestPool), [requestPool])

  useEffect(() => {
    if (!initialRequestLateMode || !enableLateRequest || requestPoolLoading) return
    if (requestPool.length === 0) return
    setView('calendar')
    const first = requestPool[0]
    if (first) {
      const [y, m] = first.split('-').map(Number)
      setViewMonth({ year: y, month: m - 1 })
    }
    setSelectMode(true)
  }, [initialRequestLateMode, enableLateRequest, requestPool, requestPoolLoading])

  const tryToggleRequestLateMode = () => {
    if (requestPoolLoading) {
      toast.message('Loading missed DCR dates…')
      return
    }
    if (activeLateSlots > 0) {
      toast.error(
        `Complete your ${activeLateSlots} open late DCR(s) from the dashboard first, then you can request more.`,
      )
      return
    }
    if (requestPool.length === 0) {
      toast.error('No missed DCR dates in your current batch to request right now.')
      return
    }
    if (!selectMode) {
      setView('calendar')
      const first = requestPool[0]
      if (first) {
        const [y, m] = first.split('-').map(Number)
        setViewMonth({ year: y, month: m - 1 })
      }
    }
    setSelectMode(v => !v)
    setSelectedDates(new Set())
  }

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

  const { data: stockistMeets = [] } = useStockistMeetsByMonth(
    subjectMrId,
    viewMonth.year,
    viewMonth.month,
  )
  const stockistMeetDates = useMemo(() => {
    const set = new Set<string>()
    for (const m of stockistMeets) set.add(m.meet_date)
    return set
  }, [stockistMeets])

  const stockistMeetsByDate = useMemo(() => {
    const map = new Map<string, StockistMeet[]>()
    for (const m of stockistMeets) {
      const list = map.get(m.meet_date) ?? []
      list.push(m)
      map.set(m.meet_date, list)
    }
    return map
  }, [stockistMeets])

  const monthRange = useMemo(() => {
    const from = `${viewMonth.year}-${String(viewMonth.month + 1).padStart(2, '0')}-01`
    const end = new Date(Date.UTC(viewMonth.year, viewMonth.month + 1, 0, 12, 0, 0))
    const to = `${end.getUTCFullYear()}-${String(end.getUTCMonth() + 1).padStart(2, '0')}-${String(
      end.getUTCDate(),
    ).padStart(2, '0')}`
    return { from, to }
  }, [viewMonth.year, viewMonth.month])

  const { data: expenseSubmittedDates = [] } = useQuery({
    queryKey: ['expense-submitted-dates', subjectMrId, monthRange.from, monthRange.to],
    enabled: !!subjectMrId && !!supabase,
    ...LIVE_QUERY_OPTIONS,
    queryFn: async (): Promise<string[]> => {
      if (!supabase) throw new Error('Supabase not configured')
      const { data, error } = await supabase
        .from('expense_reports')
        .select('report_date, status')
        .eq('mr_id', subjectMrId)
        .gte('report_date', monthRange.from)
        .lte('report_date', monthRange.to)
      if (error) throw error
      const rows = (data ?? []) as Array<{ report_date: string; status: string }>
      return rows.filter(r => r.status === 'submitted').map(r => r.report_date)
    },
  })

  const expenseSubmittedSet = useMemo(
    () => new Set(expenseSubmittedDates),
    [expenseSubmittedDates],
  )

  const submittedCount = monthReports.filter(r => r.status === 'submitted').length
  const workingDays = days.filter(d => !d.isSunday && d.date <= todayStr).length

  const closeSummary = () => {
    setSummaryReportId(null)
    setSummaryDateLabel('')
  }

  const openStockistDay = (date: string) => {
    const meets = stockistMeetsByDate.get(date) ?? []
    if (meets.length === 0) return
    setStockistDay({ date, label: formatDisplayDate(date), meets })
  }

  const summaryStockistMeets = useMemo(() => {
    if (!summaryReportId) return []
    const rep = reports.find(r => r.id === summaryReportId)
    if (!rep) return []
    return stockistMeetsByDate.get(rep.report_date) ?? []
  }, [summaryReportId, reports, stockistMeetsByDate])

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

  const toggleSelectDate = (date: string) => {
    if (!isDateInLateRequestPool(date, requestPool)) {
      toast.error('This date is not in your current batch of requestable missed days')
      return
    }
    setSelectedDates(prev => {
      const next = new Set(prev)
      if (next.has(date)) next.delete(date)
      else {
        if (next.size >= MAX_LATE_DCR_BATCH) {
          toast.error(`You can select at most ${MAX_LATE_DCR_BATCH} days per request`)
          return prev
        }
        next.add(date)
      }
      return next
    })
  }

  const handleRequestLate = async () => {
    const dates = [...selectedDates].sort()
    if (dates.length === 0) {
      toast.error('Select at least one missed day')
      return
    }
    if (dates.length > 15) {
      toast.error('Select at most 15 days per request')
      return
    }
    try {
      await requestLate.mutateAsync(dates)
      toast.success('Late DCR request sent to your manager')
      setSelectMode(false)
      setSelectedDates(new Set())
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not send request')
    }
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
          stockistMeets={summaryStockistMeets}
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

      {stockistDay && (
        <StockistMeetDayScreen
          dateLabel={stockistDay.label}
          subjectName={subjectName}
          meets={stockistDay.meets}
          onBack={() => setStockistDay(null)}
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
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="inline-flex rounded-lg border border-border/80 p-0.5 bg-muted/30">
            <button
              type="button"
              className={cn(
                'px-3 py-1.5 text-xs font-semibold rounded-md transition-colors',
                view === 'calendar' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground',
              )}
              onClick={() => setView('calendar')}
            >
              Calendar
            </button>
            <button
              type="button"
              className={cn(
                'px-3 py-1.5 text-xs font-semibold rounded-md transition-colors',
                view === 'list' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground',
              )}
              onClick={() => setView('list')}
            >
              List
            </button>
          </div>

          {enableLateRequest && (
            <Button
              type="button"
              variant={selectMode ? 'secondary' : 'outline'}
              size="sm"
              className="rounded-lg text-xs h-8"
              onClick={tryToggleRequestLateMode}
            >
              {selectMode ? 'Cancel' : 'Request late DCR'}
            </Button>
          )}
        </div>

        {enableLateRequest && activeLateSlots > 0 && (
          <p className="text-xs text-amber-800 bg-amber-500/10 rounded-lg px-3 py-2">
            You have {activeLateSlots} approved late DCR(s) to file — see Pending on your dashboard.
          </p>
        )}

        {enableLateRequest && selectMode && (
          <p className="text-xs text-muted-foreground">
            Select up to {MAX_LATE_DCR_BATCH} missed days from your current batch (highlighted in red).
            After these are approved and filed, you can request the next batch.
          </p>
        )}

        {showPdfCard && subjectMrId && (
          <DcrPdfDownloadCard mrId={subjectMrId} mrName={subjectName} />
        )}

        {selectMode && selectedDates.size > 0 && (
          <Button
            type="button"
            className="w-full rounded-xl gap-2"
            disabled={requestLate.isPending}
            onClick={() => void handleRequestLate()}
          >
            <Send className="h-4 w-4" />
            {requestLate.isPending
              ? 'Sending…'
              : `Ask manager to approve ${selectedDates.size} day(s)`}
          </Button>
        )}

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
                  const hasStockistMeet = stockistMeetDates.has(d.date)
                  const expenseDone = expenseSubmittedSet.has(d.date)
                  const expensePending = isSubmitted && isPast && !expenseDone && !d.isSunday
                  const notSubmitted = isPast && !isSubmitted && !d.isSunday
                  const requestable =
                    enableLateRequest &&
                    selectMode &&
                    notSubmitted &&
                    isOutsideDefaultDcrWindow(d.date) &&
                    requestPoolSet.has(d.date)
                  const isSelected = selectedDates.has(d.date)

                  return (
                    <button
                      key={d.date}
                      type="button"
                      disabled={
                        isFuture ||
                        (selectMode && !requestable && !isSubmitted) ||
                        (!selectMode &&
                          !isSubmitted &&
                          !stockistMeetsByDate.has(d.date) &&
                          !reports.some(r => r.report_date === d.date))
                      }
                      onClick={() => {
                        if (selectMode && requestable) {
                          toggleSelectDate(d.date)
                          return
                        }
                        const dayStockist = stockistMeetsByDate.get(d.date) ?? []
                        const rep = reports.find(r => r.report_date === d.date)
                        if (rep?.status === 'submitted') {
                          setSummaryReportId(rep.id)
                          setSummaryDateLabel(formatDisplayDate(d.date))
                          return
                        }
                        if (rep) {
                          openReport(rep)
                          return
                        }
                        if (dayStockist.length > 0) {
                          openStockistDay(d.date)
                        }
                      }}
                      className={cn(
                        'aspect-square flex flex-col items-center justify-center rounded-lg text-xs transition-all',
                        isToday && !selectMode && 'ring-2 ring-primary/50',
                        isSubmitted &&
                          (expensePending
                            ? 'bg-amber-500/15 text-amber-900 font-semibold'
                            : 'bg-emerald-600/15 text-emerald-800 font-semibold'),
                        notSubmitted && 'bg-red-500/10 text-red-700',
                        isSelected && 'ring-2 ring-primary bg-primary/15',
                        d.isSunday && !isSubmitted && 'text-muted-foreground/50',
                        isFuture && 'opacity-30',
                        selectMode && !requestable && !isSubmitted && 'opacity-40',
                        !isSubmitted && !notSubmitted && !isFuture && !d.isSunday && 'text-foreground',
                      )}
                    >
                      <span>{d.day}</span>
                      <div className="flex items-center gap-0.5 mt-0.5">
                        {isSubmitted && <CheckCircle2 className="h-2.5 w-2.5" />}
                        {expensePending && <Receipt className="h-2.5 w-2.5 text-muted-foreground" />}
                        {hasStockistMeet && <Store className="h-2.5 w-2.5 text-primary" />}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {stockistMeets.length > 0 && (
              <div className="rounded-xl border border-border/60 bg-card p-3 space-y-2">
                <p className="text-xs font-semibold text-foreground">
                  Stockist meets this month ({stockistMeets.length})
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {linkMode === 'manager-team' || linkMode === 'manager-self'
                    ? `Logged by ${subjectName}. Tap a day with the store icon on the calendar.`
                    : 'Tap a day with the store icon to view details.'}
                </p>
                <ul className="space-y-1.5 max-h-40 overflow-y-auto">
                  {stockistMeets.map(m => (
                    <li key={m.id}>
                      <button
                        type="button"
                        className="w-full text-left text-xs rounded-lg px-2 py-1.5 hover:bg-muted/60 flex justify-between gap-2"
                        onClick={() => openStockistDay(m.meet_date)}
                      >
                        <span className="font-medium text-foreground truncate">
                          {m.stockist?.name ?? 'Stockist'}
                        </span>
                        <span className="text-muted-foreground shrink-0">
                          {formatDisplayDate(m.meet_date)}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex flex-wrap gap-3 text-[10px] text-muted-foreground justify-center">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-emerald-600/15" /> Submitted (tap for summary)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-amber-500/15" /> Expense pending
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-red-500/10" /> Not Submitted
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-muted/50" /> Sunday
              </span>
              <span className="flex items-center gap-1">
                <Store className="h-3 w-3 text-muted-foreground" /> Stockist meet
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
