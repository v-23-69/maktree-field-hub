import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth, getRoleDashboard } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Info } from 'lucide-react';
import { toast } from 'sonner';

interface ChangePasswordForm {
  newPassword: string;
  confirmPassword: string;
}

export default function ChangePassword() {
  const { user, changePassword } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const { register, handleSubmit, watch, formState: { errors } } = useForm<ChangePasswordForm>();

  const onSubmit = async (data: ChangePasswordForm) => {
    setIsLoading(true);
    await changePassword(data.newPassword);
    setIsLoading(false);
    toast.success('Password changed successfully');
    if (user) navigate(getRoleDashboard(user.role));
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm animate-fade-in-up">
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
              className="touch-target rounded-lg"
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
            disabled={isLoading}
            className="w-full touch-target rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-base font-semibold"
          >
            {isLoading ? 'Updating...' : 'Set New Password'}
          </Button>
        </form>
      </div>
    </div>
  );
}
