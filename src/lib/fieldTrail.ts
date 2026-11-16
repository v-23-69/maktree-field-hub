import type { ActivityPoint, ActivityVisit } from '@/hooks/useFieldPlan'
import { haversineMeters } from '@/lib/spotWorking'

/** Pings farther than this from the current stop start a new stop. */
const SAME_PLACE_M = 200
/** A gap longer than this, even at the same place, starts a new stop. */
const BREAK_MS = 8 * 60 * 1000
/** A fix newer than this, on today, is treated as the MR's live location. */
export const LIVE_FIX_MS = 3 * 60 * 1000

export type TrailStop = {
  lat: number
  lng: number
  startedAt: string
  endedAt: string
  durationMs: number
  pingCount: number
}

export type LiveFix = {
  lat: number
  lng: number
  at: string
  live: boolean
}

function pingTime(iso: string): number {
  const t = new Date(iso).getTime()
  return Number.isFinite(t) ? t : 0
}

/** Group the day's GPS fixes into stops. Time at a stop is first fix to last fix. */
export function clusterStops(points: ActivityPoint[]): TrailStop[] {
  const pings = points
    .filter(p => p.event === 'ping' && !p.flagged && p.lat != null && p.lng != null)
    .sort((a, b) => pingTime(a.at) - pingTime(b.at))

  const stops: TrailStop[] = []
  for (const ping of pings) {
    const lat = ping.lat as number
    const lng = ping.lng as number
    const at = pingTime(ping.at)
    const last = stops[stops.length - 1]
    if (
      last
      && at - pingTime(last.endedAt) <= BREAK_MS
      && haversineMeters(last.lat, last.lng, lat, lng) <= SAME_PLACE_M
    ) {
      const n = last.pingCount
      last.lat = (last.lat * n + lat) / (n + 1)
      last.lng = (last.lng * n + lng) / (n + 1)
      last.endedAt = ping.at
      last.durationMs = Math.max(0, at - pingTime(last.startedAt))
      last.pingCount = n + 1
      continue
    }
    stops.push({
      lat,
      lng,
      startedAt: ping.at,
      endedAt: ping.at,
      durationMs: 0,
      pingCount: 1,
    })
  }
  return stops
}

export function latestFix(points: ActivityPoint[], now: Date, isToday: boolean): LiveFix | null {
  const pings = points
    .filter(p => p.lat != null && p.lng != null && !p.flagged && (p.event === 'ping' || p.event === 'dcr_open' || p.event === 'location_capture'))
    .sort((a, b) => pingTime(a.at) - pingTime(b.at))
  const last = pings[pings.length - 1]
  if (!last || last.lat == null || last.lng == null) return null
  const age = now.getTime() - pingTime(last.at)
  return {
    lat: last.lat,
    lng: last.lng,
    at: last.at,
    live: isToday && age >= 0 && age <= LIVE_FIX_MS,
  }
}

/** The stop that covers this doctor visit, when the MR's GPS was at that place. */
export function stayForVisit(visit: ActivityVisit, stops: TrailStop[]): TrailStop | null {
  const at = pingTime(visit.at)
  const near = stops.filter(stop => {
    const start = pingTime(stop.startedAt)
    const end = pingTime(stop.endedAt)
    const aroundVisit = at >= start - 10 * 60 * 1000 && at <= end + 10 * 60 * 1000
    if (!aroundVisit) return false
    if (visit.lat == null || visit.lng == null) return true
    return haversineMeters(visit.lat, visit.lng, stop.lat, stop.lng) <= 800
  })
  if (near.length === 0) return null
  return near.sort((a, b) => b.durationMs - a.durationMs)[0]
}

export function formatStay(stop: TrailStop | null): string {
  if (!stop || stop.pingCount < 2) return 'Seen once'
  const minutes = Math.round(stop.durationMs / 60000)
  if (minutes < 1) return 'Under 1 min'
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest === 0 ? `${hours} hr` : `${hours} hr ${rest} min`
}

export function formatDurationMs(ms: number): string {
  if (ms < 60_000) return '—'
  const minutes = Math.round(ms / 60000)
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest === 0 ? `${hours} hr` : `${hours} hr ${rest} min`
}

export function formatIstClock(iso: string | null | undefined): string {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date)
}
