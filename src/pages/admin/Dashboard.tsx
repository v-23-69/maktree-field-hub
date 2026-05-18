import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import AdminLayout from '@/components/admin/AdminLayout';
import StatCard from '@/components/shared/StatCard';
import { Users, Stethoscope, MapPin, UserPlus, Plus, FileText, Clock, Lock, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAdminDashboardStats } from '@/hooks/useDashboardStats';
import { usePreventAccidentalBack } from '@/hooks/usePreventAccidentalBack';
import { useUnpauseUser } from '@/hooks/useTourProgram';
import { supabase } from '@/lib/supabase';
import { formatDisplayDate } from '@/lib/dateUtils';
import { toast } from 'sonner';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  usePreventAccidentalBack(true);
  const { data: stats } = useAdminDashboardStats();
  const { data: recentReports = [] } = useQuery({
    queryKey: ['admin-recent-reports'],
    enabled: !!supabase,
    queryFn: async (): Promise<{ id: string; text: string; time: string }[]> => {
      if (!supabase) throw new Error('Supabase not configured')
      const { data, error } = await supabase
        .from('daily_reports')
        .select('id, report_date, submitted_at, mr:users!daily_reports_mr_id_fkey(full_name)')
        .eq('status', 'submitted')
        .order('submitted_at', { ascending: false })
        .limit(5)
      if (error) throw error
      return (data ?? []).map((r: any) => ({
        id: r.id,
        text: `${r.mr?.full_name ?? 'MR'} submitted report for ${formatDisplayDate(r.report_date)}`,
        time: r.submitted_at ? new Date(r.submitted_at).toLocaleString() : '—',
      }))
    },
  })
  const unpauseUser = useUnpauseUser();
  const { data: pausedUsers = [] } = useQuery({
    queryKey: ['admin-paused-users'],
    enabled: !!supabase,
    queryFn: async (): Promise<Array<{ id: string; full_name: string; role: string; pause_reason: string | null }>> => {
      if (!supabase) return [];
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, role, pause_reason')
        .eq('is_paused', true)
        .eq('is_active', true);
      if (error) throw error;
      return (data ?? []) as Array<{ id: string; full_name: string; role: string; pause_reason: string | null }>;
    },
  });

  const { data: pendingComplaints = 0 } = useQuery({
    queryKey: ['admin-pending-complaints-count'],
    enabled: !!supabase && user?.role === 'admin',
    queryFn: async (): Promise<number> => {
      if (!supabase) return 0
      const { count, error } = await supabase
        .from('block_complaints')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending')
      if (error) {
        if (error.code === '42501' || error.code === 'PGRST301') return 0
        throw error
      }
      return count ?? 0
    },
  })

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => navigate('/admin/users?filter=mr')} className="text-left active:scale-[0.97] transition-transform">
            <StatCard icon={Users} value={stats?.totalMrs ?? 0} label="Total MRs" />
          </button>
          <button onClick={() => navigate('/admin/users?filter=manager')} className="text-left active:scale-[0.97] transition-transform">
            <StatCard icon={Users} value={stats?.totalManagers ?? 0} label="Total Managers" />
          </button>
          <button onClick={() => navigate('/admin/doctors')} className="text-left active:scale-[0.97] transition-transform">
            <StatCard icon={Stethoscope} value={stats?.totalDoctors ?? 0} label="Total Doctors" />
          </button>
          <button onClick={() => navigate('/admin/areas')} className="text-left active:scale-[0.97] transition-transform">
            <StatCard icon={MapPin} value={stats?.totalAreas ?? 0} label="Total Territories" />
          </button>
        </div>

        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Quick Actions</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Add User', icon: UserPlus, to: '/admin/users' },
              { label: 'Add Doctor', icon: Plus, to: '/admin/doctors' },
              { label: 'Add Territory', icon: MapPin, to: '/admin/areas' },
              { label: `Pending Complaints (${pendingComplaints})`, icon: FileText, to: '/admin/users' },
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

        {/* Paused Accounts */}
        {pausedUsers.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-destructive" />
              Paused Accounts ({pausedUsers.length})
            </p>
            <div className="rounded-xl bg-card shadow-sm divide-y divide-border overflow-hidden">
              {pausedUsers.map(pu => (
                <div key={pu.id} className="flex items-center gap-3 p-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{pu.full_name}</p>
                    <p className="text-[10px] text-muted-foreground capitalize">{pu.role} — {pu.pause_reason ?? 'No TP'}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="shrink-0 text-xs rounded-xl h-8"
                    disabled={unpauseUser.isPending}
                    onClick={() => {
                      void unpauseUser.mutateAsync(pu.id)
                        .then(() => toast.success(`${pu.full_name} unpaused`))
                        .catch(e => toast.error(e instanceof Error ? e.message : 'Failed'))
                    }}
                  >
                    <Play className="mr-1 h-3 w-3" /> Unpause
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Activity Feed */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Recent Activity</p>
          <div className="rounded-xl bg-card shadow-sm divide-y divide-border overflow-hidden">
            {recentReports.length === 0 && (
              <div className="p-4 text-sm text-muted-foreground">No recent activity.</div>
            )}
            {recentReports.map(item => (
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
