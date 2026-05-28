import { useEffect, useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import EmptyState from '@/components/shared/EmptyState'
import AreaSelectPager, { type SubAreaVisitProgress } from '@/components/mr/AreaSelectPager'
import { useMrSubAreas } from '@/hooks/useAreas'
import {
  useVisitFrequencyProgress,
  type VisitFrequencyDoctorRow,
} from '@/hooks/useFieldActivityAnalytics'
import { todayInputDate } from '@/lib/dateUtils'
import { cn } from '@/lib/utils'
import type { SubArea } from '@/types/database.types'

type Props = {
  mrId: string
  /** YYYY-MM — defaults to current month */
  month?: string
  /** When false, renders own section title (standalone page). */
  embedded?: boolean
}

function pickInitialSubAreaId(subAreas: SubArea[]): string | null {
  return subAreas[0]?.id ?? null
}

function VisitFrequencyDoctorCard({ row }: { row: VisitFrequencyDoctorRow }) {
  const pct =
    row.target > 0 ? Math.min(100, Math.round((Math.min(row.done, row.target) / row.target) * 100)) : 0
  const met = row.done >= row.target

  return (
    <div className="glass-card rounded-xl p-3 flex flex-col gap-2.5 min-h-[100px] border border-border/60">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground leading-snug line-clamp-2">{row.name}</p>
      </div>
      <div className="space-y-1.5">
        <div className="flex items-end justify-between gap-2">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Visits</p>
          <p
            className={cn(
              'text-base font-bold tabular-nums leading-none',
              met ? 'text-emerald-600 dark:text-emerald-400' : 'text-primary',
            )}
          >
            {row.done}/{row.target}
          </p>
        </div>
        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all', met ? 'bg-emerald-500' : 'bg-primary')}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  )
}

export default function VisitFrequencyByAreaSection({
  mrId,
  month: monthProp,
  embedded = true,
}: Props) {
  const month = monthProp ?? todayInputDate().slice(0, 7)
  const monthAnchor = `${month}-01`

  const { data: subAreas = [], isLoading: subAreasLoading } = useMrSubAreas(mrId)
  const { data: vfProgress, isLoading: vfLoading } = useVisitFrequencyProgress(
    mrId,
    monthAnchor,
    !!mrId,
  )

  const flatSubAreas = useMemo(
    () =>
      [...subAreas].sort((a, b) => {
        const ta = a.area?.name ?? ''
        const tb = b.area?.name ?? ''
        if (ta !== tb) return ta.localeCompare(tb)
        return a.name.localeCompare(b.name)
      }),
    [subAreas],
  )

  const [selectedSubAreaId, setSelectedSubAreaId] = useState<string | null>(null)

  useEffect(() => {
    if (subAreasLoading || flatSubAreas.length === 0) return
    setSelectedSubAreaId(prev => {
      if (prev && flatSubAreas.some(sa => sa.id === prev)) return prev
      return pickInitialSubAreaId(flatSubAreas)
    })
  }, [flatSubAreas, subAreasLoading])

  const doctors = vfProgress?.doctors ?? []

  const visitProgressBySubArea = useMemo(() => {
    const map = new Map<string, SubAreaVisitProgress>()
    for (const d of doctors) {
      const cur = map.get(d.subAreaId) ?? { cappedDone: 0, target: 0 }
      cur.target += d.target
      cur.cappedDone += Math.min(d.done, d.target)
      map.set(d.subAreaId, cur)
    }
    return map
  }, [doctors])

  const selectedSubArea = useMemo(
    () => flatSubAreas.find(sa => sa.id === selectedSubAreaId) ?? null,
    [flatSubAreas, selectedSubAreaId],
  )

  const doctorsInSelected = useMemo(
    () => doctors.filter(d => d.subAreaId === selectedSubAreaId),
    [doctors, selectedSubAreaId],
  )

  const areaSummary = useMemo(() => {
    if (!selectedSubAreaId) return { cappedDone: 0, target: 0, pct: 0 }
    const p = visitProgressBySubArea.get(selectedSubAreaId)
    if (!p || p.target <= 0) return { cappedDone: 0, target: 0, pct: 0 }
    return {
      ...p,
      pct: Math.round((p.cappedDone / p.target) * 100),
    }
  }, [selectedSubAreaId, visitProgressBySubArea])

  const vfPct = useMemo(() => {
    if (!vfProgress || vfProgress.totalTarget <= 0) return 0
    return Math.round((vfProgress.totalDone / vfProgress.totalTarget) * 100)
  }, [vfProgress])

  const metInArea = doctorsInSelected.filter(d => d.done >= d.target).length
  const loading = subAreasLoading || vfLoading

  return (
    <section className="space-y-3">
      {embedded ? (
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-foreground">Visit frequency</h2>
          <Badge variant="outline" className="text-[10px] tabular-nums">
            {month}
          </Badge>
        </div>
      ) : null}
      <p className={cn('text-xs text-muted-foreground', embedded && '-mt-1')}>
        Pick an area like on the Doctors page, then see each doctor&apos;s visits vs monthly target.
      </p>

      {loading && <LoadingSpinner />}

      {!loading && flatSubAreas.length === 0 && (
        <EmptyState message="No areas assigned yet. Contact your manager." />
      )}

      {!loading && flatSubAreas.length > 0 && (
        <>
          <div className="glass-card p-4 space-y-3 rounded-xl">
            <div className="flex justify-between items-end gap-3">
              <div>
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
                  Month progress (all areas)
                </p>
                <p className="text-2xl font-bold tabular-nums text-foreground mt-1">
                  {vfProgress?.totalDone ?? 0}
                  <span className="text-muted-foreground font-semibold text-lg">
                    {' '}
                    / {vfProgress?.totalTarget ?? 0}
                  </span>
                </p>
              </div>
              <span className="text-sm font-bold text-primary tabular-nums">{vfPct}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${Math.min(100, vfPct)}%` }}
              />
            </div>
          </div>

          <AreaSelectPager
            subAreas={flatSubAreas}
            selectedId={selectedSubAreaId}
            visitProgressBySubArea={visitProgressBySubArea}
            onSelect={setSelectedSubAreaId}
          />

          {selectedSubArea && (
            <div className="rounded-2xl border border-border/80 bg-card shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-muted/30 border-b border-border/60">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-foreground">{selectedSubArea.name}</p>
                    <p className="text-xs text-muted-foreground">{selectedSubArea.area?.name}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-bold tabular-nums text-foreground">{areaSummary.pct}%</p>
                    <p className="text-[10px] text-muted-foreground">
                      {areaSummary.cappedDone}/{areaSummary.target} visits
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {metInArea}/{doctorsInSelected.length} doctors on target
                    </p>
                  </div>
                </div>
                <div className="mt-2.5 h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      areaSummary.pct > 80
                        ? 'bg-emerald-500'
                        : areaSummary.pct >= 50
                          ? 'bg-amber-500'
                          : 'bg-destructive',
                    )}
                    style={{ width: `${Math.min(100, areaSummary.pct)}%` }}
                  />
                </div>
              </div>

              <div className="p-3 max-h-[min(55vh,480px)] overflow-y-auto">
                {doctorsInSelected.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No doctors in this area yet.</p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 md:gap-3">
                    {doctorsInSelected.map(row => (
                      <VisitFrequencyDoctorCard key={row.doctorId} row={row} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </section>
  )
}
