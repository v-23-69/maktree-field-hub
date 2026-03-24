import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import PageHeader from '@/components/shared/PageHeader'
import BottomNav from '@/components/shared/BottomNav'
import { Button } from '@/components/ui/button'
import { todayInputDate } from '@/lib/dateUtils'
import { useAuth } from '@/hooks/useAuth'
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
      return value
    })
  }, [now])
  const [month, setMonth] = useState(monthOptions[0])
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
  const workingDayRows = useMemo(
    () => workingDays.filter(d => d.day_type === 'working'),
    [workingDays],
  )
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

  return (
    <div className="min-h-screen bg-background pb-20">
      <PageHeader title="Tour Program" />
      <div className="p-4 space-y-4">
        <div className="rounded-xl border p-3 space-y-2">
          <select className="h-10 w-full border rounded-md px-2" value={month} onChange={e => setMonth(e.target.value)}>
            {monthOptions.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <p className="text-sm">Month: {month}</p>
          <p className="text-xs text-muted-foreground">
            Status: {tpQuery.data?.status ?? 'not created'}
          </p>
          {tpQuery.data?.status === 'submitted' && (
            <p className="text-xs text-amber-700">Submitted - Awaiting Approval</p>
          )}
          {tpQuery.data?.status === 'approved' && (
            <p className="text-xs text-emerald-700">Approved ✓</p>
          )}
          {tpQuery.data?.status === 'rejected' && (
            <p className="text-xs text-destructive">Rejected - {tpQuery.data?.manager_note ?? 'No note'}</p>
          )}
          <Button
            className="w-full"
            onClick={() =>
              void createOrUpdate
                .mutateAsync({ mr_id: user?.id ?? '', month, manager_id: null })
                .then(() => toast.success('Tour program draft ready'))
            }
          >
            Create / Refresh Draft
          </Button>
        </div>

        <div className="rounded-xl border p-3 space-y-1">
          <p className="text-sm font-medium">Plan</p>
          {workingDays.map(day => {
            const entry = entryByDate.get(day.work_date)
            if (day.day_type === 'sunday') {
              return <p key={day.work_date} className="text-xs text-muted-foreground">{day.work_date} - Sunday - Off</p>
            }
            if (day.day_type === 'holiday') {
              return <p key={day.work_date} className="text-xs text-blue-600">{day.work_date} - Holiday: {day.holiday_name ?? ''}</p>
            }
            return (
              <div key={day.work_date} className="rounded-lg border p-2 space-y-2">
                <p className="text-xs">{day.work_date} - {day.day_name}</p>
                <select
                  className="h-9 w-full border rounded-md px-2 text-xs"
                  value={entry?.sub_area_id ?? ''}
                  disabled={tpQuery.data?.status === 'approved'}
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
                  <option value="">Select sub-area</option>
                  {areas.flatMap(area => area.sub_areas ?? []).map(sa => (
                    <option key={sa.id} value={sa.id}>{sa.name}</option>
                  ))}
                </select>
                <select
                  className="h-9 w-full border rounded-md px-2 text-xs"
                  value={entry?.working_with ?? ''}
                  disabled={tpQuery.data?.status === 'approved'}
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

        {tpQuery.data?.id && (
          <>
            {missingDates.length > 0 && (
              <p className="text-xs text-destructive">
                Fill all working days before submit. Missing: {missingDates.slice(0, 5).join(', ')}
                {missingDates.length > 5 ? '...' : ''}
              </p>
            )}
            <Button
              className="w-full"
              disabled={missingDates.length > 0 || tpQuery.data?.status === 'approved'}
              onClick={() =>
                void submit
                  .mutateAsync({ tourProgramId: tpQuery.data?.id ?? '', month })
                  .then(() => toast.success('Tour program submitted'))
              }
            >
              Submit TP
            </Button>
          </>
        )}

        <div className="rounded-xl border p-3 space-y-2">
          <p className="text-sm font-medium">TP History</p>
          {history.map((row: any) => (
            <p key={row.id} className="text-xs text-muted-foreground">
              {row.month} - {row.status}{row.is_late ? ' (late)' : ''}
            </p>
          ))}
        </div>
      </div>
      <BottomNav role="mr" />
    </div>
  )
}
