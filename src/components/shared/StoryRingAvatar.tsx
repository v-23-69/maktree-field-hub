import { cn } from '@/lib/utils'

export type StoryRingStatus = 'active' | 'inactive'

type Size = 'sm' | 'md'

const SIZE = {
  sm: { outer: 'h-11 w-11', inner: 'h-[38px] w-[38px]', text: 'text-[10px]', pad: 'p-[2.5px]' },
  md: { outer: 'h-16 w-16', inner: 'h-[58px] w-[58px]', text: 'text-xs', pad: 'p-[3px]' },
} as const

function personInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map(p => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

/** Short label for territories (e.g. PCMC, BR, NA). */
export function territoryAbbrev(name: string) {
  const n = name.trim()
  if (n.length <= 4) return n.toUpperCase()
  const parts = n.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase()
  return n.slice(0, 2).toUpperCase()
}

type Props = {
  name: string
  status: StoryRingStatus
  photoUrl?: string | null
  /** Text inside the circle; defaults to initials from `name`. */
  badgeText?: string
  size?: Size
  subtitle?: string
  /** Label under the circle; defaults to first word of `name`. */
  displayName?: string
  className?: string
  onClick?: () => void
}

export default function StoryRingAvatar({
  name,
  status,
  photoUrl,
  badgeText,
  size = 'md',
  subtitle,
  displayName,
  className,
  onClick,
}: Props) {
  const s = SIZE[size]
  const active = status === 'active'
  const innerLabel = badgeText ?? personInitials(name)
  const label = displayName ?? name.trim().split(/\s+/)[0] ?? name

  const ring = (
    <span
      className={cn(
        'inline-flex rounded-full',
        s.pad,
        active
          ? 'bg-gradient-to-tr from-emerald-400 via-emerald-500 to-teal-400'
          : 'bg-gradient-to-tr from-rose-500 via-red-500 to-orange-500',
      )}
    >
      <span
        className={cn(
          'rounded-full bg-background flex items-center justify-center overflow-hidden',
          s.inner,
        )}
      >
        {photoUrl ? (
          <img src={photoUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className={cn('font-bold text-foreground', s.text)}>{innerLabel}</span>
        )}
      </span>
    </span>
  )

  const body = (
    <>
      {ring}
      <span className="text-[11px] font-semibold text-foreground truncate max-w-full w-full text-center leading-tight px-0.5">
        {label}
      </span>
      {subtitle ? (
        <span className="text-[9px] text-muted-foreground truncate max-w-full w-full text-center leading-tight px-0.5">
          {subtitle}
        </span>
      ) : null}
    </>
  )

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          'flex flex-col items-center gap-1 shrink-0 w-full max-w-[108px] active:scale-95 transition-transform',
          className,
        )}
      >
        {body}
      </button>
    )
  }

  return (
    <div className={cn('flex flex-col items-center gap-1 shrink-0 w-full max-w-[108px]', className)}>
      {body}
    </div>
  )
}
