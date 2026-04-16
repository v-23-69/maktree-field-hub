import { useAuth } from '@/hooks/useAuth';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '@/components/shared/PageHeader';
import BottomNav from '@/components/shared/BottomNav';
import StatCard from '@/components/shared/StatCard';
import { Users, FileText, Stethoscope, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useManagerMrs } from '@/hooks/useManagerTeam';
import { useAddDoctor } from '@/hooks/useAdminDoctors';
import { useAddArea, useAddSubArea } from '@/hooks/useAdminAreasMutations';
import { useAssignSubAreaToMr } from '@/hooks/useAdminMrAccess';
import { useAllAreas } from '@/hooks/useAreas';
import { toast } from 'sonner';
import { useManagerDashboardStats } from '@/hooks/useDashboardStats';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { todayInputDate } from '@/lib/dateUtils';
import InstallPrompt from '@/components/shared/InstallPrompt';

const FILTERS = ['Today', 'This Week', 'This Month'] as const;
type QuickAction = 'doctor' | 'area' | 'subarea' | 'assign' | null

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
  const assignSubArea = useAssignSubAreaToMr();

  const [doctorName, setDoctorName] = useState('');
  const [doctorSpec, setDoctorSpec] = useState('');
  const [doctorSubAreaId, setDoctorSubAreaId] = useState('');
  const [areaName, setAreaName] = useState('');
  const [subAreaName, setSubAreaName] = useState('');
  const [subAreaAreaId, setSubAreaAreaId] = useState('');
  const [assignMrId, setAssignMrId] = useState('');
  const [assignSubAreaId, setAssignSubAreaId] = useState('');

  const allSubAreas = areas.flatMap(a => (a.sub_areas ?? []).map(sa => ({ ...sa, areaName: a.name })));
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
      for (const r of data ?? []) {
        byMr.set((r as any).mr_id, {
          submitted: (r as any).status === 'submitted',
          reportId: (r as any).id ?? null,
        })
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
    setAssignSubAreaId('');
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <PageHeader title="Manager Dashboard" />

      <div className="px-4 py-4 space-y-5">
        <div className="animate-fade-in-up">
          <h2 className="text-xl font-bold text-foreground">Welcome, {user?.full_name?.split(' ')[0]}!</h2>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <StatCard icon={Users} value={mrs.length} label="Total MRs" />
          <StatCard icon={FileText} value={stats?.reportsToday ?? 0} label="Reports Today" />
          <StatCard icon={Calendar} value={stats?.reportsThisMonth ?? 0} label="Reports This Month" />
          <StatCard icon={Stethoscope} value={stats?.doctorsVisitedThisMonth ?? 0} label="Doctors Visited" />
        </div>

        <div className="flex gap-2">
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={cn(
                'rounded-full px-4 py-2 text-xs font-medium border transition-colors touch-target active:scale-95',
                activeFilter === f
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card text-foreground border-border'
              )}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Quick Actions
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant="outline" className="touch-target rounded-lg" onClick={() => setAction('doctor')}>
              Add Doctor
            </Button>
            <Button type="button" variant="outline" className="touch-target rounded-lg" onClick={() => setAction('area')}>
              Add Area
            </Button>
            <Button type="button" variant="outline" className="touch-target rounded-lg" onClick={() => setAction('subarea')}>
              Add Sub-area
            </Button>
            <Button type="button" variant="outline" className="touch-target rounded-lg" onClick={() => setAction('assign')}>
              Assign Area to MR
            </Button>
            <Button type="button" variant="outline" className="touch-target rounded-lg col-span-2" onClick={() => navigate('/manager/holidays')}>
              Holidays
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Today Reports by MRs
          </p>
          <div className="space-y-2">
            {mrs.map(mr => {
              const s = todaysMrReports.find(r => r.mrId === mr.id)
              const submitted = !!s?.submitted
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
                    'w-full text-left rounded-xl border p-3 shadow-sm active:scale-[0.99] transition',
                    submitted ? 'bg-card border-emerald-600/40' : 'bg-card border-border opacity-80',
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-foreground truncate">{mr.full_name}</p>
                    <span className={cn('text-xs font-semibold', submitted ? 'text-emerald-700' : 'text-muted-foreground')}>
                      {submitted ? 'Submitted' : 'Pending'}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <Drawer open={action !== null} onOpenChange={v => { if (!v) closeDrawer(); }}>
        <DrawerContent className="!mt-0 flex h-[100dvh] max-h-[100dvh] flex-col rounded-t-[10px] border bg-background p-0 gap-0">
          <DrawerHeader className="shrink-0 border-b border-border px-4 pb-3 pt-2">
            <DrawerTitle className="text-base">
              {action === 'doctor' && 'Add Doctor'}
              {action === 'area' && 'Add Area'}
              {action === 'subarea' && 'Add Sub-area'}
              {action === 'assign' && 'Assign Area to MR'}
            </DrawerTitle>
          </DrawerHeader>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4 pt-4 space-y-4">
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
                  <Label className="text-xs">Sub-area</Label>
                  <select value={doctorSubAreaId} onChange={e => setDoctorSubAreaId(e.target.value)} className="flex h-11 w-full rounded-lg border border-input bg-background px-3 text-sm touch-target">
                    <option value="">Choose Sub-area</option>
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
                        toast.success('Doctor added ✓')
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
                  <Label className="text-xs">Area Name</Label>
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
                        toast.success('Area added ✓')
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
                  <Label className="text-xs">Area</Label>
                  <select value={subAreaAreaId} onChange={e => setSubAreaAreaId(e.target.value)} className="flex h-11 w-full rounded-lg border border-input bg-background px-3 text-sm touch-target">
                    <option value="">Choose Area</option>
                    {areas.map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Sub-area Name</Label>
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
                        toast.success('Sub-area added ✓')
                        closeDrawer()
                      })
                      .catch(e => toast.error(e instanceof Error ? e.message : 'Could not add sub-area'))
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
                  <Label className="text-xs">Sub-area</Label>
                  <select value={assignSubAreaId} onChange={e => setAssignSubAreaId(e.target.value)} className="flex h-11 w-full rounded-lg border border-input bg-background px-3 text-sm touch-target">
                    <option value="">Choose Sub-area</option>
                    {allSubAreas.map(sa => (
                      <option key={sa.id} value={sa.id}>{sa.areaName} - {sa.name}</option>
                    ))}
                  </select>
                </div>
                <Button
                  type="button"
                  disabled={assignSubArea.isPending}
                  className="w-full touch-target rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
                  onClick={() =>
                    void assignSubArea
                      .mutateAsync({ mrId: assignMrId, subAreaId: assignSubAreaId })
                      .then(() => {
                        toast.success('Area assigned to MR ✓')
                        closeDrawer()
                      })
                      .catch(e => toast.error(e instanceof Error ? e.message : 'Could not assign area'))
                  }
                >
                  {assignSubArea.isPending ? 'Saving…' : 'Save'}
                </Button>
              </>
            )}
          </div>
        </DrawerContent>
      </Drawer>

      <InstallPrompt />
      <BottomNav role="manager" />
    </div>
  );
}
