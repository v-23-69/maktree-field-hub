import type { DailyReport } from '@/types/database.types'
import { cn } from '@/lib/utils'

export function managerDcrSubmittedTileClass(
  origin: DailyReport['manager_dcr_origin'],
  expensePending: boolean,
): string {
  if (expensePending) return 'bg-amber-500/15 text-amber-900 font-semibold'
  switch (origin) {
    case 'import':
      return 'bg-violet-600/15 text-violet-900 font-semibold'
    case 'custom':
      return 'bg-sky-600/15 text-sky-900 font-semibold'
    case 'mixed':
      return 'bg-indigo-600/15 text-indigo-900 font-semibold'
    default:
      return 'bg-emerald-600/15 text-emerald-800 font-semibold'
  }
}

export function managerDcrOriginLabel(
  origin: DailyReport['manager_dcr_origin'],
  importedMrNames?: string[],
): string | null {
  if (!origin || origin === 'standard') return null
  if (origin === 'import') {
    const names = importedMrNames?.join(', ')
    return names ? `Working with: ${names}` : 'Working with (imported MR DCR)'
  }
  if (origin === 'custom') return 'Field visits (custom area)'
  if (origin === 'mixed') {
    const names = importedMrNames?.length ? ` · ${importedMrNames.join(', ')}` : ''
    return `Mixed (custom + TP/import)${names}`
  }
  return null
}

export function managerDcrLegendItems(): Array<{ className: string; label: string }> {
  return [
    { className: 'bg-emerald-600/15', label: 'Standard field DCR' },
    { className: 'bg-sky-600/15', label: 'Custom area visits' },
    { className: 'bg-violet-600/15', label: 'Working with (imported)' },
    { className: 'bg-indigo-600/15', label: 'Mixed' },
    { className: 'bg-amber-500/15', label: 'Expense pending' },
    { className: 'bg-red-500/10', label: 'Not submitted' },
  ]
}

export function listTileOriginBadgeClass(origin: DailyReport['manager_dcr_origin']): string {
  return cn(
    'text-[10px] font-semibold rounded-full px-2 py-0.5',
    origin === 'import' && 'bg-violet-600/15 text-violet-800',
    origin === 'custom' && 'bg-sky-600/15 text-sky-800',
    origin === 'mixed' && 'bg-indigo-600/15 text-indigo-800',
    (!origin || origin === 'standard') && 'bg-emerald-600/15 text-emerald-800',
  )
}
