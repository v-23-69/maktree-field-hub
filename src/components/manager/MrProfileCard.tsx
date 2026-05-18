import { Lock, Play, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { User } from '@/types/database.types'

interface Props {
  mr: User
  onOpenProfile?: () => void
  onUnpause?: () => void
  unpausePending?: boolean
  subtitle?: string
  className?: string
}

export default function MrProfileCard({
  mr,
  onOpenProfile,
  onUnpause,
  unpausePending,
  subtitle,
  className,
}: Props) {
  const paused = mr.is_paused === true
  const initials = (mr.full_name ?? '?')
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className={cn('glass-card p-4 space-y-3', className)}>
      <div className="flex items-center gap-3">
        {mr.profile_photo_url ? (
          <img
            src={mr.profile_photo_url}
            alt=""
            className="h-14 w-14 rounded-full object-cover ring-2 ring-primary/15 shrink-0"
          />
        ) : (
          <div className="h-14 w-14 rounded-full bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center ring-2 ring-primary/10 shrink-0">
            <span className="text-sm font-bold text-primary">{initials}</span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-base font-bold text-foreground truncate">{mr.full_name}</p>
          <p className="text-xs text-muted-foreground truncate">
            {subtitle ?? mr.employee_code ?? mr.email ?? 'Medical Representative'}
          </p>
          {paused && (
            <span className="inline-flex items-center gap-1 mt-1 text-[11px] font-bold text-destructive">
              <Lock className="h-3 w-3" /> Account paused
            </span>
          )}
        </div>
        {onOpenProfile && (
          <button
            type="button"
            onClick={onOpenProfile}
            className="shrink-0 p-2 rounded-lg hover:bg-muted/60 active:scale-95"
            aria-label="Open profile"
          >
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </button>
        )}
      </div>
      {paused && onUnpause && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full rounded-xl"
          disabled={unpausePending}
          onClick={onUnpause}
        >
          <Play className="mr-1.5 h-3.5 w-3.5" />
          {unpausePending ? 'Unpausing…' : 'Unpause account'}
        </Button>
      )}
    </div>
  )
}
