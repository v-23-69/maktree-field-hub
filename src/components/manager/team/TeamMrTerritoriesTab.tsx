import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Check } from 'lucide-react'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import { useAllAreas } from '@/hooks/useAreas'
import { useMrSubAreaAccess, useSaveMrSubAreaAccess } from '@/hooks/useAdminMrAccess'

interface Props {
  mrId: string
}

export default function TeamMrTerritoriesTab({ mrId }: Props) {
  const { data: areas = [], isLoading: areasLoading } = useAllAreas()
  const [checkedSubAreas, setCheckedSubAreas] = useState<string[]>([])
  const [territoryFilter, setTerritoryFilter] = useState('')
  const { data: serverAccess = [], isLoading: accessLoading } = useMrSubAreaAccess(mrId)
  const saveAccess = useSaveMrSubAreaAccess()
  const serverAssignedSet = useMemo(() => new Set(serverAccess), [serverAccess])

  useEffect(() => {
    setCheckedSubAreas(prev => {
      const next = [...serverAccess].sort()
      const prevSorted = [...prev].sort()
      if (prevSorted.length === next.length && prevSorted.every((id, i) => id === next[i])) return prev
      return next
    })
  }, [serverAccess])

  const filteredAreas = useMemo(
    () => (territoryFilter ? areas.filter(a => a.id === territoryFilter) : areas),
    [areas, territoryFilter],
  )

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

      <p className="text-xs font-medium text-primary">
        {checkedSubAreas.length} selected
        {serverAssignedSet.size > 0 && (
          <span className="text-muted-foreground font-normal"> · {serverAssignedSet.size} currently assigned</span>
        )}
      </p>

      <div className="space-y-3 max-h-[50vh] overflow-y-auto">
        {filteredAreas.map(area => {
          const subAreas = area.sub_areas ?? []
          const checkedCount = subAreas.filter(sa => checkedSubAreas.includes(sa.id)).length
          const allChecked = subAreas.length > 0 && checkedCount === subAreas.length
          const someChecked = checkedCount > 0 && !allChecked
          return (
            <div key={area.id} className="rounded-xl bg-card p-3 border border-border/60">
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
    </div>
  )
}
