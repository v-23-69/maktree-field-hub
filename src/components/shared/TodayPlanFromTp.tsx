import { MapPin, FilePlus, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

type Props = {
  subAreaName: string
  areaName: string
  className?: string
  dcrDone?: boolean
  dcrBlocked?: boolean
  todayIsSunday?: boolean
  onStartDcr?: () => void
}

/** Area from tour program for today. Working with is chosen in DCR, not TP. */
export default function TodayPlanFromTp({
  subAreaName,
  areaName,
  className,
  dcrDone,
  dcrBlocked,
  todayIsSunday,
  onStartDcr,
}: Props) {
  const showStart =
    onStartDcr && !dcrDone && !dcrBlocked && !todayIsSunday

  return (
    <div
      className={cn(
        'rounded-2xl border border-emerald-500/15 bg-emerald-500/5 overflow-hidden',
        className,
      )}
    >
      <div className="px-4 py-3 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold text-foreground">Today&apos;s area</p>
          <span className="text-[9px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
            Tour program
          </span>
        </div>
        <div className="flex items-start gap-2">
          <MapPin className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground leading-snug">{subAreaName}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{areaName}</p>
          </div>
        </div>
      </div>

      {dcrDone && (
        <div className="flex items-center gap-2 border-t border-emerald-500/15 bg-emerald-600/10 px-4 py-2.5">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Today&apos;s DCR submitted</p>
        </div>
      )}

      {dcrBlocked && !dcrDone && (
        <div className="border-t border-amber-500/15 px-4 py-2.5 text-[11px] text-muted-foreground">
          Complete your tour program before starting today&apos;s DCR.
        </div>
      )}

      {showStart && (
        <div className="border-t border-emerald-500/15 p-3 pt-2">
          <Button
            type="button"
            onClick={onStartDcr}
            className="w-full rounded-xl h-11 text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
          >
            <FilePlus className="h-4 w-4 mr-2" />
            Start today&apos;s DCR
          </Button>
        </div>
      )}
    </div>
  )
}
