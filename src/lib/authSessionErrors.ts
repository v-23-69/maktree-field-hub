/** True when Supabase Auth / JWT should be cleared and the user must sign in again. */
export function isInvalidAuthSessionError(message: string): boolean {
  const m = message.toLowerCase()
  if (
    /time[\s_-]?out|57014|statement timeout|deadline exceeded|abort|overload|schema cache|connection not available/.test(
      m,
    )
  ) {
    return false
  }
  return (
    /invalid (jwt|token|session|login credentials)/i.test(message) ||
    /jwt expired|session expired/i.test(message) ||
    /refresh[_ ]?token.*(not[ _-]?found|revoked|already used)/i.test(message) ||
    /token_revoked/i.test(message) ||
    /auth session missing/i.test(message) ||
    /invalid claim/i.test(message)
  )
}
