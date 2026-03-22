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
    <div className="space-y-5 animate-fade-in">
      <div>
        <p className="text-sm font-medium text-foreground mb-3">Select your working areas today</p>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {MOCK_AREAS.filter(a => a.is_active).map(area => {
            const selected = data.selectedAreaIds.includes(area.id);
            return (
              <button
                key={area.id}
                onClick={() => toggleArea(area.id)}
                className={cn(
                  'shrink-0 rounded-full px-4 py-2 text-sm font-medium border transition-all duration-150 touch-target active:scale-95',
                  selected
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card text-primary border-primary/40 hover:border-primary'
                )}
              >
                {area.name}
              </button>
            );
          })}
        </div>
      </div>

      {data.selectedAreaIds.map(areaId => {
        const area = MOCK_AREAS.find(a => a.id === areaId);
        const subAreas = MOCK_SUB_AREAS.filter(sa => sa.area_id === areaId && sa.is_active);
        if (!subAreas.length) return null;
        return (
          <div
            key={areaId}
            className="animate-fade-in"
          >
            <p className="text-xs font-medium text-muted-foreground mb-2">{area?.name} — Sub Areas</p>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {subAreas.map(sa => {
                const selected = data.selectedSubAreaIds.includes(sa.id);
                return (
                  <button
                    key={sa.id}
                    onClick={() => toggleSubArea(sa.id)}
                    className={cn(
                      'shrink-0 rounded-full px-3 py-1.5 text-xs font-medium border transition-all duration-150 touch-target active:scale-95',
                      selected
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-card text-primary border-primary/40 hover:border-primary'
                    )}
                  >
                    {sa.name}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      <div className="fixed bottom-20 left-0 right-0 px-4 pb-3 pt-2 bg-background/95 backdrop-blur-sm border-t border-border">
        <div className="flex gap-3 max-w-lg mx-auto">
          <Button variant="outline" onClick={onBack} className="flex-1 touch-target rounded-lg">Back</Button>
          <Button onClick={onNext} disabled={!canProceed} className="flex-1 touch-target rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-semibold">Next</Button>
        </div>
      </div>
    </div>
  );
}
