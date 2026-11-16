import { useEffect } from 'react'
import { CircleMarker, MapContainer, Polyline, Popup, TileLayer, useMap } from 'react-leaflet'
import type { LatLngExpression } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { ActivityPoint, ActivityVisit } from '@/hooks/useFieldPlan'

function Fit({ positions, token }: { positions: LatLngExpression[]; token: string }) {
  const map = useMap()
  useEffect(() => {
    if (positions.length === 0) return
    if (positions.length === 1) {
      map.setView(positions[0], 16)
      return
    }
    map.fitBounds(positions as [number, number][], { padding: [28, 28] })
    // Fit when the manager picks another MR or day, not on each live refresh.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, token])
  return null
}

export default function ActivityMap({
  points,
  visits,
  live,
  fitToken,
}: {
  points: ActivityPoint[]
  visits: ActivityVisit[]
  live?: { lat: number; lng: number; live: boolean } | null
  fitToken?: string
}) {
  const trail = points.filter(p => p.lat != null && p.lng != null && p.event === 'ping' && !p.flagged)
  const flags = points.filter(p => p.lat != null && p.lng != null && p.flagged)
  const positionedVisits = visits.filter(v => v.lat != null && v.lng != null)
  const positions: LatLngExpression[] = [
    ...trail.map(p => [p.lat as number, p.lng as number] as LatLngExpression),
    ...positionedVisits.map(v => [v.lat as number, v.lng as number] as LatLngExpression),
  ]
  const center: LatLngExpression = positions[0] ?? [18.6298, 73.7997]

  if (positions.length === 0) {
    return (
      <div className="flex h-72 items-center justify-center rounded-2xl border border-dashed border-border text-sm text-muted-foreground">
        No GPS trail for this day yet. The route appears while the app is open and location is on.
      </div>
    )
  }

  return (
    <div className="h-80 overflow-hidden rounded-2xl border border-border">
      <MapContainer center={center} zoom={14} className="h-full w-full" scrollWheelZoom={false}>
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Fit positions={positions} token={fitToken ?? `${positions.length}`} />
        {trail.length > 1 && (
          <Polyline positions={trail.map(p => [p.lat as number, p.lng as number])} pathOptions={{ color: '#2563eb', weight: 4 }} />
        )}
        {live && (
          <CircleMarker
            center={[live.lat, live.lng]}
            radius={11}
            pathOptions={{
              color: live.live ? '#b91c1c' : '#1d4ed8',
              fillColor: live.live ? '#ef4444' : '#60a5fa',
              fillOpacity: 1,
            }}
          >
            <Popup>{live.live ? 'Live location' : 'Last location'}</Popup>
          </CircleMarker>
        )}
        {positionedVisits.map(visit => (
          <CircleMarker
            key={`${visit.doctor_id}-${visit.at}`}
            center={[visit.lat as number, visit.lng as number]}
            radius={8}
            pathOptions={{
              color: visit.unavailable ? '#b45309' : '#047857',
              fillColor: visit.unavailable ? '#fbbf24' : '#34d399',
              fillOpacity: 1,
            }}
          >
            <Popup>
              <strong>{visit.doctor_name}</strong>
              <br />
              {visit.unavailable ? 'Unavailable' : 'DCR submitted'}
              {visit.products.length > 0 ? ` · ${visit.products.join(', ')}` : ''}
            </Popup>
          </CircleMarker>
        ))}
        {flags.map(point => (
          <CircleMarker
            key={point.id}
            center={[point.lat as number, point.lng as number]}
            radius={6}
            pathOptions={{ color: '#b91c1c', fillColor: '#f87171', fillOpacity: 1 }}
          >
            <Popup>Flagged: {point.flag_reason ?? 'unusual movement'}</Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  )
}
