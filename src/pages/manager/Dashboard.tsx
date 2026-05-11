import { useAuth } from '@/hooks/useAuth';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '@/components/shared/PageHeader';
import BottomNav from '@/components/shared/BottomNav';
import StatCard from '@/components/shared/StatCard';
import { Users, FileText, Stethoscope, Calendar, CalendarDays, Receipt, FilePlus, CheckCircle2, Plus, MapPin, MapPinned, UserPlus, UserMinus, UserCheck, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useManagerMrs } from '@/hooks/useManagerTeam';
import { useAddDoctor } from '@/hooks/useAdminDoctors';
import { useAddArea, useAddSubArea } from '@/hooks/useAdminAreasMutations';
import { useAssignSubAreasToMrBatch, useMrSubAreaAccess } from '@/hooks/useAdminMrAccess';
import { useCreateUser, useDeleteMrUser } from '@/hooks/useAdminUsers';
import { useAllAreas } from '@/hooks/useAreas';
import { toast } from 'sonner';
import { useManagerDashboardStats } from '@/hooks/useDashboardStats';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { todayInputDate } from '@/lib/dateUtils';
import ConfirmDialog from '@/components/shared/ConfirmDialog';

const FILTERS = ['Today', 'This Week', 'This Month'] as const;
type QuickAction = 'doctor' | 'area' | 'subarea' | 'assign' | 'assign-self' | 'create-mr' | 'delete-mr' | null

export default function ManagerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<typeof FILTERS[number]>('Today');
  const [action, setAction] = useState<QuickAction>(null);

  const { data: mrs = [] } = useManagerMrs(user?.id ?? '');
  const mrIds = useMemo(() => mrs.map(m => m.id), [mrs]);
  const { data: stats } = useManagerDashboardStats(user?.id ?? '', mrIds);
  const { data: areas = [] } = useAllAreas();
  const addDoctor = useAddDoctor();
  const addArea = useAddArea();
  const addSubArea = useAddSubArea();
  const assignSubAreasBatch = useAssignSubAreasToMrBatch();
  const createUser = useCreateUser();
  const deleteMr = useDeleteMrUser();

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
  };

  const primaryActions: { key: QuickAction | 'nav'; label: string; icon: LucideIcon; nav?: string }[] = [
    { key: 'create-mr', label: 'Create MR', icon: Plus },
    { key: 'assign', label: 'Assign MR', icon: UserCheck },
    { key: 'assign-self', label: 'Assign Self', icon: UserPlus },
    { key: 'delete-mr', label: 'Delete MR', icon: UserMinus },
  ]

  const moreActions: { key: QuickAction; label: string; icon: LucideIcon }[] = [
    { key: 'doctor', label: 'Add Doctor', icon: Stethoscope },
    { key: 'area', label: 'New Territory', icon: MapPin },
    { key: 'subarea', label: 'New Area', icon: MapPinned },
  ]

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader title="Manager Dashboard" />

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
              <p className="text-xs text-muted-foreground font-medium mt-0.5">
                {mrs.length} MR{mrs.length !== 1 ? 's' : ''} in your team
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard icon={Users} value={mrs.length} label="Total MRs" color="primary" />
          <StatCard icon={FileText} value={stats?.reportsToday ?? 0} label="Reports Today" color="emerald" />
          <StatCard icon={Calendar} value={stats?.reportsThisMonth ?? 0} label="This Month" color="blue" />
          <StatCard icon={Stethoscope} value={stats?.doctorsVisitedThisMonth ?? 0} label="Doctors Visited" color="amber" />
        </div>

        {/* Self Report CTA */}
        <Button
          onClick={() => navigate('/manager/report/new')}
          className="w-full touch-target rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 h-12 text-sm font-bold shadow-lg shadow-primary/20 active:scale-[0.97] transition-all"
        >
          <FilePlus className="mr-2 h-5 w-5" />
          Create Daily Report
        </Button>

        {/* Quick Actions — frequently used */}
        <div className="space-y-3">
          <p className="section-title">Quick Actions</p>
          <div className="grid grid-cols-4 gap-2.5">
            <button type="button" onClick={() => navigate('/manager/tour-program')} className="flex flex-col items-center gap-1.5 glass-card p-3 active:scale-95 transition-all">
              <div className="h-9 w-9 rounded-xl bg-blue-500/10 flex items-center justify-center"><CalendarDays className="h-4 w-4 text-blue-600 dark:text-blue-400" /></div>
              <span className="text-[10px] font-semibold text-foreground text-center leading-tight">Tour Plan</span>
            </button>
            <button type="button" onClick={() => navigate('/manager/expense')} className="flex flex-col items-center gap-1.5 glass-card p-3 active:scale-95 transition-all">
              <div className="h-9 w-9 rounded-xl bg-emerald-500/10 flex items-center justify-center"><Receipt className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /></div>
              <span className="text-[10px] font-semibold text-foreground text-center leading-tight">Expense</span>
            </button>
            <button type="button" onClick={() => navigate('/manager/holidays')} className="flex flex-col items-center gap-1.5 glass-card p-3 active:scale-95 transition-all">
              <div className="h-9 w-9 rounded-xl bg-amber-500/10 flex items-center justify-center"><Calendar className="h-4 w-4 text-amber-600 dark:text-amber-400" /></div>
              <span className="text-[10px] font-semibold text-foreground text-center leading-tight">Holidays</span>
            </button>
            {primaryActions.map(ab => (
              <button key={ab.key} type="button" onClick={() => setAction(ab.key)} className="flex flex-col items-center gap-1.5 glass-card p-3 active:scale-95 transition-all">
                <div className="h-9 w-9 rounded-xl bg-primary/8 flex items-center justify-center"><ab.icon className="h-4 w-4 text-primary" /></div>
                <span className="text-[10px] font-semibold text-foreground text-center leading-tight">{ab.label}</span>
              </button>
            ))}
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

        {/* Today's MR Reports */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="section-title">Today's MR Reports</p>
            <span className="text-[10px] text-muted-foreground font-medium">
              {todaysMrReports.filter(r => r.submitted).length}/{mrs.length} submitted
            </span>
          </div>
          <div className="space-y-2">
            {mrs.map(mr => {
              const s = todaysMrReports.find(r => r.mrId === mr.id)
              const submitted = !!s?.submitted
              const initials = mr.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
              return (
                <button
                  key={mr.id}
                  type="button"
                  disabled={!submitted}
                  onClick={() => {
                    if (!submitted || !s?.reportId) return
                    window.location.href = `/manager/reports?mrId=${encodeURIComponent(mr.id)}&date=${encodeURIComponent(today)}&view=1`
                  }}
                  className={cn(
                    'w-full text-left glass-card p-3.5 active:scale-[0.98] transition-all',
                    submitted && 'ring-1 ring-emerald-500/20',
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
                    {submitted ? (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                        <CheckCircle2 className="h-4 w-4" /> Done
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-muted-foreground/60 shrink-0">Pending</span>
                    )}
                  </div>
                </button>
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
          </div>
        </DrawerContent>
      </Drawer>

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
