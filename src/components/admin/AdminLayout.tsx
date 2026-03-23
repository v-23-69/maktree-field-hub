import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Users, Stethoscope, MapPin, Settings, Menu, X, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import BottomNav from '@/components/shared/BottomNav';

const SIDEBAR_ITEMS = [
  { to: '/admin/dashboard', icon: Home, label: 'Dashboard' },
  { to: '/admin/users', icon: Users, label: 'Users' },
  { to: '/admin/doctors', icon: Stethoscope, label: 'Doctors' },
  { to: '/admin/areas', icon: MapPin, label: 'Areas' },
  { to: '/admin/mr-access', icon: Settings, label: 'MR Access' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:w-60 lg:flex-col lg:border-r lg:border-border lg:bg-card">
        <div className="flex h-14 items-center gap-2 px-4 border-b border-border">
          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
            <span className="text-xs font-bold text-primary-foreground">MM</span>
          </div>
          <span className="font-semibold text-sm text-foreground">Admin Panel</span>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {SIDEBAR_ITEMS.map(item => {
            const isActive = location.pathname === item.to;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
      </aside>

      {/* Mobile drawer overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-foreground/30 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        >
          <aside
            className="absolute left-0 top-0 bottom-0 w-64 bg-card shadow-xl animate-slide-in-left"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex h-14 items-center justify-between px-4 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                  <span className="text-xs font-bold text-primary-foreground">MM</span>
                </div>
                <span className="font-semibold text-sm text-foreground">Admin</span>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="p-1.5">
                <X className="h-5 w-5 text-foreground" />
              </button>
            </div>
            <nav className="p-3 space-y-1">
              {SIDEBAR_ITEMS.map(item => {
                const isActive = location.pathname === item.to;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </NavLink>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="lg:pl-60 pb-20 lg:pb-0">
        {/* Admin header with hamburger and search */}
        <header className="sticky top-0 z-30 flex items-center gap-3 bg-card px-4 py-3 shadow-sm border-b border-border lg:border-b-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden touch-target flex items-center justify-center rounded-lg p-1 active:scale-95 transition-transform"
          >
            <Menu className="h-5 w-5 text-foreground" />
          </button>
          <div className="flex-1 flex items-center gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search..."
                className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
        </header>

        <div className="px-4 py-4 min-w-0 max-w-full overflow-x-auto">
          {children}
        </div>
      </div>

      {/* Bottom nav on mobile only */}
      <div className="lg:hidden">
        <BottomNav role="admin" />
      </div>
    </div>
  );
}
