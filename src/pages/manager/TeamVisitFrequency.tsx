import { useMemo, useState } from 'react'
import PageHeader from '@/components/shared/PageHeader'
import BottomNav from '@/components/shared/BottomNav'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/useAuth'
import { useManagerMrs } from '@/hooks/useManagerTeam'
import { useVisitFrequencyProgress } from '@/hooks/useFieldActivityAnalytics'
import { todayInputDate } from '@/lib/dateUtils'
import { dashboardPageClass, dashboardPanelClass } from '@/components/dashboard/dashboard-shell'
import { cn } from '@/lib/utils'

export default function ManagerTeamVisitFrequencyPage() {
  const { user } = useAuth()
  const { data: mrs = [], isLoading: mLoading } = useManagerMrs(user?.id ?? '')
  const [mrId, setMrId] = useState('')
  const month = todayInputDate()
  const effectiveMr = mrId || mrs[0]?.id || ''
  const { data, isLoading: vLoading } = useVisitFrequencyProgress(effectiveMr, month, !!effectiveMr)

  const rows = data?.doctors ?? []
  const summary = useMemo(() => {
    if (!data) return { t: 0, d: 0, pct: 0 }
    const pct = data.totalTarget > 0 ? Math.round((data.totalDone / data.totalTarget) * 100) : 0
    return { t: data.totalTarget, d: data.totalDone, pct }
  }, [data])

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader title="Visit frequency" showBack />
      <div className={dashboardPageClass()}>
        <p className="text-sm text-muted-foreground">
          Monthly visit targets from each MR&apos;s doctor list. Progress uses submitted field DCRs only.
        </p>

        {mLoading ? (
          <LoadingSpinner />
        ) : mrs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No MRs assigned.</p>
        ) : (
          <div className={cn(dashboardPanelClass(), 'p-4 space-y-2')}>
            <label className="text-xs font-semibold text-muted-foreground">Medical representative</label>
            <select
              className="h-11 w-full rounded-xl border border-border bg-card px-3 text-sm font-medium"
              value={effectiveMr}
              onChange={e => setMrId(e.target.value)}
            >
              {mrs.map(m => (
                <option key={m.id} value={m.id}>
                  {m.full_name ?? 'MR'}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className={cn(dashboardPanelClass(), 'p-4 flex justify-between items-center gap-3')}>
          <div>
            <p className="text-xs text-muted-foreground font-medium">This month</p>
            <p className="text-2xl font-bold text-foreground tabular-nums mt-1">
              {summary.d} <span className="text-muted-foreground font-medium text-lg">/ {summary.t}</span>
            </p>
            <p className="text-xs text-primary font-semibold mt-0.5">{summary.pct}% achieved</p>
          </div>
          <Badge variant="outline" className="text-[10px] shrink-0">
            {month.slice(0, 7)}
          </Badge>
        </div>

        {vLoading && <LoadingSpinner />}
        {!vLoading && rows.length === 0 && effectiveMr && (
          <p className="text-sm text-muted-foreground text-center py-6">No doctors with visit targets for this MR.</p>
        )}
        <div className="space-y-2">
          {rows.map(r => {
            const pct = r.target > 0 ? Math.min(100, Math.round((r.done / r.target) * 100)) : 0
            return (
              <div key={r.doctorId} className={cn(dashboardPanelClass(), 'p-3 space-y-2')}>
                <div className="flex justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{r.name}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{r.subArea}</p>
                  </div>
                  <p className="text-sm font-bold tabular-nums text-primary shrink-0">
                    {r.done} / {r.target}
                  </p>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
      <BottomNav role="manager" />
    </div>
  )
}
