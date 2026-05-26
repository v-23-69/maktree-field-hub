import type { SpecialityChartRow } from '@/components/charts/chartTypes'

/** Keep top specialties readable; roll the rest into "Others". */
export function rollupSpecialityRows(rows: SpecialityChartRow[], maxItems = 6): SpecialityChartRow[] {
  if (rows.length <= maxItems) return rows
  const sorted = [...rows].sort((a, b) => b.visits - a.visits)
  const top = sorted.slice(0, maxItems - 1)
  const rest = sorted.slice(maxItems - 1)
  const otherVisits = rest.reduce((sum, r) => sum + r.visits, 0)
  if (otherVisits <= 0) return top
  return [...top, { speciality: 'Others', visits: otherVisits }]
}
