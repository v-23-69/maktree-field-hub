import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useMrSubAreasGrouped } from '@/hooks/useAreas'
import { useMonthlySupportAggregateForMr } from '@/hooks/useReport'
import { useTpStatus } from '@/hooks/useTourProgram'
import { todayInputDate, formatDisplayDate } from '@/lib/dateUtils'
import { cn } from '@/lib/utils'
import type { User } from '@/types/database.types'
import type { MrTodayExpenseStatus, MrTodayReportStatus } from '@/hooks/useManagerTeamHub'

interface Props {
  mr: User
  todayReport?: MrTodayReportStatus
  todayExpense?: MrTodayExpenseStatus
  tpStatusLabel?: string
}

export default function TeamMrOverviewTab({ mr, todayReport, todayExpense, tpStatusLabel }: Props) {
  const navigate = useNavigate()
  const month = todayInputDate().slice(0, 7)
  const { data: msAgg } = useMonthlySupportAggregateForMr(mr.id, month)
  const { data: areas = [] } = useMrSubAreasGrouped(mr.id)
  const { data: tpStatus } = useTpStatus(mr.id)
  const today = todayInputDate()

  const areaCount = areas.reduce((n, g) => n + (g.sub_areas?.length ?? 0), 0)
  const submitted = todayReport?.submitted
  const exp = todayExpense?.status ?? 'none'

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-muted/40 px-3 py-2.5">
          <p className="text-[10px] text-muted-foreground font-medium uppercase">Today DCR</p>
          <p className={cn('text-sm font-bold mt-0.5', submitted ? 'text-emerald-600' : 'text-foreground')}>
            {submitted ? 'Submitted' : 'Pending'}
          </p>
        </div>
        <div className="rounded-xl bg-muted/40 px-3 py-2.5">
          <p className="text-[10px] text-muted-foreground font-medium uppercase">Today expense</p>
          <p className="text-sm font-bold mt-0.5 capitalize">{exp === 'none' ? '—' : exp}</p>
        </div>
        <div className="rounded-xl bg-muted/40 px-3 py-2.5">
          <p className="text-[10px] text-muted-foreground font-medium uppercase">Tour program</p>
          <p className="text-sm font-bold mt-0.5 capitalize">
            {tpStatusLabel ?? tpStatus?.current_month_tp_status ?? '—'}
          </p>
        </div>
        <div className="rounded-xl bg-muted/40 px-3 py-2.5">
          <p className="text-[10px] text-muted-foreground font-medium uppercase">Assigned areas</p>
          <p className="text-sm font-bold mt-0.5">{areaCount}</p>
        </div>
      </div>

      <div className="glass-card p-4 space-y-2">
        <p className="text-sm font-semibold text-foreground">
          Monthly support ({formatDisplayDate(`${month}-01`)})
        </p>
        <p className="text-xl font-bold text-primary tabular-nums">
          Rs {(msAgg?.total_inr ?? 0).toLocaleString('en-IN')}
        </p>
        {(msAgg?.byDoctor ?? []).length > 0 && (
          <div className="max-h-36 overflow-y-auto space-y-1 text-xs">
            {(msAgg?.byDoctor ?? []).slice(0, 8).map(d => (
              <div key={d.doctor_id} className="flex justify-between gap-2">
                <span className="truncate">{d.doctor_name}</span>
                <span className="font-semibold text-primary tabular-nums shrink-0">
                  Rs {d.total_inr.toLocaleString('en-IN')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {submitted && todayReport?.reportId && (
        <Button
          variant="outline"
          className="w-full rounded-xl"
          onClick={() => navigate(`/manager/report/${todayReport.reportId}`)}
        >
          Open today&apos;s DCR
        </Button>
      )}
      {!submitted && (
        <Button
          variant="outline"
          className="w-full rounded-xl"
          onClick={() =>
            navigate(`/manager/reports?mrId=${encodeURIComponent(mr.id)}&date=${encodeURIComponent(today)}&view=1`)
          }
        >
          Browse DCR history
        </Button>
      )}
    </div>
  )
}
