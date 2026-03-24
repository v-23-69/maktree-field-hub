import { NavLink, useLocation } from 'react-router-dom';
import { Home, Clipboard, History, BarChart3, FileText, Users, MapPin, Settings, ShieldCheck, List, Bell, Target, CalendarDays, Receipt } from 'lucide-react';
import { UserRole } from '@/types/database.types';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useManagerUnlockRequests } from '@/hooks/useUnlockRequests';

interface NavItem {
  to: string;
  icon: React.ElementType;
  label: string;
}

const NAV_ITEMS: Record<UserRole, NavItem[]> = {
  mr: [
    { to: '/mr/dashboard', icon: Home, label: 'Home' },
    { to: '/mr/report/new', icon: Clipboard, label: 'DCR Report' },
    { to: '/mr/master-list', icon: List, label: 'Master List' },
    { to: '/mr/tour-program', icon: CalendarDays, label: 'Tour Program' },
    { to: '/mr/expense', icon: Receipt, label: 'Expense' },
    { to: '/mr/report/history', icon: History, label: 'History' },
  ],
  manager: [
    { to: '/manager/dashboard', icon: Home, label: 'Home' },
    { to: '/manager/reports', icon: FileText, label: 'Reports' },
    { to: '/manager/requests', icon: Bell, label: 'Requests' },
    { to: '/manager/leaves', icon: CalendarDays, label: 'Leaves' },
    { to: '/manager/targets', icon: Target, label: 'Targets' },
    { to: '/manager/analytics', icon: BarChart3, label: 'Analytics' },
  ],
  admin: [
    { to: '/admin/dashboard', icon: Home, label: 'Home' },
    { to: '/admin/users', icon: Users, label: 'Users' },
    { to: '/admin/doctors', icon: ShieldCheck, label: 'Doctors' },
    { to: '/admin/areas', icon: MapPin, label: 'Areas' },
    { to: '/admin/mr-access', icon: Settings, label: 'Access' },
  ],
};

export default function BottomNav({ role }: { role: UserRole }) {
  const items = NAV_ITEMS[role];
  const location = useLocation();
  const { user } = useAuth();
  const managerId = role === 'manager' ? user?.id ?? '' : '';
  const { data: unlockData } = useManagerUnlockRequests(managerId);
  const pendingCount = unlockData?.pending?.length ?? 0;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card shadow-[0_-2px_10px_rgba(0,0,0,0.06)]">
      <div className="mx-auto flex max-w-lg items-center justify-around">
        {items.map(item => {
          const isActive = location.pathname.startsWith(item.to);
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={cn(
                'flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition-colors touch-target',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <span className="relative inline-flex">
                <item.icon className={cn('h-5 w-5', isActive && 'stroke-[2.5]')} />
                {item.to === '/manager/requests' && pendingCount > 0 && (
                  <span className="absolute -top-1 -right-2 min-w-[16px] px-1 h-4 text-[10px] rounded-full bg-destructive text-white flex items-center justify-center border border-background">
                    {pendingCount > 99 ? '99+' : pendingCount}
                  </span>
                )}
              </span>
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
