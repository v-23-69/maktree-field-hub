import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import PageHeader from '@/components/shared/PageHeader'
import BottomNav from '@/components/shared/BottomNav'
import { Button } from '@/components/ui/button'
import { todayInputDate } from '@/lib/dateUtils'
import { useAuth } from '@/hooks/useAuth'
import { CalendarDays, Check, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  useCreateOrUpdateTourProgram,
  useSaveTourProgramEntry,
  useSubmitTourProgram,
  useTourProgram,
  useTourProgramHistory,
  useTourProgramEntries,
} from '@/hooks/useTourProgram'
import { supabase } from '@/lib/supabase'
import { useAllAreas } from '@/hooks/useAreas'
import { useManagers } from '@/hooks/useManagers'

function monthFromDate(input: string) {
  return input.slice(0, 7) + '-01'
}

export default function TourProgramPage() {
  const { user } = useAuth()
  const now = todayInputDate()
  const monthOptions = useMemo(() => {
    const base = new Date(`${now.slice(0, 7)}-01T00:00:00`)
    return [0, 1, 2].map(offset => {
      const d = new Date(base)
      d.setMonth(d.getMonth() + offset)
      const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
      const label = d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
      return { value, label }
    })
  }, [now])
  const [month, setMonth] = useState(monthOptions[0].value)
  const tpQuery = useTourProgram(user?.id ?? '', month)
  const createOrUpdate = useCreateOrUpdateTourProgram()
  const submit = useSubmitTourProgram()
  const saveEntry = useSaveTourProgramEntry()
  const { data: entries = [] } = useTourProgramEntries(tpQuery.data?.id)
  const { data: history = [] } = useTourProgramHistory(user?.id ?? '')
  const { data: areas = [] } = useAllAreas()
  const { data: managers = [] } = useManagers()
  const [workingDays, setWorkingDays] = useState<Array<{ work_date: string; day_name: string; day_type: string; holiday_name: string | null }>>([])

  useEffect(() => {
    const load = async () => {
      if (!supabase || !user?.id || !month) return
      const { data } = await supabase.rpc('get_month_working_days', { p_mr_id: user.id, p_month: month })
      setWorkingDays((data ?? []) as Array<{ work_date: string; day_name: string; day_type: string; holiday_name: string | null }>)
    }
    void load()
  }, [user?.id, month])

  const entryByDate = useMemo(() => new Map(entries.map(e => [e.work_date, e])), [entries])
  const workingDayRows = useMemo(() => workingDays.filter(d => d.day_type === 'working'), [workingDays])
  const missingDates = useMemo(
    () =>
      workingDayRows
        .filter(day => {
          const entry = entryByDate.get(day.work_date)
          return !entry?.sub_area_id || !entry?.working_with
        })
        .map(day => day.work_date),
    [workingDayRows, entryByDate],
  )

  const allSubAreas = useMemo(() => areas.flatMap(area => (area.sub_areas ?? []).map(sa => ({ ...sa, areaName: area.name }))), [areas])

  const statusColor = {
    submitted: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20',
    approved: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    rejected: 'text-destructive bg-destructive/10 border-destructive/20',
    draft: 'text-muted-foreground bg-muted/50 border-border',
  }

  const currentStatus = tpQuery.data?.status ?? 'draft'
  const isApproved = currentStatus === 'approved'

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader title="Tour Program" showBack />

      <div className="px-4 md:px-6 py-5 space-y-5 max-w-lg md:max-w-2xl lg:max-w-4xl mx-auto">
        {/* Month selector */}
        <div className="flex gap-2">
          {monthOptions.map(m => (
            <button
              key={m.value}
              type="button"
              onClick={() => setMonth(m.value)}
              className={cn(
                'flex-1 rounded-2xl py-2.5 text-xs font-semibold border-2 transition-all active:scale-95',
                month === m.value
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/20'
                  : 'bg-card text-foreground border-border/60'
              )}
            >
              {m.label.split(' ')[0]}
            </button>
          ))}
        </div>

        {/* Status card */}
        <div className={cn('rounded-2xl border p-4 space-y-3', statusColor[currentStatus as keyof typeof statusColor] ?? statusColor.draft)}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              <p className="text-sm font-bold">
                {monthOptions.find(m => m.value === month)?.label ?? month}
              </p>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider">
              {currentStatus === 'draft' ? 'Not Created' : currentStatus}
            </span>
          </div>

          {currentStatus === 'rejected' && tpQuery.data?.manager_note && (
            <p className="text-xs">Note: {tpQuery.data.manager_note}</p>
          )}

          {(!tpQuery.data?.id || currentStatus === 'draft' || currentStatus === 'rejected') && (
            <Button
              className="w-full rounded-2xl font-bold"
              onClick={() =>
                void createOrUpdate
                  .mutateAsync({ mr_id: user?.id ?? '', month, manager_id: null })
                  .then(() => toast.success('Tour program draft ready'))
              }
            >
              {tpQuery.data?.id ? 'Refresh Draft' : 'Create Draft'}
            </Button>
          )}
        </div>

        {/* Day entries */}
        {workingDays.length > 0 && (
          <div className="space-y-2">
            <p className="section-title">Daily Plan</p>
            <div className="space-y-2 md:grid md:grid-cols-2 md:gap-3 md:space-y-0">
            {workingDays.map(day => {
              const entry = entryByDate.get(day.work_date)
              const dateObj = new Date(day.work_date + 'T00:00:00')
              const dateLabel = dateObj.toLocaleDateString(undefined, { day: 'numeric', month: 'short', weekday: 'short' })

              if (day.day_type === 'sunday') {
                return (
                  <div key={day.work_date} className="rounded-xl bg-muted/30 border border-border/30 px-4 py-2.5 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground font-medium">{dateLabel}</span>
                    <span className="text-[10px] text-muted-foreground font-semibold">Sunday</span>
                  </div>
                )
              }
              if (day.day_type === 'holiday') {
                return (
                  <div key={day.work_date} className="rounded-xl bg-blue-500/5 border border-blue-500/20 px-4 py-2.5 flex items-center justify-between">
                    <span className="text-xs text-blue-700 font-medium">{dateLabel}</span>
                    <span className="text-[10px] text-blue-600 font-semibold">{day.holiday_name ?? 'Holiday'}</span>
                  </div>
                )
              }

              const filled = !!entry?.sub_area_id && !!entry?.working_with
              return (
                <div key={day.work_date} className={cn(
                  'glass-card p-3.5 space-y-2.5',
                  filled && 'ring-1 ring-emerald-500/20'
                )}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground">{dateLabel}</span>
                    {filled && <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />}
                  </div>
                  <select
                    className="flex h-10 w-full rounded-xl border-2 border-border/60 bg-background px-3 text-xs font-medium focus:border-primary focus:outline-none transition-colors"
                    value={entry?.sub_area_id ?? ''}
                    disabled={isApproved}
                    onChange={e =>
                      tpQuery.data?.id &&
                      void saveEntry
                        .mutateAsync({
                          tour_program_id: tpQuery.data.id,
                          work_date: day.work_date,
                          sub_area_id: e.target.value || null,
                          working_with: entry?.working_with ?? null,
                          day_type: 'working',
                          notes: entry?.notes ?? null,
                        })
                        .then(() => toast.success('Saved'))
                    }
                  >
                    <option value="">Select area</option>
                    {allSubAreas.map(sa => (
                      <option key={sa.id} value={sa.id}>{sa.areaName} — {sa.name}</option>
                    ))}
                  </select>
                  <select
                    className="flex h-10 w-full rounded-xl border-2 border-border/60 bg-background px-3 text-xs font-medium focus:border-primary focus:outline-none transition-colors"
                    value={entry?.working_with ?? ''}
                    disabled={isApproved}
                    onChange={e =>
                      tpQuery.data?.id &&
                      void saveEntry
                        .mutateAsync({
                          tour_program_id: tpQuery.data.id,
                          work_date: day.work_date,
                          sub_area_id: entry?.sub_area_id ?? null,
                          working_with: e.target.value || null,
                          day_type: 'working',
                          notes: entry?.notes ?? null,
                        })
                        .then(() => toast.success('Saved'))
                    }
                  >
                    <option value="">Working with</option>
                    {managers.map(m => (
                      <option key={m.id} value={m.id}>{m.full_name}</option>
                    ))}
                  </select>
                </div>
              )
            })}
            </div>
          </div>
        )}

        {/* Submit */}
        {tpQuery.data?.id && !isApproved && (
          <div className="space-y-2">
            {missingDates.length > 0 && (
              <div className="flex items-start gap-2 rounded-xl bg-destructive/5 border border-destructive/20 p-3">
                <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                <p className="text-xs text-destructive font-medium">
                  Fill all working days. Missing: {missingDates.slice(0, 5).join(', ')}
                  {missingDates.length > 5 ? ` +${missingDates.length - 5} more` : ''}
                </p>
              </div>
            )}
            <Button
              className="w-full touch-target rounded-2xl font-bold h-12 shadow-lg shadow-primary/20"
              disabled={missingDates.length > 0}
              onClick={() =>
                void submit
                  .mutateAsync({ tourProgramId: tpQuery.data?.id ?? '', month })
                  .then(() => toast.success('Tour program submitted'))
              }
            >
              Submit Tour Program
            </Button>
          </div>
        )}

        {/* History */}
        {history.length > 0 && (
          <div className="space-y-2">
            <p className="section-title">History</p>
            {history.map((row: any) => (
              <div key={row.id} className="rounded-xl bg-card border border-border/50 px-4 py-3 flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground">{row.month}</span>
                <span className={cn(
                  'text-[10px] font-bold uppercase tracking-wider',
                  row.status === 'approved' ? 'text-emerald-600 dark:text-emerald-400' : row.status === 'rejected' ? 'text-destructive' : 'text-muted-foreground'
                )}>
                  {row.status}{row.is_late ? ' (late)' : ''}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav role={user?.role === 'manager' ? 'manager' : 'mr'} />
    </div>
  )
}
