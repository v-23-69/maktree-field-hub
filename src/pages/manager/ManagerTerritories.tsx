import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import PageHeader from '@/components/shared/PageHeader'
import BottomNav from '@/components/shared/BottomNav'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Check } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useManagerMrs } from '@/hooks/useManagerTeam'
import { useAllAreas } from '@/hooks/useAreas'
import { useMrSubAreaAccess, useSaveMrSubAreaAccess } from '@/hooks/useAdminMrAccess'

export default function ManagerTerritories() {
  const { user } = useAuth()
  const managerId = user?.id ?? ''
  const { data: teamMrs = [], isLoading: teamLoading } = useManagerMrs(managerId)
  const { data: areas = [], isLoading: areasLoading } = useAllAreas()
  const [selectedMr, setSelectedMr] = useState('')
  const [checkedSubAreas, setCheckedSubAreas] = useState<string[]>([])
  const { data: serverAccess = [], isLoading: accessLoading } = useMrSubAreaAccess(selectedMr)
  const saveAccess = useSaveMrSubAreaAccess()
  const serverAssignedSet = useMemo(() => new Set(serverAccess), [serverAccess])
  const [territoryFilter, setTerritoryFilter] = useState('')

  const mrOptions = useMemo(() => {
    const self = user
      ? [{ id: user.id, full_name: user.full_name ?? 'Me', employee_code: user.employee_code ?? '' }]
      : []
    const rest = teamMrs.filter(m => m.id !== user?.id)
    return [...self, ...rest]
  }, [teamMrs, user])

  const allSubAreaIds = useMemo(
    () => areas.flatMap(a => a.sub_areas ?? []).map(sa => sa.id),
    [areas],
  )

  useEffect(() => {
    if (!selectedMr) {
      setCheckedSubAreas([])
      return
    }
    setCheckedSubAreas(prev => {
      const next = [...serverAccess].sort()
      const prevSorted = [...prev].sort()
      if (prevSorted.length === next.length && prevSorted.every((id, idx) => id === next[idx])) {
        return prev
      }
      return next
    })
  }, [selectedMr, serverAccess])

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
    const subAreas = (areas.find(a => a.id === areaId)?.sub_areas ?? [])
    setCheckedSubAreas(prev => {
      const toAdd = subAreas.map(sa => sa.id).filter(id => !prev.includes(id))
      return [...prev, ...toAdd]
    })
  }

  const toggleArea = (areaId: string) => {
    const subAreas = (areas.find(a => a.id === areaId)?.sub_areas ?? [])
    const allChecked = subAreas.length > 0 && subAreas.every(sa => checkedSubAreas.includes(sa.id))
    if (allChecked) {
      setCheckedSubAreas(prev => prev.filter(id => !subAreas.some(sa => sa.id === id)))
    } else {
      const toAdd = subAreas.map(sa => sa.id).filter(id => !checkedSubAreas.includes(id))
      setCheckedSubAreas(prev => [...prev, ...toAdd])
    }
  }

  const handleSave = async () => {
    if (!selectedMr) return
    try {
      await saveAccess.mutateAsync({ mrId: selectedMr, subAreaIds: checkedSubAreas })
      toast.success('Territory assignment saved')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Save failed')
    }
  }

  const loading = teamLoading || areasLoading || (selectedMr !== '' && accessLoading)

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader title="Territories" showBack />
      <div className="p-4 md:px-6 space-y-4 max-w-2xl lg:max-w-4xl mx-auto">
        <p className="text-xs text-muted-foreground leading-relaxed">
          Assign sub-areas to yourself or to MRs on your team. This controls where they can plan tour programs and record visits.
        </p>

        {teamLoading && <LoadingSpinner />}

        <div className="space-y-2">
          <Label className="text-xs">Person</Label>
          <select
            value={selectedMr}
            onChange={e => setSelectedMr(e.target.value)}
            className="flex h-11 w-full rounded-lg border border-input bg-card px-3 text-sm touch-target"
          >
            <option value="">Choose MR or self</option>
            {mrOptions.map(m => (
              <option key={m.id} value={m.id}>
                {m.id === user?.id ? `Self — ${m.full_name}` : `${m.full_name}${m.employee_code ? ` (${m.employee_code})` : ''}`}
              </option>
            ))}
          </select>
        </div>

        {loading && selectedMr && <LoadingSpinner />}

        {selectedMr && !loading && (
          <div className="space-y-4 animate-fade-in">
            <div className="space-y-2">
              <Label className="text-xs">Filter by territory</Label>
              <select
                value={territoryFilter}
                onChange={e => setTerritoryFilter(e.target.value)}
                className="flex h-11 w-full rounded-lg border border-input bg-card px-3 text-sm touch-target"
              >
                <option value="">All territories</option>
                {areas.map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>

            <p className="text-xs font-medium text-primary">
              {checkedSubAreas.length} of {allSubAreaIds.length} sub-areas selected
              {serverAssignedSet.size > 0 && (
                <span className="text-muted-foreground font-normal">
                  {' '}· {serverAssignedSet.size} currently assigned
                </span>
              )}
            </p>

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
                        className={someChecked ? 'data-[state=unchecked]:bg-primary/30 data-[state=unchecked]:border-primary' : ''}
                        onCheckedChange={() => toggleArea(area.id)}
                      />
                      <span className="font-medium text-foreground text-sm">{area.name}</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground">{checkedCount} of {subAreas.length}</span>
                      {subAreas.length > 0 && checkedCount < subAreas.length && (
                        <button
                          type="button"
                          onClick={() => selectAllInTerritory(area.id)}
                          className="text-[10px] font-semibold text-primary"
                        >
                          Select all
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2.5 pl-1">
                    {subAreas.map(sa => {
                      const isAssigned = serverAssignedSet.has(sa.id)
                      const isChecked = checkedSubAreas.includes(sa.id)
                      return (
                        <label key={sa.id} className="flex items-center gap-3 touch-target cursor-pointer">
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={() => toggleSubArea(sa.id)}
                          />
                          <span className="text-sm text-foreground flex-1">{sa.name}</span>
                          {isAssigned && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                              <Check className="h-3 w-3" />
                              Assigned
                            </span>
                          )}
                        </label>
                      )
                    })}
                  </div>
                </div>
              )
            })}

            <Button
              type="button"
              disabled={saveAccess.isPending}
              onClick={() => void handleSave()}
              className="w-full touch-target rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
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
