import { isOutsideDefaultDcrWindow, isSundayYmd, todayInputDate } from '@/lib/dateUtils'

export const MAX_LATE_DCR_BATCH = 15

function parseYmd(ymd: string): Date {
  const [y, m, d] = ymd.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0))
}

function formatYmd(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
}

/** Most recent missed field days outside the normal 3-day window (max 15). */
export function getNextMissedLateBatchDates(
  submittedDates: Set<string>,
  todayStr: string = todayInputDate(),
  limit = MAX_LATE_DCR_BATCH,
): string[] {
  const missed: string[] = []
  const cursor = parseYmd(todayStr)
  cursor.setUTCDate(cursor.getUTCDate() - 3)

  for (let i = 0; i < 120 && missed.length < limit; i++) {
    const ymd = formatYmd(cursor)
    if (
      isOutsideDefaultDcrWindow(ymd) &&
      !isSundayYmd(ymd) &&
      !submittedDates.has(ymd)
    ) {
      missed.push(ymd)
    }
    cursor.setUTCDate(cursor.getUTCDate() - 1)
  }

  return missed.sort()
}

export function isDateInLateRequestPool(
  date: string,
  pool: string[],
): boolean {
  return pool.includes(date)
}
