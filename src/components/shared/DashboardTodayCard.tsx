import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronDown,
  Download,
  FilePlus,
  FileText,
  Lock,
  MapPin,
  Receipt,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'
import { formatShortDateIst, formatDisplayDate, todayInputDate } from '@/lib/dateUtils'
import type { AllowedReportDate } from '@/types/database.types'
import MarkSundayDcrButton from '@/components/shared/MarkSundayDcrButton'

export type DashboardTodayStatusState = 'done' | 'pending' | 'locked' | 'alert' | 'draft' | 'import'

export type DashboardDcrImportItem = {
  import_id: string
  mr_name: string
  report_date: string
  visit_count: number
}

type Props = {
  title?: string
  subAreaName?: string
  areaName?: string
  dcrDone: boolean
  dcrBlocked?: boolean
  expenseDone: boolean
  expenseDraft?: boolean
  todayIsSunday: boolean
  pendingDcrs?: AllowedReportDate[]
  dcrImports?: DashboardDcrImportItem[]
  expenseHref?: string
  reportHref?: string
  onStartDcr?: () => void
  onOpenDcr?: () => void
  onOpenPendingDcr?: (d: AllowedReportDate) => void
  onOpenImport?: (importId: string) => void
}

function StatusIcon({ state }: { state: DashboardTodayStatusState }) {
  if (state === 'done') {
    return (
      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/15 ring-1 ring-emerald-500/35">
        <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" strokeWidth={3} />
      </span>
    )
  }

  if (state === 'locked') {
    return (
      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/15 ring-1 ring-amber-500/35">
        <Lock className="h-2.5 w-2.5 text-amber-600 dark:text-amber-400" strokeWidth={2.5} />
      </span>
    )
  }

  if (state === 'draft') {
    return (
      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/15 ring-1 ring-amber-500/35">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-600 dark:bg-amber-400" />
      </span>
    )
  }

  if (state === 'import') {
    return (
      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-violet-500/15 ring-1 ring-violet-500/35">
        <Download className="h-2.5 w-2.5 text-violet-600 dark:text-violet-400" />
      </span>
    )
  }

  return (
    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-destructive/12 ring-1 ring-destructive/35">
      <X className="h-3 w-3 text-destructive" strokeWidth={3} />
    </span>
  )
}

function StatusRow({
  label,
  state,
  className,
}: {
  label: string
  state: DashboardTodayStatusState
  className?: string
}) {
  const labelClass =
    state === 'alert' ? 'text-destructive' : 'text-muted-foreground'

  const valueClass = cn(
    'text-[10px] font-bold uppercase tracking-wide',
    state === 'done' && 'text-primary',
    state === 'pending' && 'text-muted-foreground',
    state === 'draft' && 'text-amber-600 dark:text-amber-400',
    state === 'locked' && 'text-amber-600 dark:text-amber-400',
    state === 'import' && 'text-violet-600 dark:text-violet-400',
    state === 'alert' && 'text-destructive',
  )

  const value =
    state === 'done'
      ? 'Done'
      : state === 'locked'
        ? 'Locked'
        : state === 'draft'
          ? 'Draft'
          : state === 'import'
            ? 'Ready'
            : state === 'alert'
              ? 'Pending'
              : 'Pending'

  return (
    <div className={cn('flex items-center justify-between gap-2 py-0.5 max-md:py-1', className)}>
      <span
        className={cn(
          'min-w-0 flex-1 text-[11px] max-md:text-[11px] font-medium leading-tight',
          labelClass,
          state === 'alert' && 'max-md:font-bold',
        )}
      >
        {label}
      </span>
      <span className={cn(valueClass, 'max-md:hidden shrink-0')}>{value}</span>
      <span className="hidden max-md:inline-flex shrink-0">
        <StatusIcon state={state} />
      </span>
    </div>
  )
}

const glassCard =
  'rounded-2xl border border-primary/25 bg-card/90 dark:bg-card/70 backdrop-blur-md shadow-sm ring-1 ring-primary/10'

const compactBtn =
  'h-8 max-md:h-9 rounded-lg text-[11px] max-md:text-[11px] font-semibold px-3 max-md:px-2 w-full shadow-none max-md:flex-1'

/** Compact today plan — blue glass card, status + action buttons (MR & manager). */
export default function DashboardTodayCard({
  title = "Today's field plan",
  subAreaName,
  areaName,
  dcrDone,
  dcrBlocked,
  expenseDone,
  expenseDraft,
  todayIsSunday,
  pendingDcrs = [],
  dcrImports = [],
  expenseHref = '/mr/expense',
  reportHref = '/mr/report/new',
  onStartDcr,
  onOpenDcr,
  onOpenPendingDcr,
  onOpenImport,
}: Props) {
  const navigate = useNavigate()
  const today = todayInputDate()
  const [pendingOpen, setPendingOpen] = useState(pendingDcrs.length > 0)
  const [importsOpen, setImportsOpen] = useState(dcrImports.length > 0)
  const hasTourArea = Boolean(subAreaName?.trim())
  const pendingCount = pendingDcrs.length
  const importCount = dcrImports.length
  const todayImport = dcrImports.find(i => i.report_date === today)

  const showImportDcr =
    Boolean(todayImport && !dcrDone && !dcrBlocked && onOpenImport)

  const showStartDcr =
    hasTourArea &&
    onStartDcr &&
    !dcrDone &&
    !dcrBlocked &&
    !todayIsSunday &&
    !showImportDcr

  const dcrState: DashboardTodayStatusState = dcrDone
    ? 'done'
    : dcrBlocked
      ? 'locked'
      : showImportDcr
        ? 'import'
        : 'pending'
  const expenseState: DashboardTodayStatusState = expenseDone
    ? 'done'
    : expenseDraft
      ? 'draft'
      : 'pending'

  const openDcr = () => {
    if (dcrBlocked) return
    if (onOpenDcr) onOpenDcr()
    else if (onStartDcr) onStartDcr()
    else navigate(reportHref)
  }

  return (
    <div className={cn(glassCard, 'overflow-hidden')}>
      <div className="px-3.5 py-3 border-b border-primary/10 bg-primary/[0.04]">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[11px] font-bold text-foreground tracking-tight">{title}</p>
          <p className="text-[10px] text-muted-foreground tabular-nums shrink-0">
            {formatShortDateIst(today)} · IST
          </p>
        </div>
      </div>

      <div className="p-3.5 max-md:p-3 space-y-2 max-md:space-y-2.5">
        {hasTourArea ? (
          <div className="flex items-start gap-2">
            <div className="h-7 w-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <MapPin className="h-3.5 w-3.5 text-primary" />
            </div>
            <div className="min-w-0 pt-0.5">
              <p className="text-[13px] font-bold text-foreground leading-snug line-clamp-2">
                {subAreaName}
              </p>
              {areaName && (
                <p className="text-[10px] text-primary/80 font-medium mt-0.5">{areaName}</p>
              )}
            </div>
          </div>
        ) : (
          <p className="text-[11px] text-muted-foreground">No tour area for today.</p>
        )}

        <div className="flex gap-2.5 max-md:gap-2.5 items-start max-md:flex-col">
          <div className="flex-1 min-w-0 w-full rounded-xl border border-primary/15 bg-background/60 dark:bg-background/40 px-2.5 max-md:px-3 py-2 max-md:py-2.5 space-y-0.5 max-md:space-y-1">
            <StatusRow
              label={
                showImportDcr
                  ? 'Import DCR'
                  : todayIsSunday
                    ? 'Sunday DCR'
                    : 'Daily report'
              }
              state={dcrState}
            />
            <StatusRow label="Expense" state={expenseState} />
            {importCount > 0 && !showImportDcr && (
              <StatusRow label="MR imports" state="import" />
            )}
            {pendingCount > 0 && (
              <StatusRow label="Pending DCRs" state="alert" />
            )}
          </div>

          <div className="flex flex-col gap-1.5 shrink-0 w-[min(38%,7.5rem)] max-md:w-full max-md:flex-row mt-[0.35cm] max-md:mt-0">
            {showImportDcr && todayImport ? (
              <Button
                type="button"
                onClick={() => onOpenImport?.(todayImport.import_id)}
                className={cn(
                  compactBtn,
                  'bg-violet-600 hover:bg-violet-700 text-white border-0',
                )}
              >
                <Download className="h-3 w-3 mr-1 shrink-0" />
                Import DCR
              </Button>
            ) : showStartDcr ? (
              <Button
                type="button"
                onClick={onStartDcr}
                className={cn(
                  compactBtn,
                  'bg-primary hover:bg-primary/90 text-primary-foreground border-0',
                )}
              >
                <FilePlus className="h-3 w-3 mr-1 shrink-0" />
                Start DCR
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                disabled={dcrBlocked}
                onClick={openDcr}
                className={cn(
                  compactBtn,
                  'border-primary/30 bg-background/80 hover:bg-primary/5 text-foreground',
                  dcrDone && 'border-primary/40 text-primary',
                )}
              >
                <FileText className="h-3 w-3 mr-1 shrink-0" />
                {dcrDone ? 'DCR done' : todayIsSunday ? 'Sunday' : 'DCR'}
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(expenseHref)}
              className={cn(
                compactBtn,
                'border-primary/30 bg-background/80 hover:bg-primary/5',
                expenseDone && 'border-primary/40 text-primary',
              )}
            >
              <Receipt className="h-3 w-3 mr-1 shrink-0" />
              Expense
            </Button>
          </div>
        </div>

        {showImportDcr && todayImport && (
          <p className="flex items-center gap-1 text-[10px] font-medium text-violet-600 dark:text-violet-400">
            <Download className="h-3 w-3 shrink-0" />
            {todayImport.mr_name.split(' ')[0]} submitted — import to file your DCR
          </p>
        )}
        {dcrDone && (
          <p className="flex items-center gap-1 text-[10px] font-medium text-primary">
            <CheckCircle2 className="h-3 w-3 shrink-0" />
            DCR submitted
          </p>
        )}
        {dcrBlocked && !dcrDone && (
          <p className="flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400">
            <AlertCircle className="h-3 w-3 shrink-0" />
            Approve tour program first
          </p>
        )}
      </div>

      {importCount > 0 && (
        <Collapsible
          open={importsOpen}
          onOpenChange={setImportsOpen}
          className="border-t border-violet-500/25 bg-violet-500/[0.06]"
        >
          <CollapsibleTrigger className="flex w-full items-center justify-between gap-2 px-3.5 py-2.5 text-left hover:bg-violet-500/[0.08] transition-colors">
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-violet-700 dark:text-violet-400">
                Import from team MR
              </p>
              <p className="text-[10px] text-violet-600/80 dark:text-violet-400/80 mt-0.5">
                {importCount} DCR{importCount === 1 ? '' : 's'} ready to import
              </p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Badge
                variant="outline"
                className="h-5 min-w-5 px-1.5 text-[10px] font-bold border-violet-500/50 text-violet-700 dark:text-violet-400 bg-violet-500/10"
              >
                {importCount}
              </Badge>
              <ChevronDown
                className={cn(
                  'h-3.5 w-3.5 text-violet-600 transition-transform',
                  importsOpen && 'rotate-180',
                )}
              />
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent className="px-3.5 pb-3 space-y-1">
            {dcrImports.map(item => (
              <div
                key={item.import_id}
                className="flex items-center justify-between gap-2 rounded-lg border border-violet-500/30 bg-background/80 px-2.5 py-2"
              >
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-foreground truncate">
                    {item.mr_name}
                  </p>
                  <p className="text-[9px] text-muted-foreground">
                    {item.report_date === today
                      ? 'Today'
                      : formatDisplayDate(item.report_date)}{' '}
                    · {item.visit_count} call{item.visit_count !== 1 ? 's' : ''}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="shrink-0 h-7 text-[9px] rounded-md border-violet-500/40 text-violet-700 dark:text-violet-400 hover:bg-violet-500/10 px-2"
                  onClick={() => onOpenImport?.(item.import_id)}
                >
                  Import
                </Button>
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>
      )}

      {pendingCount > 0 && (
        <Collapsible
          open={pendingOpen}
          onOpenChange={setPendingOpen}
          className="border-t border-destructive/25 max-md:border-destructive/35 bg-destructive/[0.04] max-md:bg-destructive/[0.08]"
        >
          <CollapsibleTrigger className="flex w-full items-center justify-between gap-2 px-3.5 max-md:px-3 py-2.5 max-md:py-3 text-left hover:bg-destructive/[0.06] max-md:hover:bg-destructive/10 transition-colors">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] max-md:text-xs font-bold text-destructive">Pending DCRs</p>
              <p className="text-[10px] max-md:text-[11px] text-destructive/90 max-md:text-destructive mt-0.5 font-medium">
                {pendingCount} to file
              </p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Badge
                variant="outline"
                className="h-5 min-w-5 max-md:h-6 max-md:min-w-6 max-md:px-2 px-1.5 text-[10px] max-md:text-[11px] font-bold border-destructive/50 text-destructive bg-destructive/10"
              >
                {pendingCount}
              </Badge>
              <ChevronDown
                className={cn(
                  'h-3.5 w-3.5 max-md:h-4 max-md:w-4 text-destructive transition-transform',
                  pendingOpen && 'rotate-180',
                )}
              />
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent className="px-3.5 max-md:px-3 pb-3 max-md:pb-3.5 space-y-1.5 max-md:space-y-2">
            {pendingDcrs.map(d => {
              const isSunday = d.day_type === 'sunday'
              const isToday = d.report_date === today
              return (
                <div
                  key={d.report_date}
                  className="flex items-center justify-between gap-2 rounded-lg border border-destructive/25 max-md:border-destructive/35 bg-background/80 max-md:bg-background px-2.5 max-md:px-3 py-2 max-md:py-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] max-md:text-xs font-semibold text-foreground truncate">
                      {isToday && isSunday
                        ? 'Today (Sun)'
                        : isToday
                          ? 'Today'
                          : formatShortDateIst(d.report_date)}
                    </p>
                    <p className="text-[9px] max-md:text-[10px] text-muted-foreground capitalize">
                      {d.is_late_slot ? 'Late DCR · ' : ''}
                      {d.day_type === 'leave' ? 'Leave' : isSunday ? 'Sunday' : 'Field'}
                    </p>
                  </div>
                  {isSunday ? (
                    <MarkSundayDcrButton
                      reportDate={d.report_date}
                      className="shrink-0 text-[9px] max-md:text-[10px] h-7 max-md:h-8 px-2 max-md:px-3"
                    />
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="shrink-0 h-7 max-md:h-8 text-[9px] max-md:text-[10px] rounded-md border-destructive/40 text-destructive hover:bg-destructive/10 px-2 max-md:px-3 font-semibold"
                      onClick={() => onOpenPendingDcr?.(d)}
                    >
                      File
                    </Button>
                  )}
                </div>
              )
            })}
          </CollapsibleContent>
        </Collapsible>
      )}

      {pendingCount === 0 && dcrDone && expenseDone && (
        <div className="border-t border-primary/15 px-3.5 py-2 flex items-center gap-1.5 bg-primary/[0.04]">
          <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
          <p className="text-[10px] font-semibold text-primary">All caught up today</p>
        </div>
      )}
    </div>
  )
}
