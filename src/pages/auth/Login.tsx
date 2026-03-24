import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import type { UserRole } from '@/types/database.types';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import AppLogo from '@/components/shared/AppLogo';

function navigateByRole(
  nav: (path: string, options?: { replace?: boolean }) => void,
  role: UserRole,
) {
  const opts = { replace: true as const };
  if (role === 'mr') nav('/mr/dashboard', opts);
  else if (role === 'manager') nav('/manager/dashboard', opts);
  else nav('/admin/dashboard', opts);
}

export default function Login() {
  const { signIn, isAuthenticated, user, authReady, isProfileLoading } =
    useAuth();
  const navigate = useNavigate();
  const [employeeCode, setEmployeeCode] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!authReady) return;
    if (isAuthenticated && user) {
      navigateByRole(navigate, user.role);
    }
  }, [authReady, isAuthenticated, user, navigate]);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (!employeeCode.trim() || !password) {
      toast.error('Employee code (or email) and password are required');
      return;
    }
    setIsSubmitting(true);
    try {
      localStorage.setItem('last_employee_code', employeeCode.trim())
      const result = await signIn(employeeCode, password);
      if (result.success && result.user) {
        navigateByRole(navigate, result.user.role);
        toast.success('Signed in');
      } else if (result.isBlocked) {
        navigate('/blocked-complaint', { replace: true, state: { blockReason: result.blockReason } })
      } else {
        toast.error(result.error || 'Login failed');
      }
    } catch {
      toast.error('Login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!authReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <LoadingSpinner />
      </div>
    );
  }

  if (isProfileLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background px-4">
        <LoadingSpinner />
        <p className="text-sm text-muted-foreground">Restoring your session…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 sm:px-6 w-full max-w-full min-w-0 overflow-x-hidden">
      <div className="w-full max-w-sm min-w-0 animate-fade-in-up">
        <div className="mb-8 flex flex-col items-center gap-3">
          <AppLogo className="h-28 w-auto drop-shadow-sm" />
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Field Reporting Portal</p>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="employeeCode">Employee code or work email</Label>
            <Input
              id="employeeCode"
              value={employeeCode}
              onChange={e => setEmployeeCode(e.target.value)}
              className="touch-target rounded-lg w-full min-w-0 max-w-full"
              autoComplete="username"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="touch-target rounded-lg w-full min-w-0 max-w-full pr-11"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground hover:text-foreground"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full touch-target rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-base font-semibold"
          >
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Contact your administrator for account access
        </p>
      </div>
    </div>
  );
}
