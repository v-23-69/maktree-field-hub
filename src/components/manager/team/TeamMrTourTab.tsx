import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import {
  useDeleteTourProgramAsManager,
  useTourProgram,
  useTourProgramEntries,
  useTourProgramHistory,
} from '@/hooks/useTourProgram'
import { useMrSubAreasGrouped } from '@/hooks/useAreas'
import { formatShortDateIst, todayInputDate } from '@/lib/dateUtils'
import { Trash2, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'

function formatMonthLabel(monthStr: string) {
  const d = new Date(monthStr + 'T00:00:00')
  return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
}

interface Props {
  mrId: string
}

export default function TeamMrTourTab({ mrId }: Props) {
  const navigate = useNavigate()
  const now = todayInputDate()
  const monthOptions = useMemo(() => {
    const base = new Date(`${now.slice(0, 7)}-01T00:00:00`)
    return [0, 1, 2, 3].map(offset => {
      const d = new Date(base)
      d.setMonth(d.getMonth() - offset)
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
    })
  }, [now])

  const [month, setMonth] = useState(monthOptions[0])
  const [deleteOpen, setDeleteOpen] = useState(false)

  const tpQuery = useTourProgram(mrId, month)
  const { data: entries = [], isLoading: entriesLoading } = useTourProgramEntries(tpQuery.data?.id)
  const { data: history = [] } = useTourProgramHistory(mrId)
  const { data: areaGroups = [] } = useMrSubAreasGrouped(mrId)
  const deleteTp = useDeleteTourProgramAsManager()

  const subAreaName = useMemo(() => {
    const map = new Map<string, string>()
    for (const g of areaGroups) {
      for (const sa of g.sub_areas ?? []) {
        map.set(sa.id, `${g.area.name} — ${sa.name}`)
      }
    }
    return map
  }, [areaGroups])

  const status = tpQuery.data?.status ?? 'not_created'
  const statusClass: Record<string, string> = {
    approved: 'text-emerald-600',
    submitted: 'text-amber-600',
    rejected: 'text-destructive',
    draft: 'text-blue-600',
    not_created: 'text-muted-foreground',
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <select
          value={month}
          onChange={e => setMonth(e.target.value)}
          className="flex h-10 rounded-lg border border-input bg-card px-3 text-sm font-medium"
        >
          {monthOptions.map(m => (
            <option key={m} value={m}>
              {formatMonthLabel(m)}
            </option>
          ))}
        </select>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-lg text-xs"
          onClick={() => navigate(`/manager/tour-program?teamMr=${mrId}`)}
        >
          <ExternalLink className="h-3.5 w-3.5 mr-1" />
          Full editor
        </Button>
      </div>

      <div className="glass-card p-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground">Status</p>
          <p className={cn('text-sm font-bold capitalize', statusClass[status] ?? '')}>{status.replace('_', ' ')}</p>
        </div>
        {tpQuery.data?.id && status !== 'not_created' && (
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="rounded-lg"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="h-3.5 w-3.5 mr-1" />
            Delete TP
          </Button>
        )}
      </div>

      {tpQuery.isLoading || entriesLoading ? (
        <LoadingSpinner />
      ) : entries.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">No plan entries for this month.</p>
      ) : (
        <div className="space-y-2 max-h-[50vh] overflow-y-auto">
          {entries.map(e => (
            <div key={e.work_date} className="rounded-xl border border-border/60 bg-card px-3 py-2.5 flex justify-between gap-2">
              <span className="text-xs font-semibold">{formatShortDateIst(e.work_date)}</span>
              <span className="text-xs text-muted-foreground text-right truncate">
                {e.sub_area_id ? subAreaName.get(e.sub_area_id) ?? 'Area' : 'Not set'}
              </span>
            </div>
          ))}
        </div>
      )}

      {history.length > 1 && (
        <div className="space-y-2">
          <p className="section-title">History</p>
          {history.slice(0, 6).map((row: { id: string; month: string; status: string }) => (
            <div key={row.id} className="rounded-lg bg-muted/30 px-3 py-2 flex justify-between text-xs">
              <span className="font-semibold">{formatMonthLabel(row.month)}</span>
              <span className="capitalize text-muted-foreground">{row.status}</span>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete tour program?"
        description="This removes the tour program and its daily entries for this MR. This cannot be undone."
        confirmLabel="Delete"
        destructive
        confirmDisabled={deleteTp.isPending}
        onConfirm={() => {
          const id = tpQuery.data?.id
          if (!id) return
          void deleteTp
            .mutateAsync(id)
            .then(() => {
              toast.success('Tour program deleted')
              setDeleteOpen(false)
            })
            .catch(e => toast.error(e instanceof Error ? e.message : 'Delete failed'))
        }}
      />
    </div>
  )
}
