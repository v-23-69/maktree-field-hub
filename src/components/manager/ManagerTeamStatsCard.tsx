import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, Stethoscope, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDisplayDate } from '@/lib/dateUtils'
import type { ManagerStatsFilter, ManagerTeamActivityData } from '@/hooks/useDashboardStats'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const FILTERS: ManagerStatsFilter[] = ['Today', 'This Week', 'This Month']

type DetailPanel = 'reports' | 'doctors' | null

type Props = {
  activeFilter: ManagerStatsFilter
  onFilterChange: (f: ManagerStatsFilter) => void
  activity: ManagerTeamActivityData | undefined
  loading: boolean
  mrCount: number
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
  activity,
  loading,
  mrCount,
}: Props) {
  const navigate = useNavigate()
  const [panel, setPanel] = useState<DetailPanel>(null)

  const reportCount = activity?.reportCount ?? 0
  const doctorCount = activity?.doctorCount ?? 0
  const mrDoctorCount = activity?.mrDoctorCount ?? 0
  const selfDoctorCount = activity?.selfDoctorCount ?? 0

  return (
    <>
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
          <button
            type="button"
            onClick={() => setPanel('reports')}
            className="rounded-xl bg-background/80 border border-border/60 px-3 py-2.5 text-left transition-colors hover:border-primary/40 hover:bg-primary/5 active:scale-[0.98]"
          >
            <p className="text-2xl font-bold tabular-nums text-foreground leading-none">
              {loading ? '—' : reportCount}
            </p>
            <p className="text-[10px] text-muted-foreground mt-1.5 font-medium flex items-center gap-1">
              {REPORT_LABEL[activeFilter]}
              <ChevronRight className="h-3 w-3 opacity-60" />
            </p>
          </button>

          <button
            type="button"
            onClick={() => setPanel('doctors')}
            className="rounded-xl bg-background/80 border border-border/60 px-3 py-2.5 text-left transition-colors hover:border-primary/40 hover:bg-primary/5 active:scale-[0.98]"
          >
            <p className="text-2xl font-bold tabular-nums text-foreground leading-none">
              {loading ? '—' : doctorCount}
            </p>
            <p className="text-[10px] text-muted-foreground mt-1.5 font-medium flex items-center gap-1">
              {DOCTOR_LABEL[activeFilter]}
              <ChevronRight className="h-3 w-3 opacity-60" />
            </p>
            {!loading && doctorCount > 0 && (
              <p className="text-[9px] text-muted-foreground/90 mt-1 leading-snug">
                {mrCount} MR{mrCount !== 1 ? 's' : ''}: {mrDoctorCount}
                {selfDoctorCount > 0 ? ` · You: ${selfDoctorCount}` : ''}
              </p>
            )}
          </button>
        </div>
      </div>

      <Dialog open={panel === 'reports'} onOpenChange={open => !open && setPanel(null)}>
        <DialogContent className="max-w-md w-[calc(100%-2rem)] max-h-[85dvh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-4 pt-4 pb-2 border-b border-border/60 shrink-0">
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              {REPORT_LABEL[activeFilter]}
            </DialogTitle>
            <p className="text-xs text-muted-foreground font-normal pt-1">
              {activeFilter === 'Today' ? 'Today' : activeFilter} · {reportCount} submitted
            </p>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 min-h-0 px-4 py-3">
            {loading ? (
              <p className="text-sm text-muted-foreground text-center py-8">Loading…</p>
            ) : (activity?.reports.length ?? 0) === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No DCRs in this period.</p>
            ) : (
              <ul className="space-y-2">
                {activity?.reports.map(r => (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setPanel(null)
                        navigate(`/manager/report/${r.id}`)
                      }}
                      className="w-full flex items-center gap-3 rounded-xl border border-border/70 bg-card px-3 py-3 text-left hover:border-primary/35 active:scale-[0.99] transition-all"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{r.person_name}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {formatDisplayDate(r.report_date)}
                          {r.is_manager ? ' · Manager' : ''}
                        </p>
                      </div>
                      <span className="text-xs font-semibold text-primary tabular-nums shrink-0">
                        {r.visit_count} visit{r.visit_count !== 1 ? 's' : ''}
                      </span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={panel === 'doctors'} onOpenChange={open => !open && setPanel(null)}>
        <DialogContent className="max-w-md w-[calc(100%-2rem)] max-h-[85dvh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-4 pt-4 pb-2 border-b border-border/60 shrink-0">
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Stethoscope className="h-4 w-4 text-primary" />
              {DOCTOR_LABEL[activeFilter]}
            </DialogTitle>
            <p className="text-xs text-muted-foreground font-normal pt-1">
              {doctorCount} unique doctors · MRs {mrDoctorCount}
              {selfDoctorCount > 0 ? ` · You ${selfDoctorCount}` : ''}
            </p>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 min-h-0 px-4 py-3 space-y-4">
            {loading ? (
              <p className="text-sm text-muted-foreground text-center py-8">Loading…</p>
            ) : (activity?.doctorsByPerson.length ?? 0) === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No doctor visits in this period.</p>
            ) : (
              activity?.doctorsByPerson.map(person => (
                <section key={person.user_id} className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-bold text-foreground">
                      {person.is_manager ? 'You (Manager)' : person.full_name}
                    </p>
                    <span className="text-[10px] font-semibold text-primary tabular-nums">
                      {person.doctor_count} doctor{person.doctor_count !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <ul className="rounded-xl border border-border/60 divide-y divide-border/50 overflow-hidden">
                    {person.doctors.map(doc => (
                      <li key={doc.id} className="px-3 py-2.5 bg-background/80">
                        <p className="text-sm font-medium text-foreground">{doc.full_name}</p>
                        {doc.speciality ? (
                          <p className="text-[11px] text-muted-foreground mt-0.5">{doc.speciality}</p>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </section>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
