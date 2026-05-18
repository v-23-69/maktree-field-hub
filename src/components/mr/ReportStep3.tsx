import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useDoctorsBySubAreas } from '@/hooks/useDoctors';
import { CheckCircle2, Plus, Trash2 } from 'lucide-react';
import DoctorVisitDrawer from '@/components/mr/DoctorVisitDrawer';
import ReportStepFooter from '@/components/mr/ReportStepFooter';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import { cn } from '@/lib/utils';
import type { ReportFormData, VisitFormEntry } from '@/pages/mr/NewReport';
import type { Doctor } from '@/types/database.types';
import { useProducts } from '@/hooks/useProducts';
import { toast } from 'sonner';

interface Props {
  data: ReportFormData;
  onChange: (d: Partial<ReportFormData>) => void;
  onNext: () => void;
  onBack: () => void;
  hideFooter?: boolean;
}

export default function ReportStep3({ data, onChange, onNext, onBack, hideFooter }: Props) {
  const [activeDoctorId, setActiveDoctorId] = useState<string | null>(null);
  const [deleteDoctorId, setDeleteDoctorId] = useState<string | null>(null);
  const { data: doctors = [], isLoading, isError } = useDoctorsBySubAreas(data.selectedSubAreaIds);
  const { data: products = [] } = useProducts();

  const visitCount = Object.keys(data.visits).length;

  const grouped = data.selectedSubAreaIds.map(saId => {
    const subAreaName =
      doctors.find(d => d.sub_area_id === saId)?.sub_area?.name ?? 'Area';
    const docs = doctors.filter(d => d.sub_area_id === saId);
    return { subAreaId: saId, subAreaName, docs };
  }).filter(g => g.docs.length > 0);

  const handleSaveVisit = (doctorId: string, subAreaId: string, visit: VisitFormEntry) => {
    onChange({
      visits: {
        ...data.visits,
        [doctorId]: { ...visit, doctorId, subAreaId },
      },
    });
    setActiveDoctorId(null);
  };

  const handleDeleteVisit = (doctorId: string) => {
    const next = { ...data.visits };
    delete next[doctorId];
    onChange({ visits: next });
    setDeleteDoctorId(null);
    toast.success('Visit removed');
  };

  const activeDoctor: Doctor | null =
    activeDoctorId ? doctors.find(d => d.id === activeDoctorId) ?? null : null;
  const activeSubAreaId = activeDoctor?.sub_area_id ?? '';

  if (isLoading) {
    return <LoadingSpinner />;
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
                        onClick={() => setActiveDoctorId(doc.id)}
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
