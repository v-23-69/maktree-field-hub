/** Unique doctor_code for inserts (DB also enforces via trigger if empty). */
export function generateDoctorCode(prefix = 'MR'): string {
  const hex = crypto.randomUUID().replace(/-/g, '').toUpperCase()
  return `${prefix}${hex}`
}
