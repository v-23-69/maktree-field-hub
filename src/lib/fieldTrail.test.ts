import { describe, expect, it } from 'vitest'
import type { ActivityPoint, ActivityVisit } from '@/hooks/useFieldPlan'
import { clusterStops, formatStay, latestFix, stayForVisit } from './fieldTrail'

function ping(at: string, lat: number, lng: number): ActivityPoint {
  return {
    id: at,
    at,
    lat,
    lng,
    accuracy: 10,
    event: 'ping',
    doctor_id: null,
    doctor_name: null,
    flagged: false,
    flag_reason: null,
    metadata: {},
  }
}

describe('clusterStops', () => {
  it('keeps one stop when the MR stays in the same place', () => {
    const stops = clusterStops([
      ping('2026-11-17T04:00:00.000Z', 18.63, 73.80),
      ping('2026-11-17T04:06:00.000Z', 18.6301, 73.8001),
    ])
    expect(stops).toHaveLength(1)
    expect(stops[0].durationMs).toBe(6 * 60 * 1000)
    expect(formatStay(stops[0])).toBe('6 min')
  })

  it('splits a stop after the MR leaves', () => {
    const stops = clusterStops([
      ping('2026-11-17T04:00:00.000Z', 18.63, 73.80),
      ping('2026-11-17T04:10:00.000Z', 18.65, 73.80),
    ])
    expect(stops).toHaveLength(2)
  })

  it('splits a stop when the same place has a long gap', () => {
    const stops = clusterStops([
      ping('2026-11-17T04:00:00.000Z', 18.63, 73.80),
      ping('2026-11-17T04:20:00.000Z', 18.63, 73.80),
    ])
    expect(stops).toHaveLength(2)
  })
})

describe('latestFix', () => {
  it('is live only when the newest fix is from the last 3 minutes today', () => {
    const points = [ping('2026-11-17T04:00:00.000Z', 18.63, 73.80)]
    const now = new Date('2026-11-17T04:02:00.000Z')
    expect(latestFix(points, now, true)?.live).toBe(true)
    expect(latestFix(points, new Date('2026-11-17T04:10:00.000Z'), true)?.live).toBe(false)
    expect(latestFix(points, now, false)?.live).toBe(false)
  })
})

describe('stayForVisit', () => {
  it('matches the visit to the stop at that clinic', () => {
    const stops = clusterStops([
      ping('2026-11-17T04:00:00.000Z', 18.63, 73.80),
      ping('2026-11-17T04:06:00.000Z', 18.6301, 73.8001),
      ping('2026-11-17T04:12:00.000Z', 18.6302, 73.8002),
    ])
    const visit: ActivityVisit = {
      doctor_id: 'd1',
      doctor_name: 'Dr A',
      at: '2026-11-17T04:11:00.000Z',
      unavailable: false,
      note: null,
      lat: 18.6301,
      lng: 73.8001,
      waived: false,
      products: [],
    }
    expect(stayForVisit(visit, stops)?.durationMs).toBe(12 * 60 * 1000)
  })
})