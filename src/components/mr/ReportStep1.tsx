import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { useManagers, useWorkingWithReportOptions } from '@/hooks/useManagers';
import { useManagerMrs } from '@/hooks/useManagerTeam';
import type { ReportFormData } from '@/pages/mr/NewReport';
import { useAuth } from '@/hooks/useAuth';
import { useAllowedReportDates } from '@/hooks/useReport';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useEffect, useCallback } from 'react';

function Avatar({ src, name, size = 'sm' }: { src?: string | null; name: string; size?: 'sm' | 'md' }) {
  const px = size === 'md' ? 'h-9 w-9' : 'h-7 w-7';
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

interface Props {
  data: ReportFormData;
  onChange: (d: Partial<ReportFormData>) => void;
  onNext: () => void;
}

export default function ReportStep1({ data, onChange, onNext }: Props) {
  const { user } = useAuth();
  const {
    data: workingOptions = [],
    isLoading: workingLoading,
    isError: workingError,
  } = useWorkingWithReportOptions(user?.id)
  const { data: managersFallback = [], isLoading: mgrFbLoading, isError: mgrFbError } = useManagers();
  const isManagerReporter = user?.role === 'manager'

  const teamMrs = workingOptions.filter(o => o.option_kind === 'team_mr')
  const peerManagers = workingOptions.filter(o => o.option_kind === 'peer_manager')
  const linkedManagers = workingOptions.filter(o => o.option_kind === 'linked_manager')

  const { data: dashboardMrs = [] } = useManagerMrs(
    isManagerReporter ? (user?.id ?? '') : '',
  )
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
        }))

  const isLoading = workingLoading || (!isManagerReporter && mgrFbLoading)
  const isError = workingError || (!isManagerReporter && mgrFbError)

  const isSolo = data.workingWithIds.length === 0

  const toggleWorkingWith = useCallback((id: string) => {
    const current = data.workingWithIds ?? []
    const next = current.includes(id)
      ? current.filter(x => x !== id)
      : [...current, id]
    onChange({ workingWithIds: next, workingWithId: next[0] ?? '' })
  }, [data.workingWithIds, onChange])

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
    <div className="space-y-5 animate-fade-in pb-20">
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
                        Submitted
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
              All reports up to date
            </p>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label>Working With (Optional)</Label>
        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer rounded-lg border border-border bg-card px-3 py-2.5">
              <Checkbox
                checked={isSolo}
                onCheckedChange={() => {
                  onChange({ workingWithIds: [], workingWithId: '' })
                }}
              />
              <span className="text-sm font-medium text-foreground">Solo visit</span>
            </label>

            {isManagerReporter ? (
              <>
                {effectiveTeamMrs.length > 0 && (
                  <div>
                    <p className="section-title mb-2">Your MR team</p>
                    <div className="space-y-1.5">
                      {effectiveTeamMrs.map(m => {
                        const checked = data.workingWithIds.includes(m.id)
                        return (
                          <label key={m.id} className={cn(
                            'flex items-center gap-3 cursor-pointer rounded-xl border px-3 py-2.5 transition-all active:scale-[0.98]',
                            checked ? 'border-primary/50 bg-primary/5' : 'border-border bg-card',
                          )}>
                            <Checkbox checked={checked} onCheckedChange={() => toggleWorkingWith(m.id)} />
                            <Avatar src={m.profile_photo_url} name={m.full_name} />
                            <span className="text-sm text-foreground flex-1 truncate">{m.full_name}</span>
                            <Badge variant="outline" className="text-[10px] shrink-0">MR</Badge>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                )}
                {peerManagers.length > 0 && (
                  <div>
                    <p className="section-title mb-2">Managers</p>
                    <div className="space-y-1.5">
                      {peerManagers.map(m => {
                        const checked = data.workingWithIds.includes(m.id)
                        return (
                          <label key={m.id} className={cn(
                            'flex items-center gap-3 cursor-pointer rounded-xl border px-3 py-2.5 transition-all active:scale-[0.98]',
                            checked ? 'border-primary/50 bg-primary/5' : 'border-border bg-card',
                          )}>
                            <Checkbox checked={checked} onCheckedChange={() => toggleWorkingWith(m.id)} />
                            <Avatar src={m.profile_photo_url} name={m.full_name} />
                            <span className="text-sm text-foreground flex-1 truncate">{m.full_name}</span>
                            <Badge variant="outline" className="text-[10px] shrink-0">Manager</Badge>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                {(() => {
                  const mgrs = linkedManagers.length > 0
                    ? linkedManagers
                    : managersFallback.map(m => ({ ...m, option_kind: 'linked_manager' as const, employee_code: m.employee_code ?? '' }))
                  const peerMrs = workingOptions.filter(o => o.option_kind === 'team_mr')
                  return (
                    <>
                      {mgrs.length > 0 && (
                        <div>
                          <p className="section-title mb-2">Managers</p>
                          <div className="space-y-1.5">
                            {mgrs.map(m => {
                              const photo = 'profile_photo_url' in m ? (m as { profile_photo_url?: string | null }).profile_photo_url : null
                              const checked = data.workingWithIds.includes(m.id)
                              return (
                                <label key={m.id} className={cn(
                                  'flex items-center gap-3 cursor-pointer rounded-xl border px-3 py-2.5 transition-all active:scale-[0.98]',
                                  checked ? 'border-primary/50 bg-primary/5' : 'border-border bg-card',
                                )}>
                                  <Checkbox checked={checked} onCheckedChange={() => toggleWorkingWith(m.id)} />
                                  <Avatar src={photo} name={m.full_name} />
                                  <span className="text-sm text-foreground flex-1 truncate">{m.full_name}</span>
                                  <Badge variant="outline" className="text-[10px] shrink-0">Manager</Badge>
                                </label>
                              )
                            })}
                          </div>
                        </div>
                      )}
                      {peerMrs.length > 0 && (
                        <div>
                          <p className="section-title mb-2">Team MRs</p>
                          <div className="space-y-1.5">
                            {peerMrs.map(m => {
                              const checked = data.workingWithIds.includes(m.id)
                              return (
                                <label key={m.id} className={cn(
                                  'flex items-center gap-3 cursor-pointer rounded-xl border px-3 py-2.5 transition-all active:scale-[0.98]',
                                  checked ? 'border-primary/50 bg-primary/5' : 'border-border bg-card',
                                )}>
                                  <Checkbox checked={checked} onCheckedChange={() => toggleWorkingWith(m.id)} />
                                  <Avatar src={m.profile_photo_url} name={m.full_name} />
                                  <span className="text-sm text-foreground flex-1 truncate">{m.full_name}</span>
                                  <Badge variant="outline" className="text-[10px] shrink-0">MR</Badge>
                                </label>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </>
                  )
                })()}
              </>
            )}

            {data.workingWithIds.length > 0 && (
              <div className="rounded-xl bg-primary/5 border border-primary/20 p-3">
                <p className="text-xs text-primary font-medium">
                  Working with: {data.workingWithIds
                    .map(id => {
                      const opt = workingOptions.find(o => o.id === id)
                        ?? managersFallback.find(m => m.id === id)
                        ?? effectiveTeamMrs.find(m => m.id === id)
                      return opt?.full_name ?? id
                    })
                    .join(', ')}
                </p>
              </div>
            )}
          </div>
        )}
        {isError && (
          <p className="text-xs text-destructive">Could not load colleagues for Working With</p>
        )}
      </div>

      <div className="fixed bottom-20 left-0 right-0 px-4 pb-3 pt-2 bg-background/95 backdrop-blur-md border-t border-border/40">
        <div className="max-w-lg mx-auto">
          <Button
            onClick={onNext}
            disabled={!canProceed}
            className="w-full touch-target rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 font-bold shadow-lg shadow-primary/20"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
