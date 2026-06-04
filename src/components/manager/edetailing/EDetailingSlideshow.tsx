import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Maximize2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { ExplorerMediaItem } from '@/lib/explorerMediaOps'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  items: ExplorerMediaItem[]
  startIndex?: number
}

const FLIP_MS = 620
const SWIPE_THRESHOLD = 48

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
      }, FLIP_MS)
    },
    [animating, index, items.length],
  )

  useEffect(() => {
    if (!open || paused || items.length < 2) return
    const t = window.setInterval(() => go('next'), 4500)
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
  const label = current.title?.trim() || current.file_name
  const peekIndex =
    flipDir === 'next'
      ? (index + 1) % items.length
      : flipDir === 'prev'
        ? (index - 1 + items.length) % items.length
        : null
  const peekItem = peekIndex !== null ? items[peekIndex] : null

  const content = (
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-black touch-none"
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
            Full screen
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
        style={{ perspective: '1600px' }}
        onClick={handleTapZone}
      >
        {peekItem && animating && (
          <div className="absolute inset-4 flex items-center justify-center sm:inset-8">
            <img
              src={peekItem.public_url}
              alt=""
              className="max-h-full max-w-full rounded-lg object-contain shadow-2xl bg-[#f4f0e8]"
              draggable={false}
            />
          </div>
        )}

        <div className="relative flex h-full w-full max-h-full max-w-full items-center justify-center [transform-style:preserve-3d]">
          <motion.div
            className="relative flex h-full w-full max-h-[calc(100dvh-8rem)] max-w-[min(100%,1200px)] items-center justify-center [transform-style:preserve-3d]"
            animate={{
              rotateY:
                animating && flipDir === 'next'
                  ? -92
                  : animating && flipDir === 'prev'
                    ? 92
                    : 0,
              opacity: animating ? 0.4 : 1,
            }}
            transition={{
              duration: FLIP_MS / 1000,
              ease: [0.42, 0, 0.28, 1],
            }}
            style={{
              transformOrigin: flipDir === 'prev' ? 'right center' : 'left center',
            }}
          >
            <div
              className={cn(
                'relative h-[min(calc(100dvh-10rem),calc(100vw-1rem))] max-h-full w-full overflow-hidden rounded-lg border border-amber-900/25 bg-[#f4f0e8] shadow-2xl',
              )}
            >
              <img
                src={current.public_url}
                alt={label}
                className="h-full w-full object-contain"
                draggable={false}
              />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-amber-950/35 to-transparent" />
              {animating && (
                <div
                  className={cn(
                    'pointer-events-none absolute inset-y-0 w-[45%] bg-gradient-to-r from-amber-950/40 via-black/20 to-transparent',
                    flipDir === 'next' ? 'right-0 scale-x-[-1]' : 'left-0',
                  )}
                />
              )}
            </div>
          </motion.div>
        </div>

        <p className="pointer-events-none absolute bottom-2 left-0 right-0 text-center text-[10px] text-white/40 sm:hidden">
          Tap left or right · Swipe to turn pages
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
          aria-label="Previous image"
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
          aria-label="Next image"
        >
          <ChevronRight className="h-6 w-6" />
        </Button>
      </footer>
    </div>
  )

  return createPortal(content, document.body)
}
