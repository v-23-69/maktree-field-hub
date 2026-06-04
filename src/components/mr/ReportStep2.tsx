import ReportStepFooter from '@/components/mr/ReportStepFooter';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useMrSubAreasGrouped } from '@/hooks/useAreas';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import type { ReportFormData } from '@/pages/mr/NewReport';
import { Check, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Props {
  data: ReportFormData;
  onChange: (d: Partial<ReportFormData>) => void;
  onNext: () => void;
  onBack: () => void;
  hideFooter?: boolean;
  onCanProceedChange?: (canProceed: boolean) => void;
}

export default function ReportStep2({ data, onChange, onNext, onBack, hideFooter, onCanProceedChange }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: grouped = [], isLoading, isError } = useMrSubAreasGrouped(user?.id ?? '');

  const toggleSubArea = (id: string) => {
    const next = data.selectedSubAreaIds.includes(id)
      ? data.selectedSubAreaIds.filter(s => s !== id)
      : [...data.selectedSubAreaIds, id];
    onChange({ selectedSubAreaIds: next });
  };

  const canProceed = data.selectedSubAreaIds.length > 0;

  useEffect(() => {
    onCanProceedChange?.(canProceed);
  }, [canProceed, onCanProceedChange]);

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
    <div className="space-y-5 animate-fade-in w-full max-w-full min-w-0 overflow-x-hidden">
      {data.tpAutoFilled && (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-3.5">
          <p className="text-xs text-primary font-semibold">
            Auto-filled from your tour program for this date
          </p>
        </div>
      )}

      <p className="text-sm font-semibold text-foreground">Select the areas you worked in today</p>
      {user?.role === 'manager' && (
        <div className="rounded-xl border border-sky-500/25 bg-sky-500/5 px-3 py-2.5 flex flex-col sm:flex-row sm:items-center gap-2">
          <p className="text-xs text-sky-900 dark:text-sky-200 flex-1 min-w-0">
            <MapPin className="inline h-3.5 w-3.5 mr-1 shrink-0 text-sky-600" />
            <span className="font-semibold">Field visits (custom)</span> — file DCR for routes outside your tour program.
            {grouped.some(g => g.sub_areas.some(s => s.is_manager_custom))
              ? ' Custom areas you created appear below with a badge.'
              : ' Create a custom area first, then select it here.'}
          </p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8 text-xs rounded-lg shrink-0 border-sky-500/30"
            onClick={() => navigate('/manager/custom-areas')}
          >
            Manage custom areas
          </Button>
        </div>
      )}

      {grouped.map(({ area, sub_areas }) => (
        <div key={area.id} className="animate-fade-in min-w-0 space-y-2">
          <p className="text-sm font-bold text-foreground">{area.name}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {sub_areas.map(sa => {
              const selected = data.selectedSubAreaIds.includes(sa.id);
              return (
                <button
                  key={sa.id}
                  type="button"
                  onClick={() => toggleSubArea(sa.id)}
                  className={cn(
                    'flex items-start gap-2 rounded-xl border-2 p-3 text-left transition-all active:scale-[0.98]',
                    selected
                      ? 'border-primary bg-primary/8 shadow-sm'
                      : 'border-border/70 bg-card hover:border-primary/35',
                  )}
                >
                  <div
                    className={cn(
                      'mt-0.5 h-5 w-5 rounded-md border flex items-center justify-center shrink-0',
                      selected ? 'bg-primary border-primary text-primary-foreground' : 'border-border',
                    )}
                  >
                    {selected && <Check className="h-3 w-3" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground leading-snug flex items-center gap-1.5 flex-wrap">
                      {sa.name}
                      {sa.is_manager_custom && (
                        <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4 bg-sky-500/15 text-sky-800 border-0">
                          Custom
                        </Badge>
                      )}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{area.name}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {!hideFooter && (
        <ReportStepFooter onBack={onBack} onNext={onNext} nextDisabled={!canProceed} />
      )}
    </div>
  );
}
