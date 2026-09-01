import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

const LOGO_SRC = '/brand/maktree-logo.png'

const DEFAULT_MESSAGES = [
  'Getting the page ready for you…',
  'Please wait, loading your data…',
  'Almost there, preparing everything…',
] as const

type PageLoadingStateProps = {
  /** Fill the viewport (route / auth gates). */
  fullScreen?: boolean
  /** Inline block height for sections / charts. */
  compact?: boolean
  /** Show brand logo (off for native boot screens — launch splash already showed it). */
  showLogo?: boolean
  message?: string
  messages?: readonly string[]
  className?: string
}

export default function PageLoadingState({
  fullScreen = false,
  compact = false,
  showLogo = true,
  message,
  messages = DEFAULT_MESSAGES,
  className,
}: PageLoadingStateProps) {
  const [index, setIndex] = useState(0)
  const lines = message ? [message] : messages
  const line = lines[index % lines.length] ?? lines[0]

  useEffect(() => {
    if (message || lines.length <= 1) return
    const timer = setInterval(() => {
      setIndex(prev => (prev + 1) % lines.length)
    }, 2800)
    return () => clearInterval(timer)
  }, [lines.length, message])

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={cn(
        'flex flex-col items-center justify-center gap-5 px-6 text-center',
        fullScreen && 'min-h-screen bg-background',
        compact ? 'min-h-[160px] py-6' : !fullScreen && 'min-h-[240px] py-10',
        className,
      )}
    >
      {showLogo ? (
        <div className="relative flex items-center justify-center">
          <span
            aria-hidden
            className="absolute size-28 rounded-full bg-muted/40 animate-maktree-glow"
          />
          <img
            src={LOGO_SRC}
            alt=""
            aria-hidden
            className="relative z-[1] h-24 w-24 object-contain animate-maktree-breathe select-none"
            draggable={false}
          />
        </div>
      ) : null}
      <div className="space-y-2 max-w-xs">
        <p className="text-sm font-medium text-foreground transition-opacity duration-500">{line}</p>
        <div className="flex items-center justify-center gap-1.5" aria-hidden>
          {[0, 1, 2].map(dot => (
            <span
              key={dot}
              className="size-1.5 rounded-full bg-primary/70 animate-maktree-dot"
              style={{ animationDelay: `${dot * 180}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
