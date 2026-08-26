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
const PROFILE_SELECT =
  'id,auth_user_id,employee_code,full_name,email,role,is_active,is_blocked,block_reason,is_resigned,is_paused,pause_reason,profile_photo_url,designation,mobile,created_at,updated_at'
const LOGIN_RPC_TIMEOUT_MS = 8_000
const PROFILE_FETCH_TIMEOUT_MS = 12_000
const PROFILE_RETRY_COUNT = 3

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [authReady, setAuthReady] = useState(true)
  const [isProfileLoading, setIsProfileLoading] = useState(false)
  const [blockedInfo, setBlockedInfo] = useState<{ isBlocked: boolean; blockReason: string | null } | null>(null)
  const [accountClosedInfo, setAccountClosedInfo] = useState<{
    reason: 'blocked' | 'resigned' | 'deactivated'
  } | null>(null)
  const loadingAuthUserIdRef = useRef<string | null>(null)
  const inFlightProfileRef = useRef<{ id: string; promise: Promise<boolean> } | null>(null)
  const lastLoadedAuthUserIdRef = useRef<string | null>(null)
  const lastLoadedAtRef = useRef<number>(0)

  const clearBlockedInfo = useCallback(() => setBlockedInfo(null), [])
  const clearAccountClosedInfo = useCallback(() => setAccountClosedInfo(null), [])

  const loadProfile = useCallback(async (authUserId: string, preferCache = false, freshLogin = false): Promise<boolean> => {
    const client = supabase
    if (!client) return false
    if (inFlightProfileRef.current?.id === authUserId) return inFlightProfileRef.current.promise

    const run = (async (): Promise<boolean> => {
      let usedCache = false
      if (preferCache) {
        try {
          const raw = sessionStorage.getItem(PROFILE_CACHE_KEY)
          if (raw) {
            const cached = JSON.parse(raw) as { ts: number; user: User }
            if (
              cached?.user?.auth_user_id === authUserId &&
              Date.now() - cached.ts < PROFILE_CACHE_TTL_MS &&
              cached.user.is_active !== false &&
              !cached.user.is_resigned &&
              !cached.user.is_blocked
            ) {
              usedCache = true
              setBlockedInfo(null)
              setAccountClosedInfo(null)
              setUser(cached.user)
              setAuthReady(true)
              setIsProfileLoading(false)
            }
          }
        } catch {
          sessionStorage.removeItem(PROFILE_CACHE_KEY)
        }
      }

      loadingAuthUserIdRef.current = authUserId
      setIsProfileLoading(true)

      for (let attempt = 0; attempt < PROFILE_RETRY_COUNT; attempt++) {
        let profile: User | null = null
        let error: { message?: string; code?: string; name?: string } | null = null
        try {
          const result = await client
            .from('users')
            .select(PROFILE_SELECT)
            .eq('auth_user_id', authUserId)
            .abortSignal(abortSignalTimeout(PROFILE_FETCH_TIMEOUT_MS))
            .maybeSingle()
          profile = (result.data as User | null) ?? null
          error = result.error
        } catch (e) {
          error = { message: e instanceof Error ? e.message : String(e), name: e instanceof Error ? e.name : undefined }
        }

        if (!error && profile) {
          const p = profile as User & { is_blocked?: boolean; block_reason?: string | null; is_resigned?: boolean }
          if (p.is_blocked || p.is_resigned || !p.is_active) {
            setAccountClosedInfo({
              reason: p.is_blocked ? 'blocked' : p.is_resigned ? 'resigned' : 'deactivated',
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
          const nextUser = profile as User
          setUser(nextUser)
          sessionStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify({ ts: Date.now(), user: nextUser }))
          if (freshLogin) resetProfilePromptSession(nextUser.id)
          prefetchRoleDashboard(nextUser.role)
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

      setAuthReady(true)
      setIsProfileLoading(false)
      loadingAuthUserIdRef.current = null
      return usedCache || lastLoadedAuthUserIdRef.current === authUserId
    })()

    inFlightProfileRef.current = { id: authUserId, promise: run }
    try {
      return await run
    } finally {
      if (inFlightProfileRef.current?.id === authUserId) inFlightProfileRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!supabase) {
      setAuthReady(true)
      return
    }
    let mounted = true
    void (async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        if (!mounted) return
        const errMsg = [sessionError?.message, sessionError?.name].filter(Boolean).join(' ')
        if (sessionError && isInvalidAuthSessionError(errMsg)) {
          await supabase.auth.signOut({ scope: 'local' })
          setUser(null)
          setAuthReady(true)
          setIsProfileLoading(false)
          sessionStorage.removeItem(PROFILE_CACHE_KEY)
          return
        }
        if (session?.user) {
          try {
            const { data: userData, error: userErr } = await withTimeout(
              supabase.auth.getUser(),
              LOGIN_RPC_TIMEOUT_MS,
              'Session check timed out',
            )
            const um = [userErr?.message, userErr?.name].filter(Boolean).join(' ')
            if (userErr && isInvalidAuthSessionError(um)) {
              await supabase.auth.signOut({ scope: 'local' })
              setUser(null)
              setAuthReady(true)
              setIsProfileLoading(false)
              sessionStorage.removeItem(PROFILE_CACHE_KEY)
              return
            }
            if (!userErr && !userData.user) {
              await supabase.auth.signOut({ scope: 'local' })
              setUser(null)
              setAuthReady(true)
              setIsProfileLoading(false)
              sessionStorage.removeItem(PROFILE_CACHE_KEY)
              return
            }
          } catch {
            // Auth API timeout / 5xx — keep the local session and load the profile.
          }
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
          await supabase.auth.signOut({ scope: 'local' })
        }
        setUser(null)
        setAuthReady(true)
        setIsProfileLoading(false)
        sessionStorage.removeItem(PROFILE_CACHE_KEY)
      }
    })()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return
        if (event === 'TOKEN_REFRESHED') {
          if (!session) {
            await supabase.auth.signOut({ scope: 'local' })
            setUser(null)
            setAuthReady(true)
            sessionStorage.removeItem(PROFILE_CACHE_KEY)
          }
          return
        }
        try {
          if (session?.user) {
            const sameUser = lastLoadedAuthUserIdRef.current === session.user.id
            if (sameUser) {
              setAuthReady(true)
              return
            }
            void loadProfile(session.user.id, true)
          } else {
            setUser(null)
            setAuthReady(true)
            setIsProfileLoading(false)
            sessionStorage.removeItem(PROFILE_CACHE_KEY)
            lastLoadedAuthUserIdRef.current = null
            lastLoadedAtRef.current = 0
          }
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e)
          if (isInvalidAuthSessionError(msg)) {
            await supabase.auth.signOut({ scope: 'local' })
          }
          setUser(null)
          setAuthReady(true)
          setIsProfileLoading(false)
          sessionStorage.removeItem(PROFILE_CACHE_KEY)
          lastLoadedAuthUserIdRef.current = null
          lastLoadedAtRef.current = 0
        }
      },
    )
    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [loadProfile])

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) {
      return { success: false, error: 'Supabase is not configured' }
    }
    try {
      const normalizedEmail = email.trim().toLowerCase()
      try {
        const { data: accessCheck, error: accessErr } = await supabase
          .rpc('check_portal_login_allowed', { p_email: normalizedEmail })
          .abortSignal(abortSignalTimeout(LOGIN_RPC_TIMEOUT_MS))
        if (!accessErr && isPortalAccessDenied(accessCheck as { allowed?: boolean; reason?: string })) {
          return { success: false, accountBlocked: true }
        }
      } catch {
        // Access check timed out — still try password; blocked accounts are re-checked on profile load.
      }

      const { data: authData, error: authError } = await withTimeout(
        supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password: password.trim(),
        }),
        25_000,
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
      const loaded = await loadProfile(authData.session.user.id, false, true)
      if (!loaded) {
        return {
          success: false,
          error: 'Signed in, but the server is busy loading your profile. Please wait a few seconds and try again.',
        }
      }
      return { success: true }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Login failed'
      return { success: false, error: message }
    }
  }, [loadProfile])

  const logout = useCallback(async () => {
    const userId = user?.id
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
  }, [user?.id])

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
