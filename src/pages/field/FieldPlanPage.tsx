import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Check, Lock, MapPin } from 'lucide-react'
import PageHeader from '@/components/shared/PageHeader'
import BottomNav from '@/components/shared/BottomNav'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/hooks/useAuth'
import { useMyHqAreas } from '@/hooks/useMyHq'
import { useMrSubAreasGrouped } from '@/hooks/useAreas'
import { useDoctorsForMrDcr } from '@/hooks/useDoctors'
import { useWorkingWithReportOptions } from '@/hooks/useManagers'
import { useManagerMrs } from '@/hooks/useManagerTeam'
import { clearPageMemory, readPageMemory, writePageMemory } from '@/lib/pageMemory'
import {
  doctorNameOf,
  useClearDoctorLocation,
  useFieldDayBoard,
  usePlanAutoApproveSettings,
  useReviewFieldPlan,
  useSetPlanAutoApprove,
  useSubmitFieldPlan,
  useTeamClinicLocations,
  useTeamFieldPlans,
  type TeamFieldPlan,
} from '@/hooks/useFieldPlan'
import { addDaysYmd, formatDisplayDate, todayInputDate } from '@/lib/dateUtils'
import { PLAN_MAX_CALLS, PLAN_MIN_CALLS, SPOT_START_DATE, dailyPlanWindow } from '@/lib/spotWorking'
import { cn } from '@/lib/utils'
import CaptureLocationButton from '@/components/field/CaptureLocationButton'

function personName(plan: TeamFieldPlan): string {
  const user = plan.user
  if (!user) return 'Team member'
  return Array.isArray(user) ? user[0]?.full_name ?? 'Team member' : user.full_name
}

export default function FieldPlanPage() {
  const { user } = useAuth()
  const isManager = user?.role === 'manager'
  const [params, setParams] = useSearchParams()
  const today = todayInputDate()
  const tomorrow = addDaysYmd(today, 1)
  const requested = params.get('date')
  const initialDate = requested === tomorrow || requested === today ? requested : today
  const [date, setDate] = useState(initialDate)
  const [tab, setTab] = useState<'mine' | 'team'>(params.get('mrId') && isManager ? 'team' : 'mine')
  const priorityMode = params.get('priority') === '1'
  const replaceId = params.get('replace')
  const planDate = priorityMode ? today : date

  const windowState = dailyPlanWindow(planDate, new Date(), user?.role)
  const board = useFieldDayBoard(planDate)
  const hq = useMyHqAreas(user?.id ?? '')
  const areas = useMrSubAreasGrouped(user?.id ?? '')
  const draftKey = user?.id ? `plan:${user.id}:${planDate}:${priorityMode ? 'p' : 'd'}` : ''
  const savedDraft = draftKey ? readPageMemory<{
    selected: string[]
    subAreaIds: string[]
    withIds: string[]
    solo: boolean
    query: string
  }>(draftKey) : null
  const [subAreaIds, setSubAreaIds] = useState<string[]>(savedDraft?.subAreaIds ?? [])
  const doctors = useDoctorsForMrDcr(user?.id ?? '', subAreaIds)
  const companions = useWorkingWithReportOptions(user?.id, user?.role)
  const submit = useSubmitFieldPlan()

  const [selected, setSelected] = useState<string[]>(savedDraft?.selected ?? [])
  const [solo, setSolo] = useState(savedDraft?.solo ?? false)
  const [withIds, setWithIds] = useState<string[]>(savedDraft?.withIds ?? [])
  const [query, setQuery] = useState(savedDraft?.query ?? '')
  const [loadedKey, setLoadedKey] = useState('')

  const skipDraftSave = useRef(true)
  useEffect(() => {
    const saved = draftKey ? readPageMemory<{
      selected: string[]
      subAreaIds: string[]
      withIds: string[]
      solo: boolean
      query: string
    }>(draftKey) : null
    skipDraftSave.current = true
    setSelected(saved?.selected ?? [])
    setSubAreaIds(saved?.subAreaIds ?? [])
    setWithIds(saved?.withIds ?? [])
    setSolo(saved?.solo ?? false)
    setQuery(saved?.query ?? '')
    setLoadedKey('')
  }, [draftKey])

  useEffect(() => {
    if (skipDraftSave.current) {
      skipDraftSave.current = false
      return
    }
    if (!draftKey) return
    writePageMemory(draftKey, { selected, subAreaIds, withIds, solo, query })
  }, [draftKey, selected, subAreaIds, withIds, solo, query])

  useEffect(() => {
    const key = `${planDate}:${board.data?.plan_id ?? 'new'}:${priorityMode}`
    if (!board.data || loadedKey === key || priorityMode) return
    if (board.data.plan_status === 'none') {
      setLoadedKey(key)
      return
    }
    const dailyIds = board.data.calls.filter(c => c.source === 'daily').map(c => c.doctor_id)
    const areaIds = [...new Set(board.data.calls.filter(c => c.source === 'daily').map(c => c.sub_area_id))]
    setSelected(dailyIds)
    setSubAreaIds(areaIds)
    setWithIds(board.data.working_with_ids ?? [])
    setSolo((board.data.working_with_ids ?? []).length === 0 && board.data.plan_status !== 'none')
    setLoadedKey(key)
  }, [board.data, planDate, loadedKey, priorityMode])

  const dailyLocked = !priorityMode && (windowState !== 'open' || board.data?.plan_status === 'approved' || board.data?.plan_status === 'missed')
  const choices = (companions.data ?? []).filter(o => o.option_kind !== 'team_mr')
  const visibleDoctors = (doctors.data ?? []).filter(d => {
    const q = query.trim().toLowerCase()
    if (!q) return true
    return d.full_name.toLowerCase().includes(q) || (d.speciality ?? '').toLowerCase().includes(q)
  })
  const clinicCalls = (board.data?.calls ?? []).filter(call => priorityMode ? call.source === 'priority_call' : true)
  const showClinics = clinicCalls.length > 0 && (
    priorityMode
    || board.data?.plan_status === 'pending'
    || board.data?.plan_status === 'approved'
    || board.data?.plan_status === 'missed'
  )

  const toggleDoctor = (id: string) => {
    if (!priorityMode && dailyLocked) {
      toast.message('This plan is locked. Add the doctor as a Priority Call.')
      return
    }
    setSelected(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id)
      const alreadyPriority = priorityMode
        ? (board.data?.calls ?? []).filter(c => c.source === 'priority_call' && c.doctor_id !== id).length
        : 0
      if (prev.length + alreadyPriority >= PLAN_MAX_CALLS) {
        toast.message(priorityMode
          ? `Priority Calls can include ${PLAN_MAX_CALLS} doctors today`
          : `A daily plan can include ${PLAN_MAX_CALLS} calls`)
        return prev
      }
      return [...prev, id]
    })
  }

  const onSubmit = async () => {
    if (!solo && withIds.length === 0) {
      toast.error('Choose Solo or the manager you are working with')
      return
    }
    try {
      await submit.mutateAsync({
        planDate,
        kind: priorityMode ? 'priority_call' : 'daily',
        workingWithIds: solo ? [] : withIds,
        doctorIds: selected,
        replacesDoctorId: replaceId,
      })
      if (draftKey) clearPageMemory(draftKey)
      if (priorityMode) setSelected([])
      toast.success(priorityMode ? 'Priority Call sent to your managers' : 'Plan submitted')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not submit the plan')
    }
  }

  const priorityAlready = (board.data?.calls ?? []).filter(c => c.source === 'priority_call').length
  const countLabel = priorityMode ? `${selected.length} selected` : `${selected.length}/${PLAN_MAX_CALLS}`
  const canSubmit = priorityMode
    ? selected.length >= 1 && selected.length + priorityAlready <= PLAN_MAX_CALLS && (solo || withIds.length > 0) && !submit.isPending
    : selected.length >= PLAN_MIN_CALLS && selected.length <= PLAN_MAX_CALLS && (solo || withIds.length > 0) && !dailyLocked && !submit.isPending

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader title={priorityMode ? 'Priority Call' : 'Daily plan'} showBack />
      <div className="mx-auto w-full max-w-lg space-y-4 px-4 py-4 md:max-w-3xl md:px-8">
        {isManager && (
          <div className="grid grid-cols-2 gap-2">
            <TabButton active={tab === 'mine'} onClick={() => setTab('mine')} label="My plan" />
            <TabButton active={tab === 'team'} onClick={() => setTab('team')} label="Team plans" />
          </div>
        )}

        {tab === 'team' && isManager ? (
          <TeamPlans date={date} onDate={setDate} today={today} tomorrow={tomorrow} />
        ) : (
          <>
            <div className="glass-card space-y-3 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-foreground">
                    {priorityMode ? 'Add the doctors you need now' : 'Who you will meet'}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {priorityMode
                      ? 'Add one or more doctors. You can submit again later if more doctors are free, and you can mark several doctors unavailable. No approval. Your managers are notified each time.'
                      : isManager
                        ? `Select areas inside your headquarter, then ${PLAN_MIN_CALLS} to ${PLAN_MAX_CALLS} doctors. Tomorrow's plan opens at 6:00 PM. Today's plan can be submitted any time.`
                        : `Select areas inside your headquarter, then ${PLAN_MIN_CALLS} to ${PLAN_MAX_CALLS} doctors. Submit the plan first. Capture each clinic later, when you are at that hospital. The plan opens at 6:00 PM the day before. Submit it before 10:00 AM. After the 11:00 AM reminder it cannot be submitted.`}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">{countLabel}</span>
              </div>
              {today < SPOT_START_DATE && (
                <p className="text-xs font-medium text-amber-700 dark:text-amber-300">
                  Spot working starts {formatDisplayDate(SPOT_START_DATE)}. Submit that day’s plan from 6:00 PM the evening before. Visits before that stay normal.
                </p>
              )}
              {!priorityMode && (
                <div className="grid grid-cols-2 gap-2">
                  <DateChip active={date === today} label="Today" hint={formatDisplayDate(today)} onClick={() => setDate(today)} />
                  <DateChip active={date === tomorrow} label="Tomorrow" hint={dailyPlanWindow(tomorrow) === 'open' ? `Open · ${formatDisplayDate(tomorrow)}` : `Opens 6 PM · ${formatDisplayDate(tomorrow)}`} onClick={() => setDate(tomorrow)} />
                </div>
              )}
              {priorityMode && priorityAlready > 0 && (
                <p className="text-xs text-muted-foreground">
                  Already added today: {(board.data?.calls ?? []).filter(c => c.source === 'priority_call').map(c => c.doctor_name).join(', ')}. Select more doctors and submit again.
                </p>
              )}
              <div className="flex flex-wrap gap-1.5">
                <span className="inline-flex items-center gap-1 rounded-lg bg-muted px-2 py-1 text-[11px] font-semibold text-muted-foreground">
                  <Lock className="h-3 w-3" />
                  {(hq.data ?? []).map(h => h.area_name).join(', ') || 'Headquarter'}
                </span>
                {board.data?.plan_status && board.data.plan_status !== 'none' && !priorityMode && (
                  <span className="rounded-lg bg-primary/10 px-2 py-1 text-[11px] font-semibold capitalize text-primary">
                    {board.data.plan_status.replace('_', ' ')}
                  </span>
                )}
              </div>
              {windowState === 'locked' && !priorityMode && (
                <p className="text-xs font-medium text-amber-700 dark:text-amber-300">Tomorrow’s plan opens at 6:00 PM today.</p>
              )}
              {windowState === 'closed' && !priorityMode && (
                <p className="text-xs font-medium text-amber-700 dark:text-amber-300">
                  This plan window is closed. DCRs can still be filed, and the day will show that the plan was not submitted.
                </p>
              )}
            </div>

            {showClinics && (
              <section className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Clinics on this plan</p>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Open this plan when you are inside the hospital, then capture that clinic.
                </p>
                {clinicCalls.map(call => (
                  <div key={call.call_id} className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card p-3">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{call.doctor_name}</span>
                      <span className="block truncate text-xs text-muted-foreground">{call.sub_area_name || call.speciality}</span>
                    </span>
                    {call.has_location ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
                        <MapPin className="h-3 w-3" />Saved
                      </span>
                    ) : (
                      <CaptureLocationButton doctorId={call.doctor_id} compact />
                    )}
                  </div>
                ))}
              </section>
            )}

            <section className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Working with</p>
              <div className="flex flex-wrap gap-2">
                <ChoiceChip
                  active={solo}
                  label="Solo"
                  onClick={() => { setSolo(true); setWithIds([]) }}
                />
                {choices.map(m => (
                  <ChoiceChip
                    key={m.id}
                    active={!solo && withIds.includes(m.id)}
                    label={m.full_name}
                    onClick={() => { setSolo(false); setWithIds([m.id]) }}
                  />
                ))}
              </div>
            </section>

            <section className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Areas</p>
              <div className="flex flex-wrap gap-2">
                {(areas.data ?? []).flatMap(group => group.sub_areas.map(sa => (
                  <ChoiceChip
                    key={sa.id}
                    active={subAreaIds.includes(sa.id)}
                    label={`${group.area.name} · ${sa.name}`}
                    onClick={() => setSubAreaIds(prev => prev.includes(sa.id) ? prev.filter(id => id !== sa.id) : [...prev, sa.id])}
                  />
                )))}
              </div>
            </section>

            <section className="space-y-2">
              <Input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search doctors"
                className="rounded-xl"
              />
              {doctors.isLoading && <LoadingSpinner />}
              {subAreaIds.length === 0 && (
                <p className="text-sm text-muted-foreground">Select one or more areas to see doctors.</p>
              )}
              <div className="space-y-2">
                {visibleDoctors.map(doc => {
                  const on = selected.includes(doc.id)
                  return (
                    <button key={doc.id} type="button" onClick={() => toggleDoctor(doc.id)} className={cn('flex w-full items-center gap-3 rounded-2xl border p-3 text-left', on ? 'border-primary/40 bg-primary/5' : 'border-border/70 bg-card')}>
                      <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold', on ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}>
                        {on ? <Check className="h-4 w-4" /> : doc.full_name.slice(0, 1)}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold">{doc.full_name}</span>
                        <span className="block truncate text-xs text-muted-foreground">{doc.speciality || doc.sub_area?.name}</span>
                      </span>
                    </button>
                  )
                })}
              </div>
            </section>

            <Button className="h-12 w-full rounded-2xl text-sm font-bold" disabled={!canSubmit} onClick={() => void onSubmit()}>
              {submit.isPending ? 'Submitting…' : priorityMode ? 'Submit Priority Call' : 'Submit plan'}
            </Button>
            {priorityMode ? (
              <Button variant="outline" className="h-11 w-full rounded-2xl" onClick={() => setParams({})}>
                Back to daily plan
              </Button>
            ) : (
              <Button variant="outline" className="h-11 w-full rounded-2xl" onClick={() => setParams({ priority: '1' })}>
                Add a Priority Call
              </Button>
            )}
            {!priorityMode && selected.length < PLAN_MIN_CALLS && (
              <p className="text-center text-[11px] text-muted-foreground">
                {PLAN_MIN_CALLS} calls are required. You can add up to {PLAN_MAX_CALLS}. Clinic locations are not needed yet.
              </p>
            )}
          </>
        )}
      </div>
      <BottomNav role={isManager ? 'manager' : 'mr'} />
    </div>
  )
}

function TeamPlans({ date, onDate, today, tomorrow }: { date: string; onDate: (d: string) => void; today: string; tomorrow: string }) {
  const plans = useTeamFieldPlans(date, true)
  const settings = usePlanAutoApproveSettings(true)
  const locations = useTeamClinicLocations(true)
  const clearLocation = useClearDoctorLocation()
  const review = useReviewFieldPlan()
  const auto = useSetPlanAutoApprove()
  const { user } = useAuth()
  const team = useManagerMrs(user?.id ?? '')
  const [confirmDoctorId, setConfirmDoctorId] = useState<string | null>(null)

  const byUser = useMemo(() => {
    const map = new Map<string, TeamFieldPlan[]>()
    for (const plan of plans.data ?? []) {
      const list = map.get(plan.user_id) ?? []
      list.push(plan)
      map.set(plan.user_id, list)
    }
    return map
  }, [plans.data])

  const rows = team.data ?? []

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <DateChip active={date === today} label="Today" onClick={() => onDate(today)} />
        <DateChip active={date === tomorrow} label="Tomorrow" onClick={() => onDate(tomorrow)} />
      </div>
      {plans.isLoading && <LoadingSpinner />}
      {(locations.data ?? []).length > 0 && (
        <section className="glass-card space-y-2 p-4">
          <p className="text-sm font-bold">Saved clinic locations</p>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Delete a location if it was captured in the wrong place. The MR can capture it again at the hospital.
          </p>
          {(locations.data ?? []).map(row => (
            <div key={row.doctor_id} className="flex items-center gap-3 rounded-xl border border-border/70 px-3 py-2">
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{row.doctor_name}</span>
                <span className="block truncate text-[11px] text-muted-foreground">
                  {row.captured_by_name ? `Captured by ${row.captured_by_name}` : 'Captured'}
                </span>
              </span>
              <Button
                type="button"
                size="sm"
                variant={confirmDoctorId === row.doctor_id ? 'destructive' : 'outline'}
                className="shrink-0 rounded-xl"
                disabled={clearLocation.isPending}
                onClick={() => {
                  if (confirmDoctorId !== row.doctor_id) {
                    setConfirmDoctorId(row.doctor_id)
                    return
                  }
                  clearLocation.mutate(row.doctor_id, {
                    onSuccess: () => {
                      setConfirmDoctorId(null)
                      toast.success('Clinic location deleted')
                    },
                    onError: err => toast.error(err instanceof Error ? err.message : 'Could not delete the location'),
                  })
                }}
              >
                {confirmDoctorId === row.doctor_id ? 'Confirm delete' : 'Delete location'}
              </Button>
            </div>
          ))}
        </section>
      )}
      {rows.map(mr => {
        const mine = byUser.get(mr.id) ?? []
        const daily = mine.find(p => p.kind === 'daily')
        const priority = mine.filter(p => p.kind === 'priority_call')
        const enabled = settings.data?.[mr.id] === true
        return (
          <article key={mr.id} className="glass-card space-y-3 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold">{mr.full_name}</p>
                <p className="text-xs capitalize text-muted-foreground">{daily ? daily.status.replace('_', ' ') : 'No daily plan'}</p>
              </div>
              <label className="flex items-center gap-2 text-[11px] font-semibold text-muted-foreground">
                Auto-approve
                <Switch
                  checked={enabled}
                  onCheckedChange={value => auto.mutate({ mrId: mr.id, enabled: value })}
                />
              </label>
            </div>
            {daily && (
              <ul className="space-y-1 text-xs text-foreground">
                {(daily.calls ?? []).map(call => (
                  <li key={call.id} className="flex justify-between gap-2">
                    <span className="truncate">{doctorNameOf(call)}</span>
                    <span className="shrink-0 capitalize text-muted-foreground">{call.outcome}</span>
                  </li>
                ))}
              </ul>
            )}
            {priority.length > 0 && (
              <p className="text-xs text-primary">
                Priority Call: {priority.flatMap(p => (p.calls ?? []).map(doctorNameOf)).join(', ')}
              </p>
            )}
            {daily?.status === 'pending' && (
              <div className="flex gap-2">
                <Button size="sm" className="rounded-xl" disabled={review.isPending} onClick={() => review.mutate({ planId: daily.id, approve: true })}>Approve</Button>
                <Button size="sm" variant="outline" className="rounded-xl" disabled={review.isPending} onClick={() => review.mutate({ planId: daily.id, approve: false })}>Send back</Button>
              </div>
            )}
          </article>
        )
      })}
    </div>
  )
}

function TabButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={cn('rounded-xl border px-3 py-2 text-sm font-semibold', active ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card')}>
      {label}
    </button>
  )
}

function DateChip({ active, label, hint, onClick }: { active: boolean; label: string; hint?: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={cn('rounded-xl border px-3 py-2 text-left', active ? 'border-primary bg-primary/10' : 'border-border bg-card')}>
      <span className="block text-sm font-semibold">{label}</span>
      {hint && <span className="block text-[10px] text-muted-foreground">{hint}</span>}
    </button>
  )
}

function ChoiceChip({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={cn('rounded-full border px-3 py-1.5 text-xs font-semibold', active ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-foreground')}>
      {label}
    </button>
  )
}
