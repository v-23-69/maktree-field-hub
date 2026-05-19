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
} from 'lucide-react'
import PageHeader from '@/components/shared/PageHeader'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/useAuth'
import { useProfile, useUpdateProfile, useUploadProfilePhoto } from '@/hooks/useProfile'
import { useTheme } from '@/hooks/useTheme'
import BottomNav from '@/components/shared/BottomNav'

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
        {/* Hero card */}
        <div className="relative rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-primary/10 p-5">
          <div className="flex items-center gap-4">
            <div className="relative">
              {profile.profile_photo_url ? (
                <img
                  src={profile.profile_photo_url}
                  alt={profile.full_name}
                  className="h-20 w-20 rounded-full object-cover ring-[3px] ring-primary/20 shadow-lg"
                />
              ) : (
                <div className="h-20 w-20 rounded-full bg-primary/15 flex items-center justify-center ring-[3px] ring-primary/20 shadow-lg">
                  <span className="text-2xl font-bold text-primary">{initials}</span>
                </div>
              )}
              {canEdit && (
                <label className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center cursor-pointer shadow-md active:scale-90 transition-transform">
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
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-foreground truncate">{profile.full_name}</h2>
              <p className="text-xs text-muted-foreground">{profile.email ?? '—'}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold text-primary uppercase">
                  {profile.role}
                </span>
                {profile.designation && (
                  <span className="text-[11px] text-muted-foreground truncate">{profile.designation}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Completion */}
        {completion < 100 && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                Profile {Math.round(completion)}% Complete
              </p>
              <button
                onClick={() => setShowEdit(true)}
                className="text-[11px] font-semibold text-primary"
              >
                Complete now
              </button>
            </div>
            <Progress value={completion} className="h-1.5" />
            <p className="text-[10px] text-muted-foreground">
              Missing: {missingFields.join(', ')}. Add your birthday so teammates can celebrate with you on the day.
            </p>
          </div>
        )}

        {/* Quick info cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
          {profile.mobile && (
            <div className="glass-card !rounded-xl p-3 flex items-center gap-2.5">
              <Phone className="h-4 w-4 text-primary shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground">Mobile</p>
                <p className="text-xs font-medium text-foreground truncate">{profile.mobile}</p>
              </div>
            </div>
          )}
          {(profile.city || profile.state) && (
            <div className="glass-card !rounded-xl p-3 flex items-center gap-2.5">
              <MapPin className="h-4 w-4 text-primary shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground">Location</p>
                <p className="text-xs font-medium text-foreground truncate">
                  {[profile.city, profile.state].filter(Boolean).join(', ')}
                </p>
              </div>
            </div>
          )}
          {profile.joining_date && (
            <div className="glass-card !rounded-xl p-3 flex items-center gap-2.5">
              <Calendar className="h-4 w-4 text-primary shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground">Joined</p>
                <p className="text-xs font-medium text-foreground truncate">
                  {new Date(profile.joining_date).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                </p>
              </div>
            </div>
          )}
          {profile.dob && (
            <div className="glass-card !rounded-xl p-3 flex items-center gap-2.5">
              <Calendar className="h-4 w-4 text-primary shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground">Birthday</p>
                <p className="text-xs font-medium text-foreground truncate">
                  {new Date(profile.dob).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                </p>
              </div>
            </div>
          )}
        </div>

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
