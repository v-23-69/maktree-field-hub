import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { User, AuthState, UserRole } from '@/types/database.types';
import { MOCK_USERS } from '@/lib/mock-data';

interface AuthContextType extends AuthState {
  login: (code: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  changePassword: (newPassword: string) => Promise<{ success: boolean }>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('maktree_user');
    return stored ? JSON.parse(stored) : null;
  });

  const login = useCallback(async (code: string, _password: string) => {
    const found = MOCK_USERS.find(u => u.employee_code.toLowerCase() === code.toLowerCase() && u.is_active);
    if (!found) return { success: false, error: 'Invalid employee code or password' };
    setUser(found);
    localStorage.setItem('maktree_user', JSON.stringify(found));
    return { success: true };
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('maktree_user');
  }, []);

  const changePassword = useCallback(async (_newPassword: string) => {
    if (user) {
      const updated = { ...user, must_change_password: false };
      setUser(updated);
      localStorage.setItem('maktree_user', JSON.stringify(updated));
    }
    return { success: true };
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, isLoading: false, isAuthenticated: !!user, login, logout, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function getRoleDashboard(role: UserRole): string {
  const paths: Record<UserRole, string> = { mr: '/mr/dashboard', manager: '/manager/dashboard', admin: '/admin/dashboard' };
  return paths[role];
}
