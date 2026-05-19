import { NavLink, useLocation } from 'react-router-dom';
import { Home, Clipboard, History, BarChart3, FileText, Users, MapPin, Settings, ShieldCheck, List, Bell } from 'lucide-react';
import { UserRole } from '@/types/database.types';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useManagerPendingRequestsCount } from '@/hooks/useManagerPendingRequestsCount';

interface NavItem {
  to: string;
  icon: React.ElementType;
  label: string;
  /** If true, only highlight when pathname equals `to` (avoids matching `/manager/report/:id`). */
  exact?: boolean;
}

const NAV_ITEMS: Record<UserRole, NavItem[]> = {
  mr: [
    { to: '/mr/dashboard', icon: Home, label: 'Home' },
    { to: '/mr/report/new', icon: Clipboard, label: 'DCR' },
    { to: '/mr/master-list', icon: List, label: 'Doctors' },
    { to: '/mr/report/history', icon: History, label: 'History' },
  ],
  manager: [
    { to: '/manager/dashboard', icon: Home, label: 'Home' },
    { to: '/manager/team', icon: Users, label: 'Team' },
    { to: '/manager/reports', icon: FileText, label: 'Reports' },
    { to: '/manager/requests', icon: Bell, label: 'Requests' },
    { to: '/manager/analytics', icon: BarChart3, label: 'Analytics' },
  ],
  admin: [
    { to: '/admin/dashboard', icon: Home, label: 'Home' },
    { to: '/admin/users', icon: Users, label: 'Users' },
    { to: '/admin/doctors', icon: ShieldCheck, label: 'Doctors' },
    { to: '/admin/areas', icon: MapPin, label: 'Territories' },
    { to: '/admin/mr-access', icon: Settings, label: 'Access' },
  ],
};

export default function BottomNav({ role }: { role: UserRole }) {
  const items = NAV_ITEMS[role];
  const location = useLocation();
  const { user } = useAuth();
  const managerId = role === 'manager' ? user?.id ?? '' : '';
  const pendingCount = useManagerPendingRequestsCount(managerId);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 glass border-t"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="mx-auto flex max-w-2xl lg:max-w-3xl items-stretch">
        {items.map(item => {
          const isActive = item.exact
            ? location.pathname === item.to
            : location.pathname === item.to || location.pathname.startsWith(`${item.to}/`);
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={cn(
                'relative flex flex-1 flex-col items-center justify-center gap-[3px] pt-2 pb-1.5 text-[10px] md:text-[11px] font-semibold transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground/70'
              )}
            >
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 h-[2.5px] w-5 rounded-full bg-primary" />
              )}
              <span className="relative inline-flex">
                <item.icon className={cn('h-5 w-5 md:h-6 md:w-6', isActive && 'stroke-[2.5]')} />
                {item.to === '/manager/requests' && pendingCount > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 min-w-[15px] px-0.5 h-[15px] text-[8px] rounded-full bg-destructive text-white flex items-center justify-center border-[1.5px] border-card font-bold">
                    {pendingCount > 99 ? '99+' : pendingCount}
                  </span>
                )}
              </span>
              <span className="text-center leading-none tracking-wide">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
