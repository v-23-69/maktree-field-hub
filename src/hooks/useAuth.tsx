import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  ReactNode,
  useMemo,
} from 'react'
import type { Session } from '@supabase/supabase-js'
import { User, AuthState, UserRole } from '@/types/database.types'
import { supabase } from '@/lib/supabase'

interface AuthContextType extends AuthState {
  signIn: (
    employeeCode: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string; user?: User }>
  logout: () => Promise<void>
  changePassword: (
    newPassword: string,
  ) => Promise<{ success: boolean; error?: string }>
}

const AuthContext = createContext<AuthContextType | null>(null)

/** First paint: do not wait longer than this for `getSession()` (then finish in background). */
const GET_SESSION_QUICK_MS = 2_500
/** Loading `public.users` after we know the auth user id. */
const PROFILE_FETCH_TIMEOUT_MS = 45_000

function raceWithTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => {
      reject(new Error(`${label} timed out after ${ms}ms`))
    }, ms)
    promise
      .then(v => {
        clearTimeout(t)
        resolve(v)
      })
      .catch(e => {
        clearTimeout(t)
        reject(e)
      })
  })
}

function roleFromProfileThenMetadata(
  profileRole: UserRole | null | undefined,
  appMetadataRole: unknown,
): UserRole {
  if (profileRole === 'mr' || profileRole === 'manager' || profileRole === 'admin') {
    return profileRole
  }
  const r = appMetadataRole as string | undefined
  if (r === 'mr' || r === 'manager' || r === 'admin') return r
  return 'mr'
}

async function fetchProfileForAuthUser(authUserId: string): Promise<User | null> {
  if (!supabase) return null

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('*')
    .eq('auth_user_id', authUserId)
    .maybeSingle()

  if (profileError) {
    console.error('Profile fetch error:', profileError)
    return null
  }

  return profile as User | null
}

function mergeSessionProfile(
  profile: User,
  authUserId: string,
  appMetadata: Record<string, unknown>,
): User {
  return {
    ...profile,
    auth_user_id: profile.auth_user_id ?? authUserId,
    role: roleFromProfileThenMetadata(profile.role, appMetadata?.role),
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  /** Supabase returned a session (JWT present). Profile may still be loading. */
  const [hasSession, setHasSession] = useState(false)
  /** First `getSession` quick path finished (or no client). Login may render. */
  const [authReady, setAuthReady] = useState(() => !supabase)

  const profileLoadGenRef = useRef(0)
  const lastLoadedAuthUserIdRef = useRef<string | null>(null)

  const applySessionUser = useCallback(
    async (authUserId: string, appMetadata: Record<string, unknown>) => {
      const genAtStart = profileLoadGenRef.current
      const profile = await fetchProfileForAuthUser(authUserId)
      if (genAtStart !== profileLoadGenRef.current) return
      if (!profile) {
        lastLoadedAuthUserIdRef.current = null
        setUser(null)
        return
      }
      if (genAtStart !== profileLoadGenRef.current) return
      lastLoadedAuthUserIdRef.current = authUserId
      setUser(mergeSessionProfile(profile, authUserId, appMetadata))
    },
    [],
  )

  const applyNoSession = useCallback(() => {
    lastLoadedAuthUserIdRef.current = null
    setHasSession(false)
    setUser(null)
  }, [])

  const loadProfileInBackground = useCallback(
    (authUserId: string, appMetadata: Record<string, unknown>) => {
      void raceWithTimeout(
        applySessionUser(authUserId, appMetadata),
        PROFILE_FETCH_TIMEOUT_MS,
        'loadProfile',
      ).catch(e => {
        console.warn('Profile load failed or timed out:', e)
        profileLoadGenRef.current += 1
        lastLoadedAuthUserIdRef.current = null
        setUser(null)
      })
    },
    [applySessionUser],
  )

  useEffect(() => {
    if (!supabase) return

    let cancelled = false

    const invalidateProfileLoads = () => {
      profileLoadGenRef.current += 1
    }

    const finishBootstrap = (session: Session | null) => {
      if (cancelled) return
      const active = !!session?.user
      setHasSession(active)
      setAuthReady(true)
      if (session?.user) {
        loadProfileInBackground(session.user.id, session.user.app_metadata ?? {})
      } else {
        applyNoSession()
      }
    }

    const init = async () => {
      const sessionPromise = supabase.auth.getSession()

      const quick = await Promise.race([
        sessionPromise.then(result => ({ kind: 'ok' as const, result })),
        new Promise<{ kind: 'slow' }>(resolve =>
          setTimeout(() => resolve({ kind: 'slow' }), GET_SESSION_QUICK_MS),
        ),
      ])

      if (cancelled) return

      if (quick.kind === 'ok') {
        finishBootstrap(quick.result.data.session)
        return
      }

      /* Slow / hung getSession — show login UI immediately; apply session when it arrives. */
      setAuthReady(true)
      setHasSession(false)
      setUser(null)

      void sessionPromise.then(({ data }) => {
        if (cancelled) return
        const s = data.session
        if (s?.user) {
          setHasSession(true)
          loadProfileInBackground(s.user.id, s.user.app_metadata ?? {})
        }
      })
    }

    void init()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'INITIAL_SESSION') return

      try {
        if (session?.user) {
          const authId = session.user.id
          if (
            (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') &&
            lastLoadedAuthUserIdRef.current === authId
          ) {
            return
          }
          setHasSession(true)
          try {
            await raceWithTimeout(
              applySessionUser(authId, session.user.app_metadata ?? {}),
              PROFILE_FETCH_TIMEOUT_MS,
              'loadProfile',
            )
          } catch (e) {
            console.warn('Auth state: profile load failed or timed out:', e)
            invalidateProfileLoads()
            lastLoadedAuthUserIdRef.current = null
            setUser(null)
          }
        } else {
          applyNoSession()
        }
      } catch {
        applyNoSession()
      }
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [applyNoSession, applySessionUser, loadProfileInBackground])

  const signIn = useCallback(async (employeeCode: string, password: string) => {
    if (!supabase) {
      return { success: false, error: 'Supabase is not configured' }
    }

    const passwordForAuth = password.trim()

    const signInWithEmailAndLoadProfile = async (
      emailRaw: string,
    ): Promise<{ success: boolean; error?: string; user?: User }> => {
      const emailForAuth = emailRaw.trim().toLowerCase()

      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email: emailForAuth,
          password: passwordForAuth,
        })

      if (authError) {
        const raw = (authError.message || 'Sign-in failed').trim()
        const msg = raw.toLowerCase()
        const isInvalidCreds =
          msg.includes('invalid login') ||
          msg.includes('invalid credentials') ||
          authError.status === 400

        if (isInvalidCreds) {
          return {
            success: false,
            error: `${raw} (signing in as "${emailForAuth}"). In Supabase: Authentication → Users — confirm this exact email exists. Use "Reset password" on that user to set a new password, then try again.`,
          }
        }

        if (msg.includes('email not confirmed')) {
          return {
            success: false,
            error: `${raw} Ask an admin to confirm the email in Supabase or disable "Confirm email" for testing under Authentication → Providers → Email.`,
          }
        }

        return { success: false, error: raw }
      }

      if (!authData.session?.user) {
        return { success: false, error: 'Sign-in failed' }
      }

      const sessionUser = authData.session.user

      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('auth_user_id', sessionUser.id)
        .maybeSingle()

      if (!profile) {
        await supabase.auth.signOut()
        return {
          success: false,
          error:
            'Signed in to Auth but no matching row in public.users. Run supabase/seed-link-public-users.sql in the SQL Editor to create/link profiles.',
        }
      }

      const merged = mergeSessionProfile(
        profile as User,
        sessionUser.id,
        sessionUser.app_metadata ?? {},
      )
      profileLoadGenRef.current += 1
      lastLoadedAuthUserIdRef.current = sessionUser.id
      setHasSession(true)
      setUser(merged)
      return { success: true, user: merged }
    }

    try {
      const trimmed = employeeCode.trim()

      const { data, error: rpcError } = await supabase.rpc(
        'login_lookup_by_employee_code',
        { p_employee_code: trimmed },
      )

      const rows = Array.isArray(data) ? data : data != null ? [data] : []
      if (rpcError) {
        console.error('login_lookup_by_employee_code:', rpcError)
        return {
          success: false,
          error:
            rpcError.message ||
            'Could not look up employee code. Check that the login_lookup_by_employee_code function exists in Supabase.',
        }
      }

      if (rows.length === 0) {
        if (trimmed.includes('@')) {
          return await signInWithEmailAndLoadProfile(trimmed)
        }
        return {
          success: false,
          error:
            `No row in public.users for code "${trimmed}". Open supabase/seed-link-public-users.sql in this project, run it in Supabase → SQL Editor, then try again. Or enter your work email in this field (same password).`,
        }
      }

      const row = rows[0] as {
        email: string | null
        is_active: boolean
        has_auth_user?: boolean
      }
      const { email, is_active: isActive, has_auth_user: hasAuthUser } = row

      if (!email) {
        return { success: false, error: 'Employee code not found' }
      }

      if (!isActive) {
        return { success: false, error: 'Your account is inactive. Contact admin.' }
      }

      if (hasAuthUser === false) {
        return {
          success: false,
          error:
            'Login is not activated for this account. Ask an admin to finish setup (create-auth-user / link Auth).',
        }
      }

      return await signInWithEmailAndLoadProfile(email)
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Login failed'
      return { success: false, error: message }
    }
  }, [])

  const logout = useCallback(async () => {
    profileLoadGenRef.current += 1
    lastLoadedAuthUserIdRef.current = null
    try {
      if (supabase) await supabase.auth.signOut()
    } finally {
      setHasSession(false)
      setUser(null)
    }
  }, [])

  const changePassword = useCallback(
    async (newPassword: string) => {
      if (!supabase) {
        return { success: false, error: 'Supabase is not configured' }
      }
      try {
        const { error: authError } = await supabase.auth.updateUser({
          password: newPassword,
        })
        if (authError) throw authError

        const { error: refreshError } = await supabase.auth.refreshSession()
        if (refreshError) {
          console.error('Session refresh error:', refreshError)
        }

        return { success: true }
      } catch (error: unknown) {
        console.error('Change password error:', error)
        const message =
          error instanceof Error ? error.message : 'Failed to change password'
        return { success: false, error: message }
      }
    },
    [],
  )

  const value = useMemo((): AuthContextType => {
    const isProfileLoading = authReady && hasSession && !user
    return {
      user,
      isLoading: !authReady,
      isAuthenticated: !!user,
      authReady,
      isProfileLoading,
      signIn,
      logout,
      changePassword,
    }
  }, [user, authReady, hasSession, signIn, logout, changePassword])

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  )
}

export function useAuth() {
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
