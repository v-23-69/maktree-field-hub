import { useAuth } from '@/hooks/useAuth';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '@/components/shared/PageHeader';
import BottomNav from '@/components/shared/BottomNav';
import StatCard from '@/components/shared/StatCard';
import { Users, FileText, Stethoscope, Calendar, CalendarDays, Receipt, FilePlus, CheckCircle2, MapPinned, UserPlus, AlertTriangle, Lock, Zap, CalendarOff, History, Target, ClipboardList, Umbrella, Bell, Check, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useManagerMrs } from '@/hooks/useManagerTeam';
import { useMrSubAreaAccess, useSaveMrSubAreaAccess } from '@/hooks/useAdminMrAccess';
import { useMrSubAreas } from '@/hooks/useAreas';
import { useAllAreas } from '@/hooks/useAreas';
import { toast } from 'sonner';
import { useManagerDashboardStats, type ManagerStatsFilter } from '@/hooks/useDashboardStats';
import { useDashboardRefresh } from '@/hooks/useDashboardRefresh';
import TeamPendingDcrStrip from '@/components/manager/TeamPendingDcrStrip';
import ManagerTodayStatusCard from '@/components/manager/ManagerTodayStatusCard';
import DashboardRefreshButton from '@/components/shared/DashboardRefreshButton';
import StatCardSkeleton from '@/components/shared/StatCardSkeleton';
import { todayInputDate, formatDisplayDate, isSundayYmd } from '@/lib/dateUtils';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import { useTpStatus, useTodayTpPlan } from '@/hooks/useTourProgram';
import { useWorkingWithReportOptions } from '@/hooks/useManagers';
import { useTodayStrike, useMarkStrike, useStrikeCount } from '@/hooks/useStrike';
import { useMrHolidayCount, useMarkMrHoliday, useMrHolidays } from '@/hooks/useHolidays';
import { useAllowedReportDates } from '@/hooks/useReport';
import MarkSundayDcrButton from '@/components/shared/MarkSundayDcrButton';
import { usePreventAccidentalBack } from '@/hooks/usePreventAccidentalBack';
import { useManagerPendingRequestsCount } from '@/hooks/useManagerPendingRequestsCount';
import { useExpenseReport } from '@/hooks/useExpense';
import DashboardBirthdaySlot from '@/components/shared/employee-birthday/DashboardBirthdaySlot';

const FILTERS = ['Today', 'This Week', 'This Month'] as const satisfies readonly ManagerStatsFilter[];
type QuickAction = 'assign-self' | 'strike' | 'holiday' | null

export default function ManagerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  usePreventAccidentalBack(true);
  const [activeFilter, setActiveFilter] = useState<typeof FILTERS[number]>('Today');
  const [action, setAction] = useState<QuickAction>(null);

  const [deferReady, setDeferReady] = useState(false);
  useEffect(() => { const t = setTimeout(() => setDeferReady(true), 100); return () => clearTimeout(t); }, []);

  // Critical queries
  const { data: mrs = [] } = useManagerMrs(user?.id ?? '');
  const { data: tpStatus, isLoading: tpStatusLoading } = useTpStatus(user?.id ?? '');
  const { data: todayPlan } = useTodayTpPlan(user?.id ?? '');
  const { data: mgrSelfSubAreas = [] } = useMrSubAreas(user?.id ?? '');
  const { data: workingWithOptions = [] } = useWorkingWithReportOptions(user?.id, user?.role);

  // Deferred queries
  const mrIds = useMemo(() => mrs.map(m => m.id), [mrs]);
  const { data: stats, isLoading: statsLoading } = useManagerDashboardStats(
    deferReady ? (user?.id ?? '') : '',
    deferReady ? mrIds : [],
    activeFilter,
  );
  const { refresh: refreshDashboard } = useDashboardRefresh(!!user?.id);
  const { data: areas = [] } = useAllAreas();
  const saveMrSubAreaAccess = useSaveMrSubAreaAccess();

  const nameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const o of workingWithOptions) map.set(o.id, o.full_name);
    for (const mr of mrs) map.set(mr.id, mr.full_name);
    return map;
  }, [workingWithOptions, mrs]);

  const workingWithNames = useMemo(() => {
    if (!todayPlan?.working_with_ids?.length) return [];
    return todayPlan.working_with_ids.map(id => nameById.get(id) ?? id.slice(0, 8));
  }, [todayPlan, nameById]);

  const isPaused = user?.is_paused === true;
  const mgrTpApproved =
    !!tpStatus &&
    (tpStatus.current_month_tp_approved === true || tpStatus.current_month_tp_status === 'approved');
  const mgrDcrBlocked = !isPaused && !tpStatusLoading && !!tpStatus && !mgrTpApproved;
  const mgrHasSubAreaAccess =
    tpStatus?.has_sub_area_access === true ||
    (tpStatus?.has_sub_area_access === undefined && mgrSelfSubAreas.length > 0);
  const nextMonthDeadlineApproaching = tpStatus && !tpStatus.next_month_tp_exists && tpStatus.days_to_deadline <= 5 && tpStatus.days_to_deadline >= 0;
  const nextMonthOverdue = tpStatus?.is_overdue === true;
  const todayStr = formatDisplayDate(todayInputDate());

  const { data: todayStrike } = useTodayStrike(deferReady ? (user?.id ?? '') : '');
  const markStrike = useMarkStrike();
  const { data: strikeCount = 0 } = useStrikeCount(deferReady ? (user?.id ?? '') : '');
  const { data: holidayCount = 0 } = useMrHolidayCount(deferReady ? (user?.id ?? '') : '');
  const markHoliday = useMarkMrHoliday();
  const { data: mgrHolidays = [] } = useMrHolidays(deferReady ? (user?.id ?? '') : '');

  const { data: mgrAllowedDates = [] } = useAllowedReportDates(user?.id ?? '');
  const mgrTodayDate = todayInputDate();
  const mgrTodayIsSunday = isSundayYmd(mgrTodayDate);
  const mgrTodayDcrDone = mgrAllowedDates.find(d => d.report_date === mgrTodayDate)?.already_submitted === true;
  const showMgrSundayDcr = mgrTodayIsSunday && !mgrTodayDcrDone;
  const pendingMgrRequests = useManagerPendingRequestsCount(user?.id ?? '');
  const [strikeDate, setStrikeDate] = useState(todayInputDate());
  const [strikeReason, setStrikeReason] = useState('');
  const [showStrikeConfirm, setShowStrikeConfirm] = useState(false);
  const [holidayDate, setHolidayDate] = useState(todayInputDate());
  const [holidayReason, setHolidayReason] = useState('');

  const [selfPickAreaId, setSelfPickAreaId] = useState('');
  const [selfSelectedSubAreas, setSelfSelectedSubAreas] = useState<Set<string>>(new Set());
  const { data: selfServerAccess = [] } = useMrSubAreaAccess(
    action === 'assign-self' ? (user?.id ?? '') : '',
  );
  const selfServerSet = useMemo(() => new Set(selfServerAccess), [selfServerAccess]);

  const allSubAreas = useMemo(
    () =>
      areas.flatMap(a =>
        (a.sub_areas ?? []).map(sa => ({
          ...sa,
          areaId: a.id,
          areaName: a.name,
        })),
      ),
    [areas],
  );

  const selfSubAreasFiltered = useMemo(
    () =>
      selfPickAreaId ? allSubAreas.filter(sa => sa.areaId === selfPickAreaId) : allSubAreas,
    [allSubAreas, selfPickAreaId],
  );

  const toggleSelfSubArea = (id: string) => {
    setSelfSelectedSubAreas(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  useEffect(() => {
    if (action !== 'assign-self' || !user?.id) return;
    setSelfSelectedSubAreas(new Set(selfServerAccess));
  }, [action, user?.id, selfServerAccess]);

  const selectAllSelfFiltered = () => {
    setSelfSelectedSubAreas(prev => {
      const next = new Set(prev);
      for (const sa of selfSubAreasFiltered) next.add(sa.id);
      return next;
    });
  };

  const today = todayInputDate()

  const { data: mgrTodayExpenseReport } = useExpenseReport(deferReady ? (user?.id ?? '') : '', today);
  const mgrTodayExpenseDone = mgrTodayExpenseReport?.status === 'submitted';

  const closeDrawer = () => {
    setAction(null);
    setSelfPickAreaId('');
    setSelfSelectedSubAreas(new Set());
    setStrikeDate(todayInputDate());
    setStrikeReason('');
    setHolidayDate(todayInputDate());
    setHolidayReason('');
  };

  if (isPaused) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <PageHeader title="Manager Dashboard" />
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
              <li>Contact your Admin to unpause your account</li>
              <li>Create your Tour Program immediately after unpausing</li>
            </ul>
          </div>
        </div>
        <BottomNav role="manager" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader title="Manager Dashboard" />

      <div className="px-4 md:px-6 py-5 space-y-5 max-w-lg md:max-w-2xl lg:max-w-4xl mx-auto">
        <DashboardBirthdaySlot />

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
              <p className="text-xs text-muted-foreground font-medium mt-0.5">
                {mrs.length} MR{mrs.length !== 1 ? 's' : ''} in your team
              </p>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <Button
              type="button"
              className="flex-1 rounded-xl h-10 text-sm font-semibold"
              onClick={() => navigate('/manager/team')}
            >
              <Users className="h-4 w-4 mr-2 inline-block align-middle" />
              Manage team MRs
            </Button>
            <DashboardRefreshButton onRefresh={refreshDashboard} />
          </div>
        </div>

        {!mgrHasSubAreaAccess && !!user?.id && (
          <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 px-4 py-3 text-sm">
            <p className="font-semibold text-foreground">We are setting up the portal for you</p>
            <p className="text-xs text-muted-foreground mt-1">
              Assign at least one area to yourself (Quick Actions → Assign Self), then create your tour program. Until then, your own DCR stays closed. Use Team in the bottom nav to manage MRs.
            </p>
          </div>
        )}

        {mgrDcrBlocked && (
          <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 px-4 py-3 text-sm">
            <p className="font-semibold text-foreground">Your own DCR is paused until your tour program is approved</p>
            <p className="text-xs text-muted-foreground mt-1">
              Complete and submit your tour program (managers are auto-approved). Open Team from the bottom nav to manage your MRs.
            </p>
            <Button size="sm" variant="outline" className="mt-2 h-8 text-xs rounded-lg" onClick={() => navigate('/manager/tour-program')}>
              Open tour program
            </Button>
          </div>
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
            <Button size="sm" variant={nextMonthOverdue ? 'destructive' : 'outline'} className="shrink-0 text-xs rounded-xl" onClick={() => navigate('/manager/tour-program')}>
              Create TP
            </Button>
          </div>
        )}

        {showMgrSundayDcr && (
          <div className="rounded-2xl border border-sky-500/35 bg-sky-500/10 p-4 space-y-3">
            <div className="flex items-start gap-2">
              <Calendar className="h-5 w-5 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-foreground">Today is Sunday (IST)</p>
                <p className="text-xs text-muted-foreground mt-0.5">Submit Sunday DCR if you had no field visits.</p>
              </div>
            </div>
            <MarkSundayDcrButton reportDate={mgrTodayDate} className="w-full rounded-2xl h-12 text-sm" />
          </div>
        )}

        {/* Today's Plan from TP */}
        {todayPlan && todayPlan.sub_area_id && (
          <div className="rounded-2xl bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-background border border-emerald-500/15 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-foreground">Today's Plan</p>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full font-semibold">From TP</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Area</span>
                <p className="text-sm font-semibold text-foreground">{todayPlan.sub_area_name}</p>
                <p className="text-[11px] text-muted-foreground">{todayPlan.area_name}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Working With</span>
                {workingWithNames.length > 0 ? (
                  <div className="flex flex-wrap gap-1">{workingWithNames.map((name, i) => (
                    <span key={i} className="text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">{name}</span>
                  ))}</div>
                ) : <p className="text-sm font-semibold text-foreground">Solo</p>}
              </div>
            </div>
            {mgrTodayDcrDone ? (
              <div className="flex items-center gap-2 rounded-xl bg-emerald-600/10 border border-emerald-600/20 px-4 py-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Today's DCR Submitted</p>
              </div>
            ) : mgrDcrBlocked ? (
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-xs text-muted-foreground">
                Complete your approved tour program before starting today&apos;s DCR.
              </div>
            ) : mgrTodayIsSunday ? null : (
              <Button
                onClick={() => navigate('/manager/report/new')}
                className="w-full rounded-2xl h-11 text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <FilePlus className="mr-2 h-4 w-4" /> Start Today's DCR
              </Button>
            )}
          </div>
        )}

        {deferReady && user?.id && <TeamPendingDcrStrip managerId={user.id} />}

        <ManagerTodayStatusCard
          dcrDone={mgrTodayDcrDone}
          dcrBlocked={mgrDcrBlocked}
          expenseDone={mgrTodayExpenseDone}
          expenseDraft={!!mgrTodayExpenseReport?.id && !mgrTodayExpenseDone}
          todayIsSunday={mgrTodayIsSunday}
        />

        <div className="space-y-2">
          <p className="section-title">Team stats (IST)</p>
          <div className="flex gap-1.5 flex-wrap">
            {FILTERS.map(f => (
              <button
                key={f}
                type="button"
                onClick={() => setActiveFilter(f)}
                className={cn(
                  'text-[11px] font-semibold px-3 py-1.5 rounded-full border transition-all',
                  activeFilter === f
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card text-muted-foreground border-border',
                )}
              >
                {f}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground">Counts are for your team MRs only.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard icon={Users} value={mrs.length} label="Total MRs" color="primary" />
          {statsLoading ? (
            <>
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </>
          ) : (
            <>
              <StatCard
                icon={FileText}
                value={stats?.reportCount ?? 0}
                label={
                  activeFilter === 'Today'
                    ? 'Team reports today'
                    : activeFilter === 'This Week'
                      ? 'Team reports this week'
                      : 'Team reports this month'
                }
                color="emerald"
              />
              <StatCard
                icon={Stethoscope}
                value={stats?.doctorCount ?? 0}
                label={
                  activeFilter === 'Today'
                    ? 'Doctors visited today'
                    : activeFilter === 'This Week'
                      ? 'Doctors this week'
                      : 'Doctors this month'
                }
                color="amber"
              />
              <StatCard icon={Calendar} value={stats?.reportCount ?? 0} label={`Period · ${activeFilter}`} color="blue" />
            </>
          )}
        </div>


        {/* Self Report CTA */}
        {!mgrTodayDcrDone && !mgrTodayIsSunday && (
          mgrDcrBlocked ? (
            <Button
              type="button"
              variant="secondary"
              className="w-full touch-target rounded-2xl h-12 text-sm font-semibold"
              onClick={() => toast.message('Complete your tour program', { description: 'Open Tour Plan, fill the month, and submit. Your TP is auto-approved as a manager.' })}
            >
              <Lock className="mr-2 h-5 w-5" />
              DCR locked until tour program is ready
            </Button>
          ) : (
            <Button
              onClick={() => navigate('/manager/report/new')}
              className="w-full touch-target rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 h-12 text-sm font-bold shadow-lg shadow-primary/20 active:scale-[0.97] transition-all"
            >
              <FilePlus className="mr-2 h-5 w-5" />
              Create Daily Report
            </Button>
          )
        )}

        {/* Quick Actions — frequently used */}
        <div className="space-y-3">
          <p className="section-title">Quick Actions</p>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-8 gap-2.5">
            <button type="button" onClick={() => navigate('/manager/requests')} className="relative flex flex-col items-center gap-1.5 glass-card p-3 active:scale-95 transition-all">
              <div className="h-9 w-9 rounded-xl bg-rose-500/10 flex items-center justify-center"><Bell className="h-4 w-4 text-rose-600 dark:text-rose-400" /></div>
              <span className="text-[10px] font-semibold text-foreground text-center leading-tight">Requests</span>
              {pendingMgrRequests > 0 && (
                <span className="absolute top-1.5 right-2 min-w-[16px] h-4 px-1 rounded-full bg-destructive text-white text-[9px] font-bold flex items-center justify-center">
                  {pendingMgrRequests > 99 ? '99+' : pendingMgrRequests}
                </span>
              )}
            </button>
            <button type="button" onClick={() => navigate('/manager/tour-program')} className="flex flex-col items-center gap-1.5 glass-card p-3 active:scale-95 transition-all">
              <div className="h-9 w-9 rounded-xl bg-blue-500/10 flex items-center justify-center"><CalendarDays className="h-4 w-4 text-blue-600 dark:text-blue-400" /></div>
              <span className="text-[10px] font-semibold text-foreground text-center leading-tight">Tour Plan</span>
            </button>
            <button type="button" onClick={() => navigate('/manager/territories')} className="flex flex-col items-center gap-1.5 glass-card p-3 active:scale-95 transition-all">
              <div className="h-9 w-9 rounded-xl bg-indigo-500/10 flex items-center justify-center"><MapPinned className="h-4 w-4 text-indigo-600 dark:text-indigo-400" /></div>
              <span className="text-[10px] font-semibold text-foreground text-center leading-tight">Territories</span>
            </button>
            <button type="button" onClick={() => navigate('/manager/expense')} className="flex flex-col items-center gap-1.5 glass-card p-3 active:scale-95 transition-all">
              <div className="h-9 w-9 rounded-xl bg-emerald-500/10 flex items-center justify-center"><Receipt className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /></div>
              <span className="text-[10px] font-semibold text-foreground text-center leading-tight">Expense</span>
            </button>
            <button type="button" onClick={() => setAction('strike')} className="flex flex-col items-center gap-1.5 glass-card p-3 active:scale-95 transition-all border border-destructive/15">
              <div className="h-9 w-9 rounded-xl bg-destructive/10 flex items-center justify-center"><Zap className="h-4 w-4 text-destructive" /></div>
              <span className="text-[10px] font-semibold text-destructive text-center leading-tight">Strike</span>
            </button>
            <button type="button" onClick={() => setAction('holiday')} className="flex flex-col items-center gap-1.5 glass-card p-3 active:scale-95 transition-all">
              <div className="h-9 w-9 rounded-xl bg-amber-500/10 flex items-center justify-center"><CalendarOff className="h-4 w-4 text-amber-600 dark:text-amber-400" /></div>
              <span className="text-[10px] font-semibold text-foreground text-center leading-tight">Holiday</span>
            </button>
            <button type="button" onClick={() => navigate('/manager/holidays')} className="flex flex-col items-center gap-1.5 glass-card p-3 active:scale-95 transition-all">
              <div className="h-9 w-9 rounded-xl bg-amber-500/10 flex items-center justify-center"><Calendar className="h-4 w-4 text-amber-600 dark:text-amber-400" /></div>
              <span className="text-[10px] font-semibold text-foreground text-center leading-tight">Manage Holidays</span>
            </button>
            <button type="button" onClick={() => navigate('/manager/targets')} className="flex flex-col items-center gap-1.5 glass-card p-3 active:scale-95 transition-all">
              <div className="h-9 w-9 rounded-xl bg-violet-500/10 flex items-center justify-center"><Target className="h-4 w-4 text-violet-600 dark:text-violet-400" /></div>
              <span className="text-[10px] font-semibold text-foreground text-center leading-tight">Targets</span>
            </button>
            <button type="button" onClick={() => navigate('/manager/leaves')} className="flex flex-col items-center gap-1.5 glass-card p-3 active:scale-95 transition-all">
              <div className="h-9 w-9 rounded-xl bg-sky-500/10 flex items-center justify-center"><ClipboardList className="h-4 w-4 text-sky-600 dark:text-sky-400" /></div>
              <span className="text-[10px] font-semibold text-foreground text-center leading-tight">Leaves</span>
            </button>
            <button type="button" onClick={() => navigate('/manager/my-leave')} className="flex flex-col items-center gap-1.5 glass-card p-3 active:scale-95 transition-all">
              <div className="h-9 w-9 rounded-xl bg-teal-500/10 flex items-center justify-center"><Umbrella className="h-4 w-4 text-teal-600 dark:text-teal-400" /></div>
              <span className="text-[10px] font-semibold text-foreground text-center leading-tight">My leave</span>
            </button>
            <button type="button" onClick={() => navigate('/manager/team')} className="flex flex-col items-center gap-1.5 glass-card p-3 active:scale-95 transition-all">
              <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center"><Users className="h-4 w-4 text-primary" /></div>
              <span className="text-[10px] font-semibold text-foreground text-center leading-tight">Team hub</span>
            </button>
            <button type="button" onClick={() => setAction('assign-self')} className="flex flex-col items-center gap-1.5 glass-card p-3 active:scale-95 transition-all">
              <div className="h-9 w-9 rounded-xl bg-primary/8 flex items-center justify-center"><UserPlus className="h-4 w-4 text-primary" /></div>
              <span className="text-[10px] font-semibold text-foreground text-center leading-tight">Assign Self</span>
            </button>
            <button type="button" onClick={() => navigate('/manager/report/history')} className="flex flex-col items-center gap-1.5 glass-card p-3 active:scale-95 transition-all">
              <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center"><History className="h-4 w-4 text-primary" /></div>
              <span className="text-[10px] font-semibold text-foreground text-center leading-tight">My DCR history</span>
            </button>
          </div>
        </div>

      </div>

      <Drawer open={action !== null} onOpenChange={v => { if (!v) closeDrawer(); }}>
        <DrawerContent className="!mt-0 flex h-[100dvh] max-h-[100dvh] flex-col rounded-t-2xl border bg-background p-0 gap-0">
          <DrawerHeader className="shrink-0 border-b border-border/60 px-4 pb-3 pt-3">
            <DrawerTitle className="text-[15px] font-bold tracking-tight">
              {action === 'assign-self' && 'Assign Area to Self'}
              {action === 'strike' && 'Mark Strike Day'}
              {action === 'holiday' && 'Mark Holiday'}
            </DrawerTitle>
          </DrawerHeader>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-6 pt-4 space-y-4">
            {action === 'assign-self' && (
              <>
                <div className="space-y-2">
                  <Label className="text-xs">Territory filter</Label>
                  <select
                    value={selfPickAreaId}
                    onChange={e => setSelfPickAreaId(e.target.value)}
                    className="flex h-11 w-full rounded-lg border border-input bg-background px-3 text-sm touch-target"
                  >
                    <option value="">All Territories</option>
                    {areas.map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Label className="text-xs">Areas (select to assign or remove)</Label>
                    {selfSubAreasFiltered.length > 0 && (
                      <button
                        type="button"
                        onClick={selectAllSelfFiltered}
                        className="text-[10px] font-semibold text-primary shrink-0"
                      >
                        Select all
                      </button>
                    )}
                  </div>
                  <div className="max-h-52 overflow-y-auto space-y-2 rounded-lg border border-border p-2">
                    {selfSubAreasFiltered.length === 0 ? (
                      <p className="text-xs text-muted-foreground px-1">No areas in this territory.</p>
                    ) : (
                      selfSubAreasFiltered.map(sa => (
                        <label key={sa.id} className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={selfSelectedSubAreas.has(sa.id)}
                            onChange={() => toggleSelfSubArea(sa.id)}
                          />
                          <span className="flex-1">{sa.areaName} — {sa.name}</span>
                          {selfServerSet.has(sa.id) && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 shrink-0">
                              <Check className="h-3 w-3" />
                              Assigned
                            </span>
                          )}
                        </label>
                      ))
                    )}
                  </div>
                </div>
                <Button
                  type="button"
                  disabled={saveMrSubAreaAccess.isPending}
                  className="w-full touch-target rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
                  onClick={() => {
                    if (!user?.id) {
                      toast.error('Not signed in')
                      return
                    }
                    void saveMrSubAreaAccess
                      .mutateAsync({ mrId: user.id, subAreaIds: [...selfSelectedSubAreas] })
                      .then(() => {
                        toast.success('Area assignments saved')
                        closeDrawer()
                      })
                      .catch(e => toast.error(e instanceof Error ? e.message : 'Could not save assignments'))
                  }}
                >
                  {saveMrSubAreaAccess.isPending ? 'Saving…' : 'Save assignments'}
                </Button>
              </>
            )}

            {action === 'strike' && (
              <>
                {todayStrike && (
                  <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                    <p className="text-sm text-amber-700 dark:text-amber-400 font-medium">Strike already marked for today</p>
                  </div>
                )}
                <div className="space-y-2">
                  <Label className="text-xs">Date</Label>
                  <Input type="date" value={strikeDate} onChange={e => setStrikeDate(e.target.value)} className="touch-target rounded-lg" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Reason</Label>
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
                  <Label className="text-xs">Date</Label>
                  <Input type="date" value={holidayDate} onChange={e => setHolidayDate(e.target.value)} className="touch-target rounded-lg" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Reason / Holiday Name</Label>
                  <Textarea value={holidayReason} onChange={e => setHolidayReason(e.target.value)} placeholder="Holiday name or reason..." className="min-h-[80px] touch-target rounded-lg" />
                </div>
                <Button
                  className="w-full touch-target rounded-xl font-bold h-12"
                  disabled={markHoliday.isPending || !holidayDate || !holidayReason.trim()}
                  onClick={() => {
                    void markHoliday.mutateAsync({
                      mrId: user?.id ?? '',
                      holidayDate,
                      reason: holidayReason.trim(),
                      createdBy: user?.id ?? '',
                    }).then(() => {
                      toast.success('Holiday marked');
                      closeDrawer();
                    }).catch(e => toast.error(e instanceof Error ? e.message : 'Failed'));
                  }}
                >
                  {markHoliday.isPending ? 'Saving...' : 'Mark Holiday'}
                </Button>
                <div className="flex gap-2 pt-2">
                  <div className="flex-1 rounded-xl bg-muted/50 px-3 py-2 flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground font-medium">Strikes</span>
                    <span className="text-sm font-bold text-destructive tabular-nums">{strikeCount}</span>
                  </div>
                  <div className="flex-1 rounded-xl bg-muted/50 px-3 py-2 flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground font-medium">Holidays</span>
                    <span className="text-sm font-bold text-amber-600 dark:text-amber-400 tabular-nums">{holidayCount}</span>
                  </div>
                </div>
                {mgrHolidays.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-border/50">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Your Holidays</p>
                    {mgrHolidays.map(h => (
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
            mr_id: user?.id ?? '',
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

      <BottomNav role="manager" />
    </div>
  );
}
