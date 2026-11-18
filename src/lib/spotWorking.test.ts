import { describe, expect, it } from 'vitest'
import { dailyPlanWindow, describeDoctorSpot, haversineMeters, istNowParts } from './spotWorking'

function atIst(ymd: string, hhmm: string) {
  const [y, m, d] = ymd.split('-').map(Number)
  const [h, min] = hhmm.split(':').map(Number)
  // IST is UTC+5:30, so subtract that to build a UTC instant.
  return new Date(Date.UTC(y, m - 1, d, h - 5, min - 30, 0))
}

describe('dailyPlanWindow', () => {
  const now = atIst('2026-11-16', '17:00')

  it('keeps tomorrow locked before 6 PM IST', () => {
    expect(istNowParts(now).minutes).toBe(17 * 60)
    expect(dailyPlanWindow('2026-11-17', now)).toBe('locked')
  })

  it('opens tomorrow at 6 PM IST and refuses the day after', () => {
    const evening = atIst('2026-11-16', '18:05')
    expect(dailyPlanWindow('2026-11-17', evening)).toBe('open')
    expect(dailyPlanWindow('2026-11-18', evening)).toBe('too_far')
  })

  it('closes today at 11 AM IST for an MR and leaves it open for a manager', () => {
    expect(dailyPlanWindow('2026-11-16', atIst('2026-11-16', '10:59'))).toBe('open')
    expect(dailyPlanWindow('2026-11-16', atIst('2026-11-16', '11:00'))).toBe('closed')
    expect(dailyPlanWindow('2026-11-16', atIst('2026-11-16', '11:00'), 'mr')).toBe('closed')
    expect(dailyPlanWindow('2026-11-16', atIst('2026-11-16', '15:30'), 'manager')).toBe('open')
    expect(dailyPlanWindow('2026-11-17', atIst('2026-11-16', '15:30'), 'manager')).toBe('locked')
  })
})

describe('haversineMeters', () => {
  it('is near zero for the same point and about 1.1 km for 0.01 degrees latitude', () => {
    expect(haversineMeters(18.6, 73.8, 18.6, 73.8)).toBeLessThan(1)
    const north = haversineMeters(18.6, 73.8, 18.61, 73.8)
    expect(north).toBeGreaterThan(1000)
    expect(north).toBeLessThan(1200)
  })
})

describe('describeDoctorSpot', () => {
  const base = {
    role: 'mr',
    planStatus: 'approved',
    onDaily: true,
    onPriority: false,
    hasLocation: true,
    distanceM: 120,
    accuracyM: 20,
    serverUnlocked: true,
    serverConfirming: false,
    flagged: false,
  }

  it('opens the DCR only after the server confirms the clinic', () => {
    expect(describeDoctorSpot(base).mode).toBe('ready')
    expect(describeDoctorSpot({ ...base, serverUnlocked: false }).mode).toBe('confirming')
  })

  it('locks the DCR outside 800 metres', () => {
    expect(describeDoctorSpot({ ...base, distanceM: 900, serverUnlocked: false }).mode).toBe('away')
  })

  it('keeps visits normal before the start date', () => {
    expect(describeDoctorSpot({ ...base, planDate: '2026-11-16' }).mode).toBe('open')
  })

  it('does not geofence a day with no plan', () => {
    expect(describeDoctorSpot({ ...base, planStatus: 'missed', onDaily: false }).mode).toBe('open')
  })

  it('blocks a doctor who is not on an approved plan', () => {
    expect(describeDoctorSpot({ ...base, onDaily: false, hasLocation: false }).mode).toBe('not_on_plan')
  })

  it('lets a priority call through without a saved location', () => {
    expect(describeDoctorSpot({
      ...base,
      onDaily: false,
      onPriority: true,
      hasLocation: false,
      serverUnlocked: false,
    }).mode).toBe('capture')
  })
})
