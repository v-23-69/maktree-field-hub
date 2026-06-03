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

export type ProfileRequiredField = (typeof PROFILE_REQUIRED_FIELDS)[number]

export const PROFILE_FIELD_META: Record<
  ProfileRequiredField,
  { label: string; type: 'text' | 'tel' | 'date' | 'textarea' }
> = {
  full_name: { label: 'Full Name', type: 'text' },
  designation: { label: 'Designation', type: 'text' },
  dob: { label: 'Date of Birth', type: 'date' },
  joining_date: { label: 'Joining Date', type: 'date' },
  mobile: { label: 'Mobile', type: 'tel' },
  aadhaar_number: { label: 'Aadhaar Number', type: 'text' },
  pan_number: { label: 'PAN Number', type: 'text' },
  address: { label: 'Address', type: 'textarea' },
  city: { label: 'City', type: 'text' },
  state: { label: 'State', type: 'text' },
  pincode: { label: 'Pincode', type: 'text' },
  emergency_contact_name: { label: 'Emergency Contact Name', type: 'text' },
  emergency_contact_mobile: { label: 'Emergency Contact Mobile', type: 'tel' },
}

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
  return getProfileMissingFields(profile).length === 0
}

const LEGACY_DISMISSED_KEY = (userId: string) => `maktree_sfa_profile_prompt_dismissed_${userId}`
const SHOWN_SESSION_KEY = (userId: string) => `maktree_sfa_profile_prompt_shown_${userId}`

/** Prompt already shown this browser session (once per portal open). */
export function wasProfilePromptShownThisSession(userId: string): boolean {
  try {
    return sessionStorage.getItem(SHOWN_SESSION_KEY(userId)) === '1'
  } catch {
    return false
  }
}

export function markProfilePromptShownThisSession(userId: string): void {
  try {
    sessionStorage.setItem(SHOWN_SESSION_KEY(userId), '1')
  } catch {
    /* private mode / quota */
  }
}

/** "Skip for now" — hide until next login / new portal session. */
export function dismissProfilePrompt(userId: string): void {
  markProfilePromptShownThisSession(userId)
}

/** Call on login/logout so the prompt can appear again on the next portal open. */
export function resetProfilePromptSession(userId: string): void {
  try {
    sessionStorage.removeItem(SHOWN_SESSION_KEY(userId))
    localStorage.removeItem(LEGACY_DISMISSED_KEY(userId))
  } catch {
    /* ignore */
  }
}

export function clearProfilePromptDismissal(userId: string): void {
  resetProfilePromptSession(userId)
}
