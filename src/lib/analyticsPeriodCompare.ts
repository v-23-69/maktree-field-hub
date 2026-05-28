import { formatShortDateIst } from '@/lib/dateUtils'
import type { ChartDataPoint } from '@/components/ui/activity-stats-card'
import type { PeriodPreset } from '@/hooks/useFieldActivityAnalytics'

export function boundsForPreset(preset: PeriodPreset, anchorYmd: string): { from: string; to: string } {
  const to = anchorYmd
  const t = new Date(`${to}T12:00:00`)
  if (preset === 'weekly') {
    const s = new Date(t)
    s.setDate(s.getDate() - 6)
    const from = `${s.getFullYear()}-${String(s.getMonth() + 1).padStart(2, '0')}-${String(s.getDate()).padStart(2, '0')}`
    return { from, to }
  }
  if (preset === 'yearly') {
    const y = t.getFullYear()
    return { from: `${y}-01-01`, to }
  }
  return { from: `${to.slice(0, 7)}-01`, to }
}

export function previousBounds(from: string, to: string): { from: string; to: string } {
  const fromD = new Date(`${from}T12:00:00`)
  const toD = new Date(`${to}T12:00:00`)
  const days = Math.max(1, Math.round((toD.getTime() - fromD.getTime()) / 86400000) + 1)
  const prevEnd = new Date(fromD)
  prevEnd.setDate(prevEnd.getDate() - 1)
  const prevStart = new Date(prevEnd)
  prevStart.setDate(prevStart.getDate() - (days - 1))
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  return { from: fmt(prevStart), to: fmt(prevEnd) }
}

export function percentChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / previous) * 1000) / 10
}

export function buildDayComparisonChart(
  currentByDay: { date: string; calls: number }[],
  previousByDay: { date: string; calls: number }[],
  maxPoints = 8,
): ChartDataPoint[] {
  const cur = currentByDay.slice(-maxPoints)
  const prev = previousByDay.slice(-maxPoints)
  return cur.map((d, i) => ({
    label: d.date.length >= 10 ? d.date.slice(8, 10) : formatShortDateIst(d.date),
    currentValue: d.calls,
    previousValue: prev[i]?.calls ?? 0,
  }))
}
