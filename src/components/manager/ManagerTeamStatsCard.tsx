import { cn } from '@/lib/utils'
import type { ManagerStatsFilter } from '@/hooks/useDashboardStats'

const FILTERS: ManagerStatsFilter[] = ['Today', 'This Week', 'This Month']

type Props = {
  activeFilter: ManagerStatsFilter
  onFilterChange: (f: ManagerStatsFilter) => void
  reportCount: number
  doctorCount: number
  loading: boolean
}

const REPORT_LABEL: Record<ManagerStatsFilter, string> = {
  Today: 'DCRs submitted',
  'This Week': 'DCRs this week',
  'This Month': 'DCRs this month',
}

const DOCTOR_LABEL: Record<ManagerStatsFilter, string> = {
  Today: 'Doctors met',
  'This Week': 'Doctors met',
  'This Month': 'Doctors met',
}

export default function ManagerTeamStatsCard({
  activeFilter,
  onFilterChange,
  reportCount,
  doctorCount,
  loading,
}: Props) {
  return (
    <div className="rounded-2xl border border-border/80 bg-card/60 p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-foreground">Team activity</p>
        <div className="flex rounded-lg border border-border/80 bg-muted/40 p-0.5">
          {FILTERS.map(f => (
            <button
              key={f}
              type="button"
              onClick={() => onFilterChange(f)}
              className={cn(
                'text-[10px] font-semibold px-2 py-1 rounded-md transition-colors',
                activeFilter === f
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground',
              )}
            >
              {f === 'This Week' ? 'Week' : f === 'This Month' ? 'Month' : 'Today'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-background/80 border border-border/60 px-3 py-2.5">
          <p className="text-2xl font-bold tabular-nums text-foreground leading-none">
            {loading ? '—' : reportCount}
          </p>
          <p className="text-[10px] text-muted-foreground mt-1.5 font-medium">{REPORT_LABEL[activeFilter]}</p>
        </div>
        <div className="rounded-xl bg-background/80 border border-border/60 px-3 py-2.5">
          <p className="text-2xl font-bold tabular-nums text-foreground leading-none">
            {loading ? '—' : doctorCount}
          </p>
          <p className="text-[10px] text-muted-foreground mt-1.5 font-medium">{DOCTOR_LABEL[activeFilter]}</p>
        </div>
      </div>
    </div>
  )
}
