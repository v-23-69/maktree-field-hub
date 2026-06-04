import { useCallback, useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog'
import type { ExplorerMediaItem } from '@/lib/explorerMediaOps'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  items: ExplorerMediaItem[]
  startIndex?: number
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
      }, 520)
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
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') go('next')
      if (e.key === 'ArrowLeft') go('prev')
      if (e.key === 'Escape') onOpenChange(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, go, onOpenChange])

  if (items.length === 0) return null

  const current = items[index]
  const label = current.title?.trim() || current.file_name

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[min(96vw,900px)] w-full p-0 gap-0 border-0 bg-black/95 overflow-hidden">
        <div className="relative flex flex-col min-h-[70vh] max-h-[92vh]">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <p className="text-sm font-medium text-white truncate pr-4">
              {label} · {index + 1} / {items.length}
            </p>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10 shrink-0"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex-1 flex items-center justify-center p-4 md:p-8 perspective-[1400px]">
            <div
              className={cn(
                'relative w-full max-w-3xl aspect-[4/3] preserve-3d transition-transform duration-500 ease-in-out',
                flipDir === 'next' && animating && '[transform:rotateY(-12deg)]',
                flipDir === 'prev' && animating && '[transform:rotateY(12deg)]',
              )}
            >
              <div
                className={cn(
                  'absolute inset-0 rounded-lg overflow-hidden shadow-2xl bg-[#f4f0e8] border border-amber-900/20',
                  'transition-transform duration-500 ease-in-out [transform-style:preserve-3d] [backface-visibility:hidden]',
                  flipDir === 'next' && animating && '[transform:rotateY(-90deg)] [transform-origin:left_center]',
                  flipDir === 'prev' && animating && '[transform:rotateY(90deg)] [transform-origin:right_center]',
                )}
              >
                <img
                  src={current.public_url}
                  alt={label}
                  className="w-full h-full object-contain bg-[#f4f0e8]"
                  draggable={false}
                />
                <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-amber-950/30 to-transparent pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 pb-6 px-4">
            <Button
              type="button"
              variant="secondary"
              size="lg"
              className="rounded-full h-12 w-12 p-0"
              onClick={() => go('prev')}
              disabled={items.length < 2 || animating}
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <button
              type="button"
              className="text-xs text-white/70 min-w-[5rem] text-center hover:text-white"
              onClick={() => setPaused(p => !p)}
            >
              {paused ? 'Play' : 'Pause'}
            </button>
            <Button
              type="button"
              variant="secondary"
              size="lg"
              className="rounded-full h-12 w-12 p-0"
              onClick={() => go('next')}
              disabled={items.length < 2 || animating}
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
