import { Button } from '@/components/ui/button';
import { MOCK_AREAS, MOCK_SUB_AREAS } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import type { ReportFormData } from '@/pages/mr/NewReport';

interface Props {
  data: ReportFormData;
  onChange: (d: Partial<ReportFormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function ReportStep2({ data, onChange, onNext, onBack }: Props) {
  const toggleArea = (id: string) => {
    const next = data.selectedAreaIds.includes(id)
      ? data.selectedAreaIds.filter(a => a !== id)
      : [...data.selectedAreaIds, id];
    // Remove sub-areas of deselected areas
    const validSubAreas = data.selectedSubAreaIds.filter(sid => {
      const sa = MOCK_SUB_AREAS.find(s => s.id === sid);
      return sa && next.includes(sa.area_id);
    });
    onChange({ selectedAreaIds: next, selectedSubAreaIds: validSubAreas });
  };

  const toggleSubArea = (id: string) => {
    const next = data.selectedSubAreaIds.includes(id)
      ? data.selectedSubAreaIds.filter(s => s !== id)
      : [...data.selectedSubAreaIds, id];
    onChange({ selectedSubAreaIds: next });
  };

  const canProceed = data.selectedSubAreaIds.length > 0;

  return (
    <div className="space-y-5 animate-fade-in-up">
      <div>
        <p className="text-sm font-medium text-foreground mb-3">Select your working areas today</p>
        <div className="flex flex-wrap gap-2">
          {MOCK_AREAS.filter(a => a.is_active).map(area => (
            <button
              key={area.id}
              onClick={() => toggleArea(area.id)}
              className={cn(
                'rounded-full px-4 py-2 text-sm font-medium border transition-colors touch-target active:scale-95',
                data.selectedAreaIds.includes(area.id)
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card text-foreground border-border hover:border-primary/50'
              )}
            >
              {area.name}
            </button>
          ))}
        </div>
      </div>

      {data.selectedAreaIds.length > 0 && (
        <div className="space-y-3">
          {data.selectedAreaIds.map(areaId => {
            const area = MOCK_AREAS.find(a => a.id === areaId);
            const subAreas = MOCK_SUB_AREAS.filter(sa => sa.area_id === areaId && sa.is_active);
            return (
              <div key={areaId}>
                <p className="text-xs font-medium text-muted-foreground mb-2">{area?.name}</p>
                <div className="flex flex-wrap gap-2">
                  {subAreas.map(sa => (
                    <button
                      key={sa.id}
                      onClick={() => toggleSubArea(sa.id)}
                      className={cn(
                        'rounded-full px-3 py-1.5 text-xs font-medium border transition-colors touch-target active:scale-95',
                        data.selectedSubAreaIds.includes(sa.id)
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-card text-foreground border-border'
                      )}
                    >
                      {sa.name}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1 touch-target rounded-lg">Back</Button>
        <Button onClick={onNext} disabled={!canProceed} className="flex-1 touch-target rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-semibold">Next</Button>
      </div>
    </div>
  );
}
