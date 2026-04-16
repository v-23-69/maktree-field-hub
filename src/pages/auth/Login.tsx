import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import AppLogo from '@/components/shared/AppLogo';

export default function Login() {
  const { signIn, user, authReady, isProfileLoading, blockedInfo, clearBlockedInfo } =
    useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user && authReady) {
      if (user.role === 'mr') navigate('/mr/dashboard', { replace: true })
      else if (user.role === 'manager') navigate('/manager/dashboard', { replace: true })
      else navigate('/admin/dashboard', { replace: true })
    }
  }, [user, authReady, navigate])

  useEffect(() => {
    if (!blockedInfo?.isBlocked) return
    navigate('/blocked-complaint', { replace: true, state: { blockReason: blockedInfo.blockReason } })
    clearBlockedInfo()
  }, [blockedInfo, navigate, clearBlockedInfo])

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error('Email and password are required');
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await signIn(email, password);
      if (result.success) {
        toast.success('Signed in');
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
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
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
