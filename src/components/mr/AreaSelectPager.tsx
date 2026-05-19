import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { MasterListCompletion, SubArea } from '@/types/database.types'

const PER_PAGE = 4
const CARD_HEIGHT = 'h-[76px]'

type Props = {
  subAreas: SubArea[]
  selectedId: string | null
  completionBySubArea: Map<string, MasterListCompletion>
  onSelect: (id: string) => void
}

function AreaCard({
  sa,
  active,
  completion,
  onSelect,
}: {
  sa: SubArea
  active: boolean
  completion?: MasterListCompletion
  onSelect: () => void
}) {
  const t = completion?.total_doctors ?? 0
  const c = completion?.complete_doctors ?? 0
  const pctDone = t > 0 ? Math.round((c / t) * 100) : 0

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'rounded-xl border px-2.5 py-3 text-left transition-all touch-manipulation flex flex-col justify-between w-full self-start',
        CARD_HEIGHT,
        active
          ? 'border-primary bg-primary text-primary-foreground shadow-sm ring-2 ring-primary/20'
          : 'border-border/80 bg-card hover:border-primary/30 hover:bg-muted/30',
      )}
    >
      <div className="min-w-0">
        <p className="text-[11px] font-bold leading-snug line-clamp-2">{sa.name}</p>
        <p
          className={cn(
            'text-[9px] mt-0.5 truncate',
            active ? 'text-primary-foreground/70' : 'text-muted-foreground',
          )}
        >
          {sa.area?.name}
        </p>
      </div>
      {t > 0 && (
        <p
          className={cn(
            'text-[9px] font-semibold tabular-nums mt-1.5',
            active ? 'text-primary-foreground/85' : 'text-muted-foreground',
          )}
        >
          {pctDone}% · {c}/{t}
        </p>
      )}
    </button>
  )
}

export default function AreaSelectPager({ subAreas, selectedId, completionBySubArea, onSelect }: Props) {
  const pages = useMemo(() => {
    const chunks: SubArea[][] = []
    for (let i = 0; i < subAreas.length; i += PER_PAGE) {
      chunks.push(subAreas.slice(i, i + PER_PAGE))
    }
    return chunks
  }, [subAreas])

  const [pageIndex, setPageIndex] = useState(0)
  const pageCount = pages.length

  useEffect(() => {
    if (!selectedId || subAreas.length === 0) return
    const idx = subAreas.findIndex(sa => sa.id === selectedId)
    if (idx >= 0) setPageIndex(Math.floor(idx / PER_PAGE))
  }, [selectedId, subAreas])

  useEffect(() => {
    if (pageIndex > pageCount - 1) setPageIndex(Math.max(0, pageCount - 1))
  }, [pageCount, pageIndex])

  const goPrev = () => setPageIndex(p => Math.max(0, p - 1))
  const goNext = () => setPageIndex(p => Math.min(pageCount - 1, p + 1))

  if (subAreas.length === 0) return null

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-foreground">Select area</p>
        {pageCount > 1 && (
          <p className="text-[10px] text-muted-foreground tabular-nums">
            {pageIndex + 1} / {pageCount}
          </p>
        )}
      </div>

      <div className="relative overflow-hidden rounded-2xl">
        <div
          className="flex transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${pageIndex * 100}%)` }}
        >
          {pages.map((pageAreas, pageKey) => (
            <div
              key={pageKey}
              className="w-full shrink-0 grid grid-cols-2 gap-2 p-0.5 items-start content-start"
            >
              {Array.from({ length: PER_PAGE }, (_, slot) => {
                const sa = pageAreas[slot]
                if (!sa) {
                  return <div key={`pad-${pageKey}-${slot}`} className={CARD_HEIGHT} aria-hidden />
                }
                return (
                  <AreaCard
                    key={sa.id}
                    sa={sa}
                    active={sa.id === selectedId}
                    completion={completionBySubArea.get(sa.id)}
                    onSelect={() => onSelect(sa.id)}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {pageCount > 1 && (
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={goPrev}
            disabled={pageIndex === 0}
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card transition-all touch-manipulation',
              pageIndex === 0 ? 'opacity-40 pointer-events-none' : 'hover:bg-muted active:scale-95',
            )}
            aria-label="Previous areas"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <div className="flex items-center justify-center gap-1.5 flex-1">
            {pages.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setPageIndex(i)}
                className={cn(
                  'h-1.5 rounded-full transition-all touch-manipulation',
                  i === pageIndex ? 'w-5 bg-primary' : 'w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50',
                )}
                aria-label={`Go to page ${i + 1}`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={goNext}
            disabled={pageIndex >= pageCount - 1}
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card transition-all touch-manipulation',
              pageIndex >= pageCount - 1
                ? 'opacity-40 pointer-events-none'
                : 'hover:bg-muted active:scale-95',
            )}
            aria-label="Next areas"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </section>
  )
}
