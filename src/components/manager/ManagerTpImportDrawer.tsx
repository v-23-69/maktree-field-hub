import { useEffect, useMemo, useState } from 'react'
import { Copy, X } from 'lucide-react'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { formatShortDateIst } from '@/lib/dateUtils'
import type { TourProgramEntry } from '@/types/database.types'

export type TpImportApplyTo = 'self' | 'both'

export type TpImportDraftRow = {
  work_date: string
  sub_area_id: string
  apply_to: TpImportApplyTo
  selected: boolean
}

type SubAreaItem = { id: string; name: string; areaName: string }

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  sourceMrName: string
  workingDates: string[]
  sourceEntries: TourProgramEntry[]
  managerSubAreas: SubAreaItem[]
  saving: boolean
  onConfirm: (rows: TpImportDraftRow[]) => void
}

export default function ManagerTpImportDrawer({
  open,
  onOpenChange,
  sourceMrName,
  workingDates,
  sourceEntries,
  managerSubAreas,
  saving,
  onConfirm,
}: Props) {
  const sourceByDate = useMemo(() => {
    const m = new Map<string, string>()
    for (const e of sourceEntries) {
      if (e.sub_area_id) m.set(e.work_date, e.sub_area_id)
    }
    return m
  }, [sourceEntries])

  const [rows, setRows] = useState<TpImportDraftRow[]>([])

  useEffect(() => {
    if (!open) return
    setRows(
      workingDates
        .filter(d => sourceByDate.has(d))
        .map(work_date => ({
          work_date,
          sub_area_id: sourceByDate.get(work_date) ?? '',
          apply_to: 'self' as TpImportApplyTo,
          selected: true,
        })),
    )
  }, [open, workingDates, sourceByDate])

  const selectedCount = rows.filter(r => r.selected && r.sub_area_id).length

  const setAllApplyTo = (apply_to: TpImportApplyTo) => {
    setRows(prev => prev.map(r => (r.selected ? { ...r, apply_to } : r)))
  }

  const subAreaLabel = (id: string) => {
    const sa = managerSubAreas.find(s => s.id === id)
    return sa ? `${sa.areaName} - ${sa.name}` : 'Unknown area'
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[92vh]">
        <DrawerHeader className="text-left pb-2">
          <DrawerTitle className="text-base flex items-center gap-2">
            <Copy className="h-4 w-4 text-primary" />
            Import from {sourceMrName}
          </DrawerTitle>
          <p className="text-xs text-muted-foreground font-normal">
            Review and edit each day before saving. Choose whether changes apply to your plan only
            or to both you and the MR.
          </p>
        </DrawerHeader>

        <div className="px-4 pb-2 flex gap-2">
          <Button type="button" size="sm" variant="outline" className="rounded-xl text-xs flex-1" onClick={() => setAllApplyTo('self')}>
            All: self only
          </Button>
          <Button type="button" size="sm" variant="outline" className="rounded-xl text-xs flex-1" onClick={() => setAllApplyTo('both')}>
            All: self + MR
          </Button>
        </div>

        <div className="overflow-y-auto px-4 pb-6 space-y-2 max-h-[55vh]">
          {rows.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">
              No filled working days to import from this MR.
            </p>
          )}
          {rows.map(row => (
            <div
              key={row.work_date}
              className={cn(
                'rounded-xl border p-3 space-y-2',
                row.selected ? 'border-border/80 bg-card' : 'border-border/40 bg-muted/20 opacity-70',
              )}
            >
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={row.selected}
                  onChange={e =>
                    setRows(prev =>
                      prev.map(r =>
                        r.work_date === row.work_date ? { ...r, selected: e.target.checked } : r,
                      ),
                    )
                  }
                  className="rounded border-border"
                />
                <span className="text-xs font-bold">{formatShortDateIst(row.work_date)}</span>
              </label>

              <select
                className="flex h-10 w-full rounded-xl border border-border/60 bg-background px-3 text-xs font-medium"
                value={row.sub_area_id}
                disabled={!row.selected}
                onChange={e =>
                  setRows(prev =>
                    prev.map(r =>
                      r.work_date === row.work_date ? { ...r, sub_area_id: e.target.value } : r,
                    ),
                  )
                }
              >
                <option value="">Select area</option>
                {managerSubAreas.map(sa => (
                  <option key={sa.id} value={sa.id}>
                    {sa.areaName} - {sa.name}
                  </option>
                ))}
              </select>
              {!managerSubAreas.some(s => s.id === row.sub_area_id) && row.sub_area_id && (
                <p className="text-[10px] text-amber-700">MR area: {subAreaLabel(row.sub_area_id)} — pick your assigned area</p>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={!row.selected}
                  className={cn(
                    'flex-1 rounded-lg py-1.5 text-[10px] font-semibold border',
                    row.apply_to === 'self'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground',
                  )}
                  onClick={() =>
                    setRows(prev =>
                      prev.map(r =>
                        r.work_date === row.work_date ? { ...r, apply_to: 'self' } : r,
                      ),
                    )
                  }
                >
                  Self only
                </button>
                <button
                  type="button"
                  disabled={!row.selected}
                  className={cn(
                    'flex-1 rounded-lg py-1.5 text-[10px] font-semibold border',
                    row.apply_to === 'both'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground',
                  )}
                  onClick={() =>
                    setRows(prev =>
                      prev.map(r =>
                        r.work_date === row.work_date ? { ...r, apply_to: 'both' } : r,
                      ),
                    )
                  }
                >
                  Self + MR
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="px-4 pb-6 pt-2 border-t border-border/60 flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="rounded-xl flex-1"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4 mr-1" /> Cancel
          </Button>
          <Button
            type="button"
            className="rounded-xl flex-1 font-semibold"
            disabled={saving || selectedCount === 0}
            onClick={() => onConfirm(rows.filter(r => r.selected && r.sub_area_id))}
          >
            {saving ? 'Saving…' : `Save ${selectedCount} day(s)`}
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
