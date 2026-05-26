import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import type { MasterListCompletion, SubArea } from '@/types/database.types'

const PER_PAGE = 4
const CARD_HEIGHT = 'h-[76px]'

export type SubAreaVisitProgress = {
  cappedDone: number
  target: number
}

type Props = {
  subAreas: SubArea[]
  selectedId: string | null
  completionBySubArea?: Map<string, MasterListCompletion>
  visitProgressBySubArea?: Map<string, SubAreaVisitProgress>
  onSelect: (id: string) => void
}

function AreaCard({
  sa,
  active,
  completion,
  visitProgress,
  onSelect,
}: {
  sa: SubArea
  active: boolean
  completion?: MasterListCompletion
  visitProgress?: SubAreaVisitProgress
  onSelect: () => void
}) {
  let footer: string | null = null
  if (visitProgress && visitProgress.target > 0) {
    const pct = Math.round((visitProgress.cappedDone / visitProgress.target) * 100)
    footer = `${pct}% · ${visitProgress.cappedDone}/${visitProgress.target} visits`
  } else if (completion) {
    const t = completion.total_doctors ?? 0
    const c = completion.complete_doctors ?? 0
    if (t > 0) {
      const pctDone = Math.round((c / t) * 100)
      footer = `${pctDone}% · ${c}/${t}`
    }
  }

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'rounded-xl border px-2.5 py-3 text-left transition-all flex flex-col justify-between w-full self-start touch-manipulation',
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
      {footer && (
        <p
          className={cn(
            'text-[9px] font-semibold tabular-nums mt-1.5',
            active ? 'text-primary-foreground/85' : 'text-muted-foreground',
          )}
        >
          {footer}
        </p>
      )}
    </button>
  )
}

export default function AreaSelectPager({
  subAreas,
  selectedId,
  completionBySubArea = new Map(),
  visitProgressBySubArea,
  onSelect,
}: Props) {
  const pages = useMemo(() => {
    const chunks: SubArea[][] = []
    for (let i = 0; i < subAreas.length; i += PER_PAGE) {
      chunks.push(subAreas.slice(i, i + PER_PAGE))
    }
    return chunks
  }, [subAreas])

  const scrollRef = useRef<HTMLDivElement>(null)
  const skipScrollSyncRef = useRef(false)
  const [pageIndex, setPageIndex] = useState(0)
  const pageCount = pages.length

  const scrollToPage = useCallback(
    (page: number, behavior: ScrollBehavior = 'smooth') => {
      const el = scrollRef.current
      if (!el || pageCount < 1) return
      const clamped = Math.max(0, Math.min(pageCount - 1, page))
      const w = el.clientWidth
      if (w <= 0) return
      skipScrollSyncRef.current = true
      el.scrollTo({ left: clamped * w, behavior })
      window.setTimeout(() => {
        skipScrollSyncRef.current = false
      }, behavior === 'instant' || behavior === 'auto' ? 50 : 350)
    },
    [pageCount],
  )

  useEffect(() => {
    if (!selectedId || subAreas.length === 0) return
    const idx = subAreas.findIndex(sa => sa.id === selectedId)
    if (idx < 0) return
    const page = Math.floor(idx / PER_PAGE)
    setPageIndex(page)
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => scrollToPage(page, 'instant'))
    })
    return () => cancelAnimationFrame(id)
  }, [selectedId, subAreas, scrollToPage])

  useEffect(() => {
    if (pageIndex > pageCount - 1) setPageIndex(Math.max(0, pageCount - 1))
  }, [pageCount, pageIndex])

  const onScroll = useCallback(() => {
    if (skipScrollSyncRef.current) return
    const el = scrollRef.current
    if (!el || pageCount < 2) return
    const w = el.clientWidth
    if (w <= 0) return
    const idx = Math.round(el.scrollLeft / w)
    setPageIndex(Math.max(0, Math.min(pageCount - 1, idx)))
  }, [pageCount])

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

      <div
        ref={scrollRef}
        onScroll={onScroll}
        className={cn(
          'flex overflow-x-auto scroll-smooth snap-x snap-mandatory rounded-2xl',
          'touch-pan-x [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
        )}
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {pages.map((pageAreas, pageKey) => (
          <div
            key={pageKey}
            className="w-full min-w-full shrink-0 snap-center snap-always box-border grid grid-cols-2 gap-2 p-0.5 items-start content-start"
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
                  completion={visitProgressBySubArea ? undefined : completionBySubArea.get(sa.id)}
                  visitProgress={visitProgressBySubArea?.get(sa.id)}
                  onSelect={() => onSelect(sa.id)}
                />
              )
            })}
          </div>
        ))}
      </div>

      {pageCount > 1 && (
        <div className="flex items-center justify-center gap-1.5">
          {pages.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                setPageIndex(i)
                scrollToPage(i, 'smooth')
              }}
              className={cn(
                'h-1.5 rounded-full transition-all touch-manipulation',
                i === pageIndex ? 'w-5 bg-primary' : 'w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50',
              )}
              aria-label={`Areas page ${i + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  )
}
