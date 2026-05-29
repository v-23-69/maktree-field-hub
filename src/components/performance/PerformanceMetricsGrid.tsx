import type { MrPerformanceMetrics } from '@/hooks/usePerformance'
import { formatDisplayDate } from '@/lib/dateUtils'

interface Props {
  metrics: MrPerformanceMetrics
  periodLabel?: string
}

const ITEMS: Array<{
  key: keyof MrPerformanceMetrics
  label: string
  format?: (v: number) => string
}> = [
  { key: 'doctor_calls', label: 'Total doctor meets' },
  { key: 'doctor_call_avg', label: 'Doctor call avg', format: v => v.toFixed(2) },
  { key: 'stockist_meets', label: 'Stockist meets' },
  { key: 'chemist_meets', label: 'Chemist meets' },
  { key: 'field_work_days', label: 'Field work days' },
  { key: 'holidays', label: 'Holidays' },
  { key: 'leaves', label: 'Leaves' },
  { key: 'strikes', label: 'Strikes' },
  { key: 'sundays', label: 'Sundays' },
]

export default function PerformanceMetricsGrid({ metrics, periodLabel }: Props) {
  const range =
    periodLabel ??
    `${formatDisplayDate(metrics.from)} – ${formatDisplayDate(metrics.to)}`

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">{range}</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {ITEMS.map(({ key, label, format }) => {
          const raw = metrics[key]
          const value = typeof raw === 'number' ? (format ? format(raw) : String(raw)) : '—'
          return (
            <div key={key} className="glass-card p-3 rounded-xl">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                {label}
              </p>
              <p className="text-xl font-bold tabular-nums text-foreground mt-1">{value}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
