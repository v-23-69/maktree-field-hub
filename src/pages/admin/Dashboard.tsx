import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import AdminLayout from '@/components/admin/AdminLayout';
import DashboardStatLinkCards from '@/components/dashboard/dashboard-stat-link-cards';
import DashboardRadialMetrics from '@/components/dashboard/dashboard-radial-metrics';
import { Users, Stethoscope, MapPin, UserPlus, Plus, FileText, Clock, Lock, Play } from 'lucide-react';
import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { useAdminDashboardStats } from '@/hooks/useDashboardStats';
import { usePreventAccidentalBack } from '@/hooks/usePreventAccidentalBack';
import { useUnpauseUser } from '@/hooks/useTourProgram';
import { supabase } from '@/lib/supabase';
import { formatDisplayDate } from '@/lib/dateUtils';
import { toast } from 'sonner';
import { useDashboardRefresh } from '@/hooks/useDashboardRefresh';
import { DASHBOARD_QUERY_OPTIONS } from '@/lib/liveQueryOptions';
import DashboardBirthdaySlot from '@/components/shared/employee-birthday/DashboardBirthdaySlot';
import { DashboardSection, dashboardPanelClass } from '@/components/dashboard/dashboard-shell';
import { cn } from '@/lib/utils';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  usePreventAccidentalBack(true);
  const { refresh: refreshDashboard } = useDashboardRefresh(true);
  const { data: stats } = useAdminDashboardStats();
  const { data: recentReports = [] } = useQuery({
    queryKey: ['admin-recent-reports'],
    enabled: !!supabase,
    ...DASHBOARD_QUERY_OPTIONS,
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
    ...DASHBOARD_QUERY_OPTIONS,
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
    ...DASHBOARD_QUERY_OPTIONS,
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

  const adminStatItems = useMemo(
    () => [
      {
        name: 'Active MRs',
        value: stats?.totalMrs ?? 0,
        href: '/admin/users?filter=mr',
        linkLabel: 'Manage MRs →',
      },
      {
        name: 'Managers',
        value: stats?.totalManagers ?? 0,
        href: '/admin/users?filter=manager',
        linkLabel: 'Manage managers →',
      },
      {
        name: 'Doctors',
        value: stats?.totalDoctors ?? 0,
        href: '/admin/doctors',
        linkLabel: 'Doctor master →',
      },
      {
        name: 'Territories',
        value: stats?.totalAreas ?? 0,
        href: '/admin/areas',
        linkLabel: 'View areas →',
      },
    ],
    [stats],
  )

  const adminRadialItems = useMemo(() => {
    const values = [
      { name: 'MRs', count: stats?.totalMrs ?? 0, key: 'a' },
      { name: 'Managers', count: stats?.totalManagers ?? 0, key: 'b' },
      { name: 'Doctors', count: stats?.totalDoctors ?? 0, key: 'c' },
      { name: 'Territories', count: stats?.totalAreas ?? 0, key: 'd' },
    ]
    const max = Math.max(...values.map(v => v.count), 1)
    return values.map(v => ({
      name: v.name,
      percent: Math.round((v.count / max) * 100),
      detail: `${v.count.toLocaleString()} registered`,
      colorKey: v.key,
    }))
  }, [stats])

  return (
    <AdminLayout>
      <div className="space-y-5">
        <DashboardBirthdaySlot />
        <DashboardSection title="Portal overview">
          <DashboardStatLinkCards items={adminStatItems} columns={2} />
          <DashboardRadialMetrics
            title="Directory scale"
            description="Relative size of each master list (largest = 100%)"
            items={adminRadialItems}
          />
        </DashboardSection>

        <DashboardSection title="Quick actions">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              { label: 'Add user', icon: UserPlus, to: '/admin/users' },
              { label: 'Add doctor', icon: Plus, to: '/admin/doctors' },
              { label: 'Territories', icon: MapPin, to: '/admin/areas' },
              { label: `Complaints (${pendingComplaints})`, icon: FileText, to: '/admin/users?tab=complaints' },
            ].map(action => (
              <button
                key={action.label}
                type="button"
                onClick={() => navigate(action.to)}
                className={cn(dashboardPanelClass(), 'flex flex-col items-center gap-1.5 p-3 active:scale-95 transition-all touch-target')}
              >
                <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                  <action.icon className="h-4 w-4 text-primary" />
                </div>
                <span className="text-[10px] font-semibold text-foreground text-center leading-tight">{action.label}</span>
              </button>
            ))}
          </div>
        </DashboardSection>

        {pausedUsers.length > 0 && (
          <DashboardSection
            title={`Paused accounts (${pausedUsers.length})`}
            description="Accounts blocked until tour program is completed"
          >
            <div className={cn(dashboardPanelClass(), 'divide-y divide-border overflow-hidden p-0')}>
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
          </DashboardSection>
        )}

        <DashboardSection title="Recent activity">
          <div className={cn(dashboardPanelClass(), 'divide-y divide-border overflow-hidden p-0')}>
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
        </DashboardSection>
      </div>
    </AdminLayout>
  );
}
