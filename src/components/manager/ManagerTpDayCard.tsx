import { memo, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Check, Users, Link2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatShortDateIst } from '@/lib/dateUtils'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export type ManagerTpLocalEntry = {
  sub_area_id: string
  match_mr_id?: string
  working_with_ids?: string[]
}

type SubAreaItem = { id: string; name: string; areaName: string }

type MrOption = { id: string; full_name: string | null }

type Props = {
  dateStr: string
  local: ManagerTpLocalEntry | undefined
  canEdit: boolean
  allSubAreas: SubAreaItem[]
  teamMrs: MrOption[]
  managerId: string
  onSubAreaChange: (date: string, value: string) => void
  onMatchMrChange: (date: string, mrId: string) => void
  onMatchArea: (date: string, mrId: string, subAreaId: string) => void
  onClearMatch: (date: string) => void
}

function useMrTourDayArea(mrId: string, workDate: string, enabled: boolean) {
  return useQuery({
    queryKey: ['mr-tp-day-area', mrId, workDate],
    enabled: enabled && !!mrId && !!workDate && !!supabase,
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not configured')
      const { data, error } = await supabase.rpc('get_tour_plan_for_date', {
        p_mr_id: mrId,
        p_date: workDate,
      })
      if (error) throw error
      const row = Array.isArray(data) ? data[0] : data
      if (!row) return null
      return row as {
        sub_area_id: string
        sub_area_name: string
        area_id: string
        area_name: string
        working_with_ids: string[]
      }
    },
  })
}

export const ManagerTpDayCard = memo(function ManagerTpDayCard({
  dateStr,
  local,
  canEdit,
  allSubAreas,
  teamMrs,
  managerId,
  onSubAreaChange,
  onMatchMrChange,
  onMatchArea,
  onClearMatch,
}: Props) {
  const dateLabel = formatShortDateIst(dateStr)
  const filled = !!local?.sub_area_id
  const selectedMrId = local?.match_mr_id ?? ''
  const { data: mrDayArea, isLoading: mrAreaLoading } = useMrTourDayArea(
    selectedMrId,
    dateStr,
    !!selectedMrId,
  )

  const matchedMrName = useMemo(
    () => teamMrs.find(m => m.id === selectedMrId)?.full_name?.trim() || 'MR',
    [teamMrs, selectedMrId],
  )

  const isMatched =
    !!local?.match_mr_id &&
    !!local.sub_area_id &&
    (local.working_with_ids ?? []).includes(local.match_mr_id)

  const mrAreaLabel = mrDayArea
    ? `${mrDayArea.area_name} — ${mrDayArea.sub_area_name}`
    : null

  return (
    <div
      className={cn(
        'glass-card p-3.5 space-y-3',
        filled && 'ring-1 ring-emerald-500/20',
        isMatched && 'ring-1 ring-violet-500/30 bg-violet-500/[0.03]',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold text-foreground">{dateLabel}</span>
        <div className="flex items-center gap-1.5">
          {isMatched && (
            <Badge variant="secondary" className="text-[9px] h-5 bg-violet-500/15 text-violet-800 border-0">
              Working with
            </Badge>
          )}
          {filled && <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />}
        </div>
      </div>

      {canEdit && (
        <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-3 space-y-2.5">
          <p className="text-[10px] font-semibold text-violet-900 dark:text-violet-300 flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            Plan with team MR (manager only)
          </p>
          <select
            className="flex h-10 w-full rounded-xl border-2 border-border/60 bg-background px-3 text-xs font-medium focus:border-primary focus:outline-none"
            value={selectedMrId}
            onChange={e => onMatchMrChange(dateStr, e.target.value)}
          >
            <option value="">Select MR for this day</option>
            {teamMrs
              .filter(m => m.id !== managerId)
              .map(mr => (
                <option key={mr.id} value={mr.id}>
                  {mr.full_name ?? 'MR'}
                </option>
              ))}
          </select>

          {selectedMrId && (
            <div className="text-xs rounded-lg bg-background/80 border border-border/50 px-3 py-2">
              {mrAreaLoading ? (
                <span className="text-muted-foreground">Loading MR&apos;s area for this day…</span>
              ) : mrAreaLabel ? (
                <span>
                  <span className="text-muted-foreground">MR plan: </span>
                  <span className="font-semibold text-foreground">{mrAreaLabel}</span>
                </span>
              ) : (
                <span className="text-amber-700 dark:text-amber-400">
                  No area in {matchedMrName}&apos;s tour program for this day yet.
                </span>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              className="flex-1 rounded-xl h-9 text-xs font-semibold gap-1"
              disabled={!selectedMrId || !mrDayArea?.sub_area_id}
              onClick={() => {
                if (mrDayArea?.sub_area_id && selectedMrId) {
                  onMatchArea(dateStr, selectedMrId, mrDayArea.sub_area_id)
                }
              }}
            >
              <Link2 className="h-3.5 w-3.5" />
              Match area
            </Button>
            {isMatched && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="rounded-xl h-9 text-xs"
                onClick={() => onClearMatch(dateStr)}
              >
                Clear
              </Button>
            )}
          </div>
          {isMatched && (
            <p className="text-[10px] text-violet-800 dark:text-violet-300">
              Matched with {matchedMrName}. Working with is set on both tour programs when you save.
            </p>
          )}
        </div>
      )}

      {canEdit ? (
        <select
          className="flex h-10 w-full rounded-xl border-2 border-border/60 bg-background px-3 text-xs font-medium focus:border-primary focus:outline-none transition-colors"
          value={local?.sub_area_id ?? ''}
          onChange={e => onSubAreaChange(dateStr, e.target.value)}
        >
          <option value="">Your assigned area for this day</option>
          {allSubAreas.map(sa => (
            <option key={sa.id} value={sa.id}>
              {sa.areaName} - {sa.name}
            </option>
          ))}
        </select>
      ) : (
        <div className="rounded-lg bg-muted/40 px-3 py-2 text-xs text-foreground">
          {local?.sub_area_id
            ? (() => {
                const sa = allSubAreas.find(s => s.id === local.sub_area_id)
                return sa ? `${sa.areaName} - ${sa.name}` : 'Unknown area'
              })()
            : 'Not set'}
          {isMatched && (
            <p className="text-[10px] text-violet-700 mt-1">Working with {matchedMrName}</p>
          )}
        </div>
      )}
    </div>
  )
})
