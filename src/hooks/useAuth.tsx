import { createContext, useContext, useState, useCallback, useEffect, ReactNode, useMemo } from 'react'
import { User, AuthState, UserRole } from '@/types/database.types'
import { supabase } from '@/lib/supabase'

interface AuthContextType extends AuthState {
  signIn: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  changePassword: (
    newPassword: string,
  ) => Promise<{ success: boolean; error?: string }>
  blockedInfo: { isBlocked: boolean; blockReason: string | null } | null
  clearBlockedInfo: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [authReady, setAuthReady] = useState(() => !supabase)
  const [isProfileLoading, setIsProfileLoading] = useState(false)
  const [blockedInfo, setBlockedInfo] = useState<{ isBlocked: boolean; blockReason: string | null } | null>(null)

  const clearBlockedInfo = useCallback(() => setBlockedInfo(null), [])

  const loadProfile = useCallback(async (authUserId: string) => {
    if (!supabase) return
    setIsProfileLoading(true)
    const { data: profile, error } = await supabase
      .from('users')
      .select('*')
      .eq('auth_user_id', authUserId)
      .maybeSingle()

    if (error || !profile) {
      setUser(null)
      setAuthReady(true)
      setIsProfileLoading(false)
      return
    }

    const p = profile as User & { is_blocked?: boolean; block_reason?: string | null }
    if (p.is_blocked) {
      setBlockedInfo({ isBlocked: true, blockReason: p.block_reason ?? null })
      setUser(null)
      setAuthReady(true)
      setIsProfileLoading(false)
      await supabase.auth.signOut()
      return
    }

    setBlockedInfo(null)
    setUser(profile as User)
    setAuthReady(true)
    setIsProfileLoading(false)
  }, [])

  useEffect(() => {
    if (!supabase) {
      setAuthReady(true)
      return
    }
    let mounted = true
    void (async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!mounted) return
      if (session?.user) {
        await loadProfile(session.user.id)
      } else {
        setUser(null)
        setAuthReady(true)
        setIsProfileLoading(false)
      }
    })()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          await loadProfile(session.user.id)
        } else {
          setUser(null)
          setAuthReady(true)
          setIsProfileLoading(false)
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
      return { success: true }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Login failed'
      return { success: false, error: message }
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      if (supabase) await supabase.auth.signOut()
    } finally {
      setUser(null)
      setAuthReady(true)
      setIsProfileLoading(false)
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
    return {
      user,
      isLoading: !authReady,
      isAuthenticated: !!user,
      authReady,
      isProfileLoading,
      signIn,
      logout,
      changePassword,
      blockedInfo,
      clearBlockedInfo,
    }
  }, [user, authReady, isProfileLoading, signIn, logout, changePassword, blockedInfo, clearBlockedInfo])

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
