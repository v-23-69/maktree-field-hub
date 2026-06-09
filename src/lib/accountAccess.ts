export const COMPANY_ACCOUNT_BLOCKED_MESSAGE =
  'Your ID has been blocked by the company. You cannot access this portal. Please delete the app from your device.'

export type PortalAccessDenialReason = 'blocked' | 'resigned' | 'deactivated'

export function isPortalAccessDenied(
  check: { allowed?: boolean; reason?: string } | null | undefined,
): check is { allowed: false; reason: PortalAccessDenialReason } {
  return check?.allowed === false
}

export function isAuthBlockedError(error: { message?: string; status?: number } | null): boolean {
  if (!error) return false
  const msg = (error.message ?? '').toLowerCase()
  return (
    error.status === 500 ||
    error.status === 403 ||
    msg.includes('banned') ||
    msg.includes('disabled') ||
    msg.includes('not authorized') ||
    msg.includes('user is banned')
  )
}
