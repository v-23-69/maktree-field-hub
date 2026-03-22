import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MOCK_DOCTORS } from '@/lib/mock-data';
import { CheckCircle2, Plus } from 'lucide-react';
import DoctorVisitDrawer from '@/components/mr/DoctorVisitDrawer';
import { cn } from '@/lib/utils';
import type { ReportFormData } from '@/pages/mr/NewReport';

interface Props {
  data: ReportFormData;
  onChange: (d: Partial<ReportFormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function ReportStep3({ data, onChange, onNext, onBack }: Props) {
  const [activeDoctorId, setActiveDoctorId] = useState<string | null>(null);

  const doctors = MOCK_DOCTORS.filter(d => data.selectedSubAreaIds.includes(d.sub_area_id) && d.is_active);
  const visitCount = Object.keys(data.visits).length;

  const handleSaveVisit = (doctorId: string, visit: ReportFormData['visits'][string]) => {
    onChange({ visits: { ...data.visits, [doctorId]: visit } });
    setActiveDoctorId(null);
  };

  return (
    <div className="space-y-4 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-foreground">Add Doctor Visits</p>
        <span className="text-xs text-muted-foreground">{visitCount} visited</span>
      </div>

      {doctors.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">No doctors found in selected sub-areas.</p>
      ) : (
        <div className="space-y-2">
          {doctors.map((doc, i) => {
            const hasVisit = !!data.visits[doc.id];
            return (
              <button
                key={doc.id}
                onClick={() => setActiveDoctorId(doc.id)}
                className="w-full flex items-center gap-3 rounded-xl bg-card p-4 shadow-sm text-left active:scale-[0.98] transition-transform animate-fade-in-up"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="flex-1">
                  <p className="font-medium text-foreground text-sm">{doc.name}</p>
                  <p className="text-xs text-muted-foreground">{doc.speciality}</p>
                </div>
                {hasVisit ? (
                  <CheckCircle2 className="h-6 w-6 text-primary shrink-0" />
                ) : (
                  <div className="flex items-center gap-1 text-xs font-medium text-primary">
                    <Plus className="h-4 w-4" />
                    Add Visit
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      <DoctorVisitDrawer
        open={!!activeDoctorId}
        onClose={() => setActiveDoctorId(null)}
        doctor={doctors.find(d => d.id === activeDoctorId) || null}
        existingVisit={activeDoctorId ? data.visits[activeDoctorId] : undefined}
        onSave={handleSaveVisit}
      />

      <div className="flex gap-3 pt-2">
        <Button variant="outline" onClick={onBack} className="flex-1 touch-target rounded-lg">Back</Button>
        <Button onClick={onNext} className="flex-1 touch-target rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-semibold">Next</Button>
      </div>
    </div>
  );
}
