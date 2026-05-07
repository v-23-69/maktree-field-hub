import { ArrowLeft, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { UserCircle2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface PageHeaderProps {
  title: string;
  showBack?: boolean;
  rightAction?: React.ReactNode;
}

export default function PageHeader({ title, showBack, rightAction }: PageHeaderProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-border/80 bg-card px-3 sm:px-4 py-2.5 shadow-sm">
      {showBack && (
        <button onClick={() => navigate(-1)} className="touch-target flex items-center justify-center rounded-lg p-1.5 active:scale-95 transition-transform">
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
      )}
      <h1 className="text-base sm:text-lg font-semibold text-foreground flex-1 truncate">{title}</h1>
      {rightAction ?? (
        user ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/profile')}
              className="touch-target rounded-full"
              aria-label="Open profile"
              title="Profile"
            >
              <UserCircle2 className="h-6 w-6 text-muted-foreground" />
            </button>
            <button
              onClick={async () => {
                await logout();
                navigate('/login', { replace: true });
              }}
              className="touch-target rounded-full p-1"
              aria-label="Logout"
              title="Logout"
            >
              <LogOut className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>
        ) : null
      )}
    </header>
  );
}
