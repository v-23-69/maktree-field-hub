import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import { useAuth } from '@/hooks/useAuth'
import { useProfile, useUpdateProfile } from '@/hooks/useProfile'
import {
  dismissProfilePrompt,
  getProfileCompletionPct,
  getProfileMissingFields,
  isProfileComplete,
  PROFILE_FIELD_META,
  type ProfileRequiredField,
} from '@/lib/profileCompletion'

/**
 * Profile completion modal — shows only missing fields (red). Hidden at 100% complete.
 */
export default function ProfileCompletionPrompt() {
  const { user, isAuthenticated } = useAuth()
  const location = useLocation()
  const { data: profile, isLoading, refetch, isError } = useProfile(user?.id)
  const updateProfile = useUpdateProfile()
  const [showSkip, setShowSkip] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [ready, setReady] = useState(false)
  const [form, setForm] = useState<Record<string, string>>({})

  const isPublicRoute =
    location.pathname === '/login' || location.pathname === '/blocked-complaint'

  const profileRecord = profile as Record<string, unknown> | undefined
  const complete = isProfileComplete(profileRecord)

  const missing = useMemo(
    () => getProfileMissingFields(profileRecord) as ProfileRequiredField[],
    [profileRecord],
  )

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
    !hidden &&
    missing.length > 0

  const pct = getProfileCompletionPct(profileRecord)

  const setField = (key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    if (!user?.id || missing.length === 0) return

    const updates: Record<string, unknown> = {}
    for (const key of missing) {
      if (key in form) updates[key] = form[key]
    }

    if (Object.keys(updates).length === 0) {
      toast.error('Fill in at least one highlighted field')
      return
    }

    const needsAadhaar = missing.includes('aadhaar_number') && 'aadhaar_number' in updates

    try {
      await updateProfile.mutateAsync({
        userId: user.id,
        updates,
        allowAadhaar: needsAadhaar,
      })
      toast.success('Saved')
      setForm({})
      const result = await refetch()
      if (isProfileComplete(result.data as Record<string, unknown> | undefined)) {
        setHidden(true)
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not save'
      if (/refresh token|invalid.*token|not found|jwt|session/i.test(msg)) {
        toast.error('Session expired. Please sign in again.')
      } else {
        toast.error(msg)
      }
    }
  }

  const skip = () => {
    if (!showSkip || !user?.id) return
    dismissProfilePrompt(user.id)
    setHidden(true)
  }

  if (!shouldShow) return null

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-4 bg-background/85 backdrop-blur-sm"
      onClick={e => e.stopPropagation()}
    >
      <div
        className="w-full max-w-md max-h-[min(90dvh,640px)] flex flex-col rounded-2xl border-2 border-destructive/40 bg-card shadow-xl animate-fade-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-complete-title"
      >
        <div className="shrink-0 p-5 pb-3 border-b border-destructive/20 bg-destructive/5 rounded-t-2xl">
          <div className="flex items-start gap-3">
            <div className="h-11 w-11 rounded-xl bg-destructive/15 flex items-center justify-center shrink-0">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <div className="min-w-0">
              <h2 id="profile-complete-title" className="text-lg font-bold text-destructive">
                Complete required profile fields
              </h2>
              <p className="text-sm text-destructive/80 mt-1 leading-relaxed">
                Fill in the fields below (shown in red). The popup closes when everything is saved.
              </p>
            </div>
          </div>

          <div className="space-y-2 mt-4">
            <div className="flex items-center justify-between text-xs font-semibold text-destructive">
              <span>Remaining</span>
              <span className="tabular-nums">{missing.length} field{missing.length === 1 ? '' : 's'}</span>
            </div>
            <Progress value={pct} className="h-2 bg-destructive/10 [&>div]:bg-destructive" />
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 py-4 space-y-3">
          {isLoading ? (
            <LoadingSpinner />
          ) : isError ? (
            <p className="text-sm text-destructive text-center py-4">
              Could not load profile. Try refreshing or sign in again.
            </p>
          ) : (
            missing.map(field => {
              const meta = PROFILE_FIELD_META[field]
              const label = meta?.label ?? field
              const value = form[field] ?? ''

              if (meta?.type === 'textarea') {
                return (
                  <div key={field} className="space-y-1.5">
                    <Label className="text-xs font-semibold text-destructive">{label}</Label>
                    <Textarea
                      value={value}
                      onChange={e => setField(field, e.target.value)}
                      placeholder={`Enter ${label.toLowerCase()}`}
                      className="rounded-lg border-destructive/40 bg-background focus-visible:ring-destructive min-h-[72px]"
                    />
                  </div>
                )
              }

              const inputType = meta?.type === 'date' ? 'date' : meta?.type === 'tel' ? 'tel' : 'text'

              return (
                <div key={field} className="space-y-1.5">
                  <Label className="text-xs font-semibold text-destructive">{label}</Label>
                  <Input
                    type={inputType}
                    inputMode={field === 'aadhaar_number' ? 'numeric' : undefined}
                    autoComplete={field === 'aadhaar_number' ? 'off' : undefined}
                    value={value}
                    onChange={e => {
                      const next =
                        field === 'aadhaar_number'
                          ? e.target.value.replace(/\D/g, '').slice(0, 12)
                          : e.target.value
                      setField(field, next)
                    }}
                    placeholder={
                      field === 'aadhaar_number'
                        ? '12-digit Aadhaar number'
                        : `Enter ${label.toLowerCase()}`
                    }
                    className="rounded-lg border-destructive/40 bg-background focus-visible:ring-destructive text-foreground"
                  />
                </div>
              )
            })
          )}
        </div>

        <div className="shrink-0 p-5 pt-3 border-t border-destructive/20 space-y-2 bg-card rounded-b-2xl">
          <Button
            type="button"
            variant="destructive"
            className="w-full h-11 rounded-xl font-semibold"
            disabled={updateProfile.isPending || isLoading || isError}
            onClick={() => void handleSave()}
          >
            {updateProfile.isPending ? 'Saving…' : 'Save & continue'}
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
        </div>
      </div>
    </div>
  )
}
