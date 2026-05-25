import { useState } from 'react'
import { useMonthlySupportAggregateForMr } from '@/hooks/useReport'
import { todayInputDate, formatMonthYear } from '@/lib/dateUtils'
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
          <div className="glass-card p-4 space-y-1">
            <p className="text-xs text-muted-foreground">Total · {formatMonthYear(month)}</p>
            <p className="text-2xl font-bold text-primary tabular-nums">
              Rs {(agg?.total_inr ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          {(agg?.byDoctor ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No monthly support in submitted DCRs for this month.</p>
          ) : (
            <div className="space-y-2 max-h-[55vh] overflow-y-auto">
              {(agg?.byDoctor ?? []).map(d => (
                <div
                  key={d.doctor_id}
                  className="rounded-xl border border-border/60 bg-card px-3 py-3 flex items-center justify-between gap-3"
                >
                  <span className="text-sm font-medium text-foreground truncate min-w-0">{d.full_name}</span>
                  <span className="text-sm font-bold text-primary tabular-nums shrink-0">
                    Rs {d.total_inr.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
