import { useMemo, useState } from 'react'
import LazySpecialityBarChart from '@/components/charts/LazySpecialityBarChart'
import ChartStatsSplit from '@/components/charts/ChartStatsSplit'
import { rollupSpecialityRows } from '@/lib/chartRollup'
import AnalyticsDonutPie from '@/components/charts/AnalyticsDonutPie'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import { useCallsAndSpecialityAnalytics, type PeriodPreset } from '@/hooks/useFieldActivityAnalytics'
import { useManagerAnalytics } from '@/hooks/useManagerAnalytics'
import { todayInputDate } from '@/lib/dateUtils'
import { cn } from '@/lib/utils'

interface Props {
  mrId: string
}

export default function TeamMrAnalyticsTab({ mrId }: Props) {
  const [callPreset, setCallPreset] = useState<PeriodPreset>('monthly')
  const monthStart = useMemo(() => {
    const t = todayInputDate()
    return `${t.slice(0, 7)}-01`
  }, [])
  const today = todayInputDate()

  const { data: calls, isLoading: callsLoading } = useCallsAndSpecialityAnalytics(
    [mrId],
    callPreset,
    today,
    !!mrId,
  )

  const { data: charts, isLoading: chartsLoading } = useManagerAnalytics(
    [mrId],
    monthStart,
    today,
    !!mrId,
    'overview',
  )

  const loading = callsLoading || chartsLoading
  const specialityChart = useMemo(
    () => rollupSpecialityRows(calls?.bySpeciality ?? [], 8),
    [calls?.bySpeciality],
  )

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-wrap gap-1">
        {(['weekly', 'monthly', 'yearly'] as const).map(p => (
          <button
            key={p}
            type="button"
            onClick={() => setCallPreset(p)}
            className={cn(
              'text-[10px] px-2 py-1 rounded-lg font-semibold border',
              callPreset === p ? 'bg-primary text-primary-foreground border-primary' : 'border-border bg-card',
            )}
          >
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          <ChartStatsSplit
            chart={
              specialityChart.length > 0 ? (
                <LazySpecialityBarChart data={specialityChart} heightPx={160} />
              ) : (
                <p className="text-xs text-muted-foreground py-4 text-center">No calls in this period.</p>
              )
            }
            stats={
              <>
                <div className="rounded-xl bg-muted/40 px-3 py-2.5 flex-1 sm:w-full">
                  <p className="text-[10px] text-muted-foreground uppercase">Total calls</p>
                  <p className="text-lg font-bold tabular-nums">{calls?.totalCalls ?? 0}</p>
                </div>
                <div className="rounded-xl bg-primary/5 border border-primary/15 px-3 py-2.5 flex-1 sm:w-full">
                  <p className="text-[10px] text-muted-foreground uppercase">Avg / active day</p>
                  <p className="text-lg font-bold text-primary tabular-nums">
                    {calls && calls.daysWithReports > 0 ? calls.avgPerDay.toFixed(1) : '—'}
                  </p>
                </div>
              </>
            }
          />

          <div className="glass-card p-3 space-y-2">
            <p className="text-xs font-semibold">This month overview</p>
            <p className="text-sm">
              <span className="text-muted-foreground">Submitted visits: </span>
              <span className="font-bold">{charts?.totalVisits ?? 0}</span>
            </p>
            <p className="text-sm">
              <span className="text-muted-foreground">Unique doctors: </span>
              <span className="font-bold">{charts?.uniqueDoctorVisits ?? 0}</span>
            </p>
            {(charts?.productPromotions ?? []).length > 0 && (
              <div className="pt-2">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-2">
                  Product promotions
                </p>
                <AnalyticsDonutPie
                  data={charts!.productPromotions.slice(0, 8).map(p => ({
                    key: p.name,
                    label: p.name,
                    value: p.count,
                  }))}
                  maxHeightPx={200}
                />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
