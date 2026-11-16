import { describe, expect, it } from 'vitest'
import type { ActivityPoint, ActivityVisit } from '@/hooks/useFieldPlan'
import { buildReplay } from './fieldReplay'
import { placesForAreaNames } from './territoryPlaces'

function ping(at: string, lat: number, lng: number): ActivityPoint {
  return {
    id: at, at, lat, lng, accuracy: 8, event: 'ping', doctor_id: null, doctor_name: null,
    flagged: false, flag_reason: null, metadata: {},
  }
}

const visit: ActivityVisit = {
  doctor_id: 'd1',
  doctor_name: 'Dr Mehta',
  at: '2026-11-17T05:10:00.000Z',
  unavailable: false,
  note: null,
  lat: 18.63,
  lng: 73.8,
  waived: false,
  products: ['Makcold'],
}

describe('buildReplay', () => {
  it('builds a path and marks the call on it', () => {
    const { path, events } = buildReplay([
      ping('2026-11-17T04:30:00.000Z', 18.62, 73.79),
      ping('2026-11-17T05:10:00.000Z', 18.63, 73.8),
      ping('2026-11-17T06:00:00.000Z', 18.64, 73.81),
    ], [visit], [])
    expect(path).toHaveLength(3)
    expect(events[0].kind).toBe('start')
    expect(events.some(event => event.kind === 'call' && event.title.includes('Dr Mehta'))).toBe(true)
  })
})

describe('placesForAreaNames', () => {
  it('places PCMC areas on the Pimpri-Chinchwad map and keeps Baramati separate', () => {
    const pcmc = placesForAreaNames(['PCMC'], ['Nigdi + Akurdi', 'Chikhali -I'])
    expect(pcmc.map(place => place.name).sort()).toEqual(['Akurdi', 'Chikhali', 'Nigdi'])
    expect(pcmc.every(place => place.lng < 74.1)).toBe(true)
    const baramati = placesForAreaNames(['Baramati'], ['Phalan'])
    expect(baramati[0]?.name).toBe('Phaltan')
  })
})