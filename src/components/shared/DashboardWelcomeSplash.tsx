import { cn } from '@/lib/utils'
import LoadingSpinner from '@/components/shared/LoadingSpinner'

type Props = {
  fullName?: string | null
  profilePhotoUrl?: string | null
  subtitle?: string
  className?: string
}

function firstName(fullName?: string | null) {
  const n = fullName?.trim().split(/\s+/)[0]
  return n || 'there'
}

function initials(fullName?: string | null) {
  return (
    fullName
      ?.split(/\s+/)
      .map(p => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || '?'
  )
}

/** Full-screen welcome while dashboard / profile data is loading after sign-in. */
export default function DashboardWelcomeSplash({
  fullName,
  profilePhotoUrl,
  subtitle = 'Loading your workspace…',
  className,
}: Props) {
  const name = firstName(fullName)

  return (
    <div
      className={cn(
        'flex flex-1 flex-col items-center justify-center px-6 py-12 text-center',
        className,
      )}
    >
      <div className="w-full max-w-sm space-y-6 animate-fade-in-up">
        {profilePhotoUrl ? (
          <img
            src={profilePhotoUrl}
            alt=""
            className="mx-auto h-24 w-24 rounded-full object-cover ring-4 ring-primary/15 shadow-lg"
          />
        ) : (
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5 ring-4 ring-primary/10 shadow-lg">
            <span className="text-2xl font-extrabold text-primary">{initials(fullName)}</span>
          </div>
        )}

        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight leading-snug">
            Welcome to MakTree,{' '}
            <span className="text-primary capitalize">{name}</span>
          </h2>
          {subtitle && (
            <p className="text-sm text-muted-foreground font-medium">{subtitle}</p>
          )}
        </div>

        <LoadingSpinner />
      </div>
    </div>
  )
}
