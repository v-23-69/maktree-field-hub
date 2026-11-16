import type { ActivityPoint, ActivityVisit } from '@/hooks/useFieldPlan'
import type { TrailStop } from '@/lib/fieldTrail'
import { formatIstClock, formatStay } from '@/lib/fieldTrail'
import { haversineMeters } from '@/lib/spotWorking'

export type ReplayPoint = { at: string; t: number; lat: number; lng: number }

export type ReplayEvent = {
  id: string
  at: string
  t: number
  lat: number
  lng: number
  kind: 'start' | 'call' | 'unavailable' | 'stop'
  title: string
  detail: string
  pathIndex: number
}

function atMs(iso: string): number {
  const t = new Date(iso).getTime()
  return Number.isFinite(t) ? t : 0
}

function nearestIndex(path: ReplayPoint[], t: number): number {
  if (path.length === 0) return 0
  let best = 0
  let bestGap = Infinity
  for (let i = 0; i < path.length; i += 1) {
    const gap = Math.abs(path[i].t - t)
    if (gap < bestGap) {
      best = i
      bestGap = gap
    }
  }
  return best
}

/** The day's GPS path plus the moments a manager should see on the map. */
export function buildReplay(
  points: ActivityPoint[],
  visits: ActivityVisit[],
  stops: TrailStop[],
): { path: ReplayPoint[]; events: ReplayEvent[] } {
  const path = points
    .filter(p => p.event === 'ping' && !p.flagged && p.lat != null && p.lng != null)
    .sort((a, b) => atMs(a.at) - atMs(b.at))
    .map(p => ({ at: p.at, t: atMs(p.at), lat: p.lat as number, lng: p.lng as number }))

  const events: ReplayEvent[] = []
  if (path.length > 0) {
    events.push({
      id: 'start',
      at: path[0].at,
      t: path[0].t,
      lat: path[0].lat,
      lng: path[0].lng,
      kind: 'start',
      title: 'Day started',
      detail: `First location at ${formatIstClock(path[0].at)}`,
      pathIndex: 0,
    })
  }

  for (const visit of visits) {
    const t = atMs(visit.at)
    const pathIndex = nearestIndex(path, t)
    const anchor = path[pathIndex]
    const lat = visit.lat ?? anchor?.lat
    const lng = visit.lng ?? anchor?.lng
    if (lat == null || lng == null) continue
    const stay = stops.find(stop => (
      t >= atMs(stop.startedAt) - 10 * 60 * 1000
      && t <= atMs(stop.endedAt) + 10 * 60 * 1000
      && haversineMeters(lat, lng, stop.lat, stop.lng) <= 800
    ))
    const products = visit.products.length > 0 ? `Products: ${visit.products.join(', ')}` : 'No products recorded'
    events.push({
      id: `visit-${visit.doctor_id}-${visit.at}`,
      at: visit.at,
      t,
      lat,
      lng,
      kind: visit.unavailable ? 'unavailable' : 'call',
      title: visit.unavailable ? `${visit.doctor_name} unavailable` : `Call · ${visit.doctor_name}`,
      detail: `${formatIstClock(visit.at)} · ${formatStay(stay ?? null)} · ${products}`,
      pathIndex,
    })
  }

  for (const stop of stops) {
    if (stop.pingCount < 2 || stop.durationMs < 2 * 60 * 1000) continue
    const covered = events.some(event => haversineMeters(event.lat, event.lng, stop.lat, stop.lng) <= 250)
    if (covered) continue
    const t = atMs(stop.startedAt)
    events.push({
      id: `stop-${stop.startedAt}`,
      at: stop.startedAt,
      t,
      lat: stop.lat,
      lng: stop.lng,
      kind: 'stop',
      title: `Stopped ${formatStay(stop)}`,
      detail: `${formatIstClock(stop.startedAt)} to ${formatIstClock(stop.endedAt)}`,
      pathIndex: nearestIndex(path, t),
    })
  }

  events.sort((a, b) => a.t - b.t)
  return { path, events }
}
