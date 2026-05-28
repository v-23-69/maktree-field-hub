/** Fields required for 100% profile completion (matches Profile page). */
export const PROFILE_REQUIRED_FIELDS = [
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
] as const

export function getProfileMissingFields(
  profile: Record<string, unknown> | null | undefined,
): string[] {
  if (!profile) return [...PROFILE_REQUIRED_FIELDS]
  return PROFILE_REQUIRED_FIELDS.filter(field => !String(profile[field] ?? '').trim())
}

export function getProfileCompletionPct(
  profile: Record<string, unknown> | null | undefined,
): number {
  if (!profile) return 0
  const fromDb = Number(profile.profile_complete_pct)
  if (Number.isFinite(fromDb) && fromDb > 0) return Math.min(100, Math.round(fromDb))
  const filled = PROFILE_REQUIRED_FIELDS.length - getProfileMissingFields(profile).length
  return Math.round((filled / PROFILE_REQUIRED_FIELDS.length) * 100)
}

export function isProfileComplete(
  profile: Record<string, unknown> | null | undefined,
): boolean {
  if (!profile) return false
  return getProfileCompletionPct(profile) >= 100
}
