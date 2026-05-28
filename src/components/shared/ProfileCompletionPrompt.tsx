import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useAuth } from '@/hooks/useAuth'
import { useProfile } from '@/hooks/useProfile'
import {
  getProfileCompletionPct,
  getProfileMissingFields,
  isProfileComplete,
} from '@/lib/profileCompletion'

/** Shown on MR/Manager dashboard until profile is 100% complete. Skip hides until next visit. */
export default function ProfileCompletionPrompt() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { data: profile, isLoading } = useProfile(user?.id)
  const [skipped, setSkipped] = useState(false)
  const [showSkip, setShowSkip] = useState(false)

  useEffect(() => {
    const t = window.setTimeout(() => setShowSkip(true), 2500)
    return () => window.clearTimeout(t)
  }, [])

  if (!user || user.role === 'admin' || isLoading || skipped) return null
  if (isProfileComplete(profile as Record<string, unknown> | undefined)) return null

  const missing = getProfileMissingFields(profile as Record<string, unknown> | undefined)
  const pct = getProfileCompletionPct(profile as Record<string, unknown> | undefined)

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-4 bg-background/85 backdrop-blur-sm">
      <div
        className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl space-y-4 animate-fade-in"
        role="dialog"
        aria-labelledby="profile-complete-title"
      >
        <div className="flex items-start gap-3">
          <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <UserCircle className="h-6 w-6 text-primary" />
          </div>
          <div className="min-w-0">
            <h2 id="profile-complete-title" className="text-lg font-bold text-foreground">
              Complete your profile
            </h2>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              Fill in all details (name, designation, dates, contact, address, emergency contact) so
              records stay accurate.
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

        <Button
          type="button"
          className="w-full h-11 rounded-xl font-semibold"
          onClick={() => navigate('/profile')}
        >
          Complete profile
        </Button>

        {showSkip && (
          <Button
            type="button"
            variant="ghost"
            className="w-full h-10 rounded-xl text-muted-foreground"
            onClick={() => setSkipped(true)}
          >
            Skip for now
          </Button>
        )}
      </div>
    </div>
  )
}
