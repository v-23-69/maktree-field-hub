import { useMemo } from 'react'
import PageHeader from '@/components/shared/PageHeader'
import BottomNav from '@/components/shared/BottomNav'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/useAuth'
import { useVisitFrequencyProgress } from '@/hooks/useFieldActivityAnalytics'
import { todayInputDate } from '@/lib/dateUtils'

export default function MRVisitFrequencyPage() {
  const { user } = useAuth()
  const month = todayInputDate()
  const { data, isLoading } = useVisitFrequencyProgress(user?.id ?? '', month, !!user?.id)

  const rows = data?.doctors ?? []
  const summary = useMemo(() => {
    if (!data) return { t: 0, d: 0 }
    return { t: data.totalTarget, d: data.totalDone }
  }, [data])

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader title="Visit frequency" showBack />
      <div className="px-4 py-4 space-y-4 max-w-2xl mx-auto">
        <div className="glass-card p-4 flex justify-between items-center">
          <div>
            <p className="text-xs text-muted-foreground font-medium">This month (progress capped per doctor)</p>
            <p className="text-lg font-bold text-foreground tabular-nums mt-1">
              {summary.d} / {summary.t}
            </p>
          </div>
          <Badge variant="outline" className="text-[10px]">{month.slice(0, 7)}</Badge>
        </div>
        {isLoading && <LoadingSpinner />}
        {!isLoading && rows.length === 0 && (
          <p className="text-sm text-muted-foreground">No doctors in your territories yet.</p>
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
                <p className="text-[10px] text-muted-foreground">visits / target</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <BottomNav role="mr" />
    </div>
  )
}
