import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { UserCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import { useAuth } from '@/hooks/useAuth'
import { useProfile } from '@/hooks/useProfile'
import {
  dismissProfilePrompt,
  getProfileCompletionPct,
  getProfileMissingFields,
  isProfileComplete,
} from '@/lib/profileCompletion'

/**
 * Profile completion modal — stays until user completes profile or taps Skip (after delay).
 */
export default function ProfileCompletionPrompt() {
  const { user, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { data: profile, isLoading } = useProfile(user?.id)
  const [showSkip, setShowSkip] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [ready, setReady] = useState(false)

  const isPublicRoute =
    location.pathname === '/login' || location.pathname === '/blocked-complaint'

  const profileRecord = profile as Record<string, unknown> | undefined
  const complete = isProfileComplete(profileRecord)

  useEffect(() => {
    if (!isAuthenticated || !user || user.role === 'admin' || isPublicRoute || isLoading || complete) {
      setReady(false)
      return
    }
    const t = window.setTimeout(() => setReady(true), 400)
    return () => window.clearTimeout(t)
  }, [isAuthenticated, user, isPublicRoute, isLoading, complete])

  useEffect(() => {
    if (!ready) {
      setShowSkip(false)
      return
    }
    const t = window.setTimeout(() => setShowSkip(true), 3000)
    return () => window.clearTimeout(t)
  }, [ready])

  const shouldShow =
    isAuthenticated &&
    !!user &&
    user.role !== 'admin' &&
    !isPublicRoute &&
    !isLoading &&
    !complete &&
    ready &&
    !hidden

  if (!shouldShow) return null

  const missing = getProfileMissingFields(profileRecord)
  const pct = getProfileCompletionPct(profileRecord)

  const goToProfile = () => {
    navigate('/profile')
  }

  const skip = () => {
    if (!showSkip || !user?.id) return
    dismissProfilePrompt(user.id)
    setHidden(true)
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-4 bg-background/85 backdrop-blur-sm"
      onClick={e => e.stopPropagation()}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl space-y-4 animate-fade-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-complete-title"
      >
        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <>
            <div className="flex items-start gap-3">
              <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <UserCircle className="h-6 w-6 text-primary" />
              </div>
              <div className="min-w-0">
                <h2 id="profile-complete-title" className="text-lg font-bold text-foreground">
                  Complete your profile
                </h2>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  Fill in all details so records stay accurate across DCR, leave, and team views.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                <span>Profile completion</span>
                <span className="tabular-nums text-foreground">{pct}%</span>
              </div>
              <Progress value={pct} className="h-2" />
              {missing.length > 0 && (
                <p className="text-[11px] text-muted-foreground">
                  {missing.length} field{missing.length === 1 ? '' : 's'} still needed
                </p>
              )}
            </div>

            <Button type="button" className="w-full h-11 rounded-xl font-semibold" onClick={goToProfile}>
              Complete profile
            </Button>

            {showSkip ? (
              <Button
                type="button"
                variant="ghost"
                className="w-full h-10 rounded-xl text-muted-foreground"
                onClick={skip}
              >
                Skip for now
              </Button>
            ) : (
              <p className="text-center text-[11px] text-muted-foreground">Skip available in a moment…</p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
