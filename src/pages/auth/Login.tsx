import { useState, useEffect, useRef, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { isNativeApp } from '@/lib/capacitor';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import MaktreeBrand from '@/components/shared/MaktreeBrand';
import { prefetchRoleDashboard } from '@/lib/prefetchDashboard';

export default function Login() {
  const {
    signIn,
    user,
    authReady,
    isProfileLoading,
    blockedInfo,
    clearBlockedInfo,
    accountClosedInfo,
    clearAccountClosedInfo,
  } = useAuth();
  const navigate = useNavigate();
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user && authReady) {
      prefetchRoleDashboard(user.role)
      if (user.role === 'mr') navigate('/mr/dashboard', { replace: true })
      else if (user.role === 'manager') navigate('/manager/dashboard', { replace: true })
      else navigate('/admin/dashboard', { replace: true })
    }
  }, [user, authReady, navigate])

  useEffect(() => {
    if (!accountClosedInfo && !blockedInfo?.isBlocked) return
    if (blockedInfo?.isBlocked) clearBlockedInfo()
    if (accountClosedInfo) clearAccountClosedInfo()
    navigate('/account-blocked', { replace: true })
  }, [accountClosedInfo, blockedInfo, navigate, clearAccountClosedInfo, clearBlockedInfo])

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    const email = emailRef.current?.value ?? '';
    const password = passwordRef.current?.value ?? '';
    if (!email.trim() || !password) {
      toast.error('Email and password are required');
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await signIn(email, password);
      if (result.success) {
        toast.success('Signed in');
      } else if (result.accountBlocked) {
        navigate('/account-blocked', { replace: true });
      } else {
        toast.error(result.error || 'Login failed');
      }
    } catch {
      toast.error('Login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (user) {
    return (
      <LoadingSpinner fullScreen message="Restoring your session…" />
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-5 w-full max-w-full overflow-x-hidden">
      <div className="w-full max-w-sm md:max-w-md min-w-0 animate-fade-in-up md:glass-card md:p-8 md:rounded-2xl">
        <div className="mb-10 flex flex-col items-center">
          <MaktreeBrand variant="login" />
          {!isNativeApp() ? (
            <Link
              to="/"
              className="mt-4 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              ← Get started
            </Link>
          ) : null}
        </div>

        <form onSubmit={handleLogin} autoComplete="on" method="post" className="space-y-5">
          {(isProfileLoading || !authReady) && (
            <p className="text-xs text-center text-muted-foreground">Restoring previous session...</p>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs font-semibold">Email</Label>
            <Input
              ref={emailRef}
              id="email"
              name="username"
              type="email"
              inputMode="email"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              placeholder="your@email.com"
              className="touch-target rounded-xl border-2 border-border/60 h-12 text-[15px] font-medium focus:border-primary w-full"
              autoComplete="username"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-xs font-semibold">Password</Label>
            <div className="relative">
              <Input
                ref={passwordRef}
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                className="touch-target rounded-xl border-2 border-border/60 h-12 text-[15px] font-medium focus:border-primary w-full pr-12"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full touch-target rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 h-13 text-[15px] font-bold shadow-lg shadow-primary/20 active:scale-[0.97] transition-all"
          >
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <p className="mt-8 text-center text-xs text-muted-foreground font-medium">
          Contact your administrator for account access
        </p>
      </div>
    </div>
  );
}
