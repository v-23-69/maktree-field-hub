/** True when Supabase Auth / JWT should be cleared and the user must sign in again. */
export function isInvalidAuthSessionError(message: string): boolean {
  return /refresh|invalid|token|not found|jwt|session|expired|403|forbidden|user not found|auth session/i.test(
    message,
  )
}
