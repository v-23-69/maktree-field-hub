import { useMemo, useState } from 'react'
import PageHeader from '@/components/shared/PageHeader'
import BottomNav from '@/components/shared/BottomNav'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import EmptyState from '@/components/shared/EmptyState'
import { Badge } from '@/components/ui/badge'
import LazySpecialityBarChart from '@/components/charts/LazySpecialityBarChart'
import { rollupSpecialityRows } from '@/lib/chartRollup'
import LazyMrCallsDayChart from '@/components/charts/LazyMrCallsDayChart'
import { useAuth } from '@/hooks/useAuth'
import { useMrDashboardStats } from '@/hooks/useDashboardStats'
import {
  useCallsAndSpecialityAnalytics,
  useVisitFrequencyProgress,
  type PeriodPreset,
} from '@/hooks/useFieldActivityAnalytics'
import { todayInputDate } from '@/lib/dateUtils'
import { cn } from '@/lib/utils'

const PERIOD_PRESETS: PeriodPreset[] = ['daily', 'weekly', 'monthly', 'all']

function periodLabel(p: PeriodPreset) {
  return p === 'all' ? 'Till date' : p.charAt(0).toUpperCase() + p.slice(1)
}

export default function MRAnalyticsPage() {
  const { user } = useAuth()
  const mrId = user?.id ?? ''
  const today = todayInputDate()
  const month = today.slice(0, 7)

  const [callPreset, setCallPreset] = useState<PeriodPreset>('monthly')

  const { data: stats, isLoading: statsLoading } = useMrDashboardStats(mrId)
  const { data: calls, isLoading: callsLoading } = useCallsAndSpecialityAnalytics(
    [mrId],
    callPreset,
    today,
    !!mrId,
  )
  const { data: vfProgress, isLoading: vfLoading } = useVisitFrequencyProgress(mrId, today, !!mrId)

  const vfRows = vfProgress?.doctors ?? []
  const vfPct = useMemo(() => {
    if (!vfProgress || vfProgress.totalTarget <= 0) return 0
    return Math.round((vfProgress.totalDone / vfProgress.totalTarget) * 100)
  }, [vfProgress])

  const specialityChartData = useMemo(
    () => rollupSpecialityRows(calls?.bySpeciality ?? [], 7),
    [calls?.bySpeciality],
  )

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader title="Analytics" />
      <div className="px-4 py-4 space-y-5 max-w-2xl md:max-w-4xl lg:max-w-5xl mx-auto">
        <p className="text-sm text-muted-foreground -mt-2">
          Your field performance — calls, visit targets, and doctor coverage for this account only.
        </p>

        {!statsLoading && stats && (
          <div className="grid grid-cols-2 gap-2">
            <div className="glass-card p-3 rounded-xl">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">DCRs this month</p>
              <p className="text-xl font-bold tabular-nums text-foreground mt-1">{stats.reportsThisMonth}</p>
            </div>
            <div className="glass-card p-3 rounded-xl">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Doctors this week</p>
              <p className="text-xl font-bold tabular-nums text-foreground mt-1">{stats.doctorsThisWeek}</p>
            </div>
          </div>
        )}

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h2 className="text-sm font-semibold text-foreground">Field calls</h2>
            <div className="flex gap-1 flex-wrap justify-end">
              {PERIOD_PRESETS.map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setCallPreset(p)}
                  className={cn(
                    'text-[10px] px-2 py-1 rounded-lg font-semibold border transition',
                    callPreset === p
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border bg-card text-muted-foreground',
                  )}
                >
                  {periodLabel(p)}
                </button>
              ))}
            </div>
          </div>

          {callsLoading ? (
            <LoadingSpinner />
          ) : (
            <>
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-xl bg-muted/40 px-3 py-2.5">
                  <p className="text-[10px] text-muted-foreground font-medium">Total calls</p>
                  <p className="text-lg font-bold tabular-nums text-foreground">{calls?.totalCalls ?? 0}</p>
                </div>
                <div className="rounded-xl bg-muted/40 px-3 py-2.5">
                  <p className="text-[10px] text-muted-foreground font-medium">Avg / day</p>
                  <p className="text-lg font-bold tabular-nums text-primary">
                    {calls && calls.daysWithReports > 0 ? calls.avgPerDay.toFixed(1) : '—'}
                  </p>
                </div>
                <div className="rounded-xl bg-muted/40 px-3 py-2.5">
                  <p className="text-[10px] text-muted-foreground font-medium">Active days</p>
                  <p className="text-lg font-bold tabular-nums text-foreground">{calls?.daysWithReports ?? 0}</p>
                </div>
              </div>

              {calls && calls.byDay.length > 0 ? (
                <div className="glass-card p-3 rounded-xl space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground">Calls per day</p>
                  <LazyMrCallsDayChart data={calls.byDay} />
                </div>
              ) : (
                <EmptyState message="No submitted field visits in this period yet." />
              )}

              {specialityChartData.length > 0 && (
                <div className="glass-card p-3 rounded-xl space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground">Visits by speciality</p>
                  <p className="text-[10px] text-muted-foreground leading-snug">
                    Top specialties shown; smaller ones grouped as Others for clarity.
                  </p>
                  <LazySpecialityBarChart data={specialityChartData} heightPx={Math.min(320, specialityChartData.length * 36 + 32)} />
                </div>
              )}
            </>
          )}
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-foreground">Visit frequency</h2>
            <Badge variant="outline" className="text-[10px] tabular-nums">
              {month}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground -mt-1">
            Doctors visited vs monthly target (progress capped per doctor).
          </p>

          {vfLoading ? (
            <LoadingSpinner />
          ) : (
            <>
              <div className="glass-card p-4 space-y-3 rounded-xl">
                <div className="flex justify-between items-end gap-3">
                  <div>
                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
                      Month progress
                    </p>
                    <p className="text-2xl font-bold tabular-nums text-foreground mt-1">
                      {vfProgress?.totalDone ?? 0}
                      <span className="text-muted-foreground font-semibold text-lg">
                        {' '}
                        / {vfProgress?.totalTarget ?? 0}
                      </span>
                    </p>
                  </div>
                  <span className="text-sm font-bold text-primary tabular-nums">{vfPct}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${Math.min(100, vfPct)}%` }}
                  />
                </div>
              </div>

              {vfRows.length === 0 ? (
                <p className="text-sm text-muted-foreground">No doctors in your territories yet.</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 md:gap-3">
                  {vfRows.map(r => {
                    const pct = r.target > 0 ? Math.min(100, Math.round((Math.min(r.done, r.target) / r.target) * 100)) : 0
                    const met = r.done >= r.target
                    return (
                      <div
                        key={r.doctorId}
                        className="glass-card rounded-xl p-3 flex flex-col gap-2.5 min-h-[108px] border border-border/60"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-foreground leading-snug line-clamp-2">{r.name}</p>
                          <p className="text-[11px] text-muted-foreground mt-1 truncate">{r.subArea}</p>
                        </div>
                        <div className="space-y-1.5">
                          <div className="flex items-end justify-between gap-2">
                            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                              Visits
                            </p>
                            <p
                              className={cn(
                                'text-base font-bold tabular-nums leading-none',
                                met ? 'text-emerald-600 dark:text-emerald-400' : 'text-primary',
                              )}
                            >
                              {r.done}/{r.target}
                            </p>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                            <div
                              className={cn(
                                'h-full rounded-full transition-all',
                                met ? 'bg-emerald-500' : 'bg-primary',
                              )}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </section>

      </div>
      <BottomNav role="mr" />
    </div>
  )
}
