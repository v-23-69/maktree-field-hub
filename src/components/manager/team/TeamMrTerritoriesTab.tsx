import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Check, ChevronDown, ChevronUp } from 'lucide-react'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import { useAllAreas } from '@/hooks/useAreas'
import { useMrSubAreaAccess, useSaveMrSubAreaAccess } from '@/hooks/useAdminMrAccess'
import { dashboardPanelClass } from '@/components/dashboard/dashboard-shell'
import { cn } from '@/lib/utils'

interface Props {
  mrId: string
}

export default function TeamMrTerritoriesTab({ mrId }: Props) {
  const { data: areas = [], isLoading: areasLoading } = useAllAreas()
  const [checkedSubAreas, setCheckedSubAreas] = useState<string[]>([])
  const [territoryFilter, setTerritoryFilter] = useState('')
  const [showAssignMore, setShowAssignMore] = useState(false)
  const { data: serverAccess = [], isLoading: accessLoading } = useMrSubAreaAccess(mrId)
  const saveAccess = useSaveMrSubAreaAccess()
  const serverAssignedSet = useMemo(() => new Set(serverAccess), [serverAccess])
  const serverAccessKey = useMemo(() => [...serverAccess].sort().join(','), [serverAccess])

  useEffect(() => {
    setCheckedSubAreas(serverAccess)
    setShowAssignMore(false)
  }, [mrId, serverAccessKey])

  const assignedAreas = useMemo(() => {
    const byTerritory = new Map<string, { areaName: string; subAreas: string[] }>()
    for (const area of areas) {
      for (const sa of area.sub_areas ?? []) {
        if (!serverAssignedSet.has(sa.id)) continue
        const existing = byTerritory.get(area.id) ?? { areaName: area.name, subAreas: [] }
        existing.subAreas.push(sa.name)
        byTerritory.set(area.id, existing)
      }
    }
    return [...byTerritory.values()]
  }, [areas, serverAssignedSet])

  const filteredAreas = useMemo(
    () => (territoryFilter ? areas.filter(a => a.id === territoryFilter) : areas),
    [areas, territoryFilter],
  )

  const unassignedCount = useMemo(() => {
    let n = 0
    for (const area of areas) {
      for (const sa of area.sub_areas ?? []) {
        if (!serverAssignedSet.has(sa.id)) n++
      }
    }
    return n
  }, [areas, serverAssignedSet])

  const toggleSubArea = (id: string) => {
    setCheckedSubAreas(prev => (prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]))
  }

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

  if (areasLoading || accessLoading) return <LoadingSpinner />

  return (
    <div className="space-y-4 animate-fade-in pb-4">
      <div className={cn(dashboardPanelClass(), 'p-4 space-y-3')}>
        <p className="text-sm font-semibold text-foreground">Assigned areas</p>
        {assignedAreas.length === 0 ? (
          <p className="text-sm text-muted-foreground">No territories assigned yet.</p>
        ) : (
          <div className="space-y-2">
            {assignedAreas.map(block => (
              <div key={block.areaName} className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5">
                <p className="text-sm font-semibold text-foreground">{block.areaName}</p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {block.subAreas.map(name => (
                    <span
                      key={name}
                      className="text-[11px] leading-snug rounded-md border border-border/50 bg-background px-2 py-1 text-foreground"
                    >
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          {serverAssignedSet.size} area{serverAssignedSet.size !== 1 ? 's' : ''} assigned
          {unassignedCount > 0 && ` · ${unassignedCount} more available`}
        </p>
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full rounded-xl justify-between"
        onClick={() => setShowAssignMore(v => !v)}
      >
        {showAssignMore ? 'Hide assignment editor' : 'Assign or remove areas'}
        {showAssignMore ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </Button>

      {showAssignMore && (
        <>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Check areas to assign; uncheck to remove. Save replaces this MR&apos;s full territory list.
          </p>

          <div className="space-y-2">
            <Label className="text-xs">Filter territory</Label>
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

          <p className="text-xs font-medium text-primary">{checkedSubAreas.length} selected</p>

          <div className="space-y-3 max-h-[45vh] overflow-y-auto">
            {filteredAreas.map(area => {
              const subAreas = area.sub_areas ?? []
              const checkedCount = subAreas.filter(sa => checkedSubAreas.includes(sa.id)).length
              const allChecked = subAreas.length > 0 && checkedCount === subAreas.length
              const someChecked = checkedCount > 0 && !allChecked
              return (
                <div key={area.id} className={cn(dashboardPanelClass(), 'p-3')}>
                  <div className="flex items-center justify-between mb-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={allChecked}
                        className={someChecked ? 'data-[state=unchecked]:bg-primary/30' : ''}
                        onCheckedChange={() => toggleArea(area.id)}
                      />
                      <span className="text-sm font-semibold">{area.name}</span>
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
                          Select all
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2 pl-1">
                    {subAreas.map(sa => (
                      <label key={sa.id} className="flex items-center gap-3 cursor-pointer touch-target">
                        <Checkbox
                          checked={checkedSubAreas.includes(sa.id)}
                          onCheckedChange={() => toggleSubArea(sa.id)}
                        />
                        <span className="text-sm flex-1">{sa.name}</span>
                        {serverAssignedSet.has(sa.id) && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-600">
                            <Check className="h-3 w-3" />
                            Assigned
                          </span>
                        )}
                      </label>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          <Button
            type="button"
            disabled={saveAccess.isPending}
            className="w-full rounded-xl font-semibold"
            onClick={() =>
              void saveAccess
                .mutateAsync({ mrId, subAreaIds: checkedSubAreas })
                .then(() => toast.success('Territories saved'))
                .catch(e => toast.error(e instanceof Error ? e.message : 'Save failed'))
            }
          >
            {saveAccess.isPending ? 'Saving…' : 'Save territories'}
          </Button>
        </>
      )}
    </div>
  )
}
