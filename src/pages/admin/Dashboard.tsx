import { useNavigate } from 'react-router-dom';
import AdminLayout from '@/components/admin/AdminLayout';
import StatCard from '@/components/shared/StatCard';
import { Users, Stethoscope, MapPin, UserPlus, Plus, FileText, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ACTIVITY_FEED = [
  { id: '1', text: 'Rajesh Kumar submitted report for 20 Mar 2026', time: '2 hours ago' },
  { id: '2', text: 'Priya Sharma submitted report for 20 Mar 2026', time: '3 hours ago' },
  { id: '3', text: 'New doctor Dr. Neha Agarwal added to Saket', time: '1 day ago' },
  { id: '4', text: 'Amit Patel changed password', time: '2 days ago' },
  { id: '5', text: 'Sub-area DLF Phase 2 added to Gurgaon', time: '3 days ago' },
];

export default function AdminDashboard() {
  const navigate = useNavigate();

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => navigate('/admin/users?filter=mr')} className="text-left active:scale-[0.97] transition-transform">
            <StatCard icon={Users} value={3} label="Total MRs" />
          </button>
          <button onClick={() => navigate('/admin/users?filter=manager')} className="text-left active:scale-[0.97] transition-transform">
            <StatCard icon={Users} value={2} label="Total Managers" />
          </button>
          <button onClick={() => navigate('/admin/doctors')} className="text-left active:scale-[0.97] transition-transform">
            <StatCard icon={Stethoscope} value={6} label="Total Doctors" />
          </button>
          <button onClick={() => navigate('/admin/areas')} className="text-left active:scale-[0.97] transition-transform">
            <StatCard icon={MapPin} value={4} label="Total Areas" />
          </button>
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

        {/* Activity Feed */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Recent Activity</p>
          <div className="rounded-xl bg-card shadow-sm divide-y divide-border overflow-hidden">
            {ACTIVITY_FEED.map(item => (
              <div key={item.id} className="flex items-start gap-3 p-3">
                <Clock className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">{item.text}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
