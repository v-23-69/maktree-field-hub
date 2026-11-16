import { useEffect, useMemo, useState } from 'react'
import { CircleMarker, MapContainer, Polyline, Popup, TileLayer, Tooltip, useMap } from 'react-leaflet'
import type { LatLngExpression } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { ActivityPoint, ActivityVisit } from '@/hooks/useFieldPlan'
import type { TrailStop } from '@/lib/fieldTrail'
import { formatIstClock } from '@/lib/fieldTrail'
import { buildReplay, type ReplayEvent } from '@/lib/fieldReplay'
import type { TerritoryPlace } from '@/lib/territoryPlaces'
import { cn } from '@/lib/utils'

const KIND_COLOR: Record<ReplayEvent['kind'], string> = {
  start: '#2563eb',
  call: '#047857',
  unavailable: '#b45309',
  stop: '#7c3aed',
}

function Fit({ positions, token }: { positions: LatLngExpression[]; token: string }) {
  const map = useMap()
  useEffect(() => {
    if (positions.length === 0) return
    if (positions.length === 1) {
      map.setView(positions[0], 16)
      return
    }
    map.fitBounds(positions as [number, number][], { padding: [28, 28] })
    // Refit only when the manager picks another MR or day.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, token])
  return null
}

function Focus({ target, nonce }: { target: LatLngExpression | null; nonce: number }) {
  const map = useMap()
  useEffect(() => {
    if (!target || nonce === 0) return
    map.flyTo(target, Math.max(map.getZoom(), 16), { duration: 0.7 })
  }, [map, target, nonce])
  return null
}

export default function ActivityReplay({
  points,
  visits,
  stops,
  places = [],
  live = false,
  fitToken,
}: {
  points: ActivityPoint[]
  visits: ActivityVisit[]
  stops: TrailStop[]
  places?: TerritoryPlace[]
  /** Keep the marker on the latest fix while the manager watches today. */
  live?: boolean
  fitToken: string
}) {
  const { path, events } = useMemo(() => buildReplay(points, visits, stops), [points, visits, stops])
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [following, setFollowing] = useState(live)
  const [focusNonce, setFocusNonce] = useState(0)
  const [focusAt, setFocusAt] = useState<LatLngExpression | null>(null)

  useEffect(() => {
    setPlaying(false)
    setFollowing(live)
    setFocusNonce(0)
    setIndex(0)
  }, [fitToken, live])

  useEffect(() => {
    if (!following || path.length === 0) return
    setIndex(path.length - 1)
  }, [following, path.length])

  useEffect(() => {
    if (!playing) return
    if (path.length < 2) return
    const timer = window.setInterval(() => {
      setIndex(current => {
        if (current >= path.length - 1) {
          setPlaying(false)
          return current
        }
        return current + 1
      })
    }, 80)
    return () => window.clearInterval(timer)
  }, [playing, path.length])

  const here = path[Math.min(index, Math.max(path.length - 1, 0))]
  const traveled = path.slice(0, index + 1).map(p => [p.lat, p.lng] as LatLngExpression)
  const whole = path.map(p => [p.lat, p.lng] as LatLngExpression)
  const active = [...events].reverse().find(event => event.pathIndex <= index) ?? events[0]

  const jump = (event: ReplayEvent) => {
    setPlaying(false)
    setFollowing(false)
    setIndex(event.pathIndex)
    setFocusAt([event.lat, event.lng])
    setFocusNonce(n => n + 1)
  }

  if (path.length === 0 && places.length === 0) {
    return (
      <div className="flex h-72 items-center justify-center rounded-2xl border border-dashed border-border px-6 text-center text-sm text-muted-foreground">
        No route for this day yet. It appears as the MR moves with location on.
      </div>
    )
  }

  const mapCenter: LatLngExpression = here ? [here.lat, here.lng] : [places[0].lat, places[0].lng]
  const frame = whole.length > 0 ? whole : places.map(place => [place.lat, place.lng] as LatLngExpression)

  return (
    <div className="grid gap-3 md:grid-cols-[minmax(0,1.45fr)_minmax(220px,0.7fr)]">
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="h-80 md:h-[28rem]">
          <MapContainer center={mapCenter} zoom={14} className="h-full w-full" scrollWheelZoom={false}>
            <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Fit positions={frame} token={fitToken} />
            <Focus target={focusAt} nonce={focusNonce} />
            <Polyline positions={whole} pathOptions={{ color: '#94a3b8', weight: 3, opacity: 0.7 }} />
            {traveled.length > 1 && (
              <Polyline positions={traveled} pathOptions={{ color: '#0284c7', weight: 4 }} />
            )}
            {places.map(place => (
              <CircleMarker
                key={`${place.territory}-${place.name}`}
                center={[place.lat, place.lng]}
                radius={4}
                pathOptions={{ color: '#334155', fillColor: '#e2e8f0', fillOpacity: 0.8, weight: 1 }}
              >
                <Tooltip permanent direction="top" opacity={0.9}>{place.name}</Tooltip>
              </CircleMarker>
            ))}
            {events.map(event => (
              <CircleMarker
                key={event.id}
                center={[event.lat, event.lng]}
                radius={event.kind === 'start' ? 6 : 8}
                pathOptions={{ color: KIND_COLOR[event.kind], fillColor: KIND_COLOR[event.kind], fillOpacity: 0.9 }}
                eventHandlers={{ click: () => jump(event) }}
              >
                <Popup>
                  <strong>{event.title}</strong>
                  <br />
                  {event.detail}
                </Popup>
              </CircleMarker>
            ))}
            {here && (
              <CircleMarker
                center={[here.lat, here.lng]}
                radius={11}
                pathOptions={{ color: '#0f172a', fillColor: live && following ? '#ef4444' : '#38bdf8', fillOpacity: 1 }}
              >
                <Popup>{live && following ? 'Live now' : 'MR'} · {formatIstClock(here.at)}</Popup>
              </CircleMarker>
            )}
          </MapContainer>
        </div>
        {path.length > 0 && (
        <div className="flex items-center gap-3 border-t border-border px-3 py-2">
          <button
            type="button"
            onClick={() => {
              setFollowing(false)
              if (!playing && index >= path.length - 1) setIndex(0)
              setPlaying(value => !value)
            }}
            className="h-10 shrink-0 rounded-xl bg-primary px-3 text-xs font-bold text-primary-foreground"
          >
            {playing ? 'Pause' : 'Play day'}
          </button>
          {live && (
            <button
              type="button"
              onClick={() => {
                setPlaying(false)
                setFollowing(true)
                setIndex(Math.max(path.length - 1, 0))
              }}
              className={cn('h-10 shrink-0 rounded-xl px-3 text-xs font-bold', following ? 'bg-red-600 text-white' : 'border border-border')}
            >
              {following ? 'Live' : 'Jump to now'}
            </button>
          )}
          <input
            type="range"
            min={0}
            max={Math.max(path.length - 1, 0)}
            value={Math.min(index, path.length - 1)}
            onChange={event => {
              setPlaying(false)
              setFollowing(false)
              setIndex(Number(event.target.value))
            }}
            className="min-w-0 flex-1"
            aria-label="Day timeline"
          />
          <span className="w-16 shrink-0 text-right text-xs font-semibold tabular-nums">{here ? formatIstClock(here.at) : '—'}</span>
        </div>
        )}
      </div>

      <aside className="max-h-[28rem] overflow-y-auto rounded-2xl border border-border bg-card p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Day log</p>
        {events.length === 0 && (
          <p className="mt-2 text-sm text-muted-foreground">This MR’s areas are on the map. The route and calls appear as they move.</p>
        )}
        <ol className="mt-2 space-y-1.5">
          {events.map(event => (
            <li key={event.id}>
              <button
                type="button"
                onClick={() => jump(event)}
                className={cn(
                  'w-full rounded-xl px-2.5 py-2 text-left',
                  active?.id === event.id ? 'bg-primary/10' : 'hover:bg-muted',
                )}
              >
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: KIND_COLOR[event.kind] }} />
                  <span className="text-[11px] font-semibold tabular-nums text-muted-foreground">{formatIstClock(event.at)}</span>
                </span>
                <span className="mt-0.5 block text-sm font-semibold">{event.title}</span>
                <span className="block text-[11px] leading-relaxed text-muted-foreground">{event.detail}</span>
              </button>
            </li>
          ))}
        </ol>
      </aside>
    </div>
  )
}
