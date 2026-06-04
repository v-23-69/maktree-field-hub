import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

type Props = {
  currentSrc: string
  currentAlt: string
  underSrc: string | null
  underAlt: string
  direction: 'next' | 'prev' | null
  animating: boolean
  className?: string
}

const FLIP_DURATION_S = 0.78

/**
 * Book page turn: static page underneath + top page rotates on the spine (CSS 3D).
 * No external library — uses framer-motion already in the project.
 */
export default function BookPageFlip({
  currentSrc,
  currentAlt,
  underSrc,
  underAlt,
  direction,
  animating,
  className,
}: Props) {
  if (!animating || !direction || !underSrc) {
    return (
      <div className={cn('flex h-full w-full items-center justify-center', className)}>
        <div className="book-page-sheet">
          <img src={currentSrc} alt={currentAlt} className="book-page-img" draggable={false} />
        </div>
      </div>
    )
  }

  const spineLeft = direction === 'next'
  const rotateEnd = direction === 'next' ? -180 : 180

  return (
    <div
      className={cn('relative flex h-full w-full items-center justify-center', className)}
      style={{ perspective: '2200px' }}
    >
      {/* Page revealed underneath */}
      <div className="absolute inset-0 z-0 flex items-center justify-center" aria-hidden>
        <div className="book-page-sheet book-page-sheet--static">
          <img src={underSrc} alt={underAlt} className="book-page-img" draggable={false} />
        </div>
      </div>

      {/* Page turning on the spine */}
      <motion.div
        className="relative z-10 flex h-full w-full items-center justify-center [transform-style:preserve-3d]"
        initial={{ rotateY: 0 }}
        animate={{ rotateY: rotateEnd }}
        transition={{
          duration: FLIP_DURATION_S,
          ease: [0.35, 0.05, 0.25, 1],
        }}
        style={{
          transformOrigin: spineLeft ? 'left center' : 'right center',
        }}
      >
        <div className="book-page-flip-root [transform-style:preserve-3d]">
          <div className="book-page-face book-page-face--front">
            <div className="book-page-sheet">
              <img src={currentSrc} alt={currentAlt} className="book-page-img" draggable={false} />
              <div className="book-page-edge-glow" />
            </div>
          </div>
          <div className="book-page-face book-page-face--back">
            <div className="book-page-sheet book-page-sheet--back">
              <div className="book-page-paper-texture" />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export const BOOK_FLIP_MS = Math.round(FLIP_DURATION_S * 1000)
