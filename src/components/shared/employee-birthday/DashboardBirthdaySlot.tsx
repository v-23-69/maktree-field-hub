import { useMemo } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useProfile } from '@/hooks/useProfile'
import { useEmployeesBirthdayToday } from '@/hooks/useEmployeeBirthdays'
import { isDobCelebrationToday } from '@/lib/dateUtils'
import MyBirthdayCelebration from './MyBirthdayCelebration'

/** Birthday celebration for the signed-in user (IST), shown at top of dashboards. */
export default function DashboardBirthdaySlot({ className }: { className?: string }) {
  const { user } = useAuth()
  const { data: birthdays = [] } = useEmployeesBirthdayToday(!!user?.id)
  const { data: profile } = useProfile(user?.id)

  const isMyBirthday = useMemo(() => {
    if (!user?.id) return false
    if (birthdays.some(b => b.user_id === user.id)) return true
    const dob = profile?.dob ?? null
    return isDobCelebrationToday(dob)
  }, [user?.id, birthdays, profile?.dob])

  if (!user || !isMyBirthday) return null

  return (
    <MyBirthdayCelebration
      userId={user.id}
      fullName={user.full_name}
      profilePhotoUrl={user.profile_photo_url ?? profile?.profile_photo_url ?? null}
      className={className}
    />
  )
}
