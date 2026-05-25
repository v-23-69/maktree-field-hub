import { addMonths, format, parseISO } from 'date-fns'

const IST = 'Asia/Kolkata'

/** Today's calendar date in IST as `YYYY-MM-DD` (matches Postgres `today_ist()`). */
export function todayInputDate(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: IST,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

/** True when `dob` (any year) falls on today's calendar month/day in IST. */
export function isDobCelebrationToday(dob: string | null | undefined): boolean {
  if (!dob) return false
  const today = todayInputDate()
  const normalized = dob.slice(0, 10)
  if (normalized.length < 10 || today.length < 10) return false
  return normalized.slice(5, 10) === today.slice(5, 10)
}

/** True if `yyyy-mm-dd` is a Sunday on the Gregorian calendar (same everywhere). */
export function isSundayYmd(ymd: string): boolean {
  return calendarWeekdaySun0(ymd) === 0
}

/** 0 = Sunday … 6 = Saturday for a calendar `yyyy-mm-dd`. */
export function calendarWeekdaySun0(ymd: string): number {
  const [y, m, d] = ymd.split('-').map(Number)
  if (!y || !m || !d) return NaN
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0)).getUTCDay()
}

/** `month` is `YYYY-MM`. Returns inclusive DB start and exclusive upper bound for `.lt('report_date', endExclusive)`. */
export function monthDateRangeForSql(monthYyyyMm: string): { startInclusive: string; endExclusive: string } {
  const startInclusive = `${monthYyyyMm}-01`
  const start = parseISO(startInclusive)
  const endExclusive = format(addMonths(start, 1), 'yyyy-MM-dd')
  return { startInclusive, endExclusive }
}

/** Last calendar day of month as `YYYY-MM-DD` (inclusive). */
export function lastDayOfMonthYyyyMmDd(monthYyyyMm: string): string {
  const { endExclusive } = monthDateRangeForSql(monthYyyyMm)
  const d = parseISO(endExclusive)
  d.setDate(d.getDate() - 1)
  return format(d, 'yyyy-MM-dd')
}

/** Display dates to users, e.g. "Sun, 18 May 2026" — weekday for the given calendar date (not browser TZ). */
export function formatDisplayDate(date: string): string {
  try {
    const [y, m, d] = date.split('-').map(Number)
    if (!y || !m || !d) return date
    const utcNoon = Date.UTC(y, m - 1, d, 12, 0, 0)
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: IST,
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(utcNoon))
  } catch {
    return date
  }
}

/** Month label from `YYYY-MM`, e.g. "May 2026". */
export function formatMonthYear(monthYyyyMm: string): string {
  try {
    const [y, m] = monthYyyyMm.split('-').map(Number)
    if (!y || !m) return monthYyyyMm
    const utcNoon = Date.UTC(y, m - 1, 1, 12, 0, 0)
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: IST,
      month: 'long',
      year: 'numeric',
    }).format(new Date(utcNoon))
  } catch {
    return monthYyyyMm
  }
}

/** Short label for a calendar date in IST (weekday + day + month). */
export function formatShortDateIst(ymd: string): string {
  try {
    const [y, m, d] = ymd.split('-').map(Number)
    if (!y || !m || !d) return ymd
    const utcNoon = Date.UTC(y, m - 1, d, 12, 0, 0)
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: IST,
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    }).format(new Date(utcNoon))
  } catch {
    return ymd
  }
}

/** Format a Date for DB / input[type=date], e.g. "2025-06-23" — uses local calendar components of the given Date. */
export function formatInputDate(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

/** Add calendar days to `yyyy-mm-dd` (Gregorian). */
export function addDaysYmd(ymd: string, days: number): string {
  const [y, m, d] = ymd.split('-').map(Number)
  if (!y || !m || !d) return ymd
  const dt = new Date(Date.UTC(y, m - 1, d, 12, 0, 0))
  dt.setUTCDate(dt.getUTCDate() + days)
  return format(dt, 'yyyy-MM-dd')
}

/** First day of current month in IST as `YYYY-MM-DD`. */
export function startOfMonthIstYmd(): string {
  return `${todayInputDate().slice(0, 7)}-01`
}

/** Monday-start week containing today (IST calendar date). */
export function startOfWeekIstYmd(): string {
  const today = todayInputDate()
  const wd = calendarWeekdaySun0(today)
  const daysFromMonday = (wd + 6) % 7
  return addDaysYmd(today, -daysFromMonday)
}

/** Current clock in IST for dashboard headers, e.g. "7:42 pm IST". */
export function formatIstTimeNow(): string {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: IST,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date()) + ' IST'
}
