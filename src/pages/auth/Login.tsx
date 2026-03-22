import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth, getRoleDashboard } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface LoginForm {
  employeeCode: string;
  password: string;
}

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>();

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    const result = await login(data.employeeCode, data.password);
    setIsLoading(false);

    if (result.success) {
      const stored = localStorage.getItem('maktree_user');
      if (stored) {
        const user = JSON.parse(stored);
        if (user.must_change_password) {
          navigate('/change-password');
        } else {
          navigate(getRoleDashboard(user.role));
        }
      }
    } else {
      toast.error(result.error || 'Login failed');
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm animate-fade-in-up">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary shadow-lg">
            <span className="text-2xl font-bold text-primary-foreground">MM</span>
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold text-foreground">Maktree Medicines</h1>
            <p className="text-sm text-muted-foreground">Field Reporting Portal</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="employeeCode">Employee Code</Label>
            <Input
              id="employeeCode"
              placeholder="MKT-MR-001"
              className="touch-target rounded-lg"
              {...register('employeeCode', { required: 'Employee code is required' })}
            />
            {errors.employeeCode && <p className="text-xs text-destructive">{errors.employeeCode.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter password"
                className="touch-target rounded-lg pr-12"
                {...register('password', { required: 'Password is required' })}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full touch-target rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-base font-semibold"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Contact your administrator for account access
        </p>
      </div>
    </div>
  );
}
