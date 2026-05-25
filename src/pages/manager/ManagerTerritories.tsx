import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { UserPlus, Users } from 'lucide-react'
import PageHeader from '@/components/shared/PageHeader'
import BottomNav from '@/components/shared/BottomNav'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { useManagerMrs } from '@/hooks/useManagerTeam'
import { useAllAreas } from '@/hooks/useAreas'
import { useMrSubAreaAccess, useSaveMrSubAreaAccess } from '@/hooks/useAdminMrAccess'

type AssignTarget = 'self' | 'mr'

export default function ManagerTerritories() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const managerId = user?.id ?? ''
  const managerName = user?.full_name ?? 'Manager'
  const { data: teamMrs = [], isLoading: teamLoading } = useManagerMrs(managerId)
  const { data: areas = [], isLoading: areasLoading } = useAllAreas()
  const [assignTarget, setAssignTarget] = useState<AssignTarget>('mr')
  const [assignMrId, setAssignMrId] = useState('')
  const [checkedSubAreas, setCheckedSubAreas] = useState<string[]>([])
  const selectedMr = assignTarget === 'self' ? managerId : assignMrId
  const { data: serverAccess = [], isLoading: accessLoading } = useMrSubAreaAccess(selectedMr)
  const saveAccess = useSaveMrSubAreaAccess()
  const serverAccessKey = serverAccess.join(',')
  const serverAssignedSet = useMemo(() => new Set(serverAccess), [serverAccessKey])
  const [territoryFilter, setTerritoryFilter] = useState('')

  useEffect(() => {
    if (teamMrs.length > 0 && !assignMrId) setAssignMrId(teamMrs[0].id)
  }, [teamMrs, assignMrId])

  useEffect(() => {
    if (!selectedMr) {
      setCheckedSubAreas(prev => (prev.length === 0 ? prev : []))
      return
    }
    const next = [...serverAccess]
    setCheckedSubAreas(prev => {
      const a = [...prev].sort().join(',')
      const b = [...next].sort().join(',')
      return a === b ? prev : next
    })
  }, [selectedMr, serverAccessKey])

  const toggleSubArea = (id: string) => {
    setCheckedSubAreas(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id],
    )
  }

  const filteredAreas = useMemo(
    () => (territoryFilter ? areas.filter(a => a.id === territoryFilter) : areas),
    [areas, territoryFilter],
  )

  const selectAllInTerritory = (areaId: string) => {
    const subAreas = areas.find(a => a.id === areaId)?.sub_areas ?? []
    setCheckedSubAreas(prev => {
      const toAdd = subAreas.map(sa => sa.id).filter(id => !prev.includes(id))
      return [...prev, ...toAdd]
    })
  }

  const toggleArea = (areaId: string) => {
    const subAreas = areas.find(a => a.id === areaId)?.sub_areas ?? []
    const allChecked = subAreas.length > 0 && subAreas.every(sa => checkedSubAreas.includes(sa.id))
    if (allChecked) {
      setCheckedSubAreas(prev => prev.filter(id => !subAreas.some(sa => sa.id === id)))
    } else {
      const toAdd = subAreas.map(sa => sa.id).filter(id => !checkedSubAreas.includes(id))
      setCheckedSubAreas(prev => [...prev, ...toAdd])
    }
  }

  const handleSave = async () => {
    if (!selectedMr) {
      toast.error(assignTarget === 'mr' ? 'Choose an MR' : 'Not signed in')
      return
    }
    try {
      await saveAccess.mutateAsync({ mrId: selectedMr, subAreaIds: checkedSubAreas })
      toast.success(
        assignTarget === 'self'
          ? 'Areas assigned to you'
          : `Areas assigned to ${teamMrs.find(m => m.id === selectedMr)?.full_name ?? 'MR'}`,
      )
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Save failed')
    }
  }

  const loading = teamLoading || areasLoading
  const showAssignments = !!selectedMr && !accessLoading

  return (
    <div className="min-h-screen bg-background flex flex-col pb-24">
      <PageHeader title="Territories" showBack onBack={() => navigate('/manager/dashboard')} />

      <div className="flex-1 min-h-0 flex flex-col max-w-lg mx-auto w-full p-4 space-y-4">
        <p className="text-xs text-muted-foreground leading-relaxed">
          Assign sub-areas to yourself or MRs. Same area can be shared across multiple people.
        </p>

        {loading && <LoadingSpinner />}

        <div className="rounded-xl border border-border/60 bg-card/80 p-4 space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-foreground">Assign to</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setAssignTarget('self')}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 rounded-xl border py-3 text-sm font-semibold transition-colors',
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
                'flex-1 flex items-center justify-center gap-1.5 rounded-xl border py-3 text-sm font-semibold transition-colors',
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
                className="flex h-11 w-full rounded-lg border border-input bg-background px-3 text-sm"
              >
                <option value="">Choose MR</option>
                {teamMrs.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.full_name}
                    {m.employee_code ? ` (${m.employee_code})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {assignTarget === 'self' && (
            <p className="text-xs text-muted-foreground">Assigning to {managerName}</p>
          )}
        </div>

        {selectedMr && accessLoading && <LoadingSpinner />}

        {showAssignments && (
          <div className="flex-1 min-h-0 flex flex-col space-y-4 animate-fade-in">
            <div className="space-y-2">
              <Label className="text-xs">Filter by territory</Label>
              <select
                value={territoryFilter}
                onChange={e => setTerritoryFilter(e.target.value)}
                className="flex h-11 w-full rounded-lg border border-input bg-card px-3 text-sm"
              >
                <option value="">All territories</option>
                {areas.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>

            <p className="text-xs font-medium text-primary">
              {checkedSubAreas.length} sub-area{checkedSubAreas.length !== 1 ? 's' : ''} selected
              {serverAssignedSet.size > 0 && (
                <span className="text-muted-foreground font-normal">
                  {' '}
                  · {serverAssignedSet.size} currently assigned
                </span>
              )}
            </p>

            <div className="flex-1 min-h-0 overflow-y-auto space-y-4 pb-2">
              {filteredAreas.map(area => {
                const subAreas = area.sub_areas ?? []
                const checkedCount = subAreas.filter(sa => checkedSubAreas.includes(sa.id)).length
                const allChecked = subAreas.length > 0 && checkedCount === subAreas.length
                const someChecked = checkedCount > 0 && !allChecked

                return (
                  <div key={area.id} className="rounded-xl bg-card p-4 shadow-sm border border-border/60">
                    <div className="flex items-center justify-between mb-3">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <Checkbox
                          checked={allChecked}
                          className={
                            someChecked
                              ? 'data-[state=unchecked]:bg-primary/30 data-[state=unchecked]:border-primary'
                              : ''
                          }
                          onCheckedChange={() => toggleArea(area.id)}
                        />
                        <span className="font-medium text-foreground text-sm">{area.name}</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground">
                          {checkedCount}/{subAreas.length}
                        </span>
                        {subAreas.length > 0 && checkedCount < subAreas.length && (
                          <button
                            type="button"
                            onClick={() => selectAllInTerritory(area.id)}
                            className="text-[10px] font-semibold text-primary"
                          >
                            All
                          </button>
                        )}
                      </div>
                    </div>

                    <ul className="grid grid-cols-2 gap-2">
                      {subAreas.map(sa => {
                        const isAssigned = serverAssignedSet.has(sa.id)
                        const isChecked = checkedSubAreas.includes(sa.id)
                        return (
                          <li key={sa.id}>
                            <label className="flex items-start gap-2 rounded-lg border border-border/60 px-2.5 py-2 cursor-pointer touch-target">
                              <Checkbox
                                checked={isChecked}
                                onCheckedChange={() => toggleSubArea(sa.id)}
                                className="mt-0.5 shrink-0"
                              />
                              <span className="text-xs text-foreground flex-1 leading-tight">{sa.name}</span>
                              {isAssigned && (
                                <span className="text-[9px] font-semibold text-emerald-600 shrink-0">✓</span>
                              )}
                            </label>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                )
              })}
            </div>

            <Button
              type="button"
              disabled={saveAccess.isPending || checkedSubAreas.length === 0}
              onClick={() => void handleSave()}
              className="w-full h-12 rounded-xl font-bold shrink-0"
            >
              {saveAccess.isPending ? 'Saving…' : 'Save assignment'}
            </Button>
          </div>
        )}
      </div>

      <BottomNav role="manager" />
    </div>
  )
}
