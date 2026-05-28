import type { SpecialityChartRow } from '@/components/charts/chartTypes'

function canonicalSpeciality(label: string): string {
  const t = label.trim()
  if (!t) return '—'
  return t.toUpperCase()
}

/** Merge GP/Gp/GYNI duplicates, then roll small slices into "Others". */
export function rollupSpecialityRows(rows: SpecialityChartRow[], maxItems = 6): SpecialityChartRow[] {
  const merged = new Map<string, number>()
  for (const row of rows) {
    const key = canonicalSpeciality(row.speciality)
    merged.set(key, (merged.get(key) ?? 0) + row.visits)
  }
  const normalized: SpecialityChartRow[] = [...merged.entries()].map(([speciality, visits]) => ({
    speciality,
    visits,
  }))
  return rollupSpecialityRowsRaw(normalized, maxItems)
}

/** Keep top specialties readable; roll the rest into "Others". */
function rollupSpecialityRowsRaw(rows: SpecialityChartRow[], maxItems = 6): SpecialityChartRow[] {
  if (rows.length <= maxItems) return [...rows].sort((a, b) => b.visits - a.visits)
  const sorted = [...rows].sort((a, b) => b.visits - a.visits)
  const top = sorted.slice(0, maxItems - 1)
  const rest = sorted.slice(maxItems - 1)
  const otherVisits = rest.reduce((sum, r) => sum + r.visits, 0)
  if (otherVisits <= 0) return top
  return [...top, { speciality: 'Others', visits: otherVisits }]
}
