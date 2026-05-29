import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import {
  Camera,
  LogOut,
  Phone,
  MapPin,
  Calendar,
  Shield,
  BadgeCheck,
  Briefcase,
  AlertTriangle,
  ChevronRight,
  User as UserIcon,
  Sun,
  Moon,
  Monitor,
  Headphones,
} from 'lucide-react'
import PageHeader from '@/components/shared/PageHeader'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/useAuth'
import { useProfile, useUpdateProfile, useUploadProfilePhoto } from '@/hooks/useProfile'
import { useTheme } from '@/hooks/useTheme'
import BottomNav from '@/components/shared/BottomNav'
import ProfileSummaryCard, {
  profileStatFromContact,
} from '@/components/dashboard/profile-summary-card'

const REQUIRED_FIELDS: string[] = [
  'full_name',
  'designation',
  'dob',
  'joining_date',
  'mobile',
  'aadhaar_number',
  'pan_number',
  'address',
  'city',
  'state',
  'pincode',
  'emergency_contact_name',
  'emergency_contact_mobile',
]

export default function ProfilePage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { userId } = useParams()
  const effectiveUserId = userId || user?.id
  const isReadOnly = !!userId && user?.role === 'manager'
  const canEdit = !isReadOnly || user?.role === 'admin'
  const showSupportLink = !userId && (user?.role === 'mr' || user?.role === 'manager')

  const { data: profile, isLoading } = useProfile(effectiveUserId)
  const updateProfile = useUpdateProfile()
  const uploadPhoto = useUploadProfilePhoto()
  const [form, setForm] = useState<Record<string, string>>({})
  const [editingAadhaar, setEditingAadhaar] = useState(false)
  const [showEdit, setShowEdit] = useState(false)

  const values = profile ? { ...profile, ...form } : null
  const missingFields = useMemo(() => {
    if (!values) return []
    return REQUIRED_FIELDS.filter(field => !String(values[field] ?? '').trim())
  }, [values])
  const completion = values?.profile_complete_pct ?? Math.max(0, 100 - missingFields.length * 8)
  const maskedAadhaar = useMemo(() => {
    const raw = String(values?.aadhaar_number ?? '')
    const digits = raw.replace(/\D/g, '')
    if (digits.length < 4) return raw || '—'
    return `XXXX-XXXX-${digits.slice(-4)}`
  }, [values?.aadhaar_number])

  const initials = profile?.full_name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() ?? ''

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <PageHeader title="Profile" showBack />
        <div className="p-8"><LoadingSpinner /></div>
        <BottomNav role={user?.role ?? 'mr'} />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <PageHeader title="Profile" showBack />
        <div className="p-4 text-sm text-muted-foreground">Profile not found.</div>
        <BottomNav role={user?.role ?? 'mr'} />
      </div>
    )
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader title="Profile" showBack />

      <div className="max-w-md md:max-w-xl lg:max-w-2xl mx-auto space-y-4 px-4 md:px-6 pt-4">
        <ProfileSummaryCard
          name={profile.full_name}
          title={profile.designation ?? undefined}
          role={profile.role}
          avatarUrl={profile.profile_photo_url}
          initials={initials}
          completionPercent={completion}
          stats={profileStatFromContact(profile)}
          headerAction={
            canEdit ? (
              <label className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground cursor-pointer shadow-md active:scale-90 transition-transform">
                <Camera className="h-3.5 w-3.5" />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0]
                    if (!file || !user?.auth_user_id || !effectiveUserId) return
                    void uploadPhoto
                      .mutateAsync({ file, authUserId: user.auth_user_id, userId: effectiveUserId })
                      .then(() => toast.success('Photo updated'))
                      .catch(err => toast.error(err instanceof Error ? err.message : 'Upload failed'))
                  }}
                />
              </label>
            ) : undefined
          }
        />

        {completion < 100 && (
          <button
            type="button"
            onClick={() => setShowEdit(true)}
            className="w-full rounded-xl border border-amber-500/30 bg-amber-500/5 px-3.5 py-2.5 text-left text-xs font-semibold text-foreground flex items-center gap-1.5"
          >
            <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
            Complete missing profile fields
            <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground" />
          </button>
        )}

        {/* Details section */}
        <div className="glass-card !rounded-xl divide-y divide-border/50">
          <InfoRow icon={UserIcon} label="Full Name" value={profile.full_name} />
          <InfoRow icon={Briefcase} label="Designation" value={profile.designation ?? '—'} />
          <InfoRow icon={Shield} label="Aadhaar" value={maskedAadhaar} />
          <InfoRow icon={BadgeCheck} label="PAN" value={profile.pan_number ?? '—'} />
          <InfoRow icon={Phone} label="Emergency Contact" value={
            profile.emergency_contact_name
              ? `${profile.emergency_contact_name} · ${profile.emergency_contact_mobile ?? ''}`
              : '—'
          } />
          <InfoRow icon={MapPin} label="Address" value={
            [profile.address, profile.city, profile.state, profile.pincode].filter(Boolean).join(', ') || '—'
          } />
        </div>

        {/* Edit button */}
        {canEdit && (
          <Button
            variant="outline"
            className="w-full rounded-xl touch-target"
            onClick={() => setShowEdit(prev => !prev)}
          >
            {showEdit ? 'Hide Edit Form' : 'Edit Profile'}
            <ChevronRight className={`h-4 w-4 ml-auto transition-transform ${showEdit ? 'rotate-90' : ''}`} />
          </Button>
        )}

        {/* Edit form */}
        {showEdit && canEdit && (
          <div className="glass-card !rounded-xl p-4 space-y-3 animate-fade-in">
            {([
              ['full_name', 'Full Name', 'text'],
              ['designation', 'Designation', 'text'],
              ['dob', 'Birthday (Date of Birth)', 'date'],
              ['joining_date', 'Joining Date', 'date'],
              ['mobile', 'Mobile', 'tel'],
              ['aadhaar_number', 'Aadhaar Number', 'text'],
              ['pan_number', 'PAN Number', 'text'],
              ['city', 'City', 'text'],
              ['state', 'State', 'text'],
              ['pincode', 'Pincode', 'text'],
              ['emergency_contact_name', 'Emergency Contact Name', 'text'],
              ['emergency_contact_mobile', 'Emergency Contact Mobile', 'tel'],
            ] as [string, string, string][]).map(([key, label, type]) => (
              <div key={key} className="space-y-1">
                <Label className="text-xs">{label}</Label>
                <Input
                  value={
                    key === 'aadhaar_number' && !editingAadhaar
                      ? maskedAadhaar
                      : String(values?.[key] ?? '')
                  }
                  type={type}
                  readOnly={key === 'employee_code' || key === 'role'}
                  onFocus={() => { if (key === 'aadhaar_number') setEditingAadhaar(true) }}
                  onBlur={() => { if (key === 'aadhaar_number') setEditingAadhaar(false) }}
                  onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))}
                  className="rounded-lg"
                />
              </div>
            ))}

            <div className="space-y-1">
              <Label className="text-xs">Address</Label>
              <Textarea
                value={String(values?.address ?? '')}
                readOnly={!canEdit}
                onChange={e => setForm(prev => ({ ...prev, address: e.target.value }))}
                className="rounded-lg min-h-[80px]"
              />
            </div>

            <Button
              className="w-full rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
              disabled={updateProfile.isPending || Object.keys(form).length === 0}
              onClick={() =>
                void updateProfile
                  .mutateAsync({
                    userId: effectiveUserId!,
                    updates: form,
                    allowAadhaar: editingAadhaar,
                  })
                  .then(() => {
                    setForm({})
                    setEditingAadhaar(false)
                    toast.success('Profile saved')
                  })
                  .catch(err => toast.error(err instanceof Error ? err.message : 'Save failed'))
              }
            >
              {updateProfile.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        )}

        {showSupportLink && (
          <button
            type="button"
            onClick={() => navigate('/profile/support')}
            className="w-full glass-card !rounded-xl px-4 py-3.5 flex items-center gap-3 text-left active:scale-[0.99] transition-transform"
          >
            <Headphones className="h-4 w-4 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">Contact Support</p>
              <p className="text-xs text-muted-foreground mt-0.5">Portal help · Vishal</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          </button>
        )}

        {/* Theme */}
        <ThemeSelector />

        {/* Logout */}
        <Button
          variant="outline"
          className="w-full rounded-xl touch-target text-destructive border-destructive/30 hover:bg-destructive/5"
          onClick={() => void handleLogout()}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </div>

      <BottomNav role={user?.role ?? 'mr'} />
    </div>
  )
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="text-sm text-foreground truncate">{value}</p>
      </div>
    </div>
  )
}

const THEMES = [
  { value: 'light' as const, label: 'Light', icon: Sun },
  { value: 'dark' as const, label: 'Dark', icon: Moon },
  { value: 'system' as const, label: 'System', icon: Monitor },
]

function ThemeSelector() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="glass-card !rounded-xl p-3.5 space-y-2.5">
      <p className="section-title">Appearance</p>
      <div className="grid grid-cols-3 gap-2">
        {THEMES.map(t => {
          const active = theme === t.value
          return (
            <button
              key={t.value}
              type="button"
              onClick={() => setTheme(t.value)}
              className={`flex flex-col items-center gap-1.5 rounded-xl py-2.5 transition-all active:scale-95 ${
                active
                  ? 'bg-primary/10 ring-2 ring-primary/30'
                  : 'hover:bg-muted/50'
              }`}
            >
              <t.icon className={`h-5 w-5 ${active ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className={`text-[11px] font-semibold ${active ? 'text-primary' : 'text-muted-foreground'}`}>
                {t.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
