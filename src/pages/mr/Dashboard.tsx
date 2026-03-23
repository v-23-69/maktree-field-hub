import { useNavigate } from 'react-router-dom';
import { formatDisplayDate, todayInputDate } from '@/lib/dateUtils';
import { useAuth } from '@/hooks/useAuth';
import { FilePlus, FileText, Stethoscope, Calendar } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import BottomNav from '@/components/shared/BottomNav';
import StatCard from '@/components/shared/StatCard';
import { Button } from '@/components/ui/button';

export default function MRDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const today = formatDisplayDate(todayInputDate());

  return (
    <div className="min-h-screen bg-background pb-20">
      <PageHeader title="Dashboard" />

      <div className="px-4 py-4 space-y-5">
        {/* Welcome */}
        <div className="animate-fade-in-up">
          <h2 className="text-xl font-bold text-foreground">Welcome, {user?.full_name?.split(' ')[0]}!</h2>
          <div className="flex items-center gap-1.5 mt-1">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{today}</p>
          </div>
        </div>

        {/* CTA */}
        <Button
          onClick={() => navigate('/mr/report/new')}
          className="w-full touch-target rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 h-14 text-base font-semibold shadow-md active:scale-[0.98] transition-transform"
        >
          <FilePlus className="mr-2 h-5 w-5" />
          Start Today's Report
        </Button>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard icon={FileText} value={12} label="Reports This Month" />
          <StatCard icon={Stethoscope} value={8} label="Doctors This Week" />
        </div>
      </div>

      <BottomNav role="mr" />
    </div>
  );
}
