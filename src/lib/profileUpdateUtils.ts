import type { UserProfile } from '@/types/database.types'

/** Fields users may update on their own profile row. */
export const PROFILE_EDITABLE_FIELDS = [
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

type EditableField = (typeof PROFILE_EDITABLE_FIELDS)[number]
type DateField = 'dob' | 'joining_date'

const DATE_FIELDS = new Set<string>(['dob', 'joining_date'])

function isMaskedAadhaar(value: string) {
  return /X/i.test(value) || value.includes('—')
}

function normalizeDate(value: unknown): string | null {
  const v = String(value ?? '').trim()
  if (!v) return null
  // HTML date input: YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v
  return null
}

function normalizeText(value: unknown): string | null {
  const v = String(value ?? '').trim()
  return v ? v : null
}

/**
 * Sanitize profile PATCH payload so Postgres date columns never receive "".
 */
export function sanitizeProfileUpdates(
  raw: Record<string, unknown>,
  options?: { allowAadhaar?: boolean },
): Partial<UserProfile> {
  const out: Partial<UserProfile> = {}

  for (const key of PROFILE_EDITABLE_FIELDS) {
    if (!(key in raw)) continue

    const value = raw[key]

    if (key === 'aadhaar_number') {
      if (!options?.allowAadhaar) continue
      const str = String(value ?? '')
      if (isMaskedAadhaar(str)) continue
      const digits = str.replace(/\D/g, '')
      out.aadhaar_number = digits.length > 0 ? digits : null
      continue
    }

    if (DATE_FIELDS.has(key)) {
      out[key as DateField] = normalizeDate(value)
      continue
    }

    if (key === 'full_name') {
      const name = String(value ?? '').trim()
      if (name) out.full_name = name
      continue
    }

    out[key as Exclude<EditableField, DateField | 'full_name' | 'aadhaar_number'>] =
      normalizeText(value) as never
  }

  return out
}

export function hasProfileUpdates(updates: Partial<UserProfile>) {
  return Object.keys(updates).length > 0
}
