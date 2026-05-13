import { useMemo, useState } from 'react'
import PageHeader from '@/components/shared/PageHeader'
import BottomNav from '@/components/shared/BottomNav'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/useAuth'
import { useManagerMrs } from '@/hooks/useManagerTeam'
import { useVisitFrequencyProgress } from '@/hooks/useFieldActivityAnalytics'
import { todayInputDate } from '@/lib/dateUtils'

export default function ManagerTeamVisitFrequencyPage() {
  const { user } = useAuth()
  const { data: mrs = [], isLoading: mLoading } = useManagerMrs(user?.id ?? '')
  const [mrId, setMrId] = useState('')
  const month = todayInputDate()
  const effectiveMr = mrId || mrs[0]?.id || ''
  const { data, isLoading: vLoading } = useVisitFrequencyProgress(effectiveMr, month, !!effectiveMr)

  const rows = data?.doctors ?? []
  const summary = useMemo(() => {
    if (!data) return { t: 0, d: 0 }
    return { t: data.totalTarget, d: data.totalDone }
  }, [data])

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader title="Team visit frequency" />
      <div className="px-4 py-4 space-y-4 max-w-2xl mx-auto">
        <p className="text-xs text-muted-foreground leading-relaxed">
          Monthly visit targets set by each MR on their doctor master list. Progress uses submitted field DCRs only.
        </p>
        {mLoading ? (
          <LoadingSpinner />
        ) : mrs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No MRs assigned.</p>
        ) : (
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">MR</label>
            <select
              className="h-11 w-full rounded-xl border border-border bg-card px-3 text-sm font-medium"
              value={effectiveMr}
              onChange={e => setMrId(e.target.value)}
            >
              {mrs.map(m => (
                <option key={m.id} value={m.id}>
                  {m.full_name ?? m.id}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="glass-card p-4 flex justify-between items-center">
          <div>
            <p className="text-xs text-muted-foreground font-medium">This month</p>
            <p className="text-lg font-bold text-foreground tabular-nums mt-1">
              {summary.d} / {summary.t}
            </p>
          </div>
          <Badge variant="outline" className="text-[10px]">{month.slice(0, 7)}</Badge>
        </div>

        {vLoading && <LoadingSpinner />}
        {!vLoading && rows.length === 0 && effectiveMr && (
          <p className="text-sm text-muted-foreground">No doctors for this MR.</p>
        )}
        <div className="space-y-2">
          {rows.map(r => (
            <div key={r.doctorId} className="rounded-xl border border-border p-3 flex justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{r.name}</p>
                <p className="text-[11px] text-muted-foreground truncate">{r.subArea}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold tabular-nums text-primary">{r.done} / {r.target}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <BottomNav role="manager" />
    </div>
  )
}
