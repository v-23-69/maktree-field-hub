import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { ArrowLeft, Building2, Pill, Stethoscope, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import { formatDoctorLabel } from '@/lib/displayLabels'
import type { ReportVisitDaySummary } from '@/hooks/useReport'

type Props = {
  dateLabel: string
  loading: boolean
  summary: ReportVisitDaySummary | null | undefined
  onBack: () => void
  onOpenFullReport?: () => void
  onDelete?: () => void
}

export default function DcrDaySummaryScreen({
  dateLabel,
  loading,
  summary,
  onBack,
  onOpenFullReport,
  onDelete,
}: Props) {
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
      aria-label="DCR day summary"
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
          <h1 className="text-base font-bold text-foreground truncate">DCR day summary</h1>
          <p className="text-xs text-muted-foreground truncate">{dateLabel}</p>
        </div>
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-4 pb-6 w-full max-w-lg md:max-w-2xl lg:max-w-3xl mx-auto space-y-4">
        {loading && (
          <div className="py-12 flex justify-center">
            <LoadingSpinner />
          </div>
        )}

        {!loading && summary && (
          <>
            <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-primary/8 to-card p-5 space-y-1 shadow-sm">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Visits
              </p>
              <p className="text-3xl font-bold text-foreground tabular-nums">{summary.visit_count}</p>
              <p className="text-sm text-muted-foreground">
                Doctor call{summary.visit_count === 1 ? '' : 's'} on this submitted report
              </p>
            </div>

            {summary.visits.length > 0 ? (
              <div className="space-y-3">
                {summary.visits.map(v => {
                  const d = v.doctor
                  const territory = d?.sub_area?.area?.name?.trim() || '—'
                  const area = d?.sub_area?.name?.trim() || '—'
                  const promos = (v.promoted_products ?? [])
                    .map(p => p.product?.name)
                    .filter(Boolean) as string[]
                  const monthly = v.monthly_support_entries ?? []
                  const competitors = v.competitor_entries ?? []
                  return (
                    <div
                      key={v.id}
                      className="rounded-2xl border border-border/70 bg-card shadow-sm p-4 space-y-2.5"
                    >
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                          <Stethoscope className="h-5 w-5 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-base font-bold text-foreground leading-tight">
                            {formatDoctorLabel(d?.full_name, d?.speciality)}
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <Building2 className="h-3.5 w-3.5 shrink-0" />
                            {territory}
                            {area !== '—' ? ` · ${area}` : ''}
                          </p>
                        </div>
                      </div>
                      {promos.length > 0 && (
                        <div className="rounded-xl bg-muted/40 px-3 py-2.5">
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1 mb-1">
                            <Pill className="h-3 w-3" /> Promotions
                          </p>
                          <p className="text-sm text-foreground">{promos.join(', ')}</p>
                        </div>
                      )}
                      {monthly.length > 0 && (
                        <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/15 px-3 py-2.5">
                          <p className="text-[10px] font-semibold text-emerald-800 dark:text-emerald-300 uppercase tracking-wide mb-1">
                            Monthly support
                          </p>
                          <ul className="text-sm text-foreground space-y-1">
                            {monthly.map(m => (
                              <li key={m.id} className="flex justify-between gap-2">
                                <span className="truncate min-w-0">{m.product?.name ?? 'Product'}</span>
                                <span className="shrink-0 tabular-nums font-medium">Qty {m.quantity}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {competitors.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          <span className="font-semibold text-foreground">Competitors: </span>
                          {competitors.map(c => `${c.brand_name} (${c.quantity})`).join(', ')}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No visit rows on this report.</p>
            )}

            <div className="space-y-2 pt-2">
              {onOpenFullReport && (
                <Button type="button" className="w-full touch-target rounded-xl h-12" onClick={onOpenFullReport}>
                  Open full report
                </Button>
              )}
              {onDelete && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full touch-target rounded-xl h-11 border-destructive/40 text-destructive hover:bg-destructive/10"
                  onClick={onDelete}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete DCR
                </Button>
              )}
            </div>
          </>
        )}
      </div>
    </div>,
    document.body,
  )
}
