import { addMonths, format, parseISO, isValid } from 'date-fns'

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

/** Display dates to users, e.g. "Mon, 23 Jun 2025" */
export function formatDisplayDate(date: string): string {
  try {
    const d = parseISO(date)
    if (!isValid(d)) return date
    return format(d, 'EEE, dd MMM yyyy')
  } catch {
    return date
  }
}

/** Format a Date for DB / input[type=date], e.g. "2025-06-23" */
export function formatInputDate(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

export function todayInputDate(): string {
  return formatInputDate(new Date())
}
