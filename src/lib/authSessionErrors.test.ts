import { describe, expect, it } from 'vitest'
import { isInvalidAuthSessionError } from '@/lib/authSessionErrors'
import { isRetryableNetworkOrServerError } from '@/lib/asyncTimeout'

describe('isInvalidAuthSessionError', () => {
  it('treats JWT/session failures as invalid', () => {
    expect(isInvalidAuthSessionError('Invalid JWT')).toBe(true)
    expect(isInvalidAuthSessionError('refresh_token_not_found')).toBe(true)
    expect(isInvalidAuthSessionError('Auth session missing')).toBe(true)
  })

  it('does not treat timeouts or DB overload as a bad session', () => {
    expect(isInvalidAuthSessionError('canceling statement due to statement timeout')).toBe(false)
    expect(isInvalidAuthSessionError('57014')).toBe(false)
    expect(isInvalidAuthSessionError('Failed to load schema cache')).toBe(false)
    expect(isInvalidAuthSessionError('connection not available and request was dropped')).toBe(false)
    expect(isInvalidAuthSessionError('context deadline exceeded')).toBe(false)
  })
})

describe('isRetryableNetworkOrServerError', () => {
  it('retries timeouts and 5xx', () => {
    expect(isRetryableNetworkOrServerError('AbortError')).toBe(true)
    expect(isRetryableNetworkOrServerError('JSON object requested, multiple (or no) rows returned 503')).toBe(true)
    expect(isRetryableNetworkOrServerError('Failed to load schema cache')).toBe(true)
  })
})
