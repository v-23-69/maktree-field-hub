import { useContext, useState, useCallback, useEffect, ReactNode, useMemo, useRef } from 'react'
import { User, UserRole } from '@/types/database.types'
import { supabase } from '@/lib/supabase'
import { prefetchRoleDashboard } from '@/lib/prefetchDashboard'
import { resetProfilePromptSession } from '@/lib/profileCompletion'
import { AuthContext, type AuthContextType } from '@/contexts/auth-context'
import { isInvalidAuthSessionError } from '@/lib/authSessionErrors'
import { isAuthBlockedError, isPortalAccessDenied } from '@/lib/accountAccess'
import {
  abortSignalTimeout,
  isRetryableNetworkOrServerError,
  sleep,
  withTimeout,
} from '@/lib/asyncTimeout'

const PROFILE_CACHE_KEY = 'maktree-auth-profile-cache-v1'
const PROFILE_CACHE_TTL_MS = 5 * 60 * 1000
/** When PostgREST/Auth is overloaded, allow a recently cached profile so login still completes. */
const PROFILE_STALE_CACHE_MAX_MS = 24 * 60 * 60 * 1000
const PROFILE_SELECT =
  'id,auth_user_id,employee_code,full_name,email,role,is_active,is_blocked,block_reason,is_resigned,is_paused,pause_reason,profile_photo_url,designation,mobile,created_at,updated_at'
const LOGIN_RPC_TIMEOUT_MS = 8_000
const PROFILE_FETCH_TIMEOUT_MS = 15_000
const PROFILE_RETRY_COUNT = 5
const PASSWORD_LOGIN_TIMEOUT_MS = 30_000

type ProfileQueryError = { message?: string; code?: string; name?: string } | null

function isClosedAccount(p: User): boolean {
  return !!(p.is_blocked || p.is_resigned || p.is_active === false)
}

function asUser(row: unknown): User | null {
  if (!row || typeof row !== 'object') return null
  const u = row as Partial<User>
  if (!u.id || !u.role) return null
  return u as User
}

function readCachedProfile(authUserId: string, maxAgeMs: number): User | null {
  try {
    const raw = sessionStorage.getItem(PROFILE_CACHE_KEY)
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
    sessionStorage.removeItem(PROFILE_CACHE_KEY)
  }
  return null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [authReady, setAuthReady] = useState(true)
  const [isProfileLoading, setIsProfileLoading] = useState(false)
  const [blockedInfo, setBlockedInfo] = useState<{ isBlocked: boolean; blockReason: string | null } | null>(null)
  const [accountClosedInfo, setAccountClosedInfo] = useState<{
    reason: 'blocked' | 'resigned' | 'deactivated'
  } | null>(null)
  const loadingAuthUserIdRef = useRef<string | null>(null)
  const profileEpochRef = useRef(0)
  const inFlightProfileRef = useRef<{ epoch: number; id: string; promise: Promise<boolean> } | null>(null)
  const lastLoadedAuthUserIdRef = useRef<string | null>(null)
  const lastLoadedAtRef = useRef<number>(0)
  const signingInRef = useRef(false)

  const clearBlockedInfo = useCallback(() => setBlockedInfo(null), [])
  const clearAccountClosedInfo = useCallback(() => setAccountClosedInfo(null), [])

  const bumpProfileEpoch = useCallback(() => {
    profileEpochRef.current += 1
    inFlightProfileRef.current = null
    loadingAuthUserIdRef.current = null
  }, [])

  const fetchProfileRow = useCallback(async (client: NonNullable<typeof supabase>, authUserId: string) => {
    let error: ProfileQueryError = null
    try {
      const rpc = await client
        .rpc('get_my_portal_profile')
        .abortSignal(abortSignalTimeout(PROFILE_FETCH_TIMEOUT_MS))
      if (!rpc.error) {
        const profile = asUser(rpc.data)
        if (profile) return { profile, error: null }
      } else {
        error = rpc.error
      }
    } catch (e) {
      error = { message: e instanceof Error ? e.message : String(e), name: e instanceof Error ? e.name : undefined }
    }

    try {
      const result = await client
        .from('users')
        .select(PROFILE_SELECT)
        .eq('auth_user_id', authUserId)
        .abortSignal(abortSignalTimeout(PROFILE_FETCH_TIMEOUT_MS))
        .maybeSingle()
      return { profile: asUser(result.data), error: result.error ?? error }
    } catch (e) {
      return {
        profile: null as User | null,
        error: {
          message: e instanceof Error ? e.message : String(e),
          name: e instanceof Error ? e.name : undefined,
        } as ProfileQueryError,
      }
    }
  }, [])

  const loadProfile = useCallback(async (
    authUserId: string,
    preferCache = false,
    freshLogin = false,
    epoch = profileEpochRef.current,
  ): Promise<boolean> => {
    const client = supabase
    if (!client) return false
    if (epoch !== profileEpochRef.current) return false
    if (
      inFlightProfileRef.current?.id === authUserId &&
      inFlightProfileRef.current.epoch === epoch
    ) {
      return inFlightProfileRef.current.promise
    }

    const run = (async (): Promise<boolean> => {
      if (epoch !== profileEpochRef.current) return false

      let usedCache = false
      if (preferCache) {
        const cached = readCachedProfile(authUserId, PROFILE_CACHE_TTL_MS)
        if (cached) {
          usedCache = true
          setBlockedInfo(null)
          setAccountClosedInfo(null)
          setUser(cached)
          setAuthReady(true)
          setIsProfileLoading(false)
        }
      }

      loadingAuthUserIdRef.current = authUserId
      setIsProfileLoading(true)

      for (let attempt = 0; attempt < PROFILE_RETRY_COUNT; attempt++) {
        if (epoch !== profileEpochRef.current) return false
        const { profile, error } = await fetchProfileRow(client, authUserId)

        if (profile) {
          if (isClosedAccount(profile)) {
            setAccountClosedInfo({
              reason: profile.is_blocked ? 'blocked' : profile.is_resigned ? 'resigned' : 'deactivated',
            })
            setBlockedInfo(null)
            setUser(null)
            setAuthReady(true)
            setIsProfileLoading(false)
            loadingAuthUserIdRef.current = null
            await client.auth.signOut()
            return false
          }

          setBlockedInfo(null)
          setAccountClosedInfo(null)
          setUser(profile)
          sessionStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify({ ts: Date.now(), user: profile }))
          if (freshLogin) resetProfilePromptSession(profile.id)
          prefetchRoleDashboard(profile.role)
          lastLoadedAuthUserIdRef.current = authUserId
          lastLoadedAtRef.current = Date.now()
          setAuthReady(true)
          setIsProfileLoading(false)
          loadingAuthUserIdRef.current = null
          return true
        }

        const lastErrMsg = [error?.message, error?.code, error?.name].filter(Boolean).join(' ')
        if (error && isInvalidAuthSessionError(lastErrMsg)) {
          await client.auth.signOut({ scope: 'local' })
          sessionStorage.removeItem(PROFILE_CACHE_KEY)
          setUser(null)
          setAuthReady(true)
          setIsProfileLoading(false)
          loadingAuthUserIdRef.current = null
          return false
        }

        const retryable = !error || isRetryableNetworkOrServerError(lastErrMsg)
        if (!retryable || attempt === PROFILE_RETRY_COUNT - 1) break
        await sleep(600 * 2 ** attempt)
      }

      if (epoch !== profileEpochRef.current) return false

      const staleCached = readCachedProfile(authUserId, PROFILE_STALE_CACHE_MAX_MS)
      if (staleCached) {
        setBlockedInfo(null)
        setAccountClosedInfo(null)
        setUser(staleCached)
        lastLoadedAuthUserIdRef.current = authUserId
        lastLoadedAtRef.current = Date.now()
        setAuthReady(true)
        setIsProfileLoading(false)
        loadingAuthUserIdRef.current = null
        return true
      }

      setAuthReady(true)
      setIsProfileLoading(false)
      loadingAuthUserIdRef.current = null
      return usedCache || lastLoadedAuthUserIdRef.current === authUserId
    })()

    inFlightProfileRef.current = { epoch, id: authUserId, promise: run }
    try {
      return await run
    } finally {
      if (
        inFlightProfileRef.current?.id === authUserId &&
        inFlightProfileRef.current.epoch === epoch
      ) {
        inFlightProfileRef.current = null
      }
    }
  }, [fetchProfileRow])

  useEffect(() => {
    const client = supabase
    if (!client) {
      setAuthReady(true)
      return
    }
    let mounted = true

    void (async () => {
      try {
        const { data: { session }, error: sessionError } = await client.auth.getSession()
        if (!mounted) return
        const errMsg = [sessionError?.message, sessionError?.name].filter(Boolean).join(' ')
        if (sessionError && isInvalidAuthSessionError(errMsg)) {
          bumpProfileEpoch()
          await client.auth.signOut({ scope: 'local' })
          setUser(null)
          setAuthReady(true)
          setIsProfileLoading(false)
          sessionStorage.removeItem(PROFILE_CACHE_KEY)
          return
        }
        if (session?.user) {
          // Do not call getUser() here — Auth /user 504s hold the GoTrue lock and block login.
          void loadProfile(session.user.id, true)
        } else {
          setUser(null)
          setAuthReady(true)
          setIsProfileLoading(false)
          sessionStorage.removeItem(PROFILE_CACHE_KEY)
        }
      } catch (e) {
        if (!mounted) return
        const msg = e instanceof Error ? e.message : String(e)
        if (isInvalidAuthSessionError(msg)) {
          bumpProfileEpoch()
          await client.auth.signOut({ scope: 'local' })
        }
        setUser(null)
        setAuthReady(true)
        setIsProfileLoading(false)
        sessionStorage.removeItem(PROFILE_CACHE_KEY)
      }
    })()

    const { data: { subscription } } = client.auth.onAuthStateChange((event, session) => {
      // Defer so this callback never deadlocks signInWithPassword (GoTrue holds a lock
      // until onAuthStateChange listeners finish).
      window.setTimeout(() => {
        if (!mounted) return
        if (event === 'TOKEN_REFRESHED') {
          if (!session) {
            bumpProfileEpoch()
            setUser(null)
            setAuthReady(true)
            sessionStorage.removeItem(PROFILE_CACHE_KEY)
          }
          return
        }
        if (event === 'SIGNED_OUT') {
          if (signingInRef.current) return
          bumpProfileEpoch()
          setUser(null)
          setAuthReady(true)
          setIsProfileLoading(false)
          sessionStorage.removeItem(PROFILE_CACHE_KEY)
          lastLoadedAuthUserIdRef.current = null
          lastLoadedAtRef.current = 0
          return
        }
        if (event === 'SIGNED_IN' && session?.user) {
          void loadProfile(session.user.id, true, true)
          return
        }
        if (session?.user) {
          const sameUser = lastLoadedAuthUserIdRef.current === session.user.id
          if (sameUser && Date.now() - lastLoadedAtRef.current < PROFILE_CACHE_TTL_MS) {
            setAuthReady(true)
            return
          }
          void loadProfile(session.user.id, true)
        }
      }, 0)
    })
    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [bumpProfileEpoch, loadProfile])

  const signIn = useCallback(async (email: string, password: string) => {
    const client = supabase
    if (!client) {
      return { success: false, error: 'Supabase is not configured' }
    }
    signingInRef.current = true
    bumpProfileEpoch()
    const epoch = profileEpochRef.current
    try {
      const normalizedEmail = email.trim().toLowerCase()

      try {
        const { data: accessCheck, error: accessErr } = await client
          .rpc('check_portal_login_allowed', { p_email: normalizedEmail })
          .abortSignal(abortSignalTimeout(LOGIN_RPC_TIMEOUT_MS))
        if (!accessErr && isPortalAccessDenied(accessCheck as { allowed?: boolean; reason?: string })) {
          return { success: false, accountBlocked: true }
        }
      } catch {
        // Access check timed out — still try password; blocked accounts are re-checked on profile load.
      }

      const { data: authData, error: authError } = await withTimeout(
        client.auth.signInWithPassword({
          email: normalizedEmail,
          password: password.trim(),
        }),
        PASSWORD_LOGIN_TIMEOUT_MS,
        'Login is taking too long. The server is busy — please try again.',
      )
      if (authError) {
        if (isAuthBlockedError(authError)) {
          return { success: false, accountBlocked: true }
        }
        if (authError.message.includes('Invalid login credentials')) {
          return { success: false, error: 'Incorrect email or password.' }
        }
        return { success: false, error: authError.message }
      }
      if (!authData.session) {
        return { success: false, error: 'Login failed. Please try again.' }
      }

      let loaded = await loadProfile(authData.session.user.id, true, true, epoch)
      if (!loaded) {
        await sleep(1500)
        loaded = await loadProfile(authData.session.user.id, true, false, epoch)
      }
      if (!loaded) {
        const stale = readCachedProfile(authData.session.user.id, PROFILE_STALE_CACHE_MAX_MS)
        if (stale) {
          setBlockedInfo(null)
          setAccountClosedInfo(null)
          setUser(stale)
          lastLoadedAuthUserIdRef.current = authData.session.user.id
          lastLoadedAtRef.current = Date.now()
          setAuthReady(true)
          return { success: true }
        }
        return {
          success: false,
          error: 'Signed in, but the server is busy loading your profile. Please wait a few seconds and try again.',
        }
      }
      return { success: true }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Login failed'
      return { success: false, error: message }
    } finally {
      signingInRef.current = false
    }
  }, [bumpProfileEpoch, loadProfile])

  const logout = useCallback(async () => {
    const userId = user?.id
    bumpProfileEpoch()
    try {
      if (supabase) await supabase.auth.signOut()
    } finally {
      if (userId) resetProfilePromptSession(userId)
      setUser(null)
      setAuthReady(true)
      setIsProfileLoading(false)
      sessionStorage.removeItem(PROFILE_CACHE_KEY)
      lastLoadedAuthUserIdRef.current = null
      lastLoadedAtRef.current = 0
    }
  }, [bumpProfileEpoch, user?.id])

  const value = useMemo((): AuthContextType => {
    return {
      user,
      isLoading: !authReady,
      isAuthenticated: !!user,
      authReady,
      isProfileLoading,
      signIn,
      logout,
      blockedInfo,
      clearBlockedInfo,
      accountClosedInfo,
      clearAccountClosedInfo,
    }
  }, [user, authReady, isProfileLoading, signIn, logout, blockedInfo, clearBlockedInfo, accountClosedInfo, clearAccountClosedInfo])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export function getRoleDashboard(role: UserRole): string {
  const paths: Record<UserRole, string> = {
    mr: '/mr/dashboard',
    manager: '/manager/dashboard',
    admin: '/admin/dashboard',
  }
  return paths[role]
}
