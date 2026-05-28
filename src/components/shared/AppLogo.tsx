import { cn } from '@/lib/utils'

/** Full-color brand mark (high-res PNG in /public/brand). */
const LOGO_SRC = '/brand/maktree-logo.png'

interface AppLogoProps {
  className?: string
  alt?: string
}

export default function AppLogo({
  className = 'h-16 w-16 object-contain',
  alt = 'MakTree Medicines',
}: AppLogoProps) {
  return (
    <span className="relative inline-flex shrink-0 items-center justify-center">
      <span
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 hidden size-[106%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-sm ring-1 ring-white/80 dark:block"
      />
      <img
        src={LOGO_SRC}
        alt={alt}
        className={cn('relative z-[1] object-contain select-none', className)}
        loading="eager"
        decoding="async"
        draggable={false}
      />
    </span>
  )
}
