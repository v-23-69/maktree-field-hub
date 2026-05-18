import { useEffect, useMemo, useState, useCallback, useRef, memo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import PageHeader from '@/components/shared/PageHeader'
import BottomNav from '@/components/shared/BottomNav'
import { Button } from '@/components/ui/button'
import { todayInputDate, calendarWeekdaySun0, formatShortDateIst } from '@/lib/dateUtils'
import { useAuth } from '@/hooks/useAuth'
import { CalendarDays, Check, AlertCircle, ChevronDown, ChevronUp, Users, Save, X, Trash2 } from 'lucide-react'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import {
  useCreateOrUpdateTourProgram,
  useBatchSaveTourProgramEntries,
  useSubmitTourProgram,
  useTourProgram,
  useTourProgramHistory,
  useTourProgramEntries,
  useBeginTourProgramRevision,
  useRequestTourProgramDeletion,
  useDeleteTourProgramAsManager,
} from '@/hooks/useTourProgram'
import { supabase } from '@/lib/supabase'
import { useMrSubAreasGrouped } from '@/hooks/useAreas'
import { useWorkingWithReportOptions } from '@/hooks/useManagers'
import { useManagerMrs } from '@/hooks/useManagerTeam'

function formatMonth(monthStr: string) {
  const d = new Date(monthStr + 'T00:00:00')
  return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
}

function generateMonthDays(monthStr: string) {
  const year = parseInt(monthStr.slice(0, 4))
  const mon = parseInt(monthStr.slice(5, 7))
  const daysInMonth = new Date(year, mon, 0).getDate()
  return Array.from({ length: daysInMonth }, (_, i) => {
    const d = new Date(year, mon - 1, i + 1)
    const work_date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    return {
      work_date,
      day_type: calendarWeekdaySun0(work_date) === 0 ? 'sunday' : 'working',
      holiday_name: null as string | null,
    }
  })
}

type LocalEntry = { sub_area_id: string; working_with_ids: string[] }

type SubAreaItem = { id: string; name: string; areaName: string }
type WwOption = { id: string; full_name: string; role: string }

interface DayCardProps {
  dateStr: string
  local: LocalEntry | undefined
  canEdit: boolean
  allSubAreas: SubAreaItem[]
  workingWithOptions: WwOption[]
  nameById: Map<string, string>
  onSubAreaChange: (date: string, value: string) => void
  onToggleWw: (date: string, userId: string) => void
}

const DayCard = memo(function DayCard({
  dateStr, local, canEdit, allSubAreas, workingWithOptions, nameById, onSubAreaChange, onToggleWw,
}: DayCardProps) {
  const [expanded, setExpanded] = useState(false)
  const dateLabel = formatShortDateIst(dateStr)
  const filled = !!local?.sub_area_id && (local?.working_with_ids?.length ?? 0) > 0
  const selectedIds = local?.working_with_ids ?? []

  return (
    <div className={cn('glass-card p-3.5 space-y-2.5', filled && 'ring-1 ring-emerald-500/20')}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-foreground">{dateLabel}</span>
        {filled && <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />}
      </div>

      {canEdit ? (
        <select
          className="flex h-10 w-full rounded-xl border-2 border-border/60 bg-background px-3 text-xs font-medium focus:border-primary focus:outline-none transition-colors"
          value={local?.sub_area_id ?? ''}
          onChange={e => onSubAreaChange(dateStr, e.target.value)}
        >
          <option value="">Select area</option>
          {allSubAreas.map(sa => (
            <option key={sa.id} value={sa.id}>{sa.areaName} - {sa.name}</option>
          ))}
        </select>
      ) : (
        <div className="rounded-lg bg-muted/40 px-3 py-2 text-xs text-foreground">
          {local?.sub_area_id
            ? (() => { const sa = allSubAreas.find(s => s.id === local.sub_area_id); return sa ? `${sa.areaName} - ${sa.name}` : 'Unknown area' })()
            : 'Not set'}
        </div>
      )}

      {canEdit ? (
        <div className="space-y-1.5">
          {selectedIds.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {selectedIds.map(id => (
                <button key={id} type="button" onClick={() => onToggleWw(dateStr, id)}
                  className="inline-flex items-center gap-1 rounded-lg bg-primary/10 text-primary px-2 py-1 text-[10px] font-semibold active:scale-95 transition-transform"
                >
                  {nameById.get(id) ?? 'Unknown'}
                  <X className="h-3 w-3" />
                </button>
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={() => setExpanded(p => !p)}
            className="flex items-center gap-1 text-[10px] text-primary font-semibold"
          >
            <Users className="h-3 w-3" />
            {expanded ? 'Hide options' : selectedIds.length > 0 ? 'Change working with' : 'Select working with'}
            {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
          {expanded && (
            <div className="grid grid-cols-2 gap-1.5">
              {workingWithOptions.map(m => {
                const on = selectedIds.includes(m.id)
                return (
                  <button key={m.id} type="button" onClick={() => onToggleWw(dateStr, m.id)}
                    className={cn(
                      'rounded-lg px-2 py-1.5 text-[10px] font-medium border transition-all active:scale-95 text-left leading-tight',
                      on ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-foreground border-border/60 hover:border-primary/40'
                    )}
                  >
                    {m.full_name}
                    <span className="block text-[8px] opacity-70">{m.role}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-lg bg-muted/40 px-3 py-2 text-xs text-foreground">
          {selectedIds.length > 0 ? selectedIds.map(id => nameById.get(id) ?? 'Unknown').join(', ') : 'Not set'}
        </div>
      )}
    </div>
  )
})

export default function TourProgramPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const isManager = user?.role === 'manager'
  const now = todayInputDate()
  const monthOptions = useMemo(() => {
    const base = new Date(`${now.slice(0, 7)}-01T00:00:00`)
    return [0, 1, 2].map(offset => {
      const d = new Date(base)
      d.setMonth(d.getMonth() + offset)
      const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
      const label = d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
      return { value, label }
    })
  }, [now])

  const [tab, setTab] = useState<'self' | 'team'>('self')
  const [month, setMonth] = useState(monthOptions[0].value)
  const [viewMrId, setViewMrId] = useState('')
  const [localEntries, setLocalEntries] = useState<Record<string, LocalEntry>>({})
  const [saving, setSaving] = useState(false)

  const selfId = user?.id ?? ''
  const activeMrId = tab === 'team' && viewMrId ? viewMrId : selfId

  const tpQuery = useTourProgram(activeMrId, month)
  const createOrUpdate = useCreateOrUpdateTourProgram()
  const submit = useSubmitTourProgram()
  const batchSave = useBatchSaveTourProgramEntries()
  const beginRevision = useBeginTourProgramRevision()
  const requestTpDeletion = useRequestTourProgramDeletion()
  const deleteTpAsManager = useDeleteTourProgramAsManager()
  const [tpDeleteOpen, setTpDeleteOpen] = useState(false)
  const { data: dbEntries = [] } = useTourProgramEntries(tpQuery.data?.id)
  const { data: history = [] } = useTourProgramHistory(activeMrId)
  const { data: assignedAreaGroups = [] } = useMrSubAreasGrouped(activeMrId)
  const { data: workingWithOptions = [] } = useWorkingWithReportOptions(user?.id, user?.role)
  const { data: teamMrs = [] } = useManagerMrs(isManager ? selfId : '')

  const tpPickListWorkingWith = useMemo(() => {
    if (isManager) return workingWithOptions
    return workingWithOptions.filter(o => o.role === 'manager')
  }, [isManager, workingWithOptions])

  const mrManagerIdSet = useMemo(() => {
    if (isManager) return null
    return new Set(tpPickListWorkingWith.map(o => o.id))
  }, [isManager, tpPickListWorkingWith])

  const [workingDays, setWorkingDays] = useState<Array<{ work_date: string; day_type: string; holiday_name: string | null }>>([])

  useEffect(() => {
    setWorkingDays(generateMonthDays(month))
    const load = async () => {
      if (!supabase || !activeMrId || !month) return
      try {
        const { data } = await supabase.rpc('get_month_working_days', { p_mr_id: activeMrId, p_month: month })
        if (data && Array.isArray(data) && data.length > 0) {
          setWorkingDays(data as Array<{ work_date: string; day_type: string; holiday_name: string | null }>)
        }
      } catch { /* fallback already set */ }
    }
    void load()
  }, [activeMrId, month])

  const lastSyncKey = useRef('')
  useEffect(() => {
    const key = dbEntries.map(e => `${e.work_date}:${e.sub_area_id}:${(e.working_with_ids ?? []).join(',')}`).join('|')
    const setKey = mrManagerIdSet ? [...mrManagerIdSet].sort().join(',') : ''
    const fullKey = `${key}|${setKey}`
    if (fullKey === lastSyncKey.current) return
    lastSyncKey.current = fullKey
    const map: Record<string, LocalEntry> = {}
    for (const e of dbEntries) {
      let ids = (e.working_with_ids && e.working_with_ids.length > 0)
        ? e.working_with_ids
        : (e.working_with ? [e.working_with] : [])
      if (mrManagerIdSet && mrManagerIdSet.size > 0) ids = ids.filter(id => mrManagerIdSet.has(id))
      map[e.work_date] = { sub_area_id: e.sub_area_id ?? '', working_with_ids: ids }
    }
    setLocalEntries(map)
  }, [dbEntries, mrManagerIdSet])

  const updateSubArea = useCallback((date: string, value: string) => {
    setLocalEntries(prev => ({
      ...prev,
      [date]: { ...(prev[date] ?? { sub_area_id: '', working_with_ids: [] }), sub_area_id: value },
    }))
  }, [])

  const toggleWorkingWith = useCallback((date: string, userId: string) => {
    setLocalEntries(prev => {
      const current = prev[date] ?? { sub_area_id: '', working_with_ids: [] }
      const ids = current.working_with_ids.includes(userId)
        ? current.working_with_ids.filter(id => id !== userId)
        : [...current.working_with_ids, userId]
      return { ...prev, [date]: { ...current, working_with_ids: ids } }
    })
  }, [])

  const workingDayRows = useMemo(() => workingDays.filter(d => d.day_type === 'working'), [workingDays])
  const filledCount = useMemo(
    () => workingDayRows.filter(d => {
      const e = localEntries[d.work_date]
      return e?.sub_area_id && e.working_with_ids.length > 0
    }).length,
    [workingDayRows, localEntries],
  )
  const allFilled = filledCount === workingDayRows.length && workingDayRows.length > 0

  const allSubAreas = useMemo(() =>
    assignedAreaGroups.flatMap(g => g.sub_areas.map(sa => ({ ...sa, areaName: g.area.name }))),
    [assignedAreaGroups],
  )

  const nameById = useMemo(() => {
    const map = new Map<string, string>()
    for (const o of workingWithOptions) map.set(o.id, o.full_name)
    for (const mr of teamMrs) map.set(mr.id, mr.full_name ?? mr.id)
    return map
  }, [workingWithOptions, teamMrs])

  const buildEntryRows = (tpId: string) =>
    workingDayRows
      .filter(day => {
        const local = localEntries[day.work_date]
        return local?.sub_area_id || (local?.working_with_ids?.length ?? 0) > 0
      })
      .map(day => {
        const local = localEntries[day.work_date]
        return {
          tour_program_id: tpId,
          work_date: day.work_date,
          sub_area_id: local?.sub_area_id || null,
          working_with: null as string | null,
          working_with_ids: (() => {
            const raw = local?.working_with_ids ?? []
            if (mrManagerIdSet && mrManagerIdSet.size > 0) return raw.filter(id => mrManagerIdSet.has(id))
            return raw
          })(),
          day_type: 'working' as const,
          notes: null as string | null,
        }
      })

  const handleSaveTP = async () => {
    if (!activeMrId || !month) return
    setSaving(true)
    try {
      let tpId = tpQuery.data?.id
      if (!tpId) {
        const tp = await createOrUpdate.mutateAsync({ mr_id: activeMrId, month, manager_id: null })
        tpId = tp.id
      }
      const rows = buildEntryRows(tpId)
      if (rows.length > 0) {
        await batchSave.mutateAsync(rows)
        const st = tpQuery.data?.status
        if (isManager && tab === 'self' && st === 'approved' && tpId && supabase) {
          const { error: ecErr } = await supabase.rpc('increment_tour_program_edit_count', { p_tour_program_id: tpId })
          if (ecErr) throw ecErr
          void queryClient.invalidateQueries({ queryKey: ['tour-program', activeMrId, month] })
        }
      }

      toast.success('Tour program saved')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save tour program')
    } finally {
      setSaving(false)
    }
  }

  const handleSubmitTP = async () => {
    if (!allFilled) {
      toast.error('Fill all working days before submitting')
      return
    }
    setSaving(true)
    try {
      let tpId = tpQuery.data?.id
      if (!tpId) {
        const tp = await createOrUpdate.mutateAsync({ mr_id: activeMrId, month, manager_id: null })
        tpId = tp.id
      }
      const rows = buildEntryRows(tpId)
      if (rows.length > 0) await batchSave.mutateAsync(rows)
      await submit.mutateAsync({ tourProgramId: tpId, month })
      toast.success('Tour program submitted')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to submit')
    } finally {
      setSaving(false)
    }
  }

  const currentStatus = tpQuery.data?.status ?? 'not_created'
  const isApproved = currentStatus === 'approved'
  const isSubmitted = currentStatus === 'submitted'
  const isViewOnly = tab === 'team'
  const managerSelf = isManager && tab === 'self'
  const canEdit =
    !isViewOnly &&
    (managerSelf
      ? isApproved || currentStatus === 'draft' || currentStatus === 'rejected' || currentStatus === 'not_created'
      : !isApproved && !isSubmitted)

  const tpIdForActions = tpQuery.data?.id
  const showTpDelete =
    !!tpIdForActions &&
    currentStatus !== 'not_created' &&
    (!isManager ? !isViewOnly : tab === 'self' || (tab === 'team' && !!viewMrId))

  const statusColor: Record<string, string> = {
    submitted: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20',
    approved: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    rejected: 'text-destructive bg-destructive/10 border-destructive/20',
    draft: 'text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20',
    not_created: 'text-muted-foreground bg-muted/50 border-border',
  }

  const statusLabel: Record<string, string> = {
    submitted: 'Submitted',
    approved: 'Approved',
    rejected: 'Rejected',
    draft: 'Saved (Draft)',
    not_created: 'Not Created',
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader title="Tour Program" showBack />

      <div className="px-4 md:px-6 py-5 space-y-5 max-w-lg md:max-w-2xl lg:max-w-4xl mx-auto">
        {isManager && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setTab('self'); setViewMrId('') }}
              className={cn(
                'flex-1 rounded-2xl py-2.5 text-xs font-semibold border-2 transition-all active:scale-95',
                tab === 'self'
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                  : 'bg-card text-foreground border-border/60'
              )}
            >
              My Tour Plan
            </button>
            <button
              type="button"
              onClick={() => setTab('team')}
              className={cn(
                'flex-1 rounded-2xl py-2.5 text-xs font-semibold border-2 transition-all active:scale-95 flex items-center justify-center gap-1.5',
                tab === 'team'
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                  : 'bg-card text-foreground border-border/60'
              )}
            >
              <Users className="h-3.5 w-3.5" /> Team TPs
            </button>
          </div>
        )}

        {isManager && tab === 'team' && (
          <div className="relative">
            <select
              value={viewMrId}
              onChange={e => setViewMrId(e.target.value)}
              className="flex h-11 w-full rounded-xl border-2 border-border/60 bg-card px-3 text-sm font-medium appearance-none focus:border-primary focus:outline-none transition-colors"
            >
              <option value="">Select MR to view</option>
              {teamMrs.map(mr => (
                <option key={mr.id} value={mr.id}>{mr.full_name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          </div>
        )}

        <div className="flex gap-2">
          {monthOptions.map(m => (
            <button
              key={m.value}
              type="button"
              onClick={() => setMonth(m.value)}
              className={cn(
                'flex-1 rounded-2xl py-2.5 text-xs font-semibold border-2 transition-all active:scale-95',
                month === m.value
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/20'
                  : 'bg-card text-foreground border-border/60'
              )}
            >
              {m.label.split(' ')[0]}
            </button>
          ))}
        </div>

        {(tab !== 'team' || viewMrId) && (
          <>
            <div className={cn('rounded-2xl border p-4', statusColor[currentStatus] ?? statusColor.not_created)}>
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" />
                  <p className="text-sm font-bold">{monthOptions.find(m => m.value === month)?.label ?? month}</p>
                </div>
                <div className="flex flex-col items-end gap-0.5 text-right">
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    {statusLabel[currentStatus] ?? currentStatus}
                  </span>
                  {(tpQuery.data?.edit_count ?? 0) > 0 && (
                    <span className="text-[10px] font-semibold text-muted-foreground">
                      Edits recorded: {tpQuery.data?.edit_count ?? 0}
                    </span>
                  )}
                </div>
              </div>
              {workingDayRows.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-medium">
                    <span>{filledCount} / {workingDayRows.length} working days filled</span>
                    <span>{Math.round((filledCount / workingDayRows.length) * 100)}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-current transition-all duration-500"
                      style={{ width: `${(filledCount / workingDayRows.length) * 100}%` }}
                    />
                  </div>
                </div>
              )}
              {currentStatus === 'rejected' && tpQuery.data?.manager_note && (
                <p className="text-xs mt-2">Note: {tpQuery.data.manager_note}</p>
              )}
            </div>

            {!isManager && !isViewOnly && (currentStatus === 'submitted' || currentStatus === 'approved') && tpQuery.data?.id && (
              <Button
                type="button"
                variant="outline"
                className="w-full rounded-2xl h-11 text-sm font-semibold border-amber-500/40"
                disabled={beginRevision.isPending}
                onClick={() => {
                  const id = tpQuery.data?.id
                  if (!id) return
                  void beginRevision.mutateAsync(id).then(() => {
                    toast.success('Tour program unlocked for editing. Save your changes and submit again for manager approval.')
                  }).catch(e => toast.error(e instanceof Error ? e.message : 'Could not unlock TP'))
                }}
              >
                {beginRevision.isPending ? 'Unlocking…' : 'Edit tour program (requires re-approval)'}
              </Button>
            )}

            {showTpDelete && (
              <>
                <Button
                  type="button"
                  variant="destructive"
                  className="w-full rounded-2xl h-11 text-sm font-semibold"
                  disabled={requestTpDeletion.isPending || deleteTpAsManager.isPending}
                  onClick={() => setTpDeleteOpen(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {isManager ? 'Delete tour program' : 'Request deletion (manager approval)'}
                </Button>
                <ConfirmDialog
                  open={tpDeleteOpen}
                  onOpenChange={setTpDeleteOpen}
                  title={isManager ? 'Delete this tour program?' : 'Request tour program deletion?'}
                  description={
                    isManager
                      ? 'This permanently removes all planned days for this month for the selected profile.'
                      : 'Your manager will review and approve before the tour program is removed.'
                  }
                  confirmLabel={isManager ? 'Delete' : 'Send request'}
                  destructive={isManager}
                  confirmDisabled={requestTpDeletion.isPending || deleteTpAsManager.isPending}
                  onConfirm={() => {
                    const id = tpQuery.data?.id
                    if (!id) return
                    void (async () => {
                      try {
                        if (isManager) {
                          await deleteTpAsManager.mutateAsync(id)
                          toast.success('Tour program deleted')
                        } else {
                          await requestTpDeletion.mutateAsync(id)
                          toast.success('Deletion request sent to your manager')
                        }
                        setTpDeleteOpen(false)
                      } catch (e) {
                        toast.error(e instanceof Error ? e.message : 'Failed')
                      }
                    })()
                  }}
                />
              </>
            )}

            {allSubAreas.length === 0 && (tab === 'self' || viewMrId) && (
              <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 px-4 py-3 text-sm text-foreground">
                <p className="font-semibold">No field areas assigned yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {isManager
                    ? 'Open Territories (manager menu) to link sub-areas to your profile before planning.'
                    : 'Your manager must assign sub-areas to you before you can build a tour program.'}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <p className="section-title">Daily Plan</p>
              <div className="space-y-2 md:grid md:grid-cols-2 md:gap-3 md:space-y-0">
                {workingDays.map(day => {
                  const dateLabel = formatShortDateIst(day.work_date)

                  if (day.day_type === 'sunday') {
                    return (
                      <div key={day.work_date} className="rounded-xl bg-muted/30 border border-border/30 px-4 py-2.5 flex items-center justify-between">
                        <span className="text-xs text-muted-foreground font-medium">{dateLabel}</span>
                        <span className="text-[10px] text-muted-foreground font-semibold">Sunday</span>
                      </div>
                    )
                  }
                  if (day.day_type === 'holiday') {
                    return (
                      <div key={day.work_date} className="rounded-xl bg-blue-500/5 border border-blue-500/20 px-4 py-2.5 flex items-center justify-between">
                        <span className="text-xs text-blue-700 dark:text-blue-400 font-medium">{dateLabel}</span>
                        <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">{day.holiday_name ?? 'Holiday'}</span>
                      </div>
                    )
                  }

                  return (
                    <DayCard
                      key={day.work_date}
                      dateStr={day.work_date}
                      local={localEntries[day.work_date]}
                      canEdit={canEdit}
                      allSubAreas={allSubAreas}
                      workingWithOptions={tpPickListWorkingWith}
                      nameById={nameById}
                      onSubAreaChange={updateSubArea}
                      onToggleWw={toggleWorkingWith}
                    />
                  )
                })}
              </div>
            </div>

            {canEdit && (
              <div className="space-y-3">
                {!allFilled && filledCount > 0 && (
                  <div className="flex items-start gap-2 rounded-xl bg-amber-500/5 border border-amber-500/20 p-3">
                    <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-700 dark:text-amber-300 font-medium">
                      {workingDayRows.length - filledCount} working day(s) still need area and working-with
                    </p>
                  </div>
                )}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 touch-target rounded-2xl font-bold h-12"
                    disabled={saving || filledCount === 0}
                    onClick={() => void handleSaveTP()}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Saving...' : 'Save TP'}
                  </Button>
                  <Button
                    className="flex-1 touch-target rounded-2xl font-bold h-12 shadow-lg shadow-primary/20"
                    disabled={saving || !allFilled}
                    onClick={() => void handleSubmitTP()}
                  >
                    {saving ? 'Submitting...' : 'Submit TP'}
                  </Button>
                </div>
              </div>
            )}

            {history.length > 0 && (
              <div className="space-y-2">
                <p className="section-title">History</p>
                {history.map((row: any) => (
                  <div key={row.id} className="rounded-xl bg-card border border-border/50 px-4 py-3 flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground">{formatMonth(row.month)}</span>
                    <span className={cn(
                      'text-[10px] font-bold uppercase tracking-wider',
                      row.status === 'approved' ? 'text-emerald-600 dark:text-emerald-400' : row.status === 'rejected' ? 'text-destructive' : row.status === 'submitted' ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'
                    )}>
                      {row.status}{row.is_late ? ' (late)' : ''}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {tab === 'team' && !viewMrId && (
          <div className="glass-card p-6 text-center space-y-2">
            <Users className="h-8 w-8 text-muted-foreground mx-auto" />
            <p className="text-sm font-medium text-muted-foreground">Select an MR above to view their tour program</p>
          </div>
        )}
      </div>

      <BottomNav role={isManager ? 'manager' : 'mr'} />
    </div>
  )
}
