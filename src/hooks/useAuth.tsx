import { createContext, useContext, useState, useCallback, useEffect, ReactNode, useMemo, useRef } from 'react'
import { User, AuthState, UserRole } from '@/types/database.types'
import { supabase } from '@/lib/supabase'

interface AuthContextType extends AuthState {
  signIn: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  blockedInfo: { isBlocked: boolean; blockReason: string | null } | null
  clearBlockedInfo: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)
const PROFILE_CACHE_KEY = 'maktree-auth-profile-cache-v1'
const PROFILE_CACHE_TTL_MS = 5 * 60 * 1000
const PROFILE_SELECT =
  'id,auth_user_id,employee_code,full_name,email,role,is_active,is_blocked,block_reason,is_paused,pause_reason,profile_photo_url,designation,mobile,created_at,updated_at'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  // Keep login UI responsive even if session check is slow.
  const [authReady, setAuthReady] = useState(true)
  const [isProfileLoading, setIsProfileLoading] = useState(false)
  const [blockedInfo, setBlockedInfo] = useState<{ isBlocked: boolean; blockReason: string | null } | null>(null)
  const loadingAuthUserIdRef = useRef<string | null>(null)
  const lastLoadedAuthUserIdRef = useRef<string | null>(null)
  const lastLoadedAtRef = useRef<number>(0)

  const clearBlockedInfo = useCallback(() => setBlockedInfo(null), [])

  const loadProfile = useCallback(async (authUserId: string, preferCache = false) => {
    if (!supabase) return
    if (loadingAuthUserIdRef.current === authUserId) return

    if (preferCache) {
      try {
        const raw = sessionStorage.getItem(PROFILE_CACHE_KEY)
        if (raw) {
          const cached = JSON.parse(raw) as { ts: number; user: User }
          if (
            cached?.user?.auth_user_id === authUserId &&
            Date.now() - cached.ts < PROFILE_CACHE_TTL_MS
          ) {
            setBlockedInfo(null)
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
    const { data: profile, error } = await supabase
      .from('users')
      .select(PROFILE_SELECT)
      .eq('auth_user_id', authUserId)
      .maybeSingle()

    if (error || !profile) {
      setUser(null)
      setAuthReady(true)
      setIsProfileLoading(false)
      loadingAuthUserIdRef.current = null
      return
    }

    const p = profile as User & { is_blocked?: boolean; block_reason?: string | null }
    if (p.is_blocked) {
      setBlockedInfo({ isBlocked: true, blockReason: p.block_reason ?? null })
      setUser(null)
      setAuthReady(true)
      setIsProfileLoading(false)
      loadingAuthUserIdRef.current = null
      await supabase.auth.signOut()
      return
    }

    setBlockedInfo(null)
    const nextUser = profile as User
    setUser(nextUser)
    sessionStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify({ ts: Date.now(), user: nextUser }))
    lastLoadedAuthUserIdRef.current = authUserId
    lastLoadedAtRef.current = Date.now()
    setAuthReady(true)
    setIsProfileLoading(false)
    loadingAuthUserIdRef.current = null
  }, [])

  useEffect(() => {
    if (!supabase) {
      setAuthReady(true)
      return
    }
    let mounted = true
    void (async () => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (!mounted) return
      if (
        sessionError &&
        /refresh token|invalid.*token/i.test(sessionError.message ?? '')
      ) {
        await supabase.auth.signOut({ scope: 'local' })
        setUser(null)
        setAuthReady(true)
        setIsProfileLoading(false)
        sessionStorage.removeItem(PROFILE_CACHE_KEY)
        return
      }
      if (session?.user) {
        void loadProfile(session.user.id, true)
      } else {
        setUser(null)
        setAuthReady(true)
        setIsProfileLoading(false)
        sessionStorage.removeItem(PROFILE_CACHE_KEY)
      }
    })()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return
        if (event === 'TOKEN_REFRESHED') return
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
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: password.trim(),
      })
      if (authError) {
        if (authError.message.includes('Invalid login credentials')) {
          return { success: false, error: 'Incorrect email or password.' }
        }
        return { success: false, error: authError.message }
      }
      if (!authData.session) {
        return { success: false, error: 'Login failed. Please try again.' }
      }
      void loadProfile(authData.session.user.id, true)
      return { success: true }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Login failed'
      return { success: false, error: message }
    }
  }, [loadProfile])

  const logout = useCallback(async () => {
    try {
      if (supabase) await supabase.auth.signOut()
    } finally {
      setUser(null)
      setAuthReady(true)
      setIsProfileLoading(false)
      sessionStorage.removeItem(PROFILE_CACHE_KEY)
    }
  }, [])

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
    }
  }, [user, authReady, isProfileLoading, signIn, logout, blockedInfo, clearBlockedInfo])

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
