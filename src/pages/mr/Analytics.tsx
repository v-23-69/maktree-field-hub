import { useEffect, useMemo, useState } from 'react'
import { Phone } from 'lucide-react'
import PageHeader from '@/components/shared/PageHeader'
import BottomNav from '@/components/shared/BottomNav'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import EmptyState from '@/components/shared/EmptyState'
import LazySpecialityBarChart from '@/components/charts/LazySpecialityBarChart'
import { rollupSpecialityRows } from '@/lib/chartRollup'
import LazyMrCallsDayChart from '@/components/charts/LazyMrCallsDayChart'
import TeamFieldCallsChart from '@/components/charts/TeamFieldCallsChart'
import { useAuth } from '@/hooks/useAuth'
import { useMrDashboardStats } from '@/hooks/useDashboardStats'
import {
  useCallsComparisonAnalytics,
  type PeriodPreset,
} from '@/hooks/useFieldActivityAnalytics'
import { buildDayComparisonChart, percentChange } from '@/lib/analyticsPeriodCompare'
import { todayInputDate } from '@/lib/dateUtils'
import { cn } from '@/lib/utils'

const PERIOD_PRESETS: PeriodPreset[] = ['weekly', 'monthly', 'yearly']

function periodLabel(p: PeriodPreset) {
  return p.charAt(0).toUpperCase() + p.slice(1)
}

export default function MRAnalyticsPage() {
  const { user } = useAuth()
  const mrId = user?.id ?? ''
  const [callPreset, setCallPreset] = useState<PeriodPreset>('monthly')
  const [deferHeavy, setDeferHeavy] = useState(false)

  useEffect(() => {
    const t = window.setTimeout(() => setDeferHeavy(true), 200)
    return () => window.clearTimeout(t)
  }, [])

  const { data: stats, isLoading: statsLoading } = useMrDashboardStats(deferHeavy ? mrId : '')
  const compareEnabled = !!mrId
  const { data: callsBundle, isLoading: callsLoading } = useCallsComparisonAnalytics(
    [mrId],
    callPreset,
    todayInputDate(),
    compareEnabled,
    !!mrId,
  )

  const calls = callsBundle?.current
  const prevCalls = callsBundle?.previous

  const comparisonChart = useMemo(
    () => buildDayComparisonChart(calls?.byDay ?? [], prevCalls?.byDay ?? []),
    [calls?.byDay, prevCalls?.byDay],
  )
  const callsChange = useMemo(
    () => percentChange(calls?.totalCalls ?? 0, prevCalls?.totalCalls ?? 0),
    [calls?.totalCalls, prevCalls?.totalCalls],
  )

  const specialityChartData = useMemo(
    () => rollupSpecialityRows(calls?.bySpeciality ?? [], 7),
    [calls?.bySpeciality],
  )

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader title="Analytics" />
      <div className="mx-auto w-full px-4 py-4 space-y-5 max-w-lg md:px-8 md:max-w-3xl md:space-y-6 lg:px-10 lg:max-w-5xl">
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
              {compareEnabled && comparisonChart.length > 0 && (
                <TeamFieldCallsChart
                  title="Field calls"
                  icon={<Phone className="h-5 w-5" />}
                  mainValue={String(calls?.totalCalls ?? 0)}
                  changeValue={callsChange}
                  changeDescription="vs previous period"
                  chartData={comparisonChart}
                />
              )}

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

      </div>
      <BottomNav role="mr" />
    </div>
  )
}
