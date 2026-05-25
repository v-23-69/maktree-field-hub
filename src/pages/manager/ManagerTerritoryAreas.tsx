import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { UserPlus, Users } from 'lucide-react'
import { toast } from 'sonner'
import PageHeader from '@/components/shared/PageHeader'
import BottomNav from '@/components/shared/BottomNav'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { useManagerMrs } from '@/hooks/useManagerTeam'
import { usePreventAccidentalBack } from '@/hooks/usePreventAccidentalBack'
import {
  useInvalidateTerritoryVacancy,
  useTerritoryAssignmentDetails,
  type TerritoryAssignmentDetail,
} from '@/hooks/useTerritoryVacancy'
import { useMrSubAreaAccess, useSaveMrSubAreaAccess } from '@/hooks/useAdminMrAccess'

type AssignTarget = 'self' | 'mr'

export default function ManagerTerritoryAreas() {
  const { areaId = '' } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  usePreventAccidentalBack(true)
  const managerId = user?.id ?? ''
  const managerName = user?.full_name ?? 'Manager'
  const { data: mrs = [], isLoading: mrsLoading } = useManagerMrs(managerId)
  const { data: territories = [], isLoading: territoriesLoading } = useTerritoryAssignmentDetails()
  const invalidateVacancy = useInvalidateTerritoryVacancy()
  const saveAccess = useSaveMrSubAreaAccess()

  const territory = useMemo(
    () => territories.find(t => t.area_id === areaId) ?? null,
    [territories, areaId],
  )

  const [assignTarget, setAssignTarget] = useState<AssignTarget>('mr')
  const [assignMrId, setAssignMrId] = useState('')
  const [checkedSubAreas, setCheckedSubAreas] = useState<Set<string>>(new Set())

  const assigneeMrId = assignTarget === 'self' ? managerId : assignMrId
  const { data: serverAccess = [], isLoading: accessLoading } = useMrSubAreaAccess(assigneeMrId)

  useEffect(() => {
    if (mrs.length > 0 && !assignMrId) setAssignMrId(mrs[0].id)
  }, [mrs, assignMrId])

  const territorySubAreaIds = useMemo(
    () => new Set((territory?.sub_areas ?? []).map(sa => sa.id)),
    [territory],
  )

  useEffect(() => {
    if (!territory || !assigneeMrId) {
      setCheckedSubAreas(new Set())
      return
    }
    setCheckedSubAreas(new Set(serverAccess.filter(id => territorySubAreaIds.has(id))))
  }, [territory?.area_id, assigneeMrId, serverAccess.join(','), territorySubAreaIds])

  const assignedList = useMemo(
    () => (territory?.sub_areas ?? []).filter(sa => sa.is_assigned),
    [territory],
  )
  const vacantList = useMemo(
    () => (territory?.sub_areas ?? []).filter(sa => !sa.is_assigned),
    [territory],
  )

  const toggleSubArea = (id: string) => {
    setCheckedSubAreas(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectAllVacant = () => {
    setCheckedSubAreas(prev => {
      const next = new Set(prev)
      for (const sa of vacantList) next.add(sa.id)
      return next
    })
  }

  const selectAllInTerritory = () => {
    setCheckedSubAreas(new Set(territory?.sub_areas.map(sa => sa.id) ?? []))
  }

  const handleAssign = async () => {
    if (!assigneeMrId) {
      toast.error(assignTarget === 'mr' ? 'Choose an MR' : 'Not signed in')
      return
    }
    if (checkedSubAreas.size === 0) {
      toast.error('Select at least one area')
      return
    }
    const otherAccess = serverAccess.filter(id => !territorySubAreaIds.has(id))
    const merged = [...otherAccess, ...checkedSubAreas]
    try {
      await saveAccess.mutateAsync({ mrId: assigneeMrId, subAreaIds: merged })
      toast.success(
        assignTarget === 'self'
          ? 'Areas assigned to you'
          : `Areas assigned to ${mrs.find(m => m.id === assigneeMrId)?.full_name ?? 'MR'}`,
      )
      invalidateVacancy()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not assign')
    }
  }

  const loading = mrsLoading || territoriesLoading

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (!territory) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <PageHeader title="Territory" showBack onBack={() => navigate('/manager/dashboard')} />
        <p className="px-4 py-8 text-sm text-muted-foreground text-center">Territory not found.</p>
        <BottomNav role="manager" />
      </div>
    )
  }

  const total = territory.sub_areas.length
  const assignedCount = assignedList.length

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col">
      <PageHeader
        title={territory.area_name}
        showBack
        onBack={() => navigate('/manager/dashboard')}
      />

      <div className="flex-1 min-h-0 flex flex-col w-full max-w-lg md:max-w-2xl mx-auto">
        <div className="px-4 py-3 border-b border-border/50 bg-muted/30">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">{assignedCount}</span>
            {' assigned · '}
            <span className="font-semibold text-rose-600 dark:text-rose-400">{total - assignedCount}</span>
            {' vacant'}
          </p>
        </div>

        {/* Assign — fixed at top of main content */}
        <div className="shrink-0 px-4 py-4 border-b border-border/60 bg-card/80 space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-foreground">Assign areas</p>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Choose yourself or an MR, select areas below, then tap Assign. The same area can be assigned to
            multiple people.
          </p>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setAssignTarget('self')}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 rounded-xl border py-3 text-sm font-semibold transition-colors touch-target',
                assignTarget === 'self'
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-background text-muted-foreground',
              )}
            >
              <UserPlus className="h-4 w-4" />
              Myself
            </button>
            <button
              type="button"
              onClick={() => setAssignTarget('mr')}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 rounded-xl border py-3 text-sm font-semibold transition-colors touch-target',
                assignTarget === 'mr'
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-background text-muted-foreground',
              )}
            >
              <Users className="h-4 w-4" />
              MR
            </button>
          </div>

          {assignTarget === 'mr' && (
            <div className="space-y-1.5">
              <Label className="text-xs">Medical representative</Label>
              <select
                value={assignMrId}
                onChange={e => setAssignMrId(e.target.value)}
                className="flex h-12 w-full rounded-xl border border-input bg-background px-3 text-sm"
              >
                <option value="">Choose MR</option>
                {mrs.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.full_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {assignTarget === 'self' && (
            <p className="text-xs text-muted-foreground">Assigning to {managerName}</p>
          )}
        </div>

        {/* Area list */}
        <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <Label className="text-xs font-semibold">Areas in {territory.area_name}</Label>
            <div className="flex gap-2">
              <button type="button" onClick={selectAllVacant} className="text-[11px] font-semibold text-primary">
                Vacant
              </button>
              <span className="text-muted-foreground">·</span>
              <button type="button" onClick={selectAllInTerritory} className="text-[11px] font-semibold text-primary">
                All
              </button>
            </div>
          </div>

          {accessLoading ? (
            <div className="py-8 flex justify-center">
              <LoadingSpinner />
            </div>
          ) : (
            <ul className="grid grid-cols-2 gap-2 pb-2">
              {territory.sub_areas.map(sa => {
                const checked = checkedSubAreas.has(sa.id)
                const others = sa.assignees.filter(a => a.user_id !== assigneeMrId)
                return (
                  <li key={sa.id} className="min-w-0">
                    <label
                      className={cn(
                        'flex flex-col h-full gap-2 rounded-xl border px-2.5 py-2.5 cursor-pointer transition-colors touch-target',
                        checked
                          ? 'border-primary/40 bg-primary/5'
                          : sa.is_assigned
                            ? 'border-emerald-500/25 bg-emerald-500/5'
                            : 'border-border/70 bg-background',
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <Checkbox
                          checked={checked}
                          onCheckedChange={() => toggleSubArea(sa.id)}
                          className="mt-0.5 shrink-0"
                        />
                        <p className="text-xs font-semibold text-foreground leading-tight line-clamp-2 flex-1">
                          {sa.name}
                        </p>
                      </div>
                      {others.length > 0 ? (
                        <p className="text-[10px] text-muted-foreground leading-snug line-clamp-2">
                          {others.map(a => a.full_name).join(', ')}
                        </p>
                      ) : sa.is_assigned ? (
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400">Assigned</p>
                      ) : (
                        <p className="text-[10px] text-rose-600 dark:text-rose-400">Vacant</p>
                      )}
                    </label>
                  </li>
                )
              })}
            </ul>
          )}

          {assignedList.length > 0 && (
            <section className="space-y-2 pt-2 border-t border-border/50">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Currently assigned ({assignedList.length})
              </p>
              <ul className="space-y-1.5">
                {assignedList.map(sa => (
                  <li
                    key={sa.id}
                    className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-xs"
                  >
                    <p className="font-semibold text-foreground">{sa.name}</p>
                    {sa.assignees.length > 0 && (
                      <p className="text-muted-foreground mt-0.5">
                        {sa.assignees.map(a => `${a.full_name} (${a.role_label})`).join(', ')}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <div className="shrink-0 border-t border-border/80 bg-background/95 backdrop-blur-md px-4 pt-3 pb-3">
          <Button
            type="button"
            className="w-full h-12 rounded-xl font-bold text-base shadow-sm"
            disabled={saveAccess.isPending || !assigneeMrId || accessLoading || checkedSubAreas.size === 0}
            onClick={() => void handleAssign()}
          >
            {saveAccess.isPending
              ? 'Assigning…'
              : `Assign ${checkedSubAreas.size} area${checkedSubAreas.size !== 1 ? 's' : ''}`}
          </Button>
        </div>
      </div>

      {/* Reserve space for fixed bottom nav */}
      <div
        className="shrink-0"
        aria-hidden
        style={{ height: 'calc(3.75rem + env(safe-area-inset-bottom, 0px))' }}
      />

      <BottomNav role="manager" />
    </div>
  )
}
