import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { formatDisplayDate, todayInputDate } from '@/lib/dateUtils';
import { useAuth } from '@/hooks/useAuth';
import { FilePlus, FileText, Stethoscope, Calendar, ChevronRight, CheckCircle2, Circle, Sparkles, Cake, Heart } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import BottomNav from '@/components/shared/BottomNav';
import StatCard from '@/components/shared/StatCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { useMasterListByMr } from '@/hooks/useMasterList';
import { useMrSubAreas } from '@/hooks/useAreas';
import { useMrTargets } from '@/hooks/useTargets';
import { useMrDashboardStats } from '@/hooks/useDashboardStats';
import { supabase } from '@/lib/supabase';
import type { DoctorAlert } from '@/types/database.types';
import type { DcrDailyStatus, DcrMonthlySummary } from '@/types/database.types';
import { useTodayStrike, useMarkStrike } from '@/hooks/useStrike';
import { useMrHolidays } from '@/hooks/useHolidays';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function MRDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const today = formatDisplayDate(todayInputDate());

  const { data: completionRows = [], isLoading: completionLoading } = useMasterListByMr(user?.id ?? '');
  const { data: subAreas = [] } = useMrSubAreas(user?.id ?? '');
  const { data: targetRows = [], isLoading: targetsLoading } = useMrTargets(user?.id ?? '');
  const { data: stats } = useMrDashboardStats(user?.id ?? '');
  const { data: todayStrike } = useTodayStrike(user?.id ?? '');
  const markStrike = useMarkStrike();
  const { data: mrHolidays = [] } = useMrHolidays(user?.id ?? '');

  const { data: dailyStatus } = useQuery({
    queryKey: ['dcr-daily-status', user?.id, todayInputDate()],
    enabled: !!user?.id && !!supabase,
    queryFn: async (): Promise<DcrDailyStatus | null> => {
      if (!supabase) return null;
      const { data, error } = await supabase
        .from('v_dcr_daily_status')
        .select('*')
        .eq('mr_id', user?.id)
        .eq('check_date', todayInputDate())
        .maybeSingle();
      if (error) throw error;
      return data as DcrDailyStatus;
    },
  });

  const { data: monthlySummary } = useQuery({
    queryKey: ['dcr-monthly-summary', user?.id],
    enabled: !!user?.id && !!supabase,
    queryFn: async (): Promise<DcrMonthlySummary | null> => {
      if (!supabase) return null;
      const month = `${todayInputDate().slice(0, 7)}-01`;
      const { data, error } = await supabase
        .from('v_dcr_monthly_summary')
        .select('*')
        .eq('mr_id', user?.id)
        .eq('month', month)
        .maybeSingle();
      if (error) throw error;
      return data as DcrMonthlySummary;
    },
  });

  const { data: alerts = [], isLoading: alertsLoading } = useQuery({
    queryKey: ['doctor-alerts', user?.id],
    enabled: !!user?.id && !!supabase,
    queryFn: async (): Promise<DoctorAlert[]> => {
      if (!supabase) throw new Error('Supabase not configured');
      const { data, error } = await supabase.rpc('get_doctor_alerts', { p_mr_id: user?.id });
      if (error) throw error;
      return (data ?? []) as DoctorAlert[];
    },
  });

  const areaProgress = useMemo(() => {
    const areaIdByName = new Map<string, string>();
    for (const sa of subAreas) {
      if (sa.area?.name && sa.area?.id) areaIdByName.set(sa.area.name, sa.area.id);
    }
    const map = new Map<string, { areaId: string | null; total: number; complete: number }>();
    for (const row of completionRows) {
      const existing = map.get(row.area) ?? { areaId: areaIdByName.get(row.area) ?? null, total: 0, complete: 0 };
      existing.total += row.total_doctors ?? 0;
      existing.complete += row.complete_doctors ?? 0;
      map.set(row.area, existing);
    }
    return Array.from(map.entries()).map(([areaName, v]) => {
      const pct = v.total > 0 ? Math.round((v.complete / v.total) * 100) : 0;
      let color: 'green' | 'amber' | 'red' = 'red';
      if (pct > 80) color = 'green';
      else if (pct >= 50) color = 'amber';
      return { areaName, areaId: v.areaId, total: v.total, complete: v.complete, pct, color };
    });
  }, [completionRows, subAreas]);

  const activeTargets = useMemo(() => {
    const now = new Date();
    return targetRows
      .filter(t => new Date(t.start_date) <= now && new Date(t.end_date) >= now)
      .map(t => {
        const pct = Math.max(0, Math.min(100, Math.round(t.achievement_pct ?? 0)));
        const end = new Date(t.end_date);
        const daysRemaining = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
        return { ...t, pct, daysRemaining };
      })
      .sort((a, b) => a.daysRemaining - b.daysRemaining);
  }, [targetRows]);

  const checklist = [
    { label: 'Tour Program', done: dailyStatus?.tour_program_done, path: '/mr/tour-program' },
    { label: 'DCR Report', done: dailyStatus?.dcr_done, path: '/mr/report/new' },
    { label: 'Expense Report', done: dailyStatus?.expense_done, path: '/mr/expense' },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader title="Dashboard" />

      <div className="px-4 py-5 space-y-5 max-w-lg mx-auto">
        {/* Welcome hero */}
        <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-primary/10 p-5 animate-fade-in-up">
          <div className="flex items-center gap-3.5">
            {user?.profile_photo_url ? (
              <img src={user.profile_photo_url} alt="" className="h-12 w-12 rounded-full object-cover ring-[3px] ring-primary/15 shadow" />
            ) : (
              <div className="h-12 w-12 rounded-full bg-primary/15 flex items-center justify-center ring-[3px] ring-primary/15">
                <span className="text-base font-extrabold text-primary">
                  {user?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-extrabold text-foreground tracking-tight truncate">
                Hi, {user?.full_name?.split(' ')[0]}!
              </h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                <p className="text-xs text-muted-foreground font-medium">{today}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {!alertsLoading && alerts.length > 0 && (
          <div className="space-y-2">
            {alerts.slice(0, 3).map(a => {
              const isBirthday = a.alert_type === 'birthday';
              const AlertIcon = isBirthday ? Cake : Heart;
              const msg = a.days_until === 0
                ? `${a.doctor_name}'s ${isBirthday ? 'birthday' : 'anniversary'} is today!`
                : `${a.doctor_name}'s ${isBirthday ? 'birthday' : 'anniversary'} in ${a.days_until} days`;
              return (
                <button
                  key={a.doctor_id}
                  type="button"
                  className="w-full text-left glass-card p-3.5 active:scale-[0.98] transition-all flex items-center gap-3"
                  onClick={() => navigate(`/mr/master-list?doctorId=${encodeURIComponent(a.doctor_id)}`)}
                >
                  <div className="h-9 w-9 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                    <AlertIcon className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <p className="text-sm font-medium text-foreground flex-1">{msg}</p>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </button>
              );
            })}
          </div>
        )}

        {/* CTA */}
        <Button
          onClick={() => navigate('/mr/report/new')}
          className="w-full touch-target rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 h-14 text-[15px] font-bold shadow-lg shadow-primary/20 active:scale-[0.97] transition-all"
        >
          <FilePlus className="mr-2.5 h-5 w-5" />
          Start Today's Report
        </Button>

        {/* Daily checklist */}
        <div className="glass-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="section-title">Daily Checklist</p>
            {monthlySummary && (
              <p className="text-[10px] text-muted-foreground font-medium">
                {monthlySummary.dcr_submitted_days} days this month
              </p>
            )}
          </div>

          {dailyStatus?.is_working_day === false ? (
            <div className="flex items-center gap-2 py-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <p className="text-sm text-muted-foreground">Today is a holiday. No reports needed.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {checklist.map(item => (
                <button
                  key={item.label}
                  className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-muted/40 active:scale-[0.98] transition-all"
                  onClick={() => navigate(item.path)}
                >
                  {item.done ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground/40 shrink-0" />
                  )}
                  <span className={cn(
                    'text-sm font-medium flex-1 text-left',
                    item.done ? 'text-muted-foreground line-through' : 'text-foreground'
                  )}>
                    {item.label}
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Strike / Holiday row */}
        <div className="flex gap-2.5">
          <Button
            variant="outline"
            disabled={!!todayStrike}
            className="flex-1 rounded-2xl h-11 text-xs font-semibold"
            onClick={() =>
              void markStrike
                .mutateAsync({ mr_id: user?.id ?? '' })
                .then(() => toast.success('Strike day marked'))
            }
          >
            {todayStrike ? 'Strike Marked' : 'Mark Strike Day'}
          </Button>
          {mrHolidays.length > 0 && (
            <div className="flex-1 rounded-2xl bg-card border border-border/50 px-3 py-2 flex items-center gap-2 overflow-hidden">
              <Calendar className="h-4 w-4 text-primary shrink-0" />
              <p className="text-[11px] text-foreground font-medium truncate">
                {mrHolidays[0]?.holiday?.name ?? 'Holiday'}
              </p>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard icon={FileText} value={stats?.reportsThisMonth ?? 0} label="Reports This Month" color="primary" />
          <StatCard icon={Stethoscope} value={stats?.doctorsThisWeek ?? 0} label="Doctors This Week" color="emerald" />
        </div>

        {/* Master List Progress */}
        {!completionLoading && areaProgress.length > 0 && (
          <div className="space-y-3">
            <p className="section-title">Doctor Coverage</p>
            <div className="space-y-2.5">
              {areaProgress.map(a => (
                <button
                  key={a.areaName}
                  type="button"
                  onClick={() => a.areaId && navigate(`/mr/master-list?areaId=${encodeURIComponent(a.areaId)}`)}
                  disabled={!a.areaId}
                  className="w-full text-left glass-card p-4 active:scale-[0.98] transition-all"
                >
                  <div className="flex items-center justify-between gap-3 mb-2.5">
                    <p className="text-sm font-semibold text-foreground truncate flex-1">{a.areaName}</p>
                    <span className={cn(
                      'text-xs font-bold tabular-nums',
                      a.color === 'green' ? 'text-emerald-600 dark:text-emerald-400' : a.color === 'amber' ? 'text-amber-600 dark:text-amber-400' : 'text-destructive'
                    )}>
                      {a.complete}/{a.total}
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all',
                        a.color === 'green' ? 'bg-emerald-500' : a.color === 'amber' ? 'bg-amber-500' : 'bg-destructive'
                      )}
                      style={{ width: `${a.pct}%` }}
                    />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Targets */}
        {!targetsLoading && activeTargets.length > 0 && (
          <div className="space-y-3">
            <p className="section-title">Active Targets</p>
            <div className="space-y-2.5">
              {activeTargets.map(t => (
                <div key={t.target_id} className="glass-card p-4">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <p className="text-sm font-semibold text-foreground truncate flex-1">
                      {t.product_name}
                      {t.sub_area ? ` — ${t.sub_area}` : ''}
                    </p>
                    <Badge variant="secondary" className="text-[10px] font-bold shrink-0">{t.pct}%</Badge>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden mb-2">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all',
                        t.pct > 80 ? 'bg-emerald-500' : t.pct >= 50 ? 'bg-amber-500' : 'bg-destructive'
                      )}
                      style={{ width: `${t.pct}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] text-muted-foreground font-medium">{t.achieved_qty}/{t.target_qty} units</p>
                    <p className="text-[11px] text-muted-foreground font-medium">{t.daysRemaining}d left</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <BottomNav role="mr" />
    </div>
  );
}
