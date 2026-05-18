import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useDoctorsBySubAreas } from '@/hooks/useDoctors';
import { CheckCircle2, Pencil, Plus, Trash2 } from 'lucide-react';
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
}

export default function ReportStep3({ data, onChange, onNext, onBack }: Props) {
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
      <div className="space-y-4 pb-36">
        <EmptyState message="Could not load doctors for the selected areas." />
        <Button variant="outline" onClick={onBack} className="w-full touch-target rounded-lg">Back</Button>
      </div>
    );
  }

  const deleteDoctorName = deleteDoctorId
    ? doctors.find(d => d.id === deleteDoctorId)?.full_name ?? 'this doctor'
    : '';

  return (
    <div className="space-y-4 animate-fade-in pb-36">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-foreground">Add Doctor Visits</p>
        <span className="text-xs font-semibold text-primary bg-primary/10 rounded-full px-2.5 py-0.5">{visitCount} visited</span>
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
                  return (
                    <div
                      key={doc.id}
                      className={cn(
                        'w-full max-w-full min-w-0 flex items-center gap-2 sm:gap-3 rounded-xl p-3 sm:p-4 shadow-sm overflow-hidden animate-fade-in',
                        hasVisit ? 'bg-primary/5 border border-primary/20' : 'bg-card',
                      )}
                      style={{ animationDelay: `${i * 40}ms` }}
                    >
                      <button
                        type="button"
                        onClick={() => setActiveDoctorId(doc.id)}
                        className="flex-1 min-w-0 flex items-center gap-2 sm:gap-3 text-left active:scale-[0.98] transition-all"
                      >
                        <div className="flex-1 min-w-0 overflow-hidden">
                          <p className="font-semibold text-foreground text-sm truncate">{doc.full_name}</p>
                          <p className="text-xs text-muted-foreground">{doc.speciality}</p>
                        </div>
                        {hasVisit ? (
                          <div className="flex items-center gap-1.5 text-xs font-medium text-primary shrink-0">
                            <CheckCircle2 className="h-4 w-4" />
                            <Pencil className="h-3.5 w-3.5" />
                            <span>Edit</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-xs font-medium text-primary shrink-0">
                            <Plus className="h-4 w-4" />
                            <span>Add Visit</span>
                          </div>
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

      <ReportStepFooter onBack={onBack} onNext={onNext} />
    </div>
  );
}
