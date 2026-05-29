import { useAuth } from '@/hooks/useAuth';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '@/components/shared/PageHeader';
import BottomNav from '@/components/shared/BottomNav';
import { Calendar, CalendarDays, Receipt, FileText, CheckCircle2, MapPinned, UserPlus, AlertTriangle, Lock, Zap, CalendarOff, Target, ClipboardList, Umbrella, Users, Check, Tablet, Store } from 'lucide-react';
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
import ManagerTeamDcrToday from '@/components/manager/ManagerTeamDcrToday';
import { ManagerQuickAction, managerQuickActionGridClass } from '@/components/manager/ManagerQuickAction';
import DashboardTodayCard from '@/components/shared/DashboardTodayCard';
import { todayInputDate, formatDisplayDate, isSundayYmd } from '@/lib/dateUtils';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import { useTpStatus, useTodayTpPlan } from '@/hooks/useTourProgram';
import { useTodayStrike, useMarkStrike, useStrikeCount } from '@/hooks/useStrike';
import { useMrHolidayCount, useMarkMrHoliday, useMrHolidays } from '@/hooks/useHolidays';
import { useAllowedReportDates } from '@/hooks/useReport';
import MarkSundayDcrButton from '@/components/shared/MarkSundayDcrButton';
import { usePreventAccidentalBack } from '@/hooks/usePreventAccidentalBack';
import { useExpenseReport } from '@/hooks/useExpense';
import { usePendingDcrImports } from '@/hooks/useDcrImport';
import type { AllowedReportDate } from '@/types/database.types';
import DashboardBirthdaySlot from '@/components/shared/employee-birthday/DashboardBirthdaySlot';
import DashboardStatLinkCards from '@/components/dashboard/dashboard-stat-link-cards';
import { ActionToolbar } from '@/components/ui/action-toolbar';
import { MANAGER_FILTER_OPTIONS } from '@/lib/dashboardDateRange';
import { DashboardSection, dashboardPageClass, dashboardPanelClass } from '@/components/dashboard/dashboard-shell';
import { useCreateStockist } from '@/hooks/useStockists';

type QuickAction = 'assign-self' | 'strike' | 'holiday' | 'add-stockist' | null

export default function ManagerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  usePreventAccidentalBack(true);
  const [activeFilter, setActiveFilter] = useState<ManagerStatsFilter>('This Week');
  const [action, setAction] = useState<QuickAction>(null);

  const [deferReady, setDeferReady] = useState(false);
  useEffect(() => { const t = setTimeout(() => setDeferReady(true), 250); return () => clearTimeout(t); }, []);

  // Critical queries
  const { data: mrs = [] } = useManagerMrs(user?.id ?? '');
  const { data: tpStatus, isLoading: tpStatusLoading } = useTpStatus(user?.id ?? '');
  const { data: todayPlan } = useTodayTpPlan(user?.id ?? '');
  const { data: mgrSelfSubAreas = [] } = useMrSubAreas(user?.id ?? '');
  // Deferred queries
  const mrIds = useMemo(() => mrs.map(m => m.id), [mrs]);
  const teamMemberIds = useMemo(() => {
    const id = user?.id ?? '';
    if (!id) return mrIds;
    return mrIds.includes(id) ? mrIds : [id, ...mrIds];
  }, [mrs, user?.id, mrIds]);
  const { data: teamActivity, isLoading: statsLoading } = useManagerDashboardStats(
    deferReady ? (user?.id ?? '') : '',
    deferReady ? teamMemberIds : [],
    activeFilter,
    user?.full_name ?? 'Manager',
    mrs,
  );
  useDashboardRefresh(!!user?.id);
  const { data: areas = [] } = useAllAreas();
  const saveMrSubAreaAccess = useSaveMrSubAreaAccess();

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
  const mgrPendingAllDcrs = useMemo(
    () =>
      mgrAllowedDates
        .filter(d => !d.already_submitted)
        .sort((a, b) => a.report_date.localeCompare(b.report_date)),
    [mgrAllowedDates],
  );
  const { data: pendingImports = [] } = usePendingDcrImports(deferReady ? (user?.id ?? '') : '');
  const todayImport = pendingImports.find(p => p.report_date === mgrTodayDate);
  const showMgrSundayDcr = mgrTodayIsSunday && !mgrTodayDcrDone;
  const [strikeDate, setStrikeDate] = useState(todayInputDate());
  const [strikeReason, setStrikeReason] = useState('');
  const [showStrikeConfirm, setShowStrikeConfirm] = useState(false);
  const [holidayDate, setHolidayDate] = useState(todayInputDate());
  const [holidayReason, setHolidayReason] = useState('');
  const [stockistAreaId, setStockistAreaId] = useState('');
  const [stockistName, setStockistName] = useState('');
  const createStockist = useCreateStockist();

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

  const managerStatItems = useMemo(() => {
    const reports = teamActivity?.reportCount ?? 0
    const doctors = teamActivity?.doctorCount ?? 0
    return [
      {
        name:
          activeFilter === 'This Week'
            ? 'DCRs this week'
            : activeFilter === 'This Year'
              ? 'DCRs this year'
              : 'DCRs this month',
        value: reports,
        href: '/manager/reports',
        linkLabel: 'View reports →',
      },
      {
        name: 'Doctors met',
        value: doctors,
        href: '/manager/analytics',
        linkLabel: 'Analytics →',
      },
      {
        name: 'Team MRs',
        value: mrs.length,
        href: '/manager/team',
        linkLabel: 'Manage team →',
      },
    ]
  }, [teamActivity?.reportCount, teamActivity?.doctorCount, mrs.length, activeFilter])

  const { data: mgrTodayExpenseReport } = useExpenseReport(deferReady ? (user?.id ?? '') : '', today);
  const mgrTodayExpenseDone = mgrTodayExpenseReport?.status === 'submitted';

  const mgrOpenDcr = () => {
    if (mgrDcrBlocked) return;
    if (todayImport) navigate(`/manager/dcr-import/${todayImport.import_id}`);
    else navigate('/manager/report/new');
  };

  const mgrOpenFieldReport = (d: AllowedReportDate) => {
    const reportKind = d.day_type === 'leave' ? ('leave' as const) : ('field' as const);
    navigate('/manager/report/new', { state: { date: d.report_date, reportKind } });
  };

  const closeDrawer = () => {
    setAction(null);
    setSelfPickAreaId('');
    setSelfSelectedSubAreas(new Set());
    setStrikeDate(todayInputDate());
    setStrikeReason('');
    setHolidayDate(todayInputDate());
    setHolidayReason('');
    setStockistAreaId('');
    setStockistName('');
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
          <div className={cn(dashboardPanelClass(), 'p-4 text-left space-y-2')}>
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

      <div className={cn(dashboardPageClass(), 'max-md:flex max-md:flex-col')}>
        <DashboardBirthdaySlot className="max-md:order-[5]" />

        {/* Welcome hero */}
        <div className={cn(dashboardPanelClass(), 'bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/15 p-5 animate-fade-in-up max-md:order-[10]')}>
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
        </div>

        {!mgrHasSubAreaAccess && !!user?.id && (
          <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 px-4 py-3 text-sm max-md:order-[11]">
            <p className="font-semibold text-foreground">We are setting up the portal for you</p>
            <p className="text-xs text-muted-foreground mt-1">
              Assign at least one area to yourself (Quick Actions → Assign Self), then create your tour program. Until then, your own DCR stays closed. Use Team in the bottom nav to manage MRs.
            </p>
          </div>
        )}

        {mgrDcrBlocked && (
          <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 px-4 py-3 text-sm max-md:order-[12]">
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
            'rounded-2xl p-4 max-md:p-3 flex items-start gap-3 max-md:gap-2 border max-md:order-[15]',
            nextMonthOverdue ? 'border-destructive/30 bg-destructive/5' : 'border-amber-500/30 bg-amber-500/5'
          )}>
            <AlertTriangle className={cn('h-5 w-5 max-md:h-4 max-md:w-4 shrink-0 mt-0.5', nextMonthOverdue ? 'text-destructive' : 'text-amber-600 dark:text-amber-400')} />
            <div className="flex-1 min-w-0">
              <p className="text-sm max-md:text-xs font-semibold text-foreground">
                {nextMonthOverdue ? 'Tour Program Overdue!' : `TP Deadline in ${tpStatus!.days_to_deadline} day(s)`}
              </p>
              <p className="text-xs max-md:text-[10px] text-muted-foreground mt-0.5 max-md:leading-snug">
                Create next month's Tour Program to avoid account pause.
              </p>
            </div>
            <Button size="sm" variant={nextMonthOverdue ? 'destructive' : 'outline'} className="shrink-0 text-xs max-md:text-[10px] max-md:h-7 max-md:px-2 rounded-xl" onClick={() => navigate('/manager/tour-program')}>
              Create TP
            </Button>
          </div>
        )}

        {showMgrSundayDcr && (
          <div className="rounded-2xl border border-sky-500/35 bg-sky-500/10 p-4 space-y-3 max-md:order-[55]">
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

        {deferReady && mgrHasSubAreaAccess && mgrTpApproved && user?.id && (
          <div className="space-y-2.5 max-md:order-[20]">
            <DashboardTodayCard
              subAreaName={todayPlan?.sub_area_name ?? ''}
              areaName={todayPlan?.area_name ?? ''}
              dcrDone={mgrTodayDcrDone}
              dcrBlocked={mgrDcrBlocked}
              expenseDone={mgrTodayExpenseDone}
              expenseDraft={!!mgrTodayExpenseReport?.id && !mgrTodayExpenseDone}
              todayIsSunday={mgrTodayIsSunday}
              pendingDcrs={mgrPendingAllDcrs}
              dcrImports={pendingImports}
              expenseHref="/manager/expense"
              reportHref="/manager/report/new"
              onStartDcr={() => navigate('/manager/report/new')}
              onOpenDcr={mgrOpenDcr}
              onOpenPendingDcr={mgrOpenFieldReport}
              onOpenImport={id => navigate(`/manager/dcr-import/${id}`)}
            />
            <ManagerTeamDcrToday managerId={user.id} />
          </div>
        )}

        {deferReady && teamMemberIds.length > 0 && (
          <DashboardSection
            title="Overview"
            description="Team performance for the selected period"
            className="max-md:order-[30]"
          >
            <ActionToolbar
              className="w-full"
              activeId={activeFilter}
              onActiveChange={id => setActiveFilter(id as ManagerStatsFilter)}
              buttons={MANAGER_FILTER_OPTIONS.map(opt => ({
                id: opt.id,
                label: opt.label,
              }))}
            />
            {!statsLoading && (
              <DashboardStatLinkCards items={managerStatItems} columns={3} />
            )}
          </DashboardSection>
        )}

        <DashboardSection title="Quick actions" className="max-md:order-[35]">
          <div className={managerQuickActionGridClass}>
            <ManagerQuickAction
              label="Add MR"
              iconClassName="bg-sky-500/10"
              onClick={() => navigate('/manager/team', { state: { openManage: 'create-mr' } })}
              icon={<Users className="h-4 w-4 md:h-5 md:w-5 text-sky-600 dark:text-sky-400" />}
            />
            <ManagerQuickAction
              label="Tour Plan"
              iconClassName="bg-blue-500/10"
              onClick={() => navigate('/manager/tour-program')}
              icon={<CalendarDays className="h-4 w-4 md:h-5 md:w-5 text-blue-600 dark:text-blue-400" />}
            />
            <ManagerQuickAction
              label="Vacant areas"
              iconClassName="bg-indigo-500/10"
              onClick={() => navigate('/manager/vacant-areas')}
              icon={<MapPinned className="h-4 w-4 md:h-5 md:w-5 text-indigo-600 dark:text-indigo-400" />}
            />
            <ManagerQuickAction
              label="Assign areas"
              iconClassName="bg-slate-500/10"
              onClick={() => navigate('/manager/territories')}
              icon={<MapPinned className="h-4 w-4 md:h-5 md:w-5 text-slate-600 dark:text-slate-400" />}
            />
            <ManagerQuickAction
              label="Assign MR"
              iconClassName="bg-violet-500/10"
              onClick={() => navigate('/manager/territories')}
              icon={<Users className="h-4 w-4 md:h-5 md:w-5 text-violet-600 dark:text-violet-400" />}
            />
            <ManagerQuickAction
              label="Expense"
              iconClassName="bg-emerald-500/10"
              onClick={() => navigate('/manager/expense')}
              icon={<Receipt className="h-4 w-4 md:h-5 md:w-5 text-emerald-600 dark:text-emerald-400" />}
            />
            <ManagerQuickAction
              label="Add stockist"
              iconClassName="bg-primary/10"
              onClick={() => setAction('add-stockist')}
              icon={<Store className="h-4 w-4 md:h-5 md:w-5 text-primary" />}
            />
            <ManagerQuickAction
              label="E detailing"
              iconClassName="bg-cyan-500/10"
              comingSoon
              icon={<Tablet className="h-4 w-4 md:h-5 md:w-5 text-cyan-600 dark:text-cyan-400" />}
            />
            <ManagerQuickAction
              label="Strike"
              iconClassName="bg-destructive/10"
              variant="destructive"
              onClick={() => setAction('strike')}
              icon={<Zap className="h-4 w-4 md:h-5 md:w-5 text-destructive" />}
            />
            <ManagerQuickAction
              label="Holiday"
              iconClassName="bg-amber-500/10"
              onClick={() => setAction('holiday')}
              icon={<CalendarOff className="h-4 w-4 md:h-5 md:w-5 text-amber-600 dark:text-amber-400" />}
            />
            <ManagerQuickAction
              label="Manage Holidays"
              iconClassName="bg-amber-500/10"
              onClick={() => navigate('/manager/holidays')}
              icon={<Calendar className="h-4 w-4 md:h-5 md:w-5 text-amber-600 dark:text-amber-400" />}
            />
            <ManagerQuickAction
              label="Targets"
              iconClassName="bg-violet-500/10"
              comingSoon
              icon={<Target className="h-4 w-4 md:h-5 md:w-5 text-violet-600 dark:text-violet-400" />}
            />
            <ManagerQuickAction
              label="Leaves"
              iconClassName="bg-sky-500/10"
              onClick={() => navigate('/manager/leaves')}
              icon={<ClipboardList className="h-4 w-4 md:h-5 md:w-5 text-sky-600 dark:text-sky-400" />}
            />
            <ManagerQuickAction
              label="My leave"
              iconClassName="bg-teal-500/10"
              onClick={() => navigate('/manager/my-leave')}
              icon={<Umbrella className="h-4 w-4 md:h-5 md:w-5 text-teal-600 dark:text-teal-400" />}
            />
            <ManagerQuickAction
              label="Assign Self"
              iconClassName="bg-primary/10"
              onClick={() => setAction('assign-self')}
              icon={<UserPlus className="h-4 w-4 md:h-5 md:w-5 text-primary" />}
            />
          </div>
        </DashboardSection>

      </div>

      <Drawer open={action !== null} onOpenChange={v => { if (!v) closeDrawer(); }}>
        <DrawerContent className="!mt-0 flex h-[100dvh] max-h-[100dvh] flex-col rounded-t-2xl border bg-background p-0 gap-0">
          <DrawerHeader className="shrink-0 border-b border-border/60 px-4 pb-3 pt-3">
            <DrawerTitle className="text-[15px] font-bold tracking-tight">
              {action === 'assign-self' && 'Assign Area to Self'}
              {action === 'strike' && 'Mark Strike Day'}
              {action === 'holiday' && 'Mark Holiday'}
              {action === 'add-stockist' && 'Add stockist'}
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

            {action === 'add-stockist' && (
              <>
                <div className="space-y-2">
                  <Label className="text-xs">HQ (Territory)</Label>
                  <select
                    value={stockistAreaId}
                    onChange={e => setStockistAreaId(e.target.value)}
                    className="flex h-11 w-full rounded-lg border border-input bg-background px-3 text-sm touch-target"
                  >
                    <option value="">Select HQ</option>
                    {areas.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Stockist name</Label>
                  <Input
                    value={stockistName}
                    onChange={e => setStockistName(e.target.value)}
                    placeholder="Enter stockist name"
                    className="rounded-xl"
                  />
                </div>

                <Button
                  className="w-full rounded-2xl h-12 text-sm font-bold"
                  disabled={!stockistAreaId || !stockistName.trim() || createStockist.isPending}
                  onClick={() => {
                    if (!stockistAreaId) {
                      toast.error('Select HQ')
                      return
                    }
                    const name = stockistName.trim()
                    if (!name) {
                      toast.error('Enter stockist name')
                      return
                    }
                    void createStockist
                      .mutateAsync({ areaId: stockistAreaId, name })
                      .then(() => {
                        toast.success('Stockist added')
                        closeDrawer()
                      })
                      .catch(e => toast.error(e instanceof Error ? e.message : 'Could not add stockist'))
                  }}
                >
                  {createStockist.isPending ? 'Saving…' : 'Save'}
                </Button>
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
