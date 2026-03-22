import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';
import PageHeader from '@/components/shared/PageHeader';
import BottomNav from '@/components/shared/BottomNav';
import StatCard from '@/components/shared/StatCard';
import { Users, FileText, Stethoscope, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

const FILTERS = ['Today', 'This Week', 'This Month'] as const;

export default function ManagerDashboard() {
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState<typeof FILTERS[number]>('Today');

  return (
    <div className="min-h-screen bg-background pb-20">
      <PageHeader title="Manager Dashboard" />

      <div className="px-4 py-4 space-y-5">
        <div className="animate-fade-in-up">
          <h2 className="text-xl font-bold text-foreground">Welcome, {user?.full_name?.split(' ')[0]}!</h2>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <StatCard icon={Users} value={3} label="Total MRs" />
          <StatCard icon={FileText} value={2} label="Reports Today" />
          <StatCard icon={Calendar} value={28} label="Reports This Month" />
          <StatCard icon={Stethoscope} value={142} label="Doctors Visited" />
        </div>

        <div className="flex gap-2">
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={cn(
                'rounded-full px-4 py-2 text-xs font-medium border transition-colors touch-target active:scale-95',
                activeFilter === f
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card text-foreground border-border'
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <BottomNav role="manager" />
    </div>
  );
}
