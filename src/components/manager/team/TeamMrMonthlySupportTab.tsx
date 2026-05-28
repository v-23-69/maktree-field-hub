import { useMemo, useState } from 'react'
import { useMonthlySupportAggregateForMr, type MonthlySupportLine } from '@/hooks/useReport'
import { todayInputDate, formatMonthYear } from '@/lib/dateUtils'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import AnalyticsDonutPie from '@/components/charts/AnalyticsDonutPie'
import { dashboardPanelClass } from '@/components/dashboard/dashboard-shell'
import { cn } from '@/lib/utils'
import { formatDoctorLabel } from '@/lib/displayLabels'

interface Props {
  mrId: string
}

export default function TeamMrMonthlySupportTab({ mrId }: Props) {
  const [month, setMonth] = useState(todayInputDate().slice(0, 7))
  const { data: agg, isLoading } = useMonthlySupportAggregateForMr(mrId, month)

  const productSlices = useMemo(() => {
    const m = new Map<string, number>()
    for (const line of agg?.lines ?? []) {
      m.set(line.product_name, (m.get(line.product_name) ?? 0) + line.quantity)
    }
    return [...m.entries()]
      .map(([label, value]) => ({ key: label, label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8)
  }, [agg?.lines])

  const linesByDoctor = useMemo(() => {
    const map = new Map<string, MonthlySupportLine[]>()
    for (const line of agg?.lines ?? []) {
      const key = line.doctor_id
      const list = map.get(key) ?? []
      list.push(line)
      map.set(key, list)
    }
    return [...map.entries()].sort((a, b) =>
      (a[1][0]?.doctor_name ?? '').localeCompare(b[1][0]?.doctor_name ?? '', undefined, {
        sensitivity: 'base',
      }),
    )
  }, [agg?.lines])

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
          <div className={cn(dashboardPanelClass(), 'p-4 space-y-1')}>
            <p className="text-xs text-muted-foreground">Total · {formatMonthYear(month)}</p>
            <p className="text-2xl font-bold text-primary tabular-nums">
              Rs {(agg?.total_inr ?? 0).toLocaleString('en-IN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
            <p className="text-xs text-muted-foreground">
              {(agg?.lines ?? []).length} line{(agg?.lines ?? []).length !== 1 ? 's' : ''} across{' '}
              {linesByDoctor.length} doctor{linesByDoctor.length !== 1 ? 's' : ''}
            </p>
          </div>

          {productSlices.length > 0 && (
            <AnalyticsDonutPie title="By product (qty)" data={productSlices} valueLabel="Qty" maxHeightPx={200} />
          )}

          {linesByDoctor.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No monthly support in submitted DCRs for this month.
            </p>
          ) : (
            <div className="space-y-3 max-h-[55vh] overflow-y-auto">
              {linesByDoctor.map(([doctorId, lines]) => {
                const doctorTotal = lines.reduce((s, l) => s + l.amount_inr, 0)
                const doctorName = lines[0]?.doctor_name ?? 'Doctor'
                return (
                  <div
                    key={doctorId}
                    className={cn(dashboardPanelClass(), 'px-3 py-3 space-y-2')}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-foreground leading-snug">
                        {formatDoctorLabel(doctorName)}
                      </p>
                      <p className="text-sm font-bold text-primary tabular-nums shrink-0">
                        Rs {doctorTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </p>
                    </div>
                    <ul className="space-y-1.5 border-t border-border/50 pt-2">
                      {lines.map((line, idx) => (
                        <li
                          key={`${line.product_name}-${idx}`}
                          className="flex items-center justify-between gap-2 text-xs"
                        >
                          <span className="text-foreground truncate min-w-0">{line.product_name}</span>
                          <span className="shrink-0 tabular-nums text-muted-foreground">
                            Qty <span className="font-semibold text-foreground">{line.quantity}</span>
                            {' · '}
                            Rs {line.amount_inr.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
