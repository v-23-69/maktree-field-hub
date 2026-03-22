import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { MOCK_USERS } from '@/lib/mock-data';
import type { ReportFormData } from '@/pages/mr/NewReport';

interface Props {
  data: ReportFormData;
  onChange: (d: Partial<ReportFormData>) => void;
  onNext: () => void;
}

export default function ReportStep1({ data, onChange, onNext }: Props) {
  const managers = MOCK_USERS.filter(u => u.role === 'manager' && u.is_active);
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-5 animate-fade-in-up">
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
      </div>

      <Button
        onClick={onNext}
        className="w-full touch-target rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
      >
        Next
      </Button>
    </div>
  );
}
