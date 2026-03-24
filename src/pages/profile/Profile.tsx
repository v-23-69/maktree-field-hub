import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { UserCircle2 } from 'lucide-react'
import PageHeader from '@/components/shared/PageHeader'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/hooks/useAuth'
import { useProfile, useUpdateProfile, useUploadProfilePhoto } from '@/hooks/useProfile'

const REQUIRED_FIELDS: string[] = [
  'full_name',
  'designation',
  'dob',
  'joining_date',
  'mobile',
  'aadhaar_number',
  'address',
  'city',
  'state',
  'pincode',
  'emergency_contact_name',
  'emergency_contact_mobile',
]

export default function ProfilePage() {
  const { user } = useAuth()
  const { userId } = useParams()
  const effectiveUserId = userId || user?.id
  const isReadOnly = !!userId && user?.role === 'manager'
  const canEdit = !isReadOnly || user?.role === 'admin'

  const { data: profile, isLoading } = useProfile(effectiveUserId)
  const updateProfile = useUpdateProfile()
  const uploadPhoto = useUploadProfilePhoto()
  const [form, setForm] = useState<Record<string, string>>({})
  const [editingAadhaar, setEditingAadhaar] = useState(false)

  const values = profile
    ? { ...profile, ...form }
    : null
  const missingFields = useMemo(() => {
    if (!values) return []
    return REQUIRED_FIELDS.filter(field => !String(values[field] ?? '').trim())
  }, [values])
  const completion = values?.profile_complete_pct ?? Math.max(0, 100 - missingFields.length * 8)
  const maskedAadhaar = useMemo(() => {
    const raw = String(values?.aadhaar_number ?? '')
    const digits = raw.replace(/\D/g, '')
    if (digits.length < 4) return raw
    return `XXXX-XXXX-${digits.slice(-4)}`
  }, [values?.aadhaar_number])

  if (isLoading) return <LoadingSpinner />
  if (!profile) return <div className="p-4 text-sm text-muted-foreground">Profile not found.</div>

  return (
    <div className="min-h-screen bg-background pb-10">
      <PageHeader title="Profile" showBack />
      <div className="p-4 space-y-4 max-w-md mx-auto">
        <div className="rounded-xl border p-4 space-y-3">
          <p className="text-sm font-semibold">Profile {Math.round(completion)}% Complete</p>
          <Progress value={completion} className="h-2" />
          {missingFields.length > 0 && (
            <p className="text-xs text-muted-foreground">Missing: {missingFields.join(', ')}</p>
          )}
        </div>

        <div className="flex items-center gap-3">
          {profile.profile_photo_url ? (
            <img src={profile.profile_photo_url} className="h-16 w-16 rounded-full object-cover" />
          ) : (
            <UserCircle2 className="h-16 w-16 text-muted-foreground" />
          )}
          {canEdit && (
            <Input
              type="file"
              accept="image/*"
              onChange={e => {
                const file = e.target.files?.[0]
                if (!file || !user?.auth_user_id || !effectiveUserId) return
                void uploadPhoto
                  .mutateAsync({ file, authUserId: user.auth_user_id, userId: effectiveUserId })
                  .then(() => toast.success('Photo updated'))
                  .catch(err => toast.error(err instanceof Error ? err.message : 'Upload failed'))
              }}
            />
          )}
        </div>

        {[
          ['full_name', 'Full Name'],
          ['employee_code', 'Employee Code'],
          ['role', 'Role'],
          ['designation', 'Designation'],
          ['dob', 'Date of Birth'],
          ['joining_date', 'Joining Date'],
          ['mobile', 'Mobile'],
          ['aadhaar_number', 'Aadhaar Number'],
          ['city', 'City'],
          ['state', 'State'],
          ['pincode', 'Pincode'],
          ['emergency_contact_name', 'Emergency Contact Name'],
          ['emergency_contact_mobile', 'Emergency Contact Mobile'],
        ].map(([key, label]) => (
          <div key={key} className="space-y-1">
            <p className="text-xs text-muted-foreground">{label}</p>
            <Input
              value={
                key === 'aadhaar_number' && !editingAadhaar
                  ? maskedAadhaar
                  : String(values?.[key] ?? '')
              }
              type={key.includes('date') || key === 'dob' ? 'date' : 'text'}
              readOnly={!canEdit || key === 'employee_code' || key === 'role'}
              onFocus={() => {
                if (key === 'aadhaar_number') setEditingAadhaar(true)
              }}
              onBlur={() => {
                if (key === 'aadhaar_number') setEditingAadhaar(false)
              }}
              onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))}
            />
          </div>
        ))}

        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Address</p>
          <Textarea
            value={String(values?.address ?? '')}
            readOnly={!canEdit}
            onChange={e => setForm(prev => ({ ...prev, address: e.target.value }))}
          />
        </div>

        {canEdit && effectiveUserId && (
          <Button
            className="w-full"
            disabled={updateProfile.isPending}
            onClick={() =>
              void updateProfile
                .mutateAsync({ userId: effectiveUserId, updates: form })
                .then(() => {
                  setForm({})
                  toast.success('Profile saved')
                })
                .catch(err => toast.error(err instanceof Error ? err.message : 'Save failed'))
            }
          >
            Save
          </Button>
        )}
      </div>
    </div>
  )
}
