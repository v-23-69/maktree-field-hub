import { ArrowLeft } from 'lucide-react';
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
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 bg-card px-4 py-3 shadow-sm">
      {showBack && (
        <button onClick={() => navigate(-1)} className="touch-target flex items-center justify-center rounded-lg p-1 active:scale-95 transition-transform">
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
      )}
      <h1 className="text-lg font-semibold text-foreground flex-1 truncate">{title}</h1>
      {rightAction ?? (
        user ? (
          <button onClick={() => navigate('/profile')} className="touch-target rounded-full">
            <UserCircle2 className="h-6 w-6 text-muted-foreground" />
          </button>
        ) : null
      )}
    </header>
  );
}
