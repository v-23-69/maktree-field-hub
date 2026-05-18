import ReportStepFooter from '@/components/mr/ReportStepFooter';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useMrSubAreasGrouped } from '@/hooks/useAreas';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import type { ReportFormData } from '@/pages/mr/NewReport';
import { Check } from 'lucide-react';

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

  if (isLoading) return <LoadingSpinner />;

  if (isError) {
    return (
      <div className="space-y-4">
        <EmptyState message="Could not load your assigned areas. Try again later." />
        <Button variant="outline" onClick={onBack} className="w-full touch-target rounded-2xl">Back</Button>
      </div>
    );
  }

  if (grouped.length === 0) {
    return (
      <div className="space-y-4">
        <EmptyState
          message={
            user?.role === 'manager'
              ? 'No territory/area assigned to your account. Assign an area to self from Manager Dashboard.'
              : 'No territory/area assigned to your account. Contact your manager.'
          }
        />
        <Button variant="outline" onClick={onBack} className="w-full touch-target rounded-2xl">Back</Button>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in w-full max-w-full min-w-0 overflow-x-hidden pb-36">
      {data.tpAutoFilled && (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-3.5">
          <p className="text-xs text-primary font-semibold">
            Auto-filled from your tour program for this date
          </p>
        </div>
      )}

      <p className="text-sm font-semibold text-foreground">Select the areas you worked in today</p>

      {grouped.map(({ area, sub_areas }) => (
        <div key={area.id} className="animate-fade-in min-w-0">
          <p className="section-title mb-2.5">{area.name}</p>
          <div className="flex flex-wrap gap-2 max-w-full">
            {sub_areas.map(sa => {
              const selected = data.selectedSubAreaIds.includes(sa.id);
              return (
                <button
                  key={sa.id}
                  type="button"
                  onClick={() => toggleSubArea(sa.id)}
                  className={cn(
                    'inline-flex items-center gap-1.5 shrink-0 rounded-full px-3.5 py-2 text-xs font-semibold border-2 transition-all duration-150 active:scale-95',
                    selected
                      ? 'bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/20'
                      : 'bg-card text-foreground border-border/60 hover:border-primary/40'
                  )}
                >
                  {selected && <Check className="h-3 w-3" />}
                  {sa.name}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <ReportStepFooter onBack={onBack} onNext={onNext} nextDisabled={!canProceed} />
    </div>
  );
}
