import { useState } from 'react'
import { useMonthlySupportAggregateForMr } from '@/hooks/useReport'
import { todayInputDate, formatDisplayDate } from '@/lib/dateUtils'
import LoadingSpinner from '@/components/shared/LoadingSpinner'

interface Props {
  mrId: string
}

export default function TeamMrMonthlySupportTab({ mrId }: Props) {
  const [month, setMonth] = useState(todayInputDate().slice(0, 7))
  const { data: agg, isLoading } = useMonthlySupportAggregateForMr(mrId, month)

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">Month</label>
        <input
          type="month"
          value={month}
          onChange={e => setMonth(e.target.value)}
          className="flex h-11 w-full rounded-lg border border-input bg-card px-3 text-sm"
        />
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <>
          <div className="glass-card p-4">
            <p className="text-xs text-muted-foreground">Total recorded ({formatDisplayDate(`${month}-01`)})</p>
            <p className="text-2xl font-bold text-primary tabular-nums mt-1">
              Rs {(agg?.total_inr ?? 0).toLocaleString('en-IN')}
            </p>
          </div>
          {(agg?.byDoctor ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No monthly support in submitted DCRs for this month.</p>
          ) : (
            <div className="space-y-2 max-h-[55vh] overflow-y-auto">
              {(agg?.byDoctor ?? []).map(d => (
                <div key={d.doctor_id} className="rounded-xl border border-border/60 bg-card px-3 py-2.5 flex justify-between gap-2">
                  <span className="text-sm font-medium truncate">{d.doctor_name}</span>
                  <span className="text-sm font-bold text-primary tabular-nums shrink-0">
                    Rs {d.total_inr.toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
