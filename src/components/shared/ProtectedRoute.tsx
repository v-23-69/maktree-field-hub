import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/types/database.types';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import DashboardWelcomeSplash from '@/components/shared/DashboardWelcomeSplash';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isAuthenticated, authReady, isProfileLoading } = useAuth();

  if (!authReady) return <LoadingSpinner />;
  if (isProfileLoading && user) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <DashboardWelcomeSplash
          fullName={user.full_name}
          profilePhotoUrl={user.profile_photo_url}
          subtitle="Signing you in…"
        />
      </div>
    );
  }
  if (isProfileLoading) return <LoadingSpinner />;
  if (!isAuthenticated || !user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={`/${user.role}/dashboard`} replace />;
  }

  return <>{children}</>;
}
