import { NavLink, useLocation } from 'react-router-dom';
import { Home, FilePlus, History, BarChart3, FileText, Users, MapPin, Settings, ShieldCheck } from 'lucide-react';
import { UserRole } from '@/types/database.types';
import { cn } from '@/lib/utils';

interface NavItem {
  to: string;
  icon: React.ElementType;
  label: string;
}

const NAV_ITEMS: Record<UserRole, NavItem[]> = {
  mr: [
    { to: '/mr/dashboard', icon: Home, label: 'Home' },
    { to: '/mr/report/new', icon: FilePlus, label: 'New Report' },
    { to: '/mr/report/history', icon: History, label: 'History' },
  ],
  manager: [
    { to: '/manager/dashboard', icon: Home, label: 'Home' },
    { to: '/manager/reports', icon: FileText, label: 'Reports' },
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
              <item.icon className={cn('h-5 w-5', isActive && 'stroke-[2.5]')} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
