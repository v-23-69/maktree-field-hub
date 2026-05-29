import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { ArrowLeft, Store } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatDisplayDate } from '@/lib/dateUtils'
import type { StockistMeet } from '@/types/database.types'

type Props = {
  dateLabel: string
  subjectName: string
  meets: StockistMeet[]
  onBack: () => void
}

export default function StockistMeetDayScreen({ dateLabel, subjectName, meets, onBack }: Props) {
  useEffect(() => {
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prevOverflow
    }
  }, [])

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Stockist meets"
      className="fixed inset-0 z-[200] flex flex-col bg-background"
      style={{
        width: '100vw',
        height: '100dvh',
        maxHeight: '100dvh',
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <header className="shrink-0 flex items-center gap-2 px-3 py-3 border-b border-border bg-background">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-10 w-10 shrink-0 rounded-xl"
          onClick={onBack}
          aria-label="Back to history"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="text-base font-bold text-foreground truncate">Stockist meets</h1>
          <p className="text-xs text-muted-foreground truncate">
            {dateLabel} · {subjectName}
          </p>
        </div>
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-4 pb-6 w-full max-w-lg md:max-w-2xl mx-auto space-y-3">
        {meets.map(m => (
          <div key={m.id} className="rounded-xl border border-border/70 bg-card p-4 shadow-sm space-y-2">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Store className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-foreground">{m.stockist?.name ?? 'Stockist'}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {m.area?.name ?? '—'}
                  {m.meet_time ? ` · ${String(m.meet_time).slice(0, 5)}` : ''}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {formatDisplayDate(m.meet_date)}
                </p>
              </div>
            </div>
            {m.notes?.trim() ? (
              <p className="text-sm text-foreground whitespace-pre-wrap border-t border-border pt-2">
                {m.notes.trim()}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground border-t border-border pt-2">No notes.</p>
            )}
          </div>
        ))}
      </div>
    </div>,
    document.body,
  )
}
