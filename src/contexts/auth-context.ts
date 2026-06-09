import { createContext } from 'react'
import type { AuthState } from '@/types/database.types'

export interface AuthContextType extends AuthState {
  signIn: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string; accountBlocked?: boolean }>
  logout: () => Promise<void>
  blockedInfo: { isBlocked: boolean; blockReason: string | null } | null
  clearBlockedInfo: () => void
  accountClosedInfo: { reason: 'blocked' | 'resigned' | 'deactivated' } | null
  clearAccountClosedInfo: () => void
}

/** Stable module — do not colocate with AuthProvider (avoids HMR breaking context). */
export const AuthContext = createContext<AuthContextType | null>(null)
