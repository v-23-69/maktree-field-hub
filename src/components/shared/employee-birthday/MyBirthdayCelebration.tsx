import { Cake, Gift, PartyPopper, Sparkles } from 'lucide-react'
import { useBirthdayWishesToday } from '@/hooks/useEmployeeBirthdays'
import { cn } from '@/lib/utils'

interface MyBirthdayCelebrationProps {
  userId: string
  fullName: string
  profilePhotoUrl?: string | null
  className?: string
}

function initials(name: string) {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export default function MyBirthdayCelebration({
  userId,
  fullName,
  profilePhotoUrl,
  className,
}: MyBirthdayCelebrationProps) {
  const firstName = fullName.split(' ')[0] || fullName
  const { data: wishes = [], isLoading } = useBirthdayWishesToday(userId)

  return (
    <section
      className={cn(
        'relative overflow-hidden rounded-2xl border-2 border-amber-400/50 bg-gradient-to-br from-amber-500/30 via-pink-500/15 to-violet-500/10 p-6 shadow-xl animate-fade-in-up',
        className,
      )}
      aria-label="Your birthday celebration"
    >
      <ConfettiDots />
      <div className="pointer-events-none absolute -right-4 -top-4 h-28 w-28 rounded-full bg-amber-400/20 blur-2xl" aria-hidden />
      <div className="pointer-events-none absolute -left-6 bottom-0 h-24 w-24 rounded-full bg-pink-500/20 blur-2xl" aria-hidden />

      <div className="relative z-10 flex flex-col items-center text-center gap-4">
        <div className="relative">
          {profilePhotoUrl ? (
            <img
              src={profilePhotoUrl}
              alt=""
              className="h-24 w-24 rounded-full object-cover ring-4 ring-amber-300/60 shadow-xl"
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-pink-500 text-2xl font-bold text-white ring-4 ring-amber-300/60 shadow-xl">
              {initials(fullName)}
            </div>
          )}
          <div className="absolute -bottom-2 -right-2 flex h-11 w-11 items-center justify-center rounded-full bg-white dark:bg-card shadow-lg ring-2 ring-amber-400/40">
            <Cake className="h-6 w-6 text-amber-600" />
          </div>
          <PartyPopper className="absolute -left-3 -top-2 h-8 w-8 text-pink-500 animate-bounce" />
        </div>

        <div className="space-y-2 max-w-sm">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700 dark:text-amber-300">
            🎉 Happy Birthday 🎉
          </p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground leading-tight">
            {fullName}
          </h2>
          <p className="text-sm text-foreground/85 leading-relaxed">
            Dear {firstName}, the entire MakTree team wishes you a joyful birthday filled with
            health, success, and happiness. Have an amazing day!
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          {['🎂', '🎈', '🎁', '🥳', '✨'].map(emoji => (
            <span
              key={emoji}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-background/70 text-xl shadow-sm backdrop-blur-sm ring-1 ring-white/30"
            >
              {emoji}
            </span>
          ))}
        </div>
      </div>

      <div className="relative z-10 mt-5 rounded-xl border border-amber-400/25 bg-background/80 p-4 backdrop-blur-md">
        <p className="mb-2 flex items-center justify-center gap-1.5 text-xs font-semibold text-foreground">
          <Gift className="h-4 w-4 text-primary" />
          Wishes from your colleagues
          {!isLoading && wishes.length > 0 && (
            <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] text-primary">
              {wishes.length}
            </span>
          )}
        </p>
        {isLoading ? (
          <p className="text-center text-xs text-muted-foreground">Loading wishes…</p>
        ) : wishes.length === 0 ? (
          <p className="text-center text-xs text-muted-foreground">
            Your team can send wishes from their app — they will appear here live.
          </p>
        ) : (
          <ul className="max-h-44 space-y-2 overflow-y-auto pr-1">
            {wishes.map(w => (
              <li key={w.id} className="flex gap-2.5 rounded-lg bg-muted/50 p-2.5 text-left">
                {w.sender_photo_url ? (
                  <img
                    src={w.sender_photo_url}
                    alt=""
                    className="h-9 w-9 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[10px] font-bold text-primary">
                    {initials(w.sender_name)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold text-foreground truncate">
                    {w.sender_name}
                    <span className="ml-1 font-normal text-muted-foreground uppercase">
                      {w.sender_role}
                    </span>
                  </p>
                  <p className="text-xs text-foreground/90 leading-snug">{w.message}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="pointer-events-none absolute right-4 top-4 flex gap-1 opacity-50" aria-hidden>
        <Sparkles className="h-5 w-5 text-amber-500 animate-pulse" />
        <Sparkles className="h-4 w-4 text-pink-500 animate-pulse" />
      </div>
    </section>
  )
}

function ConfettiDots() {
  const dots = Array.from({ length: 16 }, (_, i) => i)
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {dots.map(i => (
        <span
          key={i}
          className="absolute h-2 w-2 rounded-full opacity-60 animate-pulse"
          style={{
            left: `${(i * 13) % 100}%`,
            top: `${(i * 19) % 85}%`,
            backgroundColor: ['#f59e0b', '#ec4899', '#8b5cf6', '#22c55e', '#3b82f6'][i % 5],
            animationDelay: `${i * 0.12}s`,
            animationDuration: `${1.1 + (i % 4) * 0.35}s`,
          }}
        />
      ))}
    </div>
  )
}
