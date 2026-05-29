import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { isOutsideDefaultDcrWindow, isSundayYmd } from '@/lib/dateUtils'
import { MAX_LATE_DCR_BATCH } from '@/lib/lateDcrEligibility'

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
  submittedDates: Set<string>
  selectedDates: Set<string>
  onToggle: (date: string) => void
  todayStr: string
  /** If set, only these dates can be toggled (MR request pool). */
  allowedPool?: string[]
  maxSelect?: number
}

export default function LateDcrDateMultiSelect({
  submittedDates,
  selectedDates,
  onToggle,
  todayStr,
  allowedPool,
  maxSelect = MAX_LATE_DCR_BATCH,
}: Props) {
  const [viewMonth, setViewMonth] = useState(() => {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() }
  })

  const { days, startPad } = useMemo(
    () => getMonthDays(viewMonth.year, viewMonth.month),
    [viewMonth],
  )

  const poolSet = useMemo(
    () => (allowedPool ? new Set(allowedPool) : null),
    [allowedPool],
  )

  const monthLabel = new Date(viewMonth.year, viewMonth.month).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="rounded-xl border border-border/60 bg-card p-3 space-y-3">
      <div className="flex items-center justify-between">
        <button type="button" onClick={() => setViewMonth(p => (p.month === 0 ? { year: p.year - 1, month: 11 } : { year: p.year, month: p.month - 1 }))} className="p-2 rounded-lg active:bg-muted">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <p className="text-sm font-semibold">{monthLabel}</p>
        <button type="button" onClick={() => setViewMonth(p => (p.month === 11 ? { year: p.year + 1, month: 0 } : { year: p.year, month: p.month + 1 }))} className="p-2 rounded-lg active:bg-muted">
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <p className="text-[10px] text-muted-foreground text-center">
        Selected {selectedDates.size} / {maxSelect}
      </p>

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
          const isPast = d.date <= todayStr
          const isFuture = d.date > todayStr
          const isSubmitted = submittedDates.has(d.date)
          const outsideWindow = isOutsideDefaultDcrWindow(d.date)
          const inPool = !poolSet || poolSet.has(d.date)
          const selectable =
            isPast &&
            !isFuture &&
            !isSubmitted &&
            !d.isSunday &&
            outsideWindow &&
            inPool
          const isSelected = selectedDates.has(d.date)

          return (
            <button
              key={d.date}
              type="button"
              disabled={!selectable && !isSelected}
              onClick={() => {
                if (selectable || isSelected) onToggle(d.date)
              }}
              className={cn(
                'aspect-square flex items-center justify-center rounded-lg text-xs',
                isSelected && 'bg-primary text-primary-foreground font-semibold ring-2 ring-primary/40',
                selectable && !isSelected && 'bg-red-500/10 text-red-800',
                isSubmitted && 'bg-emerald-600/15 text-emerald-800',
                !selectable && !isSelected && 'opacity-35',
                d.isSunday && 'text-muted-foreground/50',
              )}
            >
              {d.day}
            </button>
          )
        })}
      </div>
    </div>
  )
}
