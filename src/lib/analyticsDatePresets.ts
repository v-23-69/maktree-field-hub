export type AnalyticsRangePreset = 'weekly' | 'monthly' | 'yearly' | 'custom'

export function monthBounds(year: number, month: number): { from: string; to: string } {
  const m = String(month).padStart(2, '0')
  const lastDay = new Date(year, month, 0).getDate()
  return {
    from: `${year}-${m}-01`,
    to: `${year}-${m}-${String(lastDay).padStart(2, '0')}`,
  }
}

export function yearBounds(year: number): { from: string; to: string } {
  return { from: `${year}-01-01`, to: `${year}-12-31` }
}

export function applyAnalyticsPreset(
  preset: Exclude<AnalyticsRangePreset, 'custom'>,
  opts?: { year?: number; month?: number },
): { from: string; to: string } {
  const today = new Date()
  const y = today.getFullYear()
  const m = today.getMonth() + 1
  const d = String(today.getDate()).padStart(2, '0')
  const todayYmd = `${y}-${String(m).padStart(2, '0')}-${d}`

  if (preset === 'weekly') {
    const start = new Date(today)
    start.setDate(today.getDate() - 6)
    const from = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`
    return { from, to: todayYmd }
  }

  if (preset === 'monthly') {
    const year = opts?.year ?? y
    const month = opts?.month ?? m
    const bounds = monthBounds(year, month)
    if (bounds.to > todayYmd) return { from: bounds.from, to: todayYmd }
    return bounds
  }

  const year = opts?.year ?? y
  const bounds = yearBounds(year)
  if (bounds.to > todayYmd) return { from: bounds.from, to: todayYmd }
  return bounds
}
