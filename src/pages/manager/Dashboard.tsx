import { useAuth } from '@/hooks/useAuth';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '@/components/shared/PageHeader';
import BottomNav from '@/components/shared/BottomNav';
import StatCard from '@/components/shared/StatCard';
import { Users, FileText, Stethoscope, Calendar, CalendarDays, Receipt, FilePlus, CheckCircle2, Plus, MapPin, MapPinned, UserPlus, UserMinus, UserCheck, IndianRupee, AlertTriangle, Lock, Play, Zap, CalendarOff, History, Target, ClipboardList, Umbrella, BarChart3, PiggyBank, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useManagerMrs } from '@/hooks/useManagerTeam';
import { useAddDoctor } from '@/hooks/useAdminDoctors';
import { useAddArea, useAddSubArea } from '@/hooks/useAdminAreasMutations';
import { useAssignSubAreasToMrBatch, useMrSubAreaAccess } from '@/hooks/useAdminMrAccess';
import { useCreateUser, useDeleteMrUser } from '@/hooks/useAdminUsers';
import { useAllAreas } from '@/hooks/useAreas';
import { toast } from 'sonner';
import { useProducts, useUpdateProductPtr } from '@/hooks/useProducts';
import { useManagerDashboardStats } from '@/hooks/useDashboardStats';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { todayInputDate, formatDisplayDate } from '@/lib/dateUtils';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import { useTpStatus, useTodayTpPlan, useUnpauseUser } from '@/hooks/useTourProgram';
import { useWorkingWithReportOptions } from '@/hooks/useManagers';
import { useTodayStrike, useMarkStrike, useStrikeCount } from '@/hooks/useStrike';
import { useMrHolidayCount, useMarkMrHoliday, useMrHolidays } from '@/hooks/useHolidays';
import { useAllowedReportDates, useMonthlySupportAggregateForManagerTeam } from '@/hooks/useReport';
import { useExpenseReport } from '@/hooks/useExpense';
import { useCallsAndSpecialityAnalytics, type PeriodPreset } from '@/hooks/useFieldActivityAnalytics';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const FILTERS = ['Today', 'This Week', 'This Month'] as const;
type QuickAction = 'doctor' | 'area' | 'subarea' | 'assign' | 'assign-self' | 'create-mr' | 'delete-mr' | 'set-ptr' | 'strike' | 'holiday' | null

export default function ManagerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<typeof FILTERS[number]>('Today');
  const [action, setAction] = useState<QuickAction>(null);
  const [teamCallPreset, setTeamCallPreset] = useState<PeriodPreset>('monthly');

  const [deferReady, setDeferReady] = useState(false);
  useEffect(() => { const t = setTimeout(() => setDeferReady(true), 100); return () => clearTimeout(t); }, []);

  // Critical queries
  const { data: mrs = [] } = useManagerMrs(user?.id ?? '');
  const { data: tpStatus, isLoading: tpStatusLoading } = useTpStatus(user?.id ?? '');
  const { data: todayPlan } = useTodayTpPlan(user?.id ?? '');
  const { data: workingWithOptions = [] } = useWorkingWithReportOptions(user?.id, user?.role);
  const unpauseUser = useUnpauseUser();

  // Deferred queries
  const mrIds = useMemo(() => mrs.map(m => m.id), [mrs]);
  const { data: stats } = useManagerDashboardStats(deferReady ? (user?.id ?? '') : '', deferReady ? mrIds : []);
  const { data: teamCallAnalytics } = useCallsAndSpecialityAnalytics(
    mrIds,
    teamCallPreset,
    todayInputDate(),
    deferReady && mrIds.length > 0,
  );
  const { data: areas = [] } = useAllAreas();
  const addDoctor = useAddDoctor();
  const addArea = useAddArea();
  const addSubArea = useAddSubArea();
  const assignSubAreasBatch = useAssignSubAreasToMrBatch();
  const createUser = useCreateUser();
  const deleteMr = useDeleteMrUser();
  const { data: allProducts = [] } = useProducts();
  const updatePtr = useUpdateProductPtr();

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
  const currentMonthTpMissing = tpStatus && !tpStatus.current_month_tp_exists;
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
  const mgrTodayDcrDone = mgrAllowedDates.find(d => d.report_date === todayInputDate())?.already_submitted === true;
  const teamMonthYyyyMm = todayInputDate().slice(0, 7);
  const { data: teamMonthlySupport } = useMonthlySupportAggregateForManagerTeam(
    deferReady ? (user?.id ?? '') : '',
    teamMonthYyyyMm,
  );

  const [strikeDate, setStrikeDate] = useState(todayInputDate());
  const [strikeReason, setStrikeReason] = useState('');
  const [showStrikeConfirm, setShowStrikeConfirm] = useState(false);
  const [holidayDate, setHolidayDate] = useState(todayInputDate());
  const [holidayReason, setHolidayReason] = useState('');

  const [doctorName, setDoctorName] = useState('');
  const [doctorSpec, setDoctorSpec] = useState('');
  const [doctorSubAreaId, setDoctorSubAreaId] = useState('');
  const [areaName, setAreaName] = useState('');
  const [subAreaName, setSubAreaName] = useState('');
  const [subAreaAreaId, setSubAreaAreaId] = useState('');
  const [assignMrId, setAssignMrId] = useState('');
  const [assignPickAreaId, setAssignPickAreaId] = useState('');
  const [assignSelectedSubAreas, setAssignSelectedSubAreas] = useState<Set<string>>(new Set());
  const [selfPickAreaId, setSelfPickAreaId] = useState('');
  const [selfSelectedSubAreas, setSelfSelectedSubAreas] = useState<Set<string>>(new Set());
  const [newMrName, setNewMrName] = useState('');
  const [newMrCode, setNewMrCode] = useState('');
  const [newMrEmail, setNewMrEmail] = useState('');
  const [newMrSubAreas, setNewMrSubAreas] = useState<Set<string>>(new Set());
  const [deleteMrId, setDeleteMrId] = useState('');
  const [transferToMrId, setTransferToMrId] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { data: deleteMrSubAreas = [] } = useMrSubAreaAccess(deleteMrId);

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

  const assignSubAreasFiltered = useMemo(
    () =>
      assignPickAreaId
        ? allSubAreas.filter(sa => sa.areaId === assignPickAreaId)
        : allSubAreas,
    [allSubAreas, assignPickAreaId],
  );

  const selfSubAreasFiltered = useMemo(
    () =>
      selfPickAreaId ? allSubAreas.filter(sa => sa.areaId === selfPickAreaId) : allSubAreas,
    [allSubAreas, selfPickAreaId],
  );

  const toggleAssignSubArea = (id: string) => {
    setAssignSelectedSubAreas(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelfSubArea = (id: string) => {
    setSelfSelectedSubAreas(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const today = todayInputDate()

  const { data: mgrTodayExpenseReport } = useExpenseReport(deferReady ? (user?.id ?? '') : '', today);
  const mgrTodayExpenseDone = mgrTodayExpenseReport?.status === 'submitted';

  const { data: todaysMrReports = [] } = useQuery({
    queryKey: ['manager-mr-today-report-status', user?.id, mrIds, today],
    enabled: !!user?.id && mrIds.length > 0 && !!supabase,
    queryFn: async (): Promise<Array<{ mrId: string; submitted: boolean; reportId: string | null }>> => {
      if (!supabase) throw new Error('Supabase not configured')
      const { data, error } = await supabase
        .from('daily_reports')
        .select('id, mr_id, status, report_date')
        .in('mr_id', mrIds)
        .eq('report_date', today)
      if (error) throw error

      const byMr = new Map<string, { submitted: boolean; reportId: string | null }>()
      for (const id of mrIds) byMr.set(id, { submitted: false, reportId: null })
      type Row = { mr_id: string; status: string; id: string }
      for (const r of (data ?? []) as Row[]) {
        const prev = byMr.get(r.mr_id)
        const submitted = r.status === 'submitted' || !!prev?.submitted
        const reportId =
          r.status === 'submitted'
            ? r.id
            : prev?.reportId ?? r.id
        byMr.set(r.mr_id, { submitted, reportId })
      }
      return mrIds.map(id => ({ mrId: id, ...(byMr.get(id) ?? { submitted: false, reportId: null }) }))
    },
  })

  const { data: todaysMrExpenseRows = [] } = useQuery({
    queryKey: ['manager-mr-today-expense-status', user?.id, mrIds, today],
    enabled: !!user?.id && mrIds.length > 0 && !!supabase && deferReady,
    queryFn: async (): Promise<Array<{ mrId: string; status: 'none' | 'draft' | 'submitted' }>> => {
      if (!supabase) throw new Error('Supabase not configured')
      const { data, error } = await supabase
        .from('expense_reports')
        .select('mr_id, status')
        .in('mr_id', mrIds)
        .eq('report_date', today)
      if (error) throw error
      const byMr = new Map<string, 'none' | 'draft' | 'submitted'>()
      for (const id of mrIds) byMr.set(id, 'none')
      type Er = { mr_id: string; status: string }
      for (const r of (data ?? []) as Er[]) {
        const st = r.status === 'submitted' ? 'submitted' : 'draft'
        const prev = byMr.get(r.mr_id)
        if (prev === 'submitted' || st === 'submitted') byMr.set(r.mr_id, 'submitted')
        else byMr.set(r.mr_id, 'draft')
      }
      return mrIds.map(id => ({ mrId: id, status: byMr.get(id) ?? 'none' }))
    },
  })

  const closeDrawer = () => {
    setAction(null);
    setDoctorName('');
    setDoctorSpec('');
    setDoctorSubAreaId('');
    setAreaName('');
    setSubAreaName('');
    setSubAreaAreaId('');
    setAssignMrId('');
    setAssignPickAreaId('');
    setAssignSelectedSubAreas(new Set());
    setSelfPickAreaId('');
    setSelfSelectedSubAreas(new Set());
    setNewMrName('');
    setNewMrCode('');
    setNewMrEmail('');
    setNewMrSubAreas(new Set());
    setDeleteMrId('');
    setTransferToMrId('');
    setStrikeDate(todayInputDate());
    setStrikeReason('');
    setHolidayDate(todayInputDate());
    setHolidayReason('');
  };

  const primaryActions: { key: QuickAction | 'nav'; label: string; icon: LucideIcon; nav?: string }[] = [
    { key: 'create-mr', label: 'Create MR', icon: Plus },
    { key: 'assign', label: 'Assign MR', icon: UserCheck },
    { key: 'assign-self', label: 'Assign Self', icon: UserPlus },
    { key: 'delete-mr', label: 'Delete MR', icon: UserMinus },
  ]

  const moreActions: { key: QuickAction; label: string; icon: LucideIcon }[] = [
    { key: 'set-ptr', label: 'Brand rates', icon: IndianRupee },
    { key: 'doctor', label: 'Add Doctor', icon: Stethoscope },
    { key: 'area', label: 'New Territory', icon: MapPin },
    { key: 'subarea', label: 'New Area', icon: MapPinned },
  ]

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

  if (!tpStatusLoading && currentMonthTpMissing) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <PageHeader title="Manager Dashboard" />
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
                <p className="text-xs text-muted-foreground font-medium">{todayStr}</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border-2 border-amber-500/30 bg-amber-500/5 p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Tour Program Required</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Create your Tour Program for{' '}
                  <span className="font-semibold text-foreground">
                    {new Date(tpStatus!.current_month + 'T00:00:00').toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                  </span>{' '}
                  before accessing dashboard features.
                </p>
              </div>
            </div>
            <Button
              onClick={() => navigate('/manager/tour-program')}
              className="w-full rounded-2xl h-12 text-sm font-bold"
            >
              <Calendar className="mr-2 h-5 w-5" />
              Create Tour Program Now
            </Button>
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
        </div>

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
            ) : (
              <Button
                onClick={() => navigate('/manager/report/new')}
                className="w-full rounded-2xl h-11 text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <FilePlus className="mr-2 h-4 w-4" /> Start Today's DCR
              </Button>
            )}
          </div>
        )}

        {/* Your today (self) */}
        <div className="rounded-xl border border-border/60 bg-card/50 px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
          <span className="font-semibold text-foreground">Your today</span>
          <span className={cn('tabular-nums', mgrTodayDcrDone ? 'text-emerald-600' : 'text-muted-foreground')}>
            DCR: {mgrTodayDcrDone ? 'Submitted' : 'Pending'}
          </span>
          <span className={cn('tabular-nums', mgrTodayExpenseDone ? 'text-emerald-600' : 'text-muted-foreground')}>
            Expense: {mgrTodayExpenseDone ? 'Submitted' : mgrTodayExpenseReport?.id ? 'Draft' : 'Not started'}
          </span>
          <Button variant="outline" size="sm" className="h-8 rounded-lg text-xs ml-auto" onClick={() => navigate('/manager/expense')}>
            Open expense
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard icon={Users} value={mrs.length} label="Total MRs" color="primary" />
          <StatCard icon={FileText} value={stats?.reportsToday ?? 0} label="Reports Today" color="emerald" />
          <StatCard icon={Calendar} value={stats?.reportsThisMonth ?? 0} label="This Month" color="blue" />
          <StatCard icon={Stethoscope} value={stats?.doctorsVisitedThisMonth ?? 0} label="Doctors Visited" color="amber" />
        </div>

        {deferReady && user?.id && (
          <div className="rounded-xl border border-border/60 bg-card/50 px-4 py-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-foreground">Team monthly support (this month)</p>
              <PiggyBank className="h-4 w-4 text-muted-foreground shrink-0" />
            </div>
            <p className="text-xl font-bold text-primary tabular-nums">
              Rs {(teamMonthlySupport?.total_inr ?? 0).toLocaleString('en-IN')}
            </p>
            {(teamMonthlySupport?.byMr ?? []).length > 0 && (
              <div className="space-y-1 max-h-32 overflow-y-auto text-xs">
                {(teamMonthlySupport?.byMr ?? []).map(row => (
                  <div key={row.mr_id} className="flex justify-between gap-2">
                    <span className="text-foreground truncate min-w-0">{row.full_name}</span>
                    <span className="font-semibold text-primary tabular-nums shrink-0">
                      Rs {row.total_inr.toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Self Report CTA */}
        {!mgrTodayDcrDone && (
          <Button
            onClick={() => navigate('/manager/report/new')}
            className="w-full touch-target rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 h-12 text-sm font-bold shadow-lg shadow-primary/20 active:scale-[0.97] transition-all"
          >
            <FilePlus className="mr-2 h-5 w-5" />
            Create Daily Report
          </Button>
        )}

        {/* Quick Actions — frequently used */}
        <div className="space-y-3">
          <p className="section-title">Quick Actions</p>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-8 gap-2.5">
            <button type="button" onClick={() => navigate('/manager/tour-program')} className="flex flex-col items-center gap-1.5 glass-card p-3 active:scale-95 transition-all">
              <div className="h-9 w-9 rounded-xl bg-blue-500/10 flex items-center justify-center"><CalendarDays className="h-4 w-4 text-blue-600 dark:text-blue-400" /></div>
              <span className="text-[10px] font-semibold text-foreground text-center leading-tight">Tour Plan</span>
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
            <button type="button" onClick={() => navigate('/manager/team/visit-frequency')} className="flex flex-col items-center gap-1.5 glass-card p-3 active:scale-95 transition-all">
              <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center"><BarChart3 className="h-4 w-4 text-primary" /></div>
              <span className="text-[10px] font-semibold text-foreground text-center leading-tight">Team visits</span>
            </button>
            <button type="button" onClick={() => navigate('/manager/report/history')} className="flex flex-col items-center gap-1.5 glass-card p-3 active:scale-95 transition-all">
              <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center"><History className="h-4 w-4 text-primary" /></div>
              <span className="text-[10px] font-semibold text-foreground text-center leading-tight">My DCR history</span>
            </button>
            {primaryActions.map(ab => (
              <button key={ab.key} type="button" onClick={() => setAction(ab.key)} className="flex flex-col items-center gap-1.5 glass-card p-3 active:scale-95 transition-all">
                <div className="h-9 w-9 rounded-xl bg-primary/8 flex items-center justify-center"><ab.icon className="h-4 w-4 text-primary" /></div>
                <span className="text-[10px] font-semibold text-foreground text-center leading-tight">{ab.label}</span>
              </button>
            ))}
          </div>

          <div className="glass-card p-3.5 space-y-3 rounded-xl">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div>
                <p className="text-sm font-semibold text-foreground">Team calls &amp; average</p>
                <p className="text-[10px] text-muted-foreground">Submitted MR field DCRs only</p>
              </div>
              <div className="flex gap-1 flex-wrap justify-end">
                {(['daily', 'weekly', 'monthly', 'all'] as const).map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setTeamCallPreset(p)}
                    className={cn(
                      'text-[10px] px-2 py-1 rounded-lg font-semibold border transition',
                      teamCallPreset === p ? 'bg-primary text-primary-foreground border-primary' : 'border-border bg-card text-muted-foreground',
                    )}
                  >
                    {p === 'all' ? 'Till date' : p}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg bg-muted/40 px-3 py-2">
                <p className="text-[10px] text-muted-foreground font-medium">Total calls</p>
                <p className="text-lg font-bold text-foreground tabular-nums">{teamCallAnalytics?.totalCalls ?? 0}</p>
              </div>
              <div className="rounded-lg bg-muted/40 px-3 py-2">
                <p className="text-[10px] text-muted-foreground font-medium">Avg / active day</p>
                <p className="text-lg font-bold text-primary tabular-nums">
                  {teamCallAnalytics && teamCallAnalytics.daysWithReports > 0 ? teamCallAnalytics.avgPerDay.toFixed(1) : '—'}
                </p>
              </div>
            </div>
            {teamCallAnalytics && teamCallAnalytics.bySpeciality.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">Visits by speciality (team)</p>
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={teamCallAnalytics.bySpeciality}
                        dataKey="visits"
                        nameKey="speciality"
                        cx="50%"
                        cy="50%"
                        outerRadius={70}
                        label={({ speciality, visits }) => `${speciality}: ${visits}`}
                      >
                        {teamCallAnalytics.bySpeciality.map((_, i) => (
                          <Cell key={i} fill={['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6'][i % 6]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* More actions — rarely used */}
        <div className="flex gap-2">
          {moreActions.map(ab => (
            <button key={ab.key} type="button" onClick={() => setAction(ab.key)} className="flex-1 flex items-center justify-center gap-1.5 glass-subtle rounded-xl py-2 active:scale-95 transition-all">
              <ab.icon className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-[10px] font-medium text-muted-foreground">{ab.label}</span>
            </button>
          ))}
        </div>

        {/* Today's MR — DCR & expense */}
        <div className="space-y-3">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <p className="section-title">Today&apos;s MR — DCR &amp; expense</p>
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-muted-foreground font-medium">
              <span>
                DCR: {todaysMrReports.filter(r => r.submitted).length}/{mrs.length}
              </span>
              <span>
                Expense: {todaysMrExpenseRows.filter(r => r.status === 'submitted').length}/{mrs.length}
              </span>
            </div>
          </div>
          <div className="space-y-2 md:grid md:grid-cols-2 md:gap-3 md:space-y-0">
            {mrs.map(mr => {
              const s = todaysMrReports.find(r => r.mrId === mr.id)
              const submitted = !!s?.submitted
              const exp = todaysMrExpenseRows.find(r => r.mrId === mr.id)
              const expDone = exp?.status === 'submitted'
              const expDraft = exp?.status === 'draft'
              const mrPaused = (mr as { is_paused?: boolean }).is_paused === true
              const initials = mr.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
              return (
                <div
                  key={mr.id}
                  className={cn(
                    'w-full text-left glass-card p-3.5 transition-all',
                    submitted && expDone && 'ring-1 ring-emerald-500/20',
                    mrPaused && 'ring-1 ring-destructive/20 opacity-80',
                  )}
                >
                  <div className="flex items-center gap-3">
                    {mr.profile_photo_url ? (
                      <img src={mr.profile_photo_url} alt={mr.full_name} className="h-9 w-9 rounded-full object-cover ring-2 ring-primary/10 shrink-0" />
                    ) : (
                      <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center ring-2 ring-primary/10 shrink-0">
                        <span className="text-[10px] font-bold text-primary">{initials}</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{mr.full_name}</p>
                      <p className="text-[10px] text-muted-foreground font-medium">{mr.email ?? mr.employee_code}</p>
                    </div>
                    {mrPaused && (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-destructive shrink-0">
                        <Lock className="h-3.5 w-3.5" /> Paused
                      </span>
                    )}
                  </div>

                  {!mrPaused && (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <div
                        className={cn(
                          'rounded-lg border px-2 py-2 text-center text-[11px] font-semibold',
                          submitted
                            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300'
                            : 'border-border bg-muted/30 text-muted-foreground',
                        )}
                      >
                        DCR: {submitted ? 'Submitted' : 'Pending'}
                      </div>
                      <div
                        className={cn(
                          'rounded-lg border px-2 py-2 text-center text-[11px] font-semibold',
                          expDone
                            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300'
                            : expDraft
                              ? 'border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200'
                              : 'border-border bg-muted/30 text-muted-foreground',
                        )}
                      >
                        Expense: {expDone ? 'Submitted' : expDraft ? 'Draft' : '—'}
                      </div>
                    </div>
                  )}

                  {submitted && !mrPaused && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-2 w-full rounded-xl text-xs h-9"
                      onClick={() =>
                        navigate(
                          `/manager/reports?mrId=${encodeURIComponent(mr.id)}&date=${encodeURIComponent(today)}&view=1`,
                        )
                      }
                    >
                      View DCR
                    </Button>
                  )}

                  {mrPaused && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2 w-full rounded-xl text-xs h-8"
                      disabled={unpauseUser.isPending}
                      onClick={() => {
                        void unpauseUser
                          .mutateAsync(mr.id)
                          .then(() => toast.success(`${mr.full_name} unpaused`))
                          .catch(e => toast.error(e instanceof Error ? e.message : 'Failed to unpause'))
                      }}
                    >
                      <Play className="mr-1.5 h-3 w-3" />
                      {unpauseUser.isPending ? 'Unpausing...' : 'Unpause Account'}
                    </Button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <Drawer open={action !== null} onOpenChange={v => { if (!v) closeDrawer(); }}>
        <DrawerContent className="!mt-0 flex h-[100dvh] max-h-[100dvh] flex-col rounded-t-2xl border bg-background p-0 gap-0">
          <DrawerHeader className="shrink-0 border-b border-border/60 px-4 pb-3 pt-3">
            <DrawerTitle className="text-[15px] font-bold tracking-tight">
              {action === 'doctor' && 'Add Doctor'}
              {action === 'area' && 'Add Territory'}
              {action === 'subarea' && 'Add Area'}
              {action === 'assign' && 'Assign Area to MR'}
              {action === 'assign-self' && 'Assign Area to Self'}
              {action === 'create-mr' && 'Create New MR'}
              {action === 'delete-mr' && 'Delete MR'}
              {action === 'set-ptr' && 'Set brand rates (per unit)'}
              {action === 'strike' && 'Mark Strike Day'}
              {action === 'holiday' && 'Mark Holiday'}
            </DrawerTitle>
          </DrawerHeader>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-6 pt-4 space-y-4">
            {action === 'doctor' && (
              <>
                <div className="space-y-2">
                  <Label className="text-xs">Doctor Name</Label>
                  <Input value={doctorName} onChange={e => setDoctorName(e.target.value)} className="touch-target rounded-lg" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Speciality</Label>
                  <Input value={doctorSpec} onChange={e => setDoctorSpec(e.target.value)} className="touch-target rounded-lg" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Area</Label>
                  <select value={doctorSubAreaId} onChange={e => setDoctorSubAreaId(e.target.value)} className="flex h-11 w-full rounded-lg border border-input bg-background px-3 text-sm touch-target">
                    <option value="">Choose Area</option>
                    {allSubAreas.map(sa => (
                      <option key={sa.id} value={sa.id}>{sa.areaName} - {sa.name}</option>
                    ))}
                  </select>
                </div>
                <Button
                  type="button"
                  disabled={addDoctor.isPending}
                  className="w-full touch-target rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
                  onClick={() =>
                    void addDoctor
                      .mutateAsync({ sub_area_id: doctorSubAreaId, full_name: doctorName, speciality: doctorSpec })
                      .then(() => {
                        toast.success('Doctor added')
                        closeDrawer()
                      })
                      .catch(e => toast.error(e instanceof Error ? e.message : 'Could not add doctor'))
                  }
                >
                  {addDoctor.isPending ? 'Saving…' : 'Save'}
                </Button>
              </>
            )}

            {action === 'area' && (
              <>
                <div className="space-y-2">
                  <Label className="text-xs">Territory Name</Label>
                  <Input value={areaName} onChange={e => setAreaName(e.target.value)} className="touch-target rounded-lg" />
                </div>
                <Button
                  type="button"
                  disabled={addArea.isPending}
                  className="w-full touch-target rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
                  onClick={() =>
                    void addArea
                      .mutateAsync(areaName)
                      .then(() => {
                        toast.success('Territory added')
                        closeDrawer()
                      })
                      .catch(e => toast.error(e instanceof Error ? e.message : 'Could not add area'))
                  }
                >
                  {addArea.isPending ? 'Saving…' : 'Save'}
                </Button>
              </>
            )}

            {action === 'subarea' && (
              <>
                <div className="space-y-2">
                  <Label className="text-xs">Territory</Label>
                  <select value={subAreaAreaId} onChange={e => setSubAreaAreaId(e.target.value)} className="flex h-11 w-full rounded-lg border border-input bg-background px-3 text-sm touch-target">
                    <option value="">Choose Territory</option>
                    {areas.map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Area Name</Label>
                  <Input value={subAreaName} onChange={e => setSubAreaName(e.target.value)} className="touch-target rounded-lg" />
                </div>
                <Button
                  type="button"
                  disabled={addSubArea.isPending}
                  className="w-full touch-target rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
                  onClick={() =>
                    void addSubArea
                      .mutateAsync({ areaId: subAreaAreaId, name: subAreaName })
                      .then(() => {
                        toast.success('Area added')
                        closeDrawer()
                      })
                      .catch(e => toast.error(e instanceof Error ? e.message : 'Could not add area'))
                  }
                >
                  {addSubArea.isPending ? 'Saving…' : 'Save'}
                </Button>
              </>
            )}

            {action === 'assign' && (
              <>
                <div className="space-y-2">
                  <Label className="text-xs">MR</Label>
                  <select value={assignMrId} onChange={e => setAssignMrId(e.target.value)} className="flex h-11 w-full rounded-lg border border-input bg-background px-3 text-sm touch-target">
                    <option value="">Choose MR</option>
                    {mrs.map(m => (
                      <option key={m.id} value={m.id}>{m.full_name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Area</Label>
                  <select
                    value={assignPickAreaId}
                    onChange={e => {
                      setAssignPickAreaId(e.target.value)
                      setAssignSelectedSubAreas(new Set())
                    }}
                    className="flex h-11 w-full rounded-lg border border-input bg-background px-3 text-sm touch-target"
                  >
                    <option value="">All Territories</option>
                    {areas.map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Areas (select one or more)</Label>
                  <div className="max-h-52 overflow-y-auto space-y-2 rounded-lg border border-border p-2">
                    {assignSubAreasFiltered.length === 0 ? (
                      <p className="text-xs text-muted-foreground px-1">No areas in this territory.</p>
                    ) : (
                      assignSubAreasFiltered.map(sa => (
                        <label key={sa.id} className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={assignSelectedSubAreas.has(sa.id)}
                            onChange={() => toggleAssignSubArea(sa.id)}
                          />
                          <span>{sa.areaName} — {sa.name}</span>
                        </label>
                      ))
                    )}
                  </div>
                </div>
                <Button
                  type="button"
                  disabled={assignSubAreasBatch.isPending}
                  className="w-full touch-target rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
                  onClick={() => {
                    if (!assignMrId) {
                      toast.error('Choose an MR')
                      return
                    }
                    if (assignSelectedSubAreas.size === 0) {
                      toast.error('Select at least one area')
                      return
                    }
                    void assignSubAreasBatch
                      .mutateAsync({ mrId: assignMrId, subAreaIds: [...assignSelectedSubAreas] })
                      .then(() => {
                        toast.success('Areas assigned to MR')
                        closeDrawer()
                      })
                      .catch(e => toast.error(e instanceof Error ? e.message : 'Could not assign areas'))
                  }}
                >
                  {assignSubAreasBatch.isPending ? 'Saving…' : 'Save assignments'}
                </Button>
              </>
            )}

            {action === 'assign-self' && (
              <>
                <div className="space-y-2">
                  <Label className="text-xs">Area</Label>
                  <select
                    value={selfPickAreaId}
                    onChange={e => {
                      setSelfPickAreaId(e.target.value)
                      setSelfSelectedSubAreas(new Set())
                    }}
                    className="flex h-11 w-full rounded-lg border border-input bg-background px-3 text-sm touch-target"
                  >
                    <option value="">All Territories</option>
                    {areas.map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Areas (select one or more)</Label>
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
                          <span>{sa.areaName} — {sa.name}</span>
                        </label>
                      ))
                    )}
                  </div>
                </div>
                <Button
                  type="button"
                  disabled={assignSubAreasBatch.isPending}
                  className="w-full touch-target rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
                  onClick={() => {
                    if (!user?.id) {
                      toast.error('Not signed in')
                      return
                    }
                    if (selfSelectedSubAreas.size === 0) {
                      toast.error('Select at least one area')
                      return
                    }
                    void assignSubAreasBatch
                      .mutateAsync({ mrId: user.id, subAreaIds: [...selfSelectedSubAreas] })
                      .then(() => {
                        toast.success('Areas assigned to self')
                        closeDrawer()
                      })
                      .catch(e => toast.error(e instanceof Error ? e.message : 'Could not assign area'))
                  }}
                >
                  {assignSubAreasBatch.isPending ? 'Saving…' : 'Save assignments'}
                </Button>
              </>
            )}

            {action === 'create-mr' && (
              <>
                <div className="space-y-2">
                  <Label className="text-xs">MR Name</Label>
                  <Input value={newMrName} onChange={e => setNewMrName(e.target.value)} className="touch-target rounded-lg" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Email</Label>
                  <Input value={newMrEmail} onChange={e => setNewMrEmail(e.target.value)} type="email" className="touch-target rounded-lg" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Assign Areas</Label>
                  <div className="max-h-56 overflow-y-auto space-y-2 rounded-md border p-2">
                    {allSubAreas.map(sa => (
                      <label key={sa.id} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={newMrSubAreas.has(sa.id)}
                          onChange={e => {
                            setNewMrSubAreas(prev => {
                              const next = new Set(prev)
                              if (e.target.checked) next.add(sa.id)
                              else next.delete(sa.id)
                              return next
                            })
                          }}
                        />
                        <span>{sa.areaName} - {sa.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <Button
                  type="button"
                  disabled={createUser.isPending}
                  className="w-full touch-target rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
                  onClick={() => {
                    if (!newMrName.trim() || !newMrEmail.trim() || !user?.id) {
                      toast.error('Name and email are required')
                      return
                    }
                    const autoCode = newMrEmail.trim().split('@')[0].toUpperCase().replace(/[^A-Z0-9]/g, '')
                    void createUser
                      .mutateAsync({
                        fullName: newMrName.trim(),
                        employeeCode: autoCode,
                        email: newMrEmail.trim(),
                        role: 'mr',
                        managerIds: [user.id],
                        subAreaIds: [...newMrSubAreas],
                      })
                      .then(() => {
                        toast.success('MR created. Default password: Maktree@123')
                        closeDrawer()
                      })
                      .catch(e => toast.error(e instanceof Error ? e.message : 'Could not create MR'))
                  }}
                >
                  {createUser.isPending ? 'Creating…' : 'Create MR'}
                </Button>
              </>
            )}

            {action === 'delete-mr' && (
              <>
                <div className="space-y-2">
                  <Label className="text-xs">MR to delete</Label>
                  <select value={deleteMrId} onChange={e => setDeleteMrId(e.target.value)} className="flex h-11 w-full rounded-lg border border-input bg-background px-3 text-sm touch-target">
                    <option value="">Choose MR</option>
                    {mrs.map(m => (
                      <option key={m.id} value={m.id}>{m.full_name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Transfer areas to (optional)</Label>
                  <select value={transferToMrId} onChange={e => setTransferToMrId(e.target.value)} className="flex h-11 w-full rounded-lg border border-input bg-background px-3 text-sm touch-target">
                    <option value="">No transfer</option>
                    {mrs.filter(m => m.id !== deleteMrId).map(m => (
                      <option key={m.id} value={m.id}>{m.full_name}</option>
                    ))}
                  </select>
                </div>
                <Button
                  type="button"
                  disabled={deleteMr.isPending}
                  variant="destructive"
                  className="w-full touch-target rounded-lg font-semibold"
                  onClick={() => {
                    if (!deleteMrId) {
                      toast.error('Select MR to delete')
                      return
                    }
                    setShowDeleteConfirm(true)
                  }}
                >
                  {deleteMr.isPending ? 'Deleting…' : 'Delete MR'}
                </Button>
              </>
            )}
            {action === 'set-ptr' && (
              <>
                <div className="rounded-xl border border-primary/20 bg-primary/5 px-3 py-2.5 text-xs text-foreground leading-relaxed">
                  <p className="font-semibold text-foreground mb-1">Brand rates</p>
                  <p className="text-muted-foreground">
                    Enter the rupee rate per unit for each company brand. These values are used internally when MRs
                    record monthly support on submitted DCRs so totals stay consistent. Keep them up to date.
                  </p>
                </div>
                <div className="space-y-3">
                  {allProducts.map(p => (
                    <div key={p.id} className="flex items-center gap-3 rounded-xl bg-muted/50 p-3">
                      <span className="flex-1 text-sm font-medium truncate">{p.name}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-muted-foreground">Rs</span>
                        <Input
                          type="number"
                          min={0}
                          defaultValue={p.ptr || ''}
                          onBlur={e => {
                            const val = parseFloat(e.target.value) || 0;
                            if (val !== (p.ptr ?? 0)) {
                              updatePtr.mutate({ productId: p.id, ptr: val }, {
                                onSuccess: () => toast.success(`Rate updated for ${p.name}`),
                                onError: () => toast.error('Failed to update rate'),
                              });
                            }
                          }}
                          placeholder="0"
                          className="w-24 rounded-lg text-sm h-9"
                        />
                      </div>
                    </div>
                  ))}
                  {allProducts.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">No products found</p>
                  )}
                </div>
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

      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Delete this MR?"
        description={
          transferToMrId
            ? `This MR has ${deleteMrSubAreas.length} assigned areas. They will be transferred before deletion.`
            : `This MR has ${deleteMrSubAreas.length} assigned areas. They will be removed on deletion.`
        }
        onConfirm={() => {
          void deleteMr
            .mutateAsync({ mrId: deleteMrId, transferToMrId: transferToMrId || undefined })
            .then(() => {
              toast.success('MR deleted successfully')
              setShowDeleteConfirm(false)
              closeDrawer()
            })
            .catch(e => toast.error(e instanceof Error ? e.message : 'Could not delete MR'))
        }}
        confirmLabel={deleteMr.isPending ? 'Deleting…' : 'Delete MR'}
        destructive
        confirmDisabled={deleteMr.isPending}
      />

      <BottomNav role="manager" />
    </div>
  );
}
