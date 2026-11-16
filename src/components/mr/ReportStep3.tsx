import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useDoctorsForMrDcr } from '@/hooks/useDoctors';
import { CheckCircle2, Plus, Trash2 } from 'lucide-react';
import DoctorVisitDrawer from '@/components/mr/DoctorVisitDrawer';
import ReportStepFooter from '@/components/mr/ReportStepFooter';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import CaptureLocationButton from '@/components/field/CaptureLocationButton';
import { useFieldLocation } from '@/components/field/FieldLocationProvider';
import { cn } from '@/lib/utils';
import type { ReportFormData, VisitFormEntry } from '@/pages/mr/NewReport';
import type { Doctor } from '@/types/database.types';
import { useProducts } from '@/hooks/useProducts';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { ensureDraftFieldReport, removePersistedFieldVisit, saveReportVisit } from '@/hooks/useReport';
import { useFieldDayBoard, planPathForRole } from '@/hooks/useFieldPlan';
import { describeDoctorSpot, haversineMeters, type SpotUi } from '@/lib/spotWorking';

interface Props {
  data: ReportFormData;
  onChange: (d: Partial<ReportFormData>) => void;
  onNext: () => void;
  onBack: () => void;
  hideFooter?: boolean;
}

function spotForDoctor(
  doc: Doctor,
  role: string,
  planDate: string,
  board: ReturnType<typeof useFieldDayBoard>['data'],
  gps: ReturnType<typeof useFieldLocation>,
): SpotUi {
  const calls = board?.calls ?? []
  const call = calls.find(c => c.doctor_id === doc.id && c.has_location)
  const onDaily = calls.some(c => c.doctor_id === doc.id && c.source === 'daily' && (board?.plan_status === 'approved' || board?.plan_status === 'pending'))
  const onPriority = calls.some(c => c.doctor_id === doc.id && c.source === 'priority_call')
  const distance = gps.coords && call?.latitude != null && call.longitude != null
    ? haversineMeters(gps.coords.lat, gps.coords.lng, call.latitude, call.longitude)
    : null
  return describeDoctorSpot({
    role,
    planDate,
    planStatus: board?.plan_status ?? 'none',
    onDaily,
    onPriority,
    hasLocation: calls.some(c => c.doctor_id === doc.id && c.has_location),
    distanceM: distance,
    accuracyM: gps.coords?.accuracy ?? null,
    serverUnlocked: gps.unlockedIds.includes(doc.id),
    serverConfirming: gps.confirmingIds.includes(doc.id),
    flagged: gps.flagged,
  })
}

export default function ReportStep3({ data, onChange, onNext, onBack, hideFooter }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const gps = useFieldLocation();
  const board = useFieldDayBoard(user?.role === 'mr' ? data.date : '');
  const [activeDoctorId, setActiveDoctorId] = useState<string | null>(() => localStorage.getItem('maktree-open-visit'));
  useEffect(() => {
    if (activeDoctorId) localStorage.setItem('maktree-open-visit', activeDoctorId);
    else localStorage.removeItem('maktree-open-visit');
  }, [activeDoctorId]);
  const [deleteDoctorId, setDeleteDoctorId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const {
    data: doctors = [],
    isLoading,
    isError,
    allowedSubAreaIds,
  } = useDoctorsForMrDcr(user?.id ?? '', data.selectedSubAreaIds);
  const { data: products = [] } = useProducts();

  const visitCount = Object.keys(data.visits).length;

  const grouped = allowedSubAreaIds.map(saId => {
    const subAreaName =
      doctors.find(d => d.sub_area_id === saId)?.sub_area?.name ?? 'Area';
    const docs = doctors.filter(d => d.sub_area_id === saId);
    return { subAreaId: saId, subAreaName, docs };
  }).filter(g => g.docs.length > 0);

  const persistVisit = async (doctorId: string, subAreaId: string, visit: VisitFormEntry, ui: SpotUi) => {
    if (!supabase || !user) throw new Error('Not signed in')
    const needsSpot = ui.mode === 'ready'
    let spot: { lat: number; lng: number; accuracy: number } | null = null
    if (needsSpot) {
      if (!gps.coords) throw new Error('Turn location on to save this DCR')
      spot = gps.coords
    } else if (gps.coords && (ui.mode === 'open' || ui.mode === 'capture')) {
      spot = gps.coords
    }
    const reportId = await ensureDraftFieldReport(supabase, {
      mrId: user.id,
      reportDate: data.date,
      workingWithIds: data.workingWithIds ?? [],
    })
    await saveReportVisit(supabase, {
      reportId,
      doctorId,
      doctorSubAreaId: subAreaId,
      spot,
      visit: {
        productsPromoted: visit.productsPromoted,
        chemistName: visit.chemistName,
        competitors: visit.competitors.flatMap(c => (
          c.brandName.trim() ? [{ brandName: c.brandName, quantity: Number(c.quantity) || 0 }] : []
        )),
        monthlySupport: visit.monthlySupport.flatMap(m => (
          m.productId ? [{ productId: m.productId, quantity: Number(m.quantity) || 0 }] : []
        )),
        doctorUnavailable: visit.doctorUnavailable,
        unavailableNote: visit.unavailableNote,
      },
    })
  }

  const handleSaveVisit = async (doctorId: string, subAreaId: string, visit: VisitFormEntry) => {
    const doc = doctors.find(d => d.id === doctorId)
    const ui = doc ? spotForDoctor(doc, user?.role ?? '', data.date, board.data, gps) : null
    if (ui && (ui.mode === 'away' || ui.mode === 'need_gps' || ui.mode === 'confirming' || ui.mode === 'not_on_plan')) {
      toast.error(ui.detail)
      return
    }
    setSavingId(doctorId)
    try {
      if (ui && user?.role === 'mr') await persistVisit(doctorId, subAreaId, visit, ui)
      onChange({
        visits: {
          ...data.visits,
          [doctorId]: { ...visit, doctorId, subAreaId, persisted: user?.role === 'mr' },
        },
      })
      setActiveDoctorId(null)
      toast.success(visit.doctorUnavailable ? 'Marked unavailable' : 'Visit saved')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save this visit')
    } finally {
      setSavingId(null)
    }
  }

  const handleDeleteVisit = async (doctorId: string) => {
    try {
      if (data.visits[doctorId]?.persisted && supabase && user) {
        await removePersistedFieldVisit(supabase, {
          mrId: user.id,
          reportDate: data.date,
          doctorId,
        })
      }
      const next = { ...data.visits };
      delete next[doctorId];
      onChange({ visits: next });
      setDeleteDoctorId(null);
      toast.success('Visit removed');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not remove this visit')
    }
  };

  const activeDoctor: Doctor | null =
    activeDoctorId ? doctors.find(d => d.id === activeDoctorId) ?? null : null;
  const activeSubAreaId = activeDoctor?.sub_area_id ?? '';

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (allowedSubAreaIds.length === 0) {
    return (
      <div className="space-y-4">
        <EmptyState message="Select at least one assigned area you worked in today." />
        <Button variant="outline" onClick={onBack} className="w-full touch-target rounded-lg">Back</Button>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-4">
        <EmptyState message="Could not load doctors for the selected areas." />
        <Button variant="outline" onClick={onBack} className="w-full touch-target rounded-lg">Back</Button>
      </div>
    );
  }

  const deleteDoctorName = deleteDoctorId
    ? doctors.find(d => d.id === deleteDoctorId)?.full_name ?? 'this doctor'
    : '';

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="glass-card !rounded-2xl p-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-foreground">Doctor visits</p>
          <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
            Tap a doctor to add products, chemist, monthly support & competitors.
          </p>
        </div>
        <span className="shrink-0 text-xs font-bold text-primary bg-primary/10 rounded-full px-3 py-1.5 tabular-nums">
          {visitCount}/{doctors.length}
        </span>
      </div>

      {grouped.length === 0 ? (
        <EmptyState message="No doctors found in selected areas." />
      ) : (
        <div className="space-y-4">
          {grouped.map(({ subAreaId, subAreaName, docs }) => (
            <div key={subAreaId}>
              <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm py-1.5 -mx-4 px-4 mb-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{subAreaName}</p>
              </div>
              <div className="space-y-2">
                {docs.map((doc, i) => {
                  const hasVisit = !!data.visits[doc.id];
                  const visit = data.visits[doc.id];
                  const ui = user?.role === 'mr' ? spotForDoctor(doc, user.role, data.date, board.data, gps) : null
                  const locked = ui != null && (ui.mode === 'away' || ui.mode === 'need_gps' || ui.mode === 'confirming' || ui.mode === 'not_on_plan')
                  return (
                    <div
                      key={doc.id}
                      className={cn(
                        'w-full max-w-full min-w-0 flex items-center gap-2 sm:gap-3 rounded-2xl p-3 sm:p-3.5 overflow-hidden animate-fade-in border',
                        hasVisit
                          ? 'glass-card !rounded-2xl bg-primary/5 border-primary/25'
                          : 'bg-card border-border/60 shadow-sm',
                      )}
                      style={{ animationDelay: `${i * 40}ms` }}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          if (!ui || !locked) {
                            setActiveDoctorId(doc.id)
                            return
                          }
                          if (ui.mode === 'not_on_plan') {
                            navigate(`${planPathForRole(user?.role)}?priority=1&date=${data.date}`)
                            return
                          }
                          toast.message(ui.title, { description: ui.detail })
                        }}
                        className="flex-1 min-w-0 flex items-center gap-3 text-left active:scale-[0.98] transition-all"
                      >
                        <div
                          className={cn(
                            'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold',
                            hasVisit
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-muted-foreground',
                          )}
                        >
                          {hasVisit ? (
                            <CheckCircle2 className="h-5 w-5" />
                          ) : (
                            doc.full_name.slice(0, 1).toUpperCase()
                          )}
                        </div>
                        <div className="flex-1 min-w-0 overflow-hidden">
                          <p className="font-semibold text-foreground text-sm truncate">{doc.full_name}</p>
                          <p className="text-xs text-muted-foreground">{doc.speciality}</p>
                          {ui && (
                            <p className={cn('text-[10px] mt-1 font-semibold', locked ? 'text-amber-700 dark:text-amber-300' : 'text-emerald-700 dark:text-emerald-400')}>
                              {ui.title}
                            </p>
                          )}
                          {hasVisit && visit && (
                            <p className="text-[10px] text-muted-foreground mt-1 truncate">
                              {visit.chemistName ? `${visit.chemistName} · ` : ''}
                              {visit.productsPromoted.length} product
                              {visit.productsPromoted.length === 1 ? '' : 's'}
                              {visit.monthlySupport.length > 0 &&
                                ` · ${visit.monthlySupport.length} support`}
                            </p>
                          )}
                        </div>
                        {hasVisit ? (
                          <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-primary bg-primary/10 px-2 py-1 rounded-lg">
                            Edit
                          </span>
                        ) : (
                          <span className="shrink-0 flex items-center gap-0.5 text-xs font-semibold text-primary">
                            <Plus className="h-4 w-4" />
                            Add
                          </span>
                        )}
                      </button>
                      {ui && (ui.mode === 'capture' || ui.mode === 'ready' || ui.mode === 'open') && (
                        <div className="flex shrink-0 flex-col gap-1">
                          {!board.data?.calls.some(c => c.doctor_id === doc.id && c.has_location) && (
                            <CaptureLocationButton doctorId={doc.id} compact />
                          )}
                          {!visit?.doctorUnavailable ? (
                            <button
                              type="button"
                              disabled={savingId === doc.id}
                              className="rounded-lg px-2 py-1 text-[10px] font-semibold text-amber-700 hover:bg-amber-500/10"
                              onClick={() => void handleSaveVisit(doc.id, doc.sub_area_id, {
                                doctorId: doc.id,
                                subAreaId: doc.sub_area_id,
                                productsPromoted: [],
                                chemistName: '',
                                competitors: [],
                                monthlySupport: [],
                                doctorUnavailable: true,
                              })}
                            >
                              Unavailable
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="rounded-lg px-2 py-1 text-[10px] font-semibold text-primary hover:bg-primary/10"
                              onClick={() => navigate(`${planPathForRole(user?.role)}?priority=1&replace=${doc.id}`)}
                            >
                              Priority Call
                            </button>
                          )}
                        </div>
                      )}
                      {hasVisit && (
                        <button
                          type="button"
                          onClick={() => setDeleteDoctorId(doc.id)}
                          className="shrink-0 p-2 rounded-lg text-destructive hover:bg-destructive/10 active:scale-95 transition-all"
                          aria-label={`Remove visit for ${doc.full_name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <DoctorVisitDrawer
        open={!!activeDoctorId}
        onClose={() => setActiveDoctorId(null)}
        doctorId={activeDoctorId}
        subAreaId={activeSubAreaId}
        doctor={activeDoctor}
        products={products}
        existingVisit={activeDoctorId ? data.visits[activeDoctorId] : undefined}
        onSave={handleSaveVisit}
      />

      <ConfirmDialog
        open={!!deleteDoctorId}
        onOpenChange={open => { if (!open) setDeleteDoctorId(null); }}
        title="Remove doctor visit?"
        description={`Remove the saved visit for ${deleteDoctorName}? You can add it again later.`}
        confirmLabel="Remove visit"
        destructive
        onConfirm={() => {
          if (deleteDoctorId) handleDeleteVisit(deleteDoctorId);
        }}
      />

      {!hideFooter && <ReportStepFooter onBack={onBack} onNext={onNext} />}
    </div>
  );
}
