/** Login employee code from email local-part (matches manager Create MR flow). */
export function employeeCodeFromEmail(email: string): string {
  const base = email
    .trim()
    .split('@')[0]
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
  return (base.length > 0 ? base : 'MRUSER').slice(0, 32)
}
