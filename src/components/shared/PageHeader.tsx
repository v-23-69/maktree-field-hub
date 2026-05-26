import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { performAppBack } from '@/hooks/usePreventAccidentalBack';
import ManagerRequestsHeaderButton from '@/components/shared/ManagerRequestsHeaderButton';

interface PageHeaderProps {
  title: string;
  showBack?: boolean;
  /** When set, used instead of navigate(-1) — use with usePreventAccidentalBack().goBack */
  onBack?: () => void;
  rightAction?: React.ReactNode;
}

export default function PageHeader({ title, showBack, onBack, rightAction }: PageHeaderProps) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const initials = user?.full_name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() ?? '';

  return (
    <header
      className="sticky top-0 z-30 glass flex items-center gap-3 px-4 md:px-6 shrink-0 border-b border-border/40"
      style={{
        paddingTop: 'max(0px, env(safe-area-inset-top))',
        minHeight: 'calc(3.5rem + env(safe-area-inset-top, 0px))',
      }}
    >
      {showBack ? (
        <button
          type="button"
          onClick={() => performAppBack(navigate, onBack)}
          className="flex items-center justify-center h-10 w-10 shrink-0 rounded-xl hover:bg-foreground/5 active:scale-95 transition-transform touch-manipulation"
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
      ) : (
        <div className="h-9 w-9 rounded-xl overflow-hidden shrink-0 bg-primary/5 flex items-center justify-center">
          <img
            src="/icons/icon-192-v2.png"
            alt="MakTree"
            className="h-[150%] w-[150%] object-cover"
          />
        </div>
      )}

      <div className="flex-1 min-w-0">
        {!showBack ? (
          <div>
            <p className="text-[15px] md:text-base font-extrabold text-foreground truncate leading-tight tracking-tight">
              MakTree DCR Portal
            </p>
            <p className="text-[10px] md:text-[11px] text-muted-foreground/70 font-medium tracking-wide">
              Field Reporting System
            </p>
          </div>
        ) : (
          <h1 className="text-[15px] font-bold text-foreground truncate tracking-tight">{title}</h1>
        )}
      </div>

      {rightAction ?? (
        user ? (
          <div className="flex items-center gap-1.5 shrink-0">
            {user.role === 'manager' && <ManagerRequestsHeaderButton />}
            <button
              type="button"
              onClick={() => navigate('/profile')}
              className="active:scale-90 transition-transform touch-manipulation"
              aria-label="Open profile"
            >
              {user.profile_photo_url ? (
                <img
                  src={user.profile_photo_url}
                  alt={user.full_name}
                  className="h-9 w-9 rounded-full object-cover ring-2 ring-foreground/[0.06]"
                />
              ) : (
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center ring-2 ring-foreground/[0.04]">
                  <span className="text-xs font-bold text-primary">{initials}</span>
                </div>
              )}
            </button>
          </div>
        ) : null
      )}
    </header>
  );
}
