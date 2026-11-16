import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import PageHeader from '@/components/shared/PageHeader'
import BottomNav from '@/components/shared/BottomNav'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import ActivityReplay from '@/components/field/ActivityReplay'
import { useAuth } from '@/hooks/useAuth'
import { useManagerMrs } from '@/hooks/useManagerTeam'
import { useMrSubAreas } from '@/hooks/useAreas'
import { useFieldActivityDay, useFieldMonthSummary } from '@/hooks/useFieldPlan'
import { calendarWeekdaySun0, formatDisplayDate, formatDisplayDateTime, todayInputDate } from '@/lib/dateUtils'
import { clusterStops, formatDurationMs, formatIstClock, formatStay, latestFix, stayForVisit } from '@/lib/fieldTrail'
import { placesForAreaNames } from '@/lib/territoryPlaces'
import { cn } from '@/lib/utils'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function FieldActivityPage() {
  const { user } = useAuth()
  const [params, setParams] = useSearchParams()
  const mrs = useManagerMrs(user?.id ?? '')
  const today = todayInputDate()
  const [mrId, setMrId] = useState(params.get('mrId') || user?.id || '')
  const [date, setDate] = useState(params.get('date') || today)
  const month = `${date.slice(0, 7)}-01`
  const isToday = date === today
  const areas = useMrSubAreas(mrId)
  const activity = useFieldActivityDay(mrId, date, isToday)
  const summary = useFieldMonthSummary(mrId, month)

  const people = useMemo(() => {
    const self = user ? [{ id: user.id, full_name: 'Me' }] : []
    return [...self, ...(mrs.data ?? []).map(m => ({ id: m.id, full_name: m.full_name }))]
  }, [mrs.data, user])

  const select = (nextMr: string, nextDate: string) => {
    setMrId(nextMr)
    setDate(nextDate)
    const q = new URLSearchParams(params)
    q.set('mrId', nextMr)
    q.set('date', nextDate)
    setParams(q, { replace: true })
  }

  const day = activity.data
  const points = [...(day?.points ?? [])].reverse()
  const stops = useMemo(() => clusterStops(day?.points ?? []), [day?.points])
  const places = useMemo(() => {
    const rows = areas.data ?? []
    return placesForAreaNames(
      rows.map(row => row.area?.name ?? '').filter(Boolean),
      rows.map(row => row.name),
    )
  }, [areas.data])
  const live = useMemo(
    () => latestFix(day?.points ?? [], new Date(), isToday),
    [day?.points, isToday, activity.dataUpdatedAt],
  )
  const callsDone = (day?.visits ?? []).filter(v => !v.unavailable).length
  const unavailable = (day?.visits ?? []).filter(v => v.unavailable).length
  const { callStays, otherStops } = useMemo(() => {
    const used = new Set<string>()
    let total = 0
    for (const visit of day?.visits ?? []) {
      const stay = stayForVisit(visit, stops)
      if (!stay) continue
      if (used.has(stay.startedAt)) continue
      used.add(stay.startedAt)
      total += stay.durationMs
    }
    const other = stops.filter(stop => (
      stop.pingCount >= 2
      && stop.durationMs >= 2 * 60 * 1000
      && !used.has(stop.startedAt)
    ))
    return { callStays: total, otherStops: other }
  }, [day?.visits, stops])

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader title="Field activity" showBack />
      <div className="mx-auto w-full max-w-lg space-y-4 px-4 py-4 md:max-w-3xl md:px-8">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {people.map(person => (
            <button
              key={person.id}
              type="button"
              onClick={() => select(person.id, date)}
              className={cn('shrink-0 rounded-xl border px-3 py-2 text-xs font-semibold', mrId === person.id ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card')}
            >
              {person.full_name}
            </button>
          ))}
        </div>

        <label className="block text-xs font-semibold text-muted-foreground">
          Day
          <input
            type="date"
            value={date}
            onChange={e => select(mrId, e.target.value)}
            className="mt-1 h-10 w-full rounded-xl border border-border bg-background px-3 text-sm"
          />
        </label>

        {summary.data && (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat label="Plans" value={summary.data.plans_approved} />
            <Stat label="Missed plans" value={summary.data.plans_missed} />
            <Stat label="Calls" value={summary.data.calls_done} />
            <Stat label="Unavailable" value={summary.data.unavailable} />
          </div>
        )}

        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {(summary.data?.days ?? []).map(item => (
            <button
              key={item.date}
              type="button"
              onClick={() => select(mrId, item.date.slice(0, 10))}
              className={cn('shrink-0 rounded-lg border px-2 py-1 text-[10px] font-semibold', item.date.slice(0, 10) === date ? 'border-primary bg-primary/10 text-primary' : 'border-border')}
            >
              {WEEKDAYS[calendarWeekdaySun0(item.date.slice(0, 10))] ?? ''} {item.date.slice(8, 10)} · {item.visits}
            </button>
          ))}
        </div>

        {activity.isLoading && <LoadingSpinner />}
        {day && (
          <>
            <div className="glass-card space-y-2 p-4 text-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold">{day.user_name}</p>
                  <p className="text-xs text-muted-foreground">{formatDisplayDate(date)}</p>
                </div>
                <span className={cn(
                  'rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide',
                  live?.live ? 'bg-red-500/15 text-red-600' : 'bg-muted text-muted-foreground',
                )}>
                  {live?.live ? 'Live' : 'Last seen'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {live
                  ? `${live.live ? 'On the map now' : 'Last fix'} · ${formatIstClock(live.at)}`
                  : 'No location yet. It appears while this MR has the app open and GPS on.'}
              </p>
              <div className="grid grid-cols-3 gap-2 pt-1">
                <Stat label="Calls" value={callsDone} />
                <Stat label="Unavailable" value={unavailable} />
                <Stat label="At calls" value={formatDurationMs(callStays)} />
              </div>
              <p className="text-xs text-muted-foreground">Plan: {day.plan_status.replace('_', ' ')} · submitted {formatDisplayDateTime(day.plan_submitted_at)}</p>
              <p className="text-xs text-muted-foreground">First DCR: {formatDisplayDateTime(day.first_dcr_at)}</p>
            </div>
            <ActivityReplay
              points={day.points}
              visits={day.visits}
              stops={stops}
              places={places}
              live={isToday}
              fitToken={`${mrId}:${date}:${places.length}`}
            />
            <section className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Calls and time at location</p>
              {day.visits.length === 0 && (
                <p className="text-xs text-muted-foreground">No doctor call saved for this day yet.</p>
              )}
              {day.visits.map(visit => {
                const stay = stayForVisit(visit, stops)
                return (
                  <article key={`${visit.doctor_id}-${visit.at}`} className="rounded-2xl border border-border bg-card p-3">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-semibold">{visit.doctor_name}</p>
                      <p className="shrink-0 text-xs font-bold text-primary">{formatStay(stay)}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatIstClock(visit.at)} · {visit.unavailable ? 'Doctor unavailable' : 'DCR'}
                      {stay ? ` · there ${formatIstClock(stay.startedAt)} to ${formatIstClock(stay.endedAt)}` : ' · time at this clinic was not captured'}
                      {visit.waived ? ' · plan not applied' : ''}
                    </p>
                    {visit.products.length > 0 && (
                      <p className="mt-1 text-xs">Products: {visit.products.join(', ')}</p>
                    )}
                  </article>
                )
              })}
              {otherStops.length > 0 && (
                <p className="pt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Other stops</p>
              )}
              {otherStops.map(stop => (
                <p key={stop.startedAt} className="text-xs text-muted-foreground">
                  {formatIstClock(stop.startedAt)}–{formatIstClock(stop.endedAt)} · {formatStay(stop)} at one location
                </p>
              ))}
              {points.filter(p => p.event !== 'ping').slice(0, 12).map(point => (
                <p key={point.id} className="text-xs text-muted-foreground">
                  {formatDisplayDateTime(point.at)} · {point.event.replaceAll('_', ' ')}
                  {point.doctor_name ? ` · ${point.doctor_name}` : ''}
                  {point.flagged ? ' · flagged' : ''}
                </p>
              ))}
            </section>
          </>
        )}
      </div>
      <BottomNav role="manager" />
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-2xl border border-border bg-card px-3 py-2">
      <p className="text-[10px] font-semibold uppercase text-muted-foreground">{label}</p>
      <p className="text-lg font-bold tabular-nums">{value}</p>
    </div>
  )
}
