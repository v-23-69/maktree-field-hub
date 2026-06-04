import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft, ChevronRight, Maximize2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ExplorerMediaItem } from '@/lib/explorerMediaOps'
import BookPageFlip, { BOOK_FLIP_MS } from './BookPageFlip'
import './edetailing-book-flip.css'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  items: ExplorerMediaItem[]
  startIndex?: number
}

const SWIPE_THRESHOLD = 48

function itemLabel(item: ExplorerMediaItem) {
  return item.title?.trim() || item.file_name
}

export default function EDetailingSlideshow({
  open,
  onOpenChange,
  items,
  startIndex = 0,
}: Props) {
  const [index, setIndex] = useState(startIndex)
  const [flipDir, setFlipDir] = useState<'next' | 'prev' | null>(null)
  const [animating, setAnimating] = useState(false)
  const [paused, setPaused] = useState(false)
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)

  useEffect(() => {
    if (open) setIndex(Math.min(startIndex, Math.max(0, items.length - 1)))
  }, [open, startIndex, items.length])

  const go = useCallback(
    (dir: 'next' | 'prev') => {
      if (animating || items.length < 2) return
      const next =
        dir === 'next'
          ? (index + 1) % items.length
          : (index - 1 + items.length) % items.length
      setFlipDir(dir)
      setAnimating(true)
      window.setTimeout(() => {
        setIndex(next)
        setAnimating(false)
        setFlipDir(null)
      }, BOOK_FLIP_MS)
    },
    [animating, index, items.length],
  )

  useEffect(() => {
    if (!open || paused || items.length < 2) return
    const t = window.setInterval(() => go('next'), 5000)
    return () => clearInterval(t)
  }, [open, paused, items.length, go])

  useEffect(() => {
    if (!open) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') go('next')
      if (e.key === 'ArrowLeft') go('prev')
      if (e.key === 'Escape') onOpenChange(false)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [open, go, onOpenChange])

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current
    const dy = e.changedTouches[0].clientY - touchStartY.current
    if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) < Math.abs(dy)) return
    if (dx < 0) go('next')
    else go('prev')
  }

  const handleTapZone = (e: React.MouseEvent<HTMLDivElement>) => {
    if (items.length < 2 || animating) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    if (x < rect.width * 0.35) go('prev')
    else if (x > rect.width * 0.65) go('next')
  }

  if (!open || items.length === 0) return null

  const current = items[index]
  const label = itemLabel(current)
  const underIndex =
    flipDir === 'next'
      ? (index + 1) % items.length
      : flipDir === 'prev'
        ? (index - 1 + items.length) % items.length
        : null
  const underItem = underIndex !== null ? items[underIndex] : null

  const content = (
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-[#1a1510] touch-none"
      role="dialog"
      aria-modal="true"
      aria-label="Image slideshow"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 px-3 py-2 pt-[max(0.5rem,env(safe-area-inset-top))] sm:px-4 sm:py-3">
        <p className="min-w-0 flex-1 truncate text-sm font-medium text-white">
          {label} · {index + 1} / {items.length}
        </p>
        <div className="flex shrink-0 items-center gap-1">
          <span className="hidden text-[10px] text-white/50 sm:inline-flex items-center gap-1">
            <Maximize2 className="h-3 w-3" />
            Full screen · Book turn
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-10 w-10 text-white hover:bg-white/10"
            onClick={() => onOpenChange(false)}
            aria-label="Close slideshow"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <div
        className="relative flex min-h-0 flex-1 flex-col items-center justify-center px-2 py-2 sm:px-6"
        onClick={handleTapZone}
      >
        <BookPageFlip
          currentSrc={current.public_url}
          currentAlt={label}
          underSrc={underItem?.public_url ?? null}
          underAlt={underItem ? itemLabel(underItem) : ''}
          direction={flipDir}
          animating={animating}
          className="w-full h-full max-h-[calc(100dvh-8rem)]"
        />

        <p className="pointer-events-none absolute bottom-2 left-0 right-0 text-center text-[10px] text-white/40 sm:hidden">
          Tap sides or swipe — pages turn like a book
        </p>
      </div>

      <footer className="flex shrink-0 items-center justify-center gap-4 border-t border-white/10 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <Button
          type="button"
          variant="secondary"
          size="lg"
          className="h-12 w-12 rounded-full p-0"
          onClick={e => {
            e.stopPropagation()
            go('prev')
          }}
          disabled={items.length < 2 || animating}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <button
          type="button"
          className="min-w-[5rem] text-center text-xs text-white/70 hover:text-white"
          onClick={e => {
            e.stopPropagation()
            setPaused(p => !p)
          }}
        >
          {paused ? 'Play' : 'Pause'}
        </button>
        <Button
          type="button"
          variant="secondary"
          size="lg"
          className="h-12 w-12 rounded-full p-0"
          onClick={e => {
            e.stopPropagation()
            go('next')
          }}
          disabled={items.length < 2 || animating}
          aria-label="Next page"
        >
          <ChevronRight className="h-6 w-6" />
        </Button>
      </footer>
    </div>
  )

  return createPortal(content, document.body)
}
