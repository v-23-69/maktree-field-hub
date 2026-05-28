import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, Receipt } from 'lucide-react'
import { cn } from '@/lib/utils'
import StoryRingAvatar from '@/components/shared/StoryRingAvatar'
import { useManagerMrs } from '@/hooks/useManagerTeam'
import { useTeamMrsTodayReportStatus } from '@/hooks/useManagerTeamHub'
import { usePendingDcrImports } from '@/hooks/useDcrImport'
import { formatShortDateIst, todayInputDate } from '@/lib/dateUtils'

type Props = {
  managerId: string
  dcrDone: boolean
  dcrBlocked: boolean
  expenseDone: boolean
  expenseDraft: boolean
  todayIsSunday: boolean
}

export default function ManagerDashboardTodayPanel({
  managerId,
  dcrDone,
  dcrBlocked,
  expenseDone,
  expenseDraft,
  todayIsSunday,
}: Props) {
  const navigate = useNavigate()
  const today = todayInputDate()
  const { data: mrs = [] } = useManagerMrs(managerId)
  const mrIds = useMemo(() => mrs.map(m => m.id), [mrs])
  const { data: todayReports = [] } = useTeamMrsTodayReportStatus(mrIds, today)
  const { data: pendingImports = [] } = usePendingDcrImports(managerId)

  const todayImport = pendingImports.find(p => p.report_date === today)

  const statusByMrId = useMemo(() => new Map(todayReports.map(r => [r.mrId, r.submitted])), [todayReports])

  return (
    <div className="rounded-2xl border border-border/80 bg-card/60 backdrop-blur-sm overflow-hidden">
      <div className="px-4 py-2.5 border-b border-border/60 flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-foreground">Today</span>
        <span className="text-[10px] text-muted-foreground tabular-nums">{formatShortDateIst(today)} · IST</span>
      </div>

      <div className="px-4 py-3 border-b border-border/50">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={dcrBlocked || (todayIsSunday && dcrDone)}
            onClick={() => {
              if (dcrBlocked) return
              if (todayImport) {
                navigate(`/manager/dcr-import/${todayImport.import_id}`)
                return
              }
              navigate('/manager/report/new')
            }}
            className={cn(
              'group flex items-center gap-2.5 rounded-xl px-3 py-3 text-left transition-all touch-pan-y',
              dcrDone
                ? 'bg-emerald-500/10 ring-1 ring-emerald-500/25'
                : dcrBlocked
                  ? 'bg-muted/40 opacity-50 cursor-not-allowed'
                  : 'bg-background ring-1 ring-border/80 hover:ring-primary/35 active:scale-[0.98]',
            )}
          >
            <span
              className={cn(
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                dcrDone ? 'bg-emerald-500/15 text-emerald-600' : 'bg-muted text-muted-foreground',
              )}
            >
              <FileText className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-xs font-semibold text-foreground">
                {todayIsSunday ? 'Sunday DCR' : todayImport ? 'Import DCR' : 'Daily report'}
              </span>
              <span
                className={cn(
                  'block text-[10px] font-medium mt-0.5',
                  dcrDone ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground',
                )}
              >
                {dcrDone
                  ? 'Submitted'
                  : dcrBlocked
                    ? 'Locked'
                    : todayImport
                      ? `From ${todayImport.mr_name.split(' ')[0]}`
                      : 'Tap to start'}
              </span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/manager/expense')}
            className={cn(
              'group flex items-center gap-2.5 rounded-xl px-3 py-3 text-left transition-all active:scale-[0.98] touch-pan-y',
              expenseDone
                ? 'bg-emerald-500/10 ring-1 ring-emerald-500/25'
                : 'bg-background ring-1 ring-border/80 hover:ring-primary/35',
            )}
          >
            <span
              className={cn(
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                expenseDone ? 'bg-emerald-500/15 text-emerald-600' : 'bg-muted text-muted-foreground',
              )}
            >
              <Receipt className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-xs font-semibold text-foreground">Expense</span>
              <span
                className={cn(
                  'block text-[10px] font-medium mt-0.5',
                  expenseDone ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground',
                )}
              >
                {expenseDone ? 'Submitted' : expenseDraft ? 'Continue draft' : 'Tap to open'}
              </span>
            </span>
          </button>
        </div>
      </div>

      {mrs.length > 0 && (
        <div className="px-4 py-3">
          <p className="text-[10px] font-medium text-muted-foreground mb-2">Team DCR today</p>
          <div className="flex flex-wrap gap-4">
            {mrs.map(mr => {
              const submitted = statusByMrId.get(mr.id) === true
              return (
                <StoryRingAvatar
                  key={mr.id}
                  name={mr.full_name ?? 'MR'}
                  photoUrl={mr.profile_photo_url}
                  status={submitted ? 'active' : 'inactive'}
                  size="md"
                  onClick={() => navigate(`/manager/team/${mr.id}`)}
                />
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
