import { format, parseISO, isValid } from 'date-fns'

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
