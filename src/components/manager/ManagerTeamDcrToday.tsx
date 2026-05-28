import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, CheckCircle2, Circle, X } from 'lucide-react'
import { useManagerMrs } from '@/hooks/useManagerTeam'
import { useTeamMrsTodayReportStatus } from '@/hooks/useManagerTeamHub'
import { todayInputDate } from '@/lib/dateUtils'
import { cn } from '@/lib/utils'

type Props = {
  managerId: string
}

function firstName(fullName: string) {
  return fullName.trim().split(/\s+/)[0] ?? fullName
}

/** Team MR DCR status for today — compact horizontal cards. */
export default function ManagerTeamDcrToday({ managerId }: Props) {
  const navigate = useNavigate()
  const today = todayInputDate()
  const { data: mrs = [] } = useManagerMrs(managerId)
  const mrIds = useMemo(() => mrs.map(m => m.id), [mrs])
  const { data: todayReports = [] } = useTeamMrsTodayReportStatus(mrIds, today)
  const statusByMrId = useMemo(
    () => new Map(todayReports.map(r => [r.mrId, r.submitted])),
    [todayReports],
  )

  if (mrs.length === 0) return null

  const filed = mrs.filter(m => statusByMrId.get(m.id) === true).length

  return (
    <div className="rounded-2xl border border-primary/20 bg-card/80 backdrop-blur-sm overflow-hidden">
      <div className="px-3.5 py-2.5 border-b border-primary/10 flex items-center justify-between gap-2">
        <p className="text-[11px] font-bold text-foreground">Team DCR today</p>
        <p className="text-[10px] font-semibold text-muted-foreground tabular-nums">
          {filed}/{mrs.length} filed
        </p>
      </div>

      <div className="p-3 flex gap-2 overflow-x-auto scrollbar-thin">
        {mrs.map(mr => {
          const submitted = statusByMrId.get(mr.id) === true
          const name = mr.full_name ?? 'MR'
          const initials = name
            .split(/\s+/)
            .map(p => p[0])
            .join('')
            .slice(0, 2)
            .toUpperCase()

          return (
            <button
              key={mr.id}
              type="button"
              onClick={() => navigate(`/manager/team/${mr.id}`)}
              className={cn(
                'shrink-0 w-[88px] rounded-xl border px-2 py-2.5 text-center transition-all active:scale-[0.98]',
                submitted
                  ? 'border-emerald-500/30 bg-emerald-500/[0.07]'
                  : 'border-border/80 bg-background/60 hover:border-primary/25',
              )}
            >
              <div
                className={cn(
                  'mx-auto h-9 w-9 rounded-full flex items-center justify-center text-[10px] font-bold overflow-hidden ring-2',
                  submitted
                    ? 'ring-emerald-500/40 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                    : 'ring-muted bg-muted text-muted-foreground',
                )}
              >
                {mr.profile_photo_url ? (
                  <img src={mr.profile_photo_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  initials
                )}
              </div>
              <p className="text-[10px] font-semibold text-foreground mt-1.5 truncate w-full">
                {firstName(name)}
              </p>
              <span
                className={cn(
                  'inline-flex items-center justify-center mt-1',
                  submitted ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive',
                )}
              >
                {submitted ? (
                  <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500/15 ring-1 ring-emerald-500/35 max-md:h-[18px] max-md:w-[18px]">
                    <Check className="h-2.5 w-2.5 max-md:h-2 max-md:w-2" strokeWidth={3} />
                  </span>
                ) : (
                  <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-destructive/12 ring-1 ring-destructive/35 max-md:h-[18px] max-md:w-[18px]">
                    <X className="h-2.5 w-2.5 max-md:h-2 max-md:w-2" strokeWidth={3} />
                  </span>
                )}
                <span className="hidden md:inline-flex items-center gap-0.5 ml-0.5 text-[9px] font-bold uppercase tracking-wide">
                  {submitted ? (
                    <CheckCircle2 className="h-2.5 w-2.5" />
                  ) : (
                    <Circle className="h-2.5 w-2.5" />
                  )}
                  {submitted ? 'Done' : 'Pending'}
                </span>
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
