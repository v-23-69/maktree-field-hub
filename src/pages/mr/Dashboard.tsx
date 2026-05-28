import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { formatDisplayDate, todayInputDate, isSundayYmd, formatShortDateIst, formatIstTimeNow } from '@/lib/dateUtils';
import { useAuth } from '@/hooks/useAuth';
import { FilePlus, FileText, Stethoscope, Calendar, ChevronRight, CheckCircle2, Circle, Sparkles, Cake, Heart, AlertTriangle, MapPin, Users, Lock, Zap, CalendarOff, CalendarDays, Receipt, Umbrella } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import BottomNav from '@/components/shared/BottomNav';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { useMasterListByMr } from '@/hooks/useMasterList';
import { useMrSubAreas } from '@/hooks/useAreas';
import { useMrTargets } from '@/hooks/useTargets';
import { useMrDashboardStats } from '@/hooks/useDashboardStats';
import { supabase } from '@/lib/supabase';
import type { DoctorAlert } from '@/types/database.types';
import type { DcrDailyStatus } from '@/types/database.types';
import { useTodayStrike, useMarkStrike, useStrikeCount } from '@/hooks/useStrike';
import { useMrHolidays, useMrHolidayCount, useMarkMrHoliday } from '@/hooks/useHolidays';
import { useTpStatus, useTodayTpPlan } from '@/hooks/useTourProgram';
import { useAllowedReportDates } from '@/hooks/useReport';
import { usePreventAccidentalBack } from '@/hooks/usePreventAccidentalBack';
import MarkSundayDcrButton from '@/components/shared/MarkSundayDcrButton';
import { useDashboardRefresh } from '@/hooks/useDashboardRefresh';
import MrDashboardTodayPanel from '@/components/mr/MrDashboardTodayPanel';
import TodayPlanFromTp from '@/components/shared/TodayPlanFromTp';
import { LIVE_QUERY_OPTIONS } from '@/lib/liveQueryOptions';
import type { AllowedReportDate } from '@/types/database.types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import DashboardBirthdaySlot from '@/components/shared/employee-birthday/DashboardBirthdaySlot';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import DashboardWelcomeSplash from '@/components/shared/DashboardWelcomeSplash';
import ProfileCompletionPrompt from '@/components/shared/ProfileCompletionPrompt';
import { useMrLeaves } from '@/hooks/useLeaves';
type DrawerAction = 'strike' | 'holiday' | null;

export default function MRDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  usePreventAccidentalBack(true);
  const today = formatDisplayDate(todayInputDate());
  const userId = user?.id ?? '';

  // Defer non-critical queries so the main UI renders fast
  const [deferReady, setDeferReady] = useState(false);
  useEffect(() => { const t = setTimeout(() => setDeferReady(true), 100); return () => clearTimeout(t); }, []);

  // Critical queries (needed for first paint)
  const { data: tpStatus, isLoading: tpStatusLoading } = useTpStatus(userId);
  const { data: todayPlan } = useTodayTpPlan(userId);
  const { data: allowedDates = [] } = useAllowedReportDates(userId);
  // Deferred queries (below the fold)
  const { data: completionRows = [], isLoading: completionLoading } = useMasterListByMr(deferReady ? userId : '');
  const { data: subAreas = [], isLoading: subAreasLoading } = useMrSubAreas(userId);
  const { data: targetRows = [], isLoading: targetsLoading } = useMrTargets(deferReady ? userId : '');
  const { data: stats, isLoading: statsLoading } = useMrDashboardStats(deferReady ? userId : '');
  useDashboardRefresh(!!userId);
  const { data: todayStrike } = useTodayStrike(deferReady ? userId : '');
  const markStrike = useMarkStrike();
  const { data: strikeCount = 0 } = useStrikeCount(deferReady ? userId : '');
  const { data: mrHolidays = [] } = useMrHolidays(deferReady ? userId : '');
  const { data: holidayCount = 0 } = useMrHolidayCount(deferReady ? userId : '');
  const markHoliday = useMarkMrHoliday();
  const [action, setAction] = useState<DrawerAction>(null);
  const [strikeDate, setStrikeDate] = useState(todayInputDate());
  const [strikeReason, setStrikeReason] = useState('');
  const [showStrikeConfirm, setShowStrikeConfirm] = useState(false);
  const [holidayDate, setHolidayDate] = useState(todayInputDate());
  const [holidayReason, setHolidayReason] = useState('');

  const { data: dailyStatus } = useQuery({
    queryKey: ['dcr-daily-status', userId, todayInputDate()],
    enabled: !!userId && !!supabase && deferReady,
    ...LIVE_QUERY_OPTIONS,
    queryFn: async (): Promise<DcrDailyStatus | null> => {
      if (!supabase) return null;
      const { data, error } = await supabase
        .from('v_dcr_daily_status')
        .select('mr_id, check_date, tour_program_done, dcr_done, expense_done, is_working_day')
        .eq('mr_id', userId)
        .eq('check_date', todayInputDate())
        .maybeSingle();
      if (error) throw error;
      return data as DcrDailyStatus;
    },
  });

  const { data: alerts = [], isLoading: alertsLoading } = useQuery({
    queryKey: ['doctor-alerts', userId],
    enabled: !!userId && !!supabase && deferReady,
    queryFn: async (): Promise<DoctorAlert[]> => {
      if (!supabase) throw new Error('Supabase not configured');
      const { data, error } = await supabase.rpc('get_doctor_alerts', { p_mr_id: userId });
      if (error) throw error;
      return (data ?? []) as DoctorAlert[];
    },
  });

  const { data: mrLeaves = [] } = useMrLeaves(deferReady ? userId : '');
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

  const todayDate = todayInputDate();
  const todayIsSunday = isSundayYmd(todayDate);
  const todayDcrDone = allowedDates.find(d => d.report_date === todayDate)?.already_submitted === true;
  const pendingFieldDcrDays = allowedDates.filter(
    d => !d.already_submitted && d.day_type !== 'sunday',
  );
  const pendingSundayDcrDays = allowedDates.filter(
    d => !d.already_submitted && d.day_type === 'sunday',
  );
  const allDcrDone = allowedDates.length > 0 && allowedDates.every(d => d.already_submitted);

  const openFieldReport = (d: AllowedReportDate) => {
    const reportKind = d.day_type === 'leave' ? 'leave' as const : 'field' as const
    navigate('/mr/report/new', { state: { date: d.report_date, reportKind } })
  }

  const isPaused = user?.is_paused === true;
  const tpApproved =
    !!tpStatus &&
    (tpStatus.current_month_tp_approved === true || tpStatus.current_month_tp_status === 'approved');
  const hasSubAreaAccess =
    tpStatus?.has_sub_area_access === true ||
    (tpStatus?.has_sub_area_access === undefined && subAreas.length > 0);
  const dcrBlocked = hasSubAreaAccess && !tpApproved && !isPaused;
  const expenseDoneToday = dailyStatus?.expense_done === true;

  const nextMonthDeadlineApproaching = tpStatus && !tpStatus.next_month_tp_exists && tpStatus.days_to_deadline <= 5 && tpStatus.days_to_deadline >= 0;
  const nextMonthOverdue = tpStatus?.is_overdue === true;
  const tpGateLoading = tpStatusLoading || (!!userId && subAreasLoading);

  const showSundayDcrCta = isSundayYmd(todayDate) && !todayDcrDone;
  const pendingFieldDcrPast = pendingFieldDcrDays.filter(d => d.report_date !== todayDate);
  const showMrStats =
    deferReady && ((stats?.reportsThisMonth ?? 0) > 0 || (stats?.doctorsThisWeek ?? 0) > 0);
  const showDoctorCoverage =
    !completionLoading && areaProgress.some(a => a.total > 0);

  const closeDrawer = () => {
    setAction(null);
    setStrikeDate(todayInputDate());
    setStrikeReason('');
    setHolidayDate(todayInputDate());
    setHolidayReason('');
  };

  if (isPaused) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <PageHeader title="Dashboard" />
        <div className="px-4 py-12 max-w-lg mx-auto text-center space-y-6">
          <div className="mx-auto h-20 w-20 rounded-full bg-destructive/10 flex items-center justify-center">
            <Lock className="h-10 w-10 text-destructive" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-foreground">Account Paused</h2>
            <p className="text-sm text-muted-foreground">
              {user?.pause_reason ?? 'Your account has been paused due to non-compliance with Tour Program requirements.'}
            </p>
          </div>
          <div className="glass-card p-4 text-left space-y-2">
            <p className="text-sm font-semibold text-foreground">What to do:</p>
            <ul className="text-sm text-muted-foreground space-y-1.5 list-disc pl-5">
              <li>Contact your Manager to unpause your account</li>
              <li>Create your Tour Program immediately after unpausing</li>
            </ul>
          </div>
        </div>
        <BottomNav role="mr" />
      </div>
    );
  }

  if (tpGateLoading && userId) {
    return (
      <div className="min-h-screen bg-background pb-24 flex flex-col">
        <PageHeader title="Dashboard" />
        <DashboardWelcomeSplash
          fullName={user?.full_name}
          profilePhotoUrl={user?.profile_photo_url}
        />
        <BottomNav role="mr" />
      </div>
    );
  }

  if (userId && tpStatus && !hasSubAreaAccess) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <PageHeader title="Dashboard" />
        <div className="px-4 py-8 max-w-lg mx-auto space-y-6">
          <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-primary/10 p-5">
            <div className="flex items-center gap-3.5">
              <div className="h-12 w-12 rounded-full bg-primary/15 flex items-center justify-center ring-[3px] ring-primary/15">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-extrabold text-foreground tracking-tight truncate">
                  Hi, {user?.full_name?.split(' ')[0]}!
                </h2>
                <p className="text-xs text-muted-foreground font-medium">{today}</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-border/60 bg-card/80 p-5 space-y-3 text-center">
            <p className="text-base font-bold text-foreground">We are setting up the portal for you</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Your manager still needs to assign your field areas. Once territories are linked to your profile, you will be able to create your tour program and use the rest of the dashboard.
            </p>
          </div>
        </div>
        <BottomNav role="mr" />
      </div>
    );
  }

  if (userId && tpStatus && hasSubAreaAccess && !tpApproved) {
    const st = tpStatus.current_month_tp_status;
    const monthLabel = new Date(tpStatus.current_month + 'T00:00:00').toLocaleDateString(undefined, {
      month: 'long',
      year: 'numeric',
    });
    const isAwaitingApproval = st === 'submitted';
    const isRejected = st === 'rejected';
    return (
      <div className="min-h-screen bg-background pb-24">
        <PageHeader title="Dashboard" />
        <div className="px-4 py-8 max-w-lg mx-auto space-y-6">
          <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-primary/10 p-5">
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
                <p className="text-xs text-muted-foreground font-medium">{today}</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border-2 border-amber-500/30 bg-amber-500/5 p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">
                  {isAwaitingApproval ? 'Tour program pending approval' : isRejected ? 'Tour program needs attention' : 'Tour program required'}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {isAwaitingApproval ? (
                    <>
                      Your tour program for <span className="font-semibold text-foreground">{monthLabel}</span> is with your manager for approval.
                      You will get full access as soon as it is approved.
                    </>
                  ) : isRejected ? (
                    <>
                      Your tour program for <span className="font-semibold text-foreground">{monthLabel}</span> was rejected. Open Tour Program to review feedback, update it, and submit again.
                    </>
                  ) : (
                    <>
                      Create and get your tour program approved for{' '}
                      <span className="font-semibold text-foreground">{monthLabel}</span> before accessing other features.
                    </>
                  )}
                </p>
              </div>
            </div>
            <Button onClick={() => navigate('/mr/tour-program')} className="w-full rounded-2xl h-12 text-sm font-bold">
              <Calendar className="mr-2 h-5 w-5" />
              {isAwaitingApproval ? 'View tour program' : 'Create or update tour program'}
            </Button>
          </div>
        </div>
        <BottomNav role="mr" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader title="Dashboard" />

      <div className="px-4 md:px-6 py-5 space-y-5 max-w-lg md:max-w-2xl lg:max-w-4xl mx-auto">
        <DashboardBirthdaySlot />

        {/* Welcome hero */}
        <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-primary/10 p-5 animate-fade-in-up">
          <div className="flex items-start gap-3.5">
            {user?.profile_photo_url ? (
              <img src={user.profile_photo_url} alt="" className="h-12 w-12 rounded-full object-cover ring-[3px] ring-primary/15 shadow shrink-0" />
            ) : (
              <div className="h-12 w-12 rounded-full bg-primary/15 flex items-center justify-center ring-[3px] ring-primary/15 shrink-0">
                <span className="text-base font-extrabold text-primary">
                  {user?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-extrabold text-foreground tracking-tight truncate">
                Hi, {user?.full_name?.split(' ')[0]}!
              </h2>
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <p className="text-xs text-muted-foreground font-medium">{today}</p>
                <span className="text-[10px] text-muted-foreground/80">Â· {formatIstTimeNow()}</span>
              </div>
            </div>
          </div>
        </div>

        {deferReady && hasSubAreaAccess && tpApproved && (
          <>
            {todayPlan?.sub_area_id && (
              <TodayPlanFromTp
                subAreaName={todayPlan.sub_area_name ?? ''}
                areaName={todayPlan.area_name ?? ''}
                dcrDone={todayDcrDone}
                dcrBlocked={dcrBlocked}
                todayIsSunday={todayIsSunday}
                onStartDcr={() => navigate('/mr/report/new')}
              />
            )}
            <MrDashboardTodayPanel
              todayIsSunday={todayIsSunday}
              dcrDone={todayDcrDone}
              expenseDone={expenseDoneToday}
              dcrBlocked={dcrBlocked}
            />
          </>
        )}

        {/* TP Deadline Alert */}
        {(nextMonthDeadlineApproaching || nextMonthOverdue) && (
          <div className={cn(
            'rounded-2xl p-4 flex items-start gap-3 border',
            nextMonthOverdue ? 'border-destructive/30 bg-destructive/5' : 'border-amber-500/30 bg-amber-500/5'
          )}>
            <AlertTriangle className={cn('h-5 w-5 shrink-0 mt-0.5', nextMonthOverdue ? 'text-destructive' : 'text-amber-600 dark:text-amber-400')} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">
                {nextMonthOverdue ? 'Tour Program Overdue!' : `TP Deadline in ${tpStatus!.days_to_deadline} day(s)`}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Create next month's Tour Program to avoid account pause.
              </p>
            </div>
            <Button size="sm" variant={nextMonthOverdue ? 'destructive' : 'outline'} className="shrink-0 text-xs rounded-xl" onClick={() => navigate('/mr/tour-program')}>
              Create TP
            </Button>
          </div>
        )}

        {/* Sunday DCR (IST) */}
        {showSundayDcrCta && (
          <div className="rounded-2xl border border-sky-500/35 bg-sky-500/10 p-4 space-y-3">
            <div className="flex items-start gap-2">
              <Calendar className="h-5 w-5 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-foreground">Today is Sunday (IST)</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Tap below to submit your Sunday DCR if you had no field visits.
                </p>
              </div>
            </div>
            <MarkSundayDcrButton reportDate={todayDate} className="w-full rounded-2xl h-12 text-sm" />
          </div>
        )}


        {pendingFieldDcrPast.length > 0 && !allDcrDone && (
          <div className="glass-card p-4 space-y-3">
            <p className="section-title">Past pending DCR</p>
            <div className="space-y-1.5">
              {pendingFieldDcrPast.map(d => (
                  <button
                    key={d.report_date}
                    type="button"
                    onClick={() => openFieldReport(d)}
                    className="w-full flex items-center justify-between rounded-xl px-3 py-2.5 hover:bg-muted/40 active:scale-[0.98] transition-all border border-border"
                  >
                    <div className="flex items-center gap-2">
                      <Circle className="h-4 w-4 text-amber-500 shrink-0" />
                      <span className="text-sm font-medium text-foreground">
                        {formatShortDateIst(d.report_date)}
                      </span>
                    </div>
                    <Badge variant="outline" className="text-[10px] text-amber-600 dark:text-amber-400 border-amber-500/30">
                      {d.day_type === 'leave' ? 'Leave DCR' : 'Pending'}
                    </Badge>
                  </button>
              ))}
            </div>
          </div>
        )}

        {pendingSundayDcrDays.length > 0 && !allDcrDone && (
          <div className="glass-card p-4 space-y-3 border border-sky-500/20">
            <p className="section-title text-sky-800 dark:text-sky-200">Pending Sunday DCR</p>
            <div className="space-y-2">
              {pendingSundayDcrDays.map(d => (
                <div
                  key={d.report_date}
                  className="flex items-center justify-between gap-2 rounded-xl border border-border px-3 py-2.5"
                >
                  <span className="text-sm font-medium text-foreground">
                    {d.report_date === todayDate ? 'Today (Sunday)' : formatShortDateIst(d.report_date)}
                  </span>
                  <MarkSundayDcrButton reportDate={d.report_date} className="shrink-0" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All DCR done message */}
        {allDcrDone && (
          <div className="flex items-center gap-2 rounded-xl bg-emerald-600/10 border border-emerald-600/20 px-4 py-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">All reports up to date</p>
          </div>
        )}

        {deferReady &&
          mrLeaves
            .filter(l => l.status === 'approved')
            .slice(0, 3)
            .map(leave => (
              <div key={leave.id} className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3">
                <p className="text-xs font-semibold text-emerald-900 dark:text-emerald-100 leading-snug">
                  Leave approved
                  {leave.approver?.full_name ? ` by ${leave.approver.full_name}` : ''}
                  {' â€” '}
                  {formatDisplayDate(leave.leave_date)} ({leave.leave_category === 'sick' ? 'Sick' : 'Casual'})
                </p>
              </div>
            ))}

        {/* Quick Actions */}
        <div className="space-y-3">
          <p className="section-title">Quick Actions</p>
          <div className="grid grid-cols-5 gap-2">
            <button type="button" onClick={() => navigate('/mr/tour-program')} className="flex flex-col items-center gap-1.5 glass-card p-2.5 active:scale-95 transition-all">
              <div className="h-8 w-8 rounded-xl bg-blue-500/10 flex items-center justify-center"><CalendarDays className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" /></div>
              <span className="text-[9px] font-semibold text-foreground text-center leading-tight">Tour</span>
            </button>
            <button type="button" onClick={() => navigate('/mr/expense')} className="flex flex-col items-center gap-1.5 glass-card p-2.5 active:scale-95 transition-all">
              <div className="h-8 w-8 rounded-xl bg-emerald-500/10 flex items-center justify-center"><Receipt className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" /></div>
              <span className="text-[9px] font-semibold text-foreground text-center leading-tight">Expense</span>
            </button>
            <button type="button" onClick={() => setAction('strike')} className="flex flex-col items-center gap-1.5 glass-card p-2.5 active:scale-95 transition-all border border-destructive/15">
              <div className="h-8 w-8 rounded-xl bg-destructive/10 flex items-center justify-center"><Zap className="h-3.5 w-3.5 text-destructive" /></div>
              <span className="text-[9px] font-semibold text-destructive text-center leading-tight">Strike</span>
            </button>
            <button type="button" onClick={() => setAction('holiday')} className="flex flex-col items-center gap-1.5 glass-card p-2.5 active:scale-95 transition-all">
              <div className="h-8 w-8 rounded-xl bg-amber-500/10 flex items-center justify-center"><CalendarOff className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" /></div>
              <span className="text-[9px] font-semibold text-foreground text-center leading-tight">Holiday</span>
            </button>
            <button type="button" onClick={() => navigate('/mr/leave')} className="flex flex-col items-center gap-1.5 glass-card p-2.5 active:scale-95 transition-all">
              <div className="h-8 w-8 rounded-xl bg-violet-500/10 flex items-center justify-center"><Umbrella className="h-3.5 w-3.5 text-violet-600 dark:text-violet-300" /></div>
              <span className="text-[9px] font-semibold text-foreground text-center leading-tight">Leave</span>
            </button>
          </div>
          <div className="flex gap-2">
            <div className="flex-1 rounded-xl bg-muted/50 px-3 py-2 flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground font-medium">Strikes this year</span>
              <span className="text-sm font-bold text-destructive tabular-nums">{strikeCount}</span>
            </div>
            <div className="flex-1 rounded-xl bg-muted/50 px-3 py-2 flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground font-medium">Holidays this year</span>
              <span className="text-sm font-bold text-amber-600 dark:text-amber-400 tabular-nums">{holidayCount}</span>
            </div>
          </div>
        </div>

        {dailyStatus?.is_working_day === false && (
          <div className="flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-2.5">
            <Sparkles className="h-4 w-4 text-amber-500 shrink-0" />
            <p className="text-sm text-muted-foreground">Today is a holiday â€” no field reports needed.</p>
          </div>
        )}

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
                <button key={a.doctor_id} type="button" className="w-full text-left glass-card p-3.5 active:scale-[0.98] transition-all flex items-center gap-3" onClick={() => navigate(`/mr/master-list?doctorId=${encodeURIComponent(a.doctor_id)}`)}>
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

        {showMrStats && (
          <div className="rounded-2xl border border-border/80 bg-card/60 px-4 py-3 grid grid-cols-2 gap-3">
            <div>
              <p className="text-xl font-bold tabular-nums text-foreground">{stats?.reportsThisMonth ?? 0}</p>
              <p className="text-[10px] text-muted-foreground font-medium mt-0.5">DCRs this month</p>
            </div>
            <div>
              <p className="text-xl font-bold tabular-nums text-foreground">{stats?.doctorsThisWeek ?? 0}</p>
              <p className="text-[10px] text-muted-foreground font-medium mt-0.5">Doctors this week</p>
            </div>
          </div>
        )}

        {showDoctorCoverage && (
          <div className="space-y-3">
            <p className="section-title">Doctor Coverage</p>
            <div className="space-y-2.5 md:grid md:grid-cols-2 md:gap-3 md:space-y-0">
              {areaProgress.map(a => (
                <button key={a.areaName} type="button" onClick={() => a.areaId && navigate(`/mr/master-list?areaId=${encodeURIComponent(a.areaId)}`)} disabled={!a.areaId} className="w-full text-left glass-card p-4 active:scale-[0.98] transition-all">
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
                    <div className={cn('h-full rounded-full transition-all', a.color === 'green' ? 'bg-emerald-500' : a.color === 'amber' ? 'bg-amber-500' : 'bg-destructive')} style={{ width: `${a.pct}%` }} />
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
            <div className="space-y-2.5 md:grid md:grid-cols-2 md:gap-3 md:space-y-0">
              {activeTargets.map(t => (
                <div key={t.target_id} className="glass-card p-4">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <p className="text-sm font-semibold text-foreground truncate flex-1">{t.product_name}{t.sub_area ? ` â€” ${t.sub_area}` : ''}</p>
                    <Badge variant="secondary" className="text-[10px] font-bold shrink-0">{t.pct}%</Badge>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden mb-2">
                    <div className={cn('h-full rounded-full transition-all', t.pct > 80 ? 'bg-emerald-500' : t.pct >= 50 ? 'bg-amber-500' : 'bg-destructive')} style={{ width: `${t.pct}%` }} />
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

      {/* Strike / Holiday Drawer */}
      <Drawer open={action !== null} onOpenChange={v => { if (!v) closeDrawer(); }}>
        <DrawerContent className="!mt-0 flex max-h-[85dvh] flex-col rounded-t-2xl border bg-background p-0 gap-0">
          <DrawerHeader className="shrink-0 border-b border-border/60 px-4 pb-3 pt-3">
            <DrawerTitle className="text-[15px] font-bold tracking-tight">
              {action === 'strike' && 'Mark Strike Day'}
              {action === 'holiday' && 'Mark Holiday'}
            </DrawerTitle>
          </DrawerHeader>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-6 pt-4 space-y-4">
            {action === 'strike' && (
              <>
                {todayStrike && (
                  <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                    <p className="text-sm text-amber-700 dark:text-amber-400 font-medium">Strike already marked for today</p>
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date</label>
                  <Input type="date" value={strikeDate} onChange={e => setStrikeDate(e.target.value)} className="touch-target rounded-lg" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Reason</label>
                  <Textarea value={strikeReason} onChange={e => setStrikeReason(e.target.value)} placeholder="Reason for strike day..." className="min-h-[80px] touch-target rounded-lg" />
                </div>
                <Button
                  variant="destructive"
                  className="w-full touch-target rounded-xl font-bold h-12"
                  disabled={markStrike.isPending || !strikeDate}
                  onClick={() => setShowStrikeConfirm(true)}
                >
                  {markStrike.isPending ? 'Marking...' : 'Confirm Strike Day'}
                </Button>
                <p className="text-[11px] text-muted-foreground text-center">Strikes this year: <span className="font-bold text-destructive">{strikeCount}</span></p>
              </>
            )}
            {action === 'holiday' && (
              <>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date</label>
                  <Input type="date" value={holidayDate} onChange={e => setHolidayDate(e.target.value)} className="touch-target rounded-lg" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Reason / Holiday Name</label>
                  <Textarea value={holidayReason} onChange={e => setHolidayReason(e.target.value)} placeholder="Holiday name or reason..." className="min-h-[80px] touch-target rounded-lg" />
                </div>
                <Button
                  className="w-full touch-target rounded-xl font-bold h-12"
                  disabled={markHoliday.isPending || !holidayDate || !holidayReason.trim()}
                  onClick={() => {
                    void markHoliday.mutateAsync({
                      mrId: userId,
                      holidayDate,
                      reason: holidayReason.trim(),
                      createdBy: userId,
                    }).then(() => {
                      toast.success('Holiday marked');
                      closeDrawer();
                    }).catch(e => toast.error(e instanceof Error ? e.message : 'Failed to mark holiday'));
                  }}
                >
                  {markHoliday.isPending ? 'Saving...' : 'Mark Holiday'}
                </Button>
                <p className="text-[11px] text-muted-foreground text-center">Holidays this year: <span className="font-bold text-amber-600 dark:text-amber-400">{holidayCount}</span></p>

                {mrHolidays.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-border/50">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Your Holidays</p>
                    {mrHolidays.map(h => (
                      <div key={h.id} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                        <span className="text-sm font-medium text-foreground">{h.holiday?.name ?? 'Holiday'}</span>
                        <span className="text-xs text-muted-foreground">{h.holiday?.holiday_date ? formatDisplayDate(h.holiday.holiday_date) : ''}</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </DrawerContent>
      </Drawer>

      <ConfirmDialog
        open={showStrikeConfirm}
        onOpenChange={setShowStrikeConfirm}
        title="Confirm Strike Day"
        description={`Mark ${formatDisplayDate(strikeDate)} as a strike day? This action cannot be undone.`}
        onConfirm={() => {
          void markStrike.mutateAsync({
            mr_id: userId,
            strike_date: strikeDate,
            reason: strikeReason.trim() || undefined,
          }).then(() => {
            toast.success('Strike day marked');
            setShowStrikeConfirm(false);
            closeDrawer();
          }).catch(e => toast.error(e instanceof Error ? e.message : 'Failed'));
        }}
        confirmLabel={markStrike.isPending ? 'Marking...' : 'Yes, Mark Strike'}
        destructive
        confirmDisabled={markStrike.isPending}
      />

      <ProfileCompletionPrompt />

      <BottomNav role="mr" />
    </div>
  );
}
