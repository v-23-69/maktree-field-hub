import ReportStepFooter from '@/components/mr/ReportStepFooter';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { useManagers, useWorkingWithReportOptions } from '@/hooks/useManagers';
import { useManagerMrs } from '@/hooks/useManagerTeam';
import type { ReportFormData } from '@/pages/mr/NewReport';
import type { ReportKind } from '@/lib/dcrLabels';
import { useAuth } from '@/hooks/useAuth';
import { useAllowedReportDates } from '@/hooks/useReport';
import { cn } from '@/lib/utils';
import { useEffect, useCallback, useMemo } from 'react';
import { formatShortDateIst } from '@/lib/dateUtils';

function Avatar({ src, name, size = 'md' }: { src?: string | null; name: string; size?: 'sm' | 'md' }) {
  const px = size === 'md' ? 'h-10 w-10' : 'h-8 w-8';
  const text = size === 'md' ? 'text-xs' : 'text-[10px]';
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  if (src) {
    return <img src={src} alt={name} className={`${px} rounded-full object-cover ring-2 ring-primary/10`} />;
  }
  return (
    <div className={`${px} rounded-full bg-primary/10 flex items-center justify-center ring-2 ring-primary/10`}>
      <span className={`${text} font-bold text-primary`}>{initials}</span>
    </div>
  );
}

function WorkingWithCard({
  name,
  photo,
  roleLabel,
  selected,
  onClick,
}: {
  name: string;
  photo?: string | null;
  roleLabel: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex flex-col items-center gap-2 rounded-2xl border-2 p-3 text-center transition-all active:scale-[0.98] min-h-[108px]',
        selected
          ? 'border-primary bg-primary/8 shadow-sm ring-2 ring-primary/15'
          : 'border-border/70 bg-card hover:border-primary/35',
      )}
    >
      <Avatar src={photo} name={name} size="md" />
      <div className="min-w-0 w-full">
        <p className="text-xs font-bold text-foreground leading-tight line-clamp-2">{name}</p>
        <Badge variant="outline" className="text-[9px] mt-1 h-5 px-1.5">
          {roleLabel}
        </Badge>
      </div>
    </button>
  );
}

interface Props {
  data: ReportFormData;
  onChange: (d: Partial<ReportFormData>) => void;
  onNext: () => void;
  hideFooter?: boolean;
  onCanProceedChange?: (canProceed: boolean) => void;
}

const DCR_TYPE_OPTIONS: { value: ReportKind; label: string; mrOnly?: boolean; managerOnly?: boolean }[] = [
  { value: 'field', label: 'Field work' },
  { value: 'stockist_visit', label: 'Stockist visit' },
  { value: 'meeting', label: 'Meeting DCR' },
  { value: 'sunday', label: 'Sunday DCR' },
  { value: 'strike', label: 'Strike DCR' },
  { value: 'holiday', label: 'Holiday DCR' },
  { value: 'leave', label: 'Leave DCR', mrOnly: true },
  { value: 'admin_day', label: 'Admin day', managerOnly: true },
  { value: 'sales_closing', label: 'Sales & closing', managerOnly: true },
];

export default function ReportStep1({ data, onChange, onNext, hideFooter, onCanProceedChange }: Props) {
  const { user } = useAuth();
  const reportKind = data.reportKind ?? 'field';
  const isFieldDcr = reportKind === 'field';

  const {
    data: workingOptions = [],
    isLoading: workingLoading,
    isError: workingError,
  } = useWorkingWithReportOptions(user?.id, user?.role);
  const { data: managersFallback = [], isLoading: mgrFbLoading, isError: mgrFbError } = useManagers();
  const isManagerReporter = user?.role === 'manager';

  const teamMrs = isManagerReporter ? workingOptions.filter(o => o.option_kind === 'team_mr') : [];
  const peerManagers = workingOptions.filter(o => o.option_kind === 'peer_manager');
  const linkedManagers = workingOptions.filter(o => o.option_kind === 'linked_manager');

  const { data: dashboardMrs = [] } = useManagerMrs(isManagerReporter ? (user?.id ?? '') : '');
  const effectiveTeamMrs =
    teamMrs.length > 0
      ? teamMrs
      : dashboardMrs.map(u => ({
          id: u.id,
          full_name: u.full_name ?? '',
          employee_code: u.employee_code ?? '',
          role: typeof u.role === 'string' ? u.role : String(u.role ?? 'mr'),
          option_kind: 'team_mr' as const,
          profile_photo_url: u.profile_photo_url ?? null,
        }));

  const isLoading = workingLoading || (!isManagerReporter && mgrFbLoading);
  const isError = workingError || (!isManagerReporter && mgrFbError);

  const toggleWorkingWith = useCallback(
    (id: string) => {
      const current = data.workingWithIds ?? [];
      const next = current.includes(id) ? current.filter(x => x !== id) : [...current, id];
      onChange({ workingWithIds: next, workingWithId: next[0] ?? '' });
    },
    [data.workingWithIds, onChange],
  );

  const {
    data: allowedDates = [],
    isLoading: allowedLoading,
    isError: allowedError,
  } = useAllowedReportDates(user?.id ?? '');

  const selectedDateRow = allowedDates.find(d => d.report_date === data.date);
  const suggestedKind = useMemo((): ReportKind | null => {
    if (!selectedDateRow) return null;
    if (selectedDateRow.day_type === 'sunday') return 'sunday';
    if (selectedDateRow.day_type === 'leave' && user?.role === 'mr') return 'leave';
    if (selectedDateRow.day_type === 'strike') return 'strike';
    if (selectedDateRow.day_type === 'holiday') return 'holiday';
    return null;
  }, [selectedDateRow, user?.role]);

  const dcrTypeOptions = DCR_TYPE_OPTIONS.filter(o => {
    if (o.mrOnly && user?.role !== 'mr') return false
    if (o.managerOnly && user?.role !== 'manager') return false
    return true
  });

  const setReportKind = (kind: ReportKind) => {
    onChange({
      reportKind: kind,
      ...(kind !== 'field'
        ? {
            selectedSubAreaIds: [],
            visits: {},
            workingWithIds: [],
            workingWithId: '',
            tpAutoFilled: false,
          }
        : {}),
      ...(kind === 'leave'
        ? { leaveDcrCategory: 'casual', leaveDcrRemark: '' }
        : { leaveDcrCategory: '', leaveDcrRemark: '' }),
      ...(kind === 'meeting'
        ? {
            meetingDurationType: 'full_day',
            meetingStartTime: '09:00',
            meetingEndTime: '18:00',
            meetingType: 'weekly',
            meetingAttendeeIds: user?.id ? [user.id] : [],
            meetingNotes: '',
          }
        : {}),
      ...(kind === 'admin_day' || kind === 'sales_closing'
        ? {
            adminDayStartTime: '09:00',
            adminDayEndTime: '18:00',
            adminDayNotes: '',
          }
        : {}),
      ...(kind === 'stockist_visit'
        ? {
            stockistId: '',
            stockistHqAreaId: '',
            stockistMeetTime: '10:00',
            stockistNotes: '',
          }
        : {}),
    });
  };

  useEffect(() => {
    if (allowedLoading) return;
    if (!allowedDates || allowedDates.length === 0) return;
    const selected = allowedDates.find(d => d.report_date === data.date);
    if (selected && selected.already_submitted === false) return;
    const firstSelectable = allowedDates.find(d => d.already_submitted === false);
    const nextDate = firstSelectable?.report_date ?? allowedDates[0]?.report_date ?? '';
    if (nextDate && nextDate !== data.date) onChange({ date: nextDate });
  }, [allowedLoading, allowedDates, data.date, onChange]);

  const mrWorkingWithAllowedIds = useMemo(() => {
    if (isManagerReporter) return null;
    const s = new Set<string>();
    for (const o of workingOptions) {
      if (o.role === 'manager' || o.option_kind === 'linked_manager') s.add(o.id);
    }
    for (const m of managersFallback) s.add(m.id);
    return s;
  }, [isManagerReporter, workingOptions, managersFallback]);

  useEffect(() => {
    if (isManagerReporter || workingLoading || !mrWorkingWithAllowedIds) return;
    const cur = data.workingWithIds ?? [];
    const next = cur.filter(id => mrWorkingWithAllowedIds.has(id));
    if (next.length !== cur.length) {
      onChange({ workingWithIds: next, workingWithId: next[0] ?? '' });
    }
  }, [isManagerReporter, workingLoading, mrWorkingWithAllowedIds, data.workingWithIds, onChange]);

  const selectedAlreadySubmitted = !!selectedDateRow?.already_submitted;
  const allSubmitted = allowedDates.length > 0 && allowedDates.every(d => d.already_submitted);
  const canProceed = !!selectedDateRow?.report_date && !selectedAlreadySubmitted && !allSubmitted;

  useEffect(() => {
    onCanProceedChange?.(canProceed);
  }, [canProceed, onCanProceedChange]);

  const mgrs =
    linkedManagers.length > 0
      ? linkedManagers
      : managersFallback.map(m => ({
          ...m,
          option_kind: 'linked_manager' as const,
          employee_code: m.employee_code ?? '',
        }));

  return (
    <div className="space-y-5 animate-fade-in min-w-0">
      {data.tpAutoFilled && isFieldDcr && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-3">
          <p className="text-xs text-primary font-medium">
            Auto-filled from your tour program for this date
          </p>
        </div>
      )}

      <div className="space-y-2">
        <Label>Date</Label>
        {allowedLoading ? (
          <LoadingSpinner />
        ) : allowedError ? (
          <p className="text-xs text-destructive">Could not load allowed report dates.</p>
        ) : allowedDates.length === 0 ? (
          <p className="text-xs text-muted-foreground">No report dates available.</p>
        ) : (
          <div className="grid grid-cols-1 gap-2">
            {allowedDates.slice(0, 3).map((d, idx) => {
              const whenLabel = idx === 0 ? 'Today' : idx === 1 ? 'Yesterday' : 'Day Before';
              const isSelected = d.report_date === data.date;
              const isSubmitted = d.already_submitted;
              return (
                <button
                  key={d.report_date}
                  type="button"
                  disabled={isSubmitted}
                  onClick={() => {
                    if (isSubmitted) return;
                    onChange({ date: d.report_date });
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
                      <p className="text-xs text-muted-foreground mt-0.5">{formatShortDateIst(d.report_date)}</p>
                    </div>
                    {isSubmitted ? (
                      <Badge className="bg-emerald-600/10 text-emerald-800 border-emerald-600/30">Submitted</Badge>
                    ) : (
                      <Badge variant="outline" className="opacity-70 text-muted-foreground">
                        Select
                      </Badge>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label>Working mode</Label>
        <Select value={reportKind} onValueChange={v => setReportKind(v as ReportKind)}>
          <SelectTrigger className="h-11 rounded-xl">
            <SelectValue placeholder="Choose DCR type" />
          </SelectTrigger>
          <SelectContent>
            {dcrTypeOptions.map(o => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {suggestedKind && suggestedKind !== reportKind && (
          <p className="text-[11px] text-muted-foreground">
            Suggested for this date:{' '}
            <button
              type="button"
              className="font-semibold text-primary underline-offset-2 hover:underline"
              onClick={() => setReportKind(suggestedKind)}
            >
              {DCR_TYPE_OPTIONS.find(o => o.value === suggestedKind)?.label}
            </button>
          </p>
        )}
      </div>

      {reportKind === 'leave' && user?.role === 'mr' && (
        <div className="rounded-xl border border-violet-500/30 bg-violet-500/5 p-3 text-xs text-violet-900 dark:text-violet-100">
          Leave DCR: next step asks for leave type and remark only.
        </div>
      )}
      {reportKind === 'sunday' && (
        <div className="rounded-xl border border-sky-500/30 bg-sky-500/5 p-3 text-xs text-sky-900 dark:text-sky-100">
          Sunday DCR: confirm no field visits on the next step.
        </div>
      )}
      {reportKind === 'strike' && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
          Strike DCR: record strike for this date on the next step.
        </div>
      )}
      {reportKind === 'holiday' && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-900 dark:text-amber-100">
          Holiday DCR: confirm no field activity on the next step.
        </div>
      )}

      {isFieldDcr && (
        <div className="space-y-3">
          <Label>Working with (optional)</Label>
          {!isManagerReporter && (
            <p className="text-[11px] text-muted-foreground leading-snug">
              Tap cards to select managers you worked with. Solo visit clears all selections.
            </p>
          )}
          {isLoading ? (
            <LoadingSpinner />
          ) : (
            <>
              <Button
                type="button"
                variant={data.workingWithIds.length === 0 ? 'default' : 'outline'}
                className="w-full h-11 rounded-xl font-semibold"
                onClick={() => onChange({ workingWithIds: [], workingWithId: '' })}
              >
                Solo visit
              </Button>

              {isManagerReporter && effectiveTeamMrs.length > 0 && (
                <div className="space-y-2">
                  <p className="section-title">Your MR team</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {effectiveTeamMrs.map(m => (
                      <WorkingWithCard
                        key={m.id}
                        name={m.full_name}
                        photo={m.profile_photo_url}
                        roleLabel="MR"
                        selected={data.workingWithIds.includes(m.id)}
                        onClick={() => toggleWorkingWith(m.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {isManagerReporter && peerManagers.length > 0 && (
                <div className="space-y-2">
                  <p className="section-title">Managers</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {peerManagers.map(m => (
                      <WorkingWithCard
                        key={m.id}
                        name={m.full_name}
                        photo={m.profile_photo_url}
                        roleLabel="Manager"
                        selected={data.workingWithIds.includes(m.id)}
                        onClick={() => toggleWorkingWith(m.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {!isManagerReporter && mgrs.length > 0 && (
                <div className="space-y-2">
                  <p className="section-title">Managers</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {mgrs.map(m => {
                      const photo =
                        'profile_photo_url' in m
                          ? (m as { profile_photo_url?: string | null }).profile_photo_url
                          : null;
                      return (
                        <WorkingWithCard
                          key={m.id}
                          name={m.full_name}
                          photo={photo}
                          roleLabel="Manager"
                          selected={data.workingWithIds.includes(m.id)}
                          onClick={() => toggleWorkingWith(m.id)}
                        />
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
          {isError && (
            <p className="text-xs text-destructive">Could not load colleagues for Working With</p>
          )}
        </div>
      )}

      {!hideFooter && (
        <ReportStepFooter showBack={false} onNext={onNext} nextDisabled={!canProceed} />
      )}
    </div>
  );
}
