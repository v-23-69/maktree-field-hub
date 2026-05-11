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

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-5 w-full max-w-full overflow-x-hidden">
      <div className="w-full max-w-sm md:max-w-md min-w-0 animate-fade-in-up md:glass-card md:p-8 md:rounded-2xl">
        <div className="mb-10 flex flex-col items-center gap-4">
          <AppLogo className="h-24 w-auto drop-shadow-sm" />
          <div className="text-center space-y-1">
            <h1 className="text-xl font-extrabold text-foreground tracking-tight">MakTree DCR Portal</h1>
            <p className="text-sm text-muted-foreground font-medium">Field Reporting System</p>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          {isProfileLoading && (
            <p className="text-xs text-center text-muted-foreground">Restoring previous session...</p>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs font-semibold">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="touch-target rounded-xl border-2 border-border/60 h-12 text-[15px] font-medium focus:border-primary w-full"
              autoComplete="username"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-xs font-semibold">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
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
