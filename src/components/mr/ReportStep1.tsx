import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { todayInputDate } from '@/lib/dateUtils';
import { useManagers } from '@/hooks/useManagers';
import type { ReportFormData } from '@/pages/mr/NewReport';

interface Props {
  data: ReportFormData;
  onChange: (d: Partial<ReportFormData>) => void;
  onNext: () => void;
}

export default function ReportStep1({ data, onChange, onNext }: Props) {
  const { data: managers = [], isLoading, isError } = useManagers();
  const today = todayInputDate();

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="space-y-2">
        <Label>Date</Label>
        <Input
          type="date"
          value={data.date}
          max={today}
          onChange={e => onChange({ date: e.target.value })}
          className="touch-target rounded-lg"
        />
      </div>

      <div className="space-y-2">
        <Label>Working With (Optional)</Label>
        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <select
            value={data.workingWithId}
            onChange={e => onChange({ workingWithId: e.target.value })}
            className="flex h-11 w-full rounded-lg border border-input bg-card px-3 text-sm text-foreground touch-target"
          >
            <option value="">Solo visit</option>
            {managers.map(m => (
              <option key={m.id} value={m.id}>{m.full_name}</option>
            ))}
          </select>
        )}
        {isError && (
          <p className="text-xs text-destructive">Could not load managers</p>
        )}
      </div>

      <div className="fixed bottom-20 left-0 right-0 px-4 pb-3 pt-2 bg-background/95 backdrop-blur-sm border-t border-border">
        <div className="max-w-lg mx-auto">
          <Button
            onClick={onNext}
            className="w-full touch-target rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
