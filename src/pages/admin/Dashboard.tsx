import { useNavigate } from 'react-router-dom';
import PageHeader from '@/components/shared/PageHeader';
import BottomNav from '@/components/shared/BottomNav';
import StatCard from '@/components/shared/StatCard';
import { Users, Stethoscope, MapPin, UserPlus, Plus, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AdminDashboard() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-20">
      <PageHeader title="Admin Dashboard" />

      <div className="px-4 py-4 space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <StatCard icon={Users} value={3} label="Total MRs" />
          <StatCard icon={Users} value={2} label="Total Managers" />
          <StatCard icon={Stethoscope} value={6} label="Total Doctors" />
          <StatCard icon={MapPin} value={4} label="Total Areas" />
        </div>

        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Quick Actions</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Add User', icon: UserPlus, to: '/admin/users' },
              { label: 'Add Doctor', icon: Plus, to: '/admin/doctors' },
              { label: 'Add Area', icon: MapPin, to: '/admin/areas' },
              { label: 'View Reports', icon: FileText, to: '/admin/users' },
            ].map(action => (
              <Button
                key={action.label}
                variant="outline"
                onClick={() => navigate(action.to)}
                className="h-auto flex-col gap-2 rounded-xl py-4 touch-target active:scale-[0.97] transition-transform"
              >
                <action.icon className="h-5 w-5 text-primary" />
                <span className="text-xs font-medium">{action.label}</span>
              </Button>
            ))}
          </div>
        </div>
      </div>

      <BottomNav role="admin" />
    </div>
  );
}
