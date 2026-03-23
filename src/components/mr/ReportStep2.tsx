import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useMrSubAreasGrouped } from '@/hooks/useAreas';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import type { ReportFormData } from '@/pages/mr/NewReport';

interface Props {
  data: ReportFormData;
  onChange: (d: Partial<ReportFormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function ReportStep2({ data, onChange, onNext, onBack }: Props) {
  const { user } = useAuth();
  const { data: grouped = [], isLoading, isError } = useMrSubAreasGrouped(user?.id ?? '');

  const toggleSubArea = (id: string) => {
    const next = data.selectedSubAreaIds.includes(id)
      ? data.selectedSubAreaIds.filter(s => s !== id)
      : [...data.selectedSubAreaIds, id];
    onChange({ selectedSubAreaIds: next });
  };

  const canProceed = data.selectedSubAreaIds.length > 0;

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (isError) {
    return (
      <div className="space-y-4">
        <EmptyState message="Could not load your assigned areas. Try again later." />
        <Button variant="outline" onClick={onBack} className="w-full touch-target rounded-lg">Back</Button>
      </div>
    );
  }

  if (grouped.length === 0) {
    return (
      <div className="space-y-4">
        <EmptyState message="No sub-areas assigned to your account. Contact your administrator." />
        <Button variant="outline" onClick={onBack} className="w-full touch-target rounded-lg">Back</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in w-full max-w-full min-w-0 overflow-x-hidden">
      <p className="text-sm font-medium text-foreground">Select the sub-areas you worked in today</p>

      {grouped.map(({ area, sub_areas }) => (
        <div key={area.id} className="animate-fade-in min-w-0">
          <p className="text-sm font-semibold text-foreground mb-2.5 break-words">{area.name}</p>
          <div className="flex flex-wrap gap-2 max-w-full">
            {sub_areas.map(sa => {
              const selected = data.selectedSubAreaIds.includes(sa.id);
              return (
                <button
                  key={sa.id}
                  type="button"
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
      ))}

      <div className="fixed bottom-20 left-0 right-0 px-4 pb-3 pt-2 bg-background/95 backdrop-blur-sm border-t border-border">
        <div className="flex gap-3 max-w-lg mx-auto">
          <Button variant="outline" onClick={onBack} className="flex-1 touch-target rounded-lg">Back</Button>
          <Button onClick={onNext} disabled={!canProceed} className="flex-1 touch-target rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-semibold">Next</Button>
        </div>
      </div>
    </div>
  );
}
