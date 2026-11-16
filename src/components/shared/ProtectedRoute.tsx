import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/types/database.types';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import RouteErrorBoundary from '@/components/shared/RouteErrorBoundary';
import { getRoleDashboard } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  /** When set, wraps children in a route-level error boundary (Sentry-safe). */
  scope?: string;
}

export default function ProtectedRoute({ children, allowedRoles, scope }: ProtectedRouteProps) {
  const { user, isAuthenticated, authReady, isProfileLoading } = useAuth();

  // A signed-in user keeps the page they were on. Refreshing the profile must not unmount it.
  if (user && isAuthenticated) {
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      return <Navigate to={`/${user.role}/dashboard`} replace />;
    }
    if (!scope) return <>{children}</>;
    const fallbackPath = allowedRoles?.[0] ? getRoleDashboard(allowedRoles[0]) : undefined;
    return (
      <RouteErrorBoundary scope={scope} fallbackPath={fallbackPath}>
        {children}
      </RouteErrorBoundary>
    );
  }

  if (!authReady || isProfileLoading) {
    return <LoadingSpinner fullScreen showLogo={false} message="Checking your session…" />;
  }
  return <Navigate to="/login" replace />;
}
