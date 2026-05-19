import { useNavigate } from 'react-router-dom'
import { CheckCircle2, Circle, FilePlus, Receipt } from 'lucide-react'
import { cn } from '@/lib/utils'
import DashboardSection from '@/components/shared/DashboardSection'
import { Button } from '@/components/ui/button'

type Props = {
  todayIsSunday: boolean
  dcrDone: boolean
  expenseDone: boolean
  dcrBlocked?: boolean
}

export default function MrTodayStatusCard({
  todayIsSunday,
  dcrDone,
  expenseDone,
  dcrBlocked,
}: Props) {
  const navigate = useNavigate()

  const items = [
    {
      label: todayIsSunday ? 'Sunday DCR' : "Today's DCR",
      done: dcrDone,
      onClick: () => navigate('/mr/report/new'),
      disabled: dcrBlocked,
    },
    {
      label: "Today's expense",
      done: expenseDone,
      onClick: () => navigate('/mr/expense'),
      disabled: false,
    },
  ]

  return (
    <DashboardSection title="Today at a glance" hint="IST calendar day — tap to open each task.">
      <div className="space-y-1">
        {items.map(item => (
          <button
            key={item.label}
            type="button"
            disabled={item.disabled}
            onClick={() => !item.disabled && item.onClick()}
            className={cn(
              'w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all',
              item.disabled ? 'opacity-60 cursor-not-allowed' : 'hover:bg-muted/40 active:scale-[0.98]',
            )}
          >
            {item.done ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            ) : (
              <Circle className="h-5 w-5 text-muted-foreground/40 shrink-0" />
            )}
            <span
              className={cn(
                'text-sm font-medium flex-1',
                item.done ? 'text-muted-foreground line-through' : 'text-foreground',
              )}
            >
              {item.label}
            </span>
            {!item.done && !item.disabled && (
              <span className="text-[10px] font-semibold text-primary">Open</span>
            )}
          </button>
        ))}
      </div>
      {!dcrDone && !dcrBlocked && !todayIsSunday && (
        <Button
          className="w-full rounded-xl h-10 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
          onClick={() => navigate('/mr/report/new')}
        >
          <FilePlus className="h-4 w-4 mr-2" />
          Start DCR
        </Button>
      )}
      {!expenseDone && (
        <Button variant="outline" className="w-full rounded-xl h-10 text-sm" onClick={() => navigate('/mr/expense')}>
          <Receipt className="h-4 w-4 mr-2" />
          Open expense
        </Button>
      )}
    </DashboardSection>
  )
}
