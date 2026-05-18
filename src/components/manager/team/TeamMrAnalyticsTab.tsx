import { useMemo, useState } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import { useCallsAndSpecialityAnalytics, type PeriodPreset } from '@/hooks/useFieldActivityAnalytics'
import { useManagerAnalytics } from '@/hooks/useManagerAnalytics'
import { todayInputDate } from '@/lib/dateUtils'
import { cn } from '@/lib/utils'

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6']

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
  )

  const loading = callsLoading || chartsLoading

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-wrap gap-1">
        {(['daily', 'weekly', 'monthly', 'all'] as const).map(p => (
          <button
            key={p}
            type="button"
            onClick={() => setCallPreset(p)}
            className={cn(
              'text-[10px] px-2 py-1 rounded-lg font-semibold border',
              callPreset === p ? 'bg-primary text-primary-foreground border-primary' : 'border-border bg-card',
            )}
          >
            {p === 'all' ? 'Till date' : p}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-muted/40 px-3 py-2.5">
              <p className="text-[10px] text-muted-foreground uppercase">Total calls</p>
              <p className="text-lg font-bold tabular-nums">{calls?.totalCalls ?? 0}</p>
            </div>
            <div className="rounded-xl bg-muted/40 px-3 py-2.5">
              <p className="text-[10px] text-muted-foreground uppercase">Avg / active day</p>
              <p className="text-lg font-bold text-primary tabular-nums">
                {calls && calls.daysWithReports > 0 ? calls.avgPerDay.toFixed(1) : '—'}
              </p>
            </div>
          </div>

          {calls && calls.bySpeciality.length > 0 && (
            <div className="glass-card p-3">
              <p className="text-xs font-semibold mb-2">Visits by speciality</p>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={calls.bySpeciality} dataKey="visits" nameKey="speciality" cx="50%" cy="50%" outerRadius={70}>
                      {calls.bySpeciality.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

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
              <div className="pt-2 space-y-1 max-h-32 overflow-y-auto text-xs">
                {charts!.productPromotions.slice(0, 8).map(p => (
                  <div key={p.name} className="flex justify-between gap-2">
                    <span className="truncate">{p.name}</span>
                    <span className="font-semibold shrink-0">{p.count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
