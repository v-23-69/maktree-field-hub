import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, ChevronRight } from 'lucide-react'
import { useManagerMrs } from '@/hooks/useManagerTeam'
import { useTeamMrsTodayReportStatus } from '@/hooks/useManagerTeamHub'
import { todayInputDate, formatShortDateIst } from '@/lib/dateUtils'
import DashboardSection from '@/components/shared/DashboardSection'

type Props = {
  managerId: string
}

export default function TeamPendingDcrStrip({ managerId }: Props) {
  const navigate = useNavigate()
  const today = todayInputDate()
  const { data: mrs = [] } = useManagerMrs(managerId)
  const mrIds = useMemo(() => mrs.map(m => m.id), [mrs])
  const { data: todayReports = [] } = useTeamMrsTodayReportStatus(mrIds, today)

  const pending = useMemo(() => {
    const byId = new Map(mrs.map(m => [m.id, m]))
    return todayReports
      .filter(r => !r.submitted)
      .map(r => byId.get(r.mrId))
      .filter((m): m is NonNullable<typeof m> => !!m)
  }, [mrs, todayReports])

  if (mrs.length === 0 || pending.length === 0) return null

  return (
    <DashboardSection
      icon={AlertCircle}
      title="Team DCR pending today"
      hint={`${pending.length} of ${mrs.length} MRs have not submitted today's DCR (IST).`}
      action={
        <button
          type="button"
          onClick={() => navigate('/manager/team')}
          className="text-[10px] font-semibold text-primary shrink-0"
        >
          Team hub
        </button>
      }
    >
      <div className="space-y-1.5 max-h-40 overflow-y-auto">
        {pending.slice(0, 8).map(mr => (
          <button
            key={mr.id}
            type="button"
            onClick={() => navigate(`/manager/team/${mr.id}`)}
            className="w-full flex items-center justify-between gap-2 rounded-xl border border-amber-500/25 bg-amber-500/5 px-3 py-2.5 text-left active:scale-[0.98] transition-all"
          >
            <span className="text-sm font-medium text-foreground truncate">{mr.full_name}</span>
            <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-700 dark:text-amber-400 shrink-0">
              Pending · {formatShortDateIst(today)}
              <ChevronRight className="h-3.5 w-3.5" />
            </span>
          </button>
        ))}
      </div>
      {pending.length > 8 && (
        <p className="text-[10px] text-muted-foreground text-center">
          +{pending.length - 8} more — open Team hub
        </p>
      )}
    </DashboardSection>
  )
}
