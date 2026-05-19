import { useNavigate } from 'react-router-dom'
import { FileText, Receipt } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatShortDateIst, todayInputDate } from '@/lib/dateUtils'

type Props = {
  dcrDone: boolean
  dcrBlocked?: boolean
  expenseDone: boolean
  todayIsSunday: boolean
}

export default function MrDashboardTodayPanel({
  dcrDone,
  dcrBlocked,
  expenseDone,
  todayIsSunday,
}: Props) {
  const navigate = useNavigate()
  const today = todayInputDate()

  return (
    <div className="rounded-2xl border border-border/80 bg-card/60 backdrop-blur-sm overflow-hidden">
      <div className="px-4 py-2.5 border-b border-border/60 flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-foreground">Today</span>
        <span className="text-[10px] text-muted-foreground tabular-nums">{formatShortDateIst(today)} · IST</span>
      </div>
      <div className="px-4 py-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={dcrBlocked || (todayIsSunday && dcrDone)}
          onClick={() => !dcrBlocked && navigate('/mr/report/new')}
          className={cn(
            'flex items-center gap-2.5 rounded-xl px-3 py-3 text-left transition-all',
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
          <span className="min-w-0">
            <span className="block text-xs font-semibold text-foreground">
              {todayIsSunday ? 'Sunday DCR' : 'Daily report'}
            </span>
            <span
              className={cn(
                'block text-[10px] font-medium mt-0.5',
                dcrDone ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground',
              )}
            >
              {dcrDone ? 'Submitted' : dcrBlocked ? 'Locked' : 'Tap to start'}
            </span>
          </span>
        </button>

        <button
          type="button"
          onClick={() => navigate('/mr/expense')}
          className={cn(
            'flex items-center gap-2.5 rounded-xl px-3 py-3 text-left transition-all active:scale-[0.98]',
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
          <span className="min-w-0">
            <span className="block text-xs font-semibold text-foreground">Expense</span>
            <span
              className={cn(
                'block text-[10px] font-medium mt-0.5',
                expenseDone ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground',
              )}
            >
              {expenseDone ? 'Submitted' : 'Tap to open'}
            </span>
          </span>
        </button>
      </div>
    </div>
  )
}
