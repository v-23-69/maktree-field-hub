import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { useManagers } from '@/hooks/useManagers';
import type { ReportFormData } from '@/pages/mr/NewReport';
import { useAuth } from '@/hooks/useAuth';
import { useAllowedReportDates } from '@/hooks/useReport';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';

interface Props {
  data: ReportFormData;
  onChange: (d: Partial<ReportFormData>) => void;
  onNext: () => void;
}

export default function ReportStep1({ data, onChange, onNext }: Props) {
  const { data: managers = [], isLoading, isError } = useManagers();
  const { user } = useAuth();

  const {
    data: allowedDates = [],
    isLoading: allowedLoading,
    isError: allowedError,
  } = useAllowedReportDates(user?.id ?? '');

  useEffect(() => {
    if (allowedLoading) return
    if (!allowedDates || allowedDates.length === 0) return

    const selected = allowedDates.find(d => d.report_date === data.date)
    if (selected && selected.already_submitted === false) return

    const firstSelectable = allowedDates.find(d => d.already_submitted === false)
    const nextDate = firstSelectable?.report_date ?? allowedDates[0]?.report_date ?? ''
    if (nextDate && nextDate !== data.date) onChange({ date: nextDate })
  }, [allowedLoading, allowedDates, data.date, onChange])

  const selected = allowedDates.find(d => d.report_date === data.date)
  const selectedAlreadySubmitted = !!selected?.already_submitted
  const allSubmitted = allowedDates.length > 0 && allowedDates.every(d => d.already_submitted)

  const canProceed = !!selected?.report_date && !selectedAlreadySubmitted && !allSubmitted

  return (
    <div className="space-y-5 animate-fade-in">
      {data.tpAutoFilled && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-3">
          <p className="text-xs text-primary font-medium">
            Auto-filled from your tour program for this date
          </p>
        </div>
      )}
      <div className="space-y-2">
        <Label>Date Options</Label>

        {allowedLoading ? (
          <LoadingSpinner />
        ) : allowedError ? (
          <p className="text-xs text-destructive">Could not load allowed report dates.</p>
        ) : allowedDates.length === 0 ? (
          <p className="text-xs text-muted-foreground">No report dates available.</p>
        ) : (
          <div className="grid grid-cols-1 gap-2">
            {allowedDates.slice(0, 3).map((d, idx) => {
              const whenLabel = idx === 0 ? 'Today' : idx === 1 ? 'Yesterday' : 'Day Before'
              const dt = new Date(d.report_date)
              const weekday = dt.toLocaleDateString(undefined, { weekday: 'short' })
              const day = dt.getDate()
              const month = dt.toLocaleDateString(undefined, { month: 'short' })

              const isSelected = d.report_date === data.date
              const isSubmitted = d.already_submitted

              return (
                <button
                  key={d.report_date}
                  type="button"
                  disabled={isSubmitted}
                  onClick={() => {
                    if (isSubmitted) return
                    onChange({ date: d.report_date })
                  }}
                  className={cn(
                    'rounded-xl border p-3 text-left touch-target active:scale-[0.99] transition',
                    isSelected && !isSubmitted
                      ? 'border-emerald-600/70 bg-emerald-600/5'
                      : 'border-border bg-card hover:border-primary/40',
                    isSubmitted && 'opacity-80 cursor-not-allowed',
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{whenLabel}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {weekday} {day} {month}
                      </p>
                    </div>

                    {isSubmitted ? (
                      <Badge className="bg-emerald-600/10 text-emerald-800 border-emerald-600/30">
                        Submitted ✓
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="opacity-70 text-muted-foreground">
                        Select
                      </Badge>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {allowedDates.length > 0 && allSubmitted && (
          <div className="pt-2">
            <p className="text-sm font-semibold text-emerald-700">
              All reports up to date! ✓
            </p>
          </div>
        )}
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
            disabled={!canProceed}
            className="w-full touch-target rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
