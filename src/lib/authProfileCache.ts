import { isNativeApp } from '@/lib/capacitor'
import type { User } from '@/types/database.types'

export const PROFILE_CACHE_KEY = 'maktree-auth-profile-cache-v1'
export const PROFILE_CACHE_TTL_MS = 5 * 60 * 1000
export const PROFILE_STALE_CACHE_MAX_MS = 7 * 24 * 60 * 60 * 1000

function storage(): Storage | null {
  if (typeof globalThis === 'undefined') return null
  const g = globalThis as unknown as { localStorage?: Storage; sessionStorage?: Storage }
  if (isNativeApp()) return g.localStorage ?? null
  return g.sessionStorage ?? g.localStorage ?? null
}

export function readCachedProfile(authUserId: string, maxAgeMs: number): User | null {
  const store = storage()
  if (!store) return null
  try {
    const raw = store.getItem(PROFILE_CACHE_KEY)
    if (!raw) return null
    const cached = JSON.parse(raw) as { ts: number; user: User }
    if (
      cached?.user?.auth_user_id === authUserId &&
      Date.now() - cached.ts < maxAgeMs &&
      cached.user.is_active !== false &&
      !cached.user.is_resigned &&
      !cached.user.is_blocked
    ) {
      return cached.user
    }
  } catch {
    store.removeItem(PROFILE_CACHE_KEY)
  }
  return null
}

export function readAnyCachedProfile(maxAgeMs: number): User | null {
  const store = storage()
  if (!store) return null
  try {
    const raw = store.getItem(PROFILE_CACHE_KEY)
    if (!raw) return null
    const cached = JSON.parse(raw) as { ts: number; user: User }
    if (
      cached?.user?.auth_user_id &&
      Date.now() - cached.ts < maxAgeMs &&
      cached.user.is_active !== false &&
      !cached.user.is_resigned &&
      !cached.user.is_blocked
    ) {
      return cached.user
    }
  } catch {
    store.removeItem(PROFILE_CACHE_KEY)
  }
  return null
}

export function writeCachedProfile(user: User): void {
  const store = storage()
  if (!store) return
  try {
    store.setItem(PROFILE_CACHE_KEY, JSON.stringify({ ts: Date.now(), user }))
  } catch {
    /* ignore quota errors */
  }
}

export function clearCachedProfile(): void {
  storage()?.removeItem(PROFILE_CACHE_KEY)
}
