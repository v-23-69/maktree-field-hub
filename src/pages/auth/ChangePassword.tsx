import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Info } from 'lucide-react';
import { toast } from 'sonner';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

interface ChangePasswordForm {
  newPassword: string;
  confirmPassword: string;
}

export default function ChangePassword() {
  const {
    user,
    changePassword,
    isAuthenticated,
    authReady,
    isProfileLoading,
  } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, handleSubmit, watch, formState: { errors } } = useForm<ChangePasswordForm>();

  useEffect(() => {
    if (!authReady || isProfileLoading) return;
    if (!isAuthenticated || !user) {
      navigate('/login', { replace: true });
    }
  }, [authReady, isProfileLoading, isAuthenticated, user, navigate]);

  const onSubmit = async (data: ChangePasswordForm) => {
    setIsSubmitting(true);
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error('Request timed out. Please try again.')),
        10_000,
      ),
    );
    try {
      const result = (await Promise.race([
        changePassword(data.newPassword),
        timeoutPromise,
      ])) as { success: boolean; error?: string };

      if (result.success) {
        toast.success('Password changed successfully ✓');
        if (user?.role === 'mr') navigate('/mr/dashboard');
        else if (user?.role === 'manager') navigate('/manager/dashboard');
        else navigate('/admin/dashboard');
      } else {
        toast.error(result.error || 'Failed to change password');
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Failed to change password';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!authReady || isProfileLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 sm:px-6 w-full max-w-full min-w-0 overflow-x-hidden">
      <div className="w-full max-w-sm min-w-0 animate-fade-in-up">
        <div className="mb-6 flex flex-col items-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary">
            <span className="text-xl font-bold text-primary-foreground">MM</span>
          </div>
          <h1 className="text-xl font-bold text-foreground">Change Password</h1>
        </div>

        <div className="mb-6 flex items-start gap-2 rounded-lg bg-accent/20 p-3">
          <Info className="h-5 w-5 text-accent shrink-0 mt-0.5" />
          <p className="text-sm text-foreground">Please set a new password to continue using the portal.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              id="newPassword"
              type="password"
              className="touch-target rounded-lg"
              placeholder="Min 6 characters"
              {...register('newPassword', { required: 'Required', minLength: { value: 6, message: 'Min 6 characters' } })}
            />
            {errors.newPassword && <p className="text-xs text-destructive">{errors.newPassword.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              className="touch-target rounded-lg w-full min-w-0 max-w-full"
              placeholder="Re-enter password"
              {...register('confirmPassword', {
                required: 'Required',
                validate: v => v === watch('newPassword') || 'Passwords do not match'
              })}
            />
            {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full touch-target rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-base font-semibold"
          >
            {isSubmitting ? 'Updating...' : 'Set New Password'}
          </Button>
        </form>
      </div>
    </div>
  );
}
