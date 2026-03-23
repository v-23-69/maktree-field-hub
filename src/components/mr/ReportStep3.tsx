import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useDoctorsBySubAreas } from '@/hooks/useDoctors';
import { CheckCircle2, Pencil, Plus } from 'lucide-react';
import DoctorVisitDrawer from '@/components/mr/DoctorVisitDrawer';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import { cn } from '@/lib/utils';
import type { ReportFormData, VisitFormEntry } from '@/pages/mr/NewReport';
import type { Doctor } from '@/types/database.types';
import { useProducts } from '@/hooks/useProducts';

interface Props {
  data: ReportFormData;
  onChange: (d: Partial<ReportFormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function ReportStep3({ data, onChange, onNext, onBack }: Props) {
  const [activeDoctorId, setActiveDoctorId] = useState<string | null>(null);
  const { data: doctors = [], isLoading, isError } = useDoctorsBySubAreas(data.selectedSubAreaIds);
  const { data: products = [] } = useProducts();

  const visitCount = Object.keys(data.visits).length;

  const grouped = data.selectedSubAreaIds.map(saId => {
    const subAreaName =
      doctors.find(d => d.sub_area_id === saId)?.sub_area?.name ?? 'Sub-area';
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

  const activeDoctor: Doctor | null =
    activeDoctorId ? doctors.find(d => d.id === activeDoctorId) ?? null : null;
  const activeSubAreaId = activeDoctor?.sub_area_id ?? '';

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (isError) {
    return (
      <div className="space-y-4 pb-20">
        <EmptyState message="Could not load doctors for the selected sub-areas." />
        <Button variant="outline" onClick={onBack} className="w-full touch-target rounded-lg">Back</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in pb-20">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-foreground">Add Doctor Visits</p>
        <span className="text-xs font-semibold text-primary bg-primary/10 rounded-full px-2.5 py-0.5">{visitCount} visited</span>
      </div>

      {grouped.length === 0 ? (
        <EmptyState message="No doctors found in selected sub-areas." />
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
                    <button
                      key={doc.id}
                      type="button"
                      onClick={() => setActiveDoctorId(doc.id)}
                      className={cn(
                        'w-full max-w-full min-w-0 flex items-center gap-2 sm:gap-3 rounded-xl p-3 sm:p-4 shadow-sm text-left active:scale-[0.98] transition-all duration-150 animate-fade-in overflow-hidden',
                        hasVisit ? 'bg-primary/5 border border-primary/20' : 'bg-card'
                      )}
                      style={{ animationDelay: `${i * 40}ms` }}
                    >
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <p className="font-semibold text-foreground text-sm truncate text-left">{doc.full_name}</p>
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

      <div className="fixed bottom-20 left-0 right-0 px-4 pb-3 pt-2 bg-background/95 backdrop-blur-sm border-t border-border">
        <div className="flex gap-3 max-w-lg mx-auto">
          <Button variant="outline" onClick={onBack} className="flex-1 touch-target rounded-lg">Back</Button>
          <Button onClick={onNext} className="flex-1 touch-target rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-semibold">Next</Button>
        </div>
      </div>
    </div>
  );
}
