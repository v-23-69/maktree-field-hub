import { addDaysYmd } from '@/lib/dateUtils'

/** First calendar day (IST) on which plans, spot working, and Priority Calls apply. */
export const SPOT_START_DATE = '2026-11-17'
/** Daily plan must include at least this many doctor calls. Confirm if this number changes. */
export const PLAN_MIN_CALLS = 10
/** A daily plan cannot list more than this many doctor calls. */
export const PLAN_MAX_CALLS = 16
/** DCR stays open inside this many metres of the saved clinic. */
export const SPOT_RADIUS_M = 800
/** Fixes coarser than this are rejected so a rough network location cannot unlock a DCR. */
export const SPOT_MAX_ACCURACY_M = 80

const IST = 'Asia/Kolkata'

export function istNowParts(now = new Date()): { ymd: string; minutes: number } {
  const ymd = new Intl.DateTimeFormat('en-CA', {
    timeZone: IST,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
  const hm = new Intl.DateTimeFormat('en-GB', {
    timeZone: IST,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(now)
  const [h, m] = hm.split(':').map(Number)
  return { ymd, minutes: (h || 0) * 60 + (m || 0) }
}

export type PlanWindow = 'open' | 'locked' | 'closed' | 'too_far'

/** Tomorrow opens at 18:00 IST. The screen asks for the plan by 10:00 IST. It actually closes at 11:00 IST, after the last reminder. */
export function dailyPlanWindow(planDate: string, now = new Date()): PlanWindow {
  const { ymd, minutes } = istNowParts(now)
  const tomorrow = addDaysYmd(ymd, 1)
  if (planDate < ymd) return 'closed'
  if (planDate > tomorrow) return 'too_far'
  if (planDate === tomorrow) return minutes >= 18 * 60 ? 'open' : 'locked'
  return minutes < 11 * 60 ? 'open' : 'closed'
}

export function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const r = 6371000
  const p1 = (lat1 * Math.PI) / 180
  const p2 = (lat2 * Math.PI) / 180
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dLng / 2) ** 2
  return 2 * r * Math.asin(Math.min(1, Math.sqrt(a)))
}

export type SpotUiMode = 'ready' | 'confirming' | 'away' | 'need_gps' | 'not_on_plan' | 'open' | 'capture'

export type SpotUi = { mode: SpotUiMode; title: string; detail: string }

export function describeDoctorSpot(input: {
  role: string
  planDate?: string
  planStatus: string
  onDaily: boolean
  onPriority: boolean
  hasLocation: boolean
  distanceM: number | null
  accuracyM: number | null
  serverUnlocked: boolean
  serverConfirming: boolean
  flagged: boolean
}): SpotUi {
  const {
    role, planDate, planStatus, onDaily, onPriority, hasLocation,
    distanceM, accuracyM, serverUnlocked, serverConfirming, flagged,
  } = input

  if (planDate && planDate < SPOT_START_DATE) {
    return {
      mode: 'open',
      title: 'Normal working',
      detail: 'Spot working starts on 17 Nov. This visit is filed as normal work.',
    }
  }

  if (role !== 'mr') {
    return { mode: 'open', title: 'Open', detail: 'Spot working applies to medical representatives.' }
  }

  const planMissing = !planStatus || planStatus === 'none' || planStatus === 'missed' || planStatus === 'rejected'
  if (planMissing) {
    return {
      mode: 'open',
      title: 'Normal working',
      detail: planStatus === 'rejected'
        ? 'The daily plan was rejected. File this DCR normally. The day will carry that remark.'
        : 'No daily plan for this day. Spot working is off. This DCR will note that the plan was not submitted.',
    }
  }

  if (onPriority && !hasLocation) {
    return {
      mode: 'capture',
      title: 'Priority Call',
      detail: 'This doctor has no clinic location yet. File the DCR, and save the location while you are here.',
    }
  }

  if (!onDaily && !onPriority && (planStatus === 'approved' || planStatus === 'pending')) {
    return {
      mode: 'not_on_plan',
      title: 'Not on today’s plan',
      detail: 'Add a Priority Call for this doctor. It does not need approval.',
    }
  }

  if ((onDaily || onPriority) && !hasLocation) {
    return {
      mode: 'capture',
      title: 'Location not saved',
      detail: 'You can file this DCR. Save the clinic location now so the next visit unlocks only on site.',
    }
  }

  if (!(onDaily || onPriority) || !hasLocation) {
    return { mode: 'open', title: 'Open', detail: 'This visit is not location-locked.' }
  }

  if (flagged || accuracyM == null || accuracyM < 1 || accuracyM > SPOT_MAX_ACCURACY_M || distanceM == null) {
    return {
      mode: 'need_gps',
      title: 'Waiting for GPS',
      detail: 'Turn location on and keep Maktree open. A weak signal cannot unlock the DCR.',
    }
  }

  if (distanceM > SPOT_RADIUS_M) {
    return {
      mode: 'away',
      title: `${Math.round(distanceM)} m away`,
      detail: `The DCR opens within ${SPOT_RADIUS_M} m of this clinic and locks again when you leave.`,
    }
  }

  if (serverUnlocked) {
    return {
      mode: 'ready',
      title: 'DCR open',
      detail: 'You are at the clinic. Fill this doctor’s DCR before you leave.',
    }
  }

  return {
    mode: 'confirming',
    title: serverConfirming ? 'Confirming location' : 'Confirming location',
    detail: 'Stay inside the clinic for a few seconds. Two GPS fixes are required so a fake location cannot unlock the DCR.',
  }
}
