import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useMrSubAreasGrouped } from '@/hooks/useAreas'
import { useTeamMrMasterData } from '@/hooks/useManagerTeamHub'
import { useMonthlySupportAggregateForMr } from '@/hooks/useReport'
import { useTpStatus } from '@/hooks/useTourProgram'
import { todayInputDate, formatMonthYear } from '@/lib/dateUtils'
import { cn } from '@/lib/utils'
import type { User } from '@/types/database.types'
import type { MrTodayExpenseStatus, MrTodayReportStatus } from '@/hooks/useManagerTeamHub'

interface Props {
  mr: User
  todayReport?: MrTodayReportStatus
  todayExpense?: MrTodayExpenseStatus
  tpStatusLabel?: string
  onOpenTab?: (tab: string) => void
}

export default function TeamMrOverviewTab({ mr, todayReport, todayExpense, tpStatusLabel, onOpenTab }: Props) {
  const navigate = useNavigate()
  const month = todayInputDate().slice(0, 7)
  const { data: msAgg } = useMonthlySupportAggregateForMr(mr.id, month)
  const { data: areas = [] } = useMrSubAreasGrouped(mr.id)
  const { data: master } = useTeamMrMasterData(mr.id)
  const { data: tpStatus } = useTpStatus(mr.id)
  const today = todayInputDate()

  const areaCount = areas.reduce((n, g) => n + (g.sub_areas?.length ?? 0), 0)
  const submitted = todayReport?.submitted
  const exp = todayExpense?.status ?? 'none'

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => onOpenTab?.('dcr')}
          className="rounded-xl bg-muted/40 px-3 py-2.5 text-left active:scale-[0.98] transition-transform"
        >
          <p className="text-[10px] text-muted-foreground font-medium uppercase">Today DCR</p>
          <p className={cn('text-sm font-bold mt-0.5', submitted ? 'text-emerald-600' : 'text-foreground')}>
            {submitted ? 'Submitted' : 'Pending'}
          </p>
        </button>
        <div className="rounded-xl bg-muted/40 px-3 py-2.5">
          <p className="text-[10px] text-muted-foreground font-medium uppercase">Today expense</p>
          <p className="text-sm font-bold mt-0.5 capitalize">{exp === 'none' ? '—' : exp}</p>
        </div>
        <button
          type="button"
          onClick={() => onOpenTab?.('tp')}
          className="rounded-xl bg-muted/40 px-3 py-2.5 text-left active:scale-[0.98] transition-transform"
        >
          <p className="text-[10px] text-muted-foreground font-medium uppercase">Tour program</p>
          <p className="text-sm font-bold mt-0.5 capitalize">
            {tpStatusLabel ?? tpStatus?.current_month_tp_status ?? '—'}
          </p>
        </button>
        <button
          type="button"
          onClick={() => onOpenTab?.('territories')}
          className="rounded-xl bg-muted/40 px-3 py-2.5 text-left active:scale-[0.98] transition-transform"
        >
          <p className="text-[10px] text-muted-foreground font-medium uppercase">Areas</p>
          <p className="text-sm font-bold mt-0.5">{areaCount}</p>
        </button>
        <button
          type="button"
          onClick={() => onOpenTab?.('master')}
          className="rounded-xl bg-muted/40 px-3 py-2.5 text-left active:scale-[0.98] transition-transform"
        >
          <p className="text-[10px] text-muted-foreground font-medium uppercase">Doctors</p>
          <p className="text-sm font-bold mt-0.5">{master?.doctors.length ?? 0}</p>
        </button>
        <button
          type="button"
          onClick={() => onOpenTab?.('master')}
          className="rounded-xl bg-muted/40 px-3 py-2.5 text-left active:scale-[0.98] transition-transform"
        >
          <p className="text-[10px] text-muted-foreground font-medium uppercase">Chemists</p>
          <p className="text-sm font-bold mt-0.5">{master?.chemists.length ?? 0}</p>
        </button>
      </div>

      <div className="glass-card p-4 space-y-3">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-sm font-semibold text-foreground">Monthly support</p>
          <p className="text-[11px] text-muted-foreground">{formatMonthYear(month)}</p>
        </div>
        <div className="rounded-xl bg-primary/8 border border-primary/15 px-3 py-2.5">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Total</p>
          <p className="text-xl font-bold text-primary tabular-nums mt-0.5">
            Rs {(msAgg?.total_inr ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        {(msAgg?.byDoctor ?? []).length > 0 ? (
          <div className="space-y-1.5 max-h-40 overflow-y-auto">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide px-0.5">
              By doctor
            </p>
            {(msAgg?.byDoctor ?? []).map(d => (
              <div
                key={d.doctor_id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-background/80 px-3 py-2"
              >
                <span className="text-sm font-medium text-foreground truncate min-w-0">{d.full_name}</span>
                <span className="text-sm font-bold text-primary tabular-nums shrink-0">
                  Rs {d.total_inr.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground text-center py-2">No monthly support recorded this month.</p>
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
