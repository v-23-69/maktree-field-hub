import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Plus, Stethoscope, ChevronRight, Link2, Layers } from 'lucide-react'
import { toast } from 'sonner'
import PageHeader from '@/components/shared/PageHeader'
import BottomNav from '@/components/shared/BottomNav'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import EmptyState from '@/components/shared/EmptyState'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  useAssignCustomAreasToTerritory,
  useCreateManagerCustomArea,
  useCreateTerritoryWithSubAreas,
  useManagerCustomAreas,
} from '@/hooks/useManagerCustomAreas'
import { useAllAreas } from '@/hooks/useAreas'
import { useManagerMrs } from '@/hooks/useManagerTeam'
import { useAuth } from '@/hooks/useAuth'
import { dashboardPanelClass } from '@/components/dashboard/dashboard-shell'

export default function ManagerCustomAreas() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: areas = [], isLoading, isError } = useManagerCustomAreas()
  const { data: allTerritories = [] } = useAllAreas()
  const { data: mrs = [] } = useManagerMrs(user?.id ?? '')
  const createArea = useCreateManagerCustomArea()
  const assignTerritory = useAssignCustomAreasToTerritory()
  const createTerritory = useCreateTerritoryWithSubAreas()

  const [newName, setNewName] = useState('')
  const [mode, setMode] = useState<'list' | 'assign' | 'create-territory'>('list')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [pickTerritoryId, setPickTerritoryId] = useState('')
  const [newTerritoryName, setNewTerritoryName] = useState('')
  const [assignMrIds, setAssignMrIds] = useState<Set<string>>(new Set())

  const realTerritories = useMemo(
    () => allTerritories.filter(a => !a.code.startsWith('MGR-CUST-')),
    [allTerritories],
  )

  const toggle = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectedSubAreaIds = useMemo(() => {
    const ids: string[] = []
    for (const a of areas) {
      if (selectedIds.has(a.custom_area_id)) ids.push(a.sub_area_id)
    }
    return ids
  }, [areas, selectedIds])

  const handleCreate = async () => {
    const name = newName.trim()
    if (!name) {
      toast.error('Enter an area name')
      return
    }
    try {
      const id = await createArea.mutateAsync(name)
      toast.success('Custom area created')
      setNewName('')
      navigate(`/manager/custom-areas/${id}`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not create area')
    }
  }

  const handleAssignTerritory = async () => {
    if (!pickTerritoryId || selectedIds.size === 0) {
      toast.error('Select areas and a territory')
      return
    }
    try {
      const n = await assignTerritory.mutateAsync({
        customAreaIds: [...selectedIds],
        territoryAreaId: pickTerritoryId,
      })
      toast.success(`Assigned ${n} area(s) to territory`)
      setMode('list')
      setSelectedIds(new Set())
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Assign failed')
    }
  }

  const handleCreateTerritory = async () => {
    const name = newTerritoryName.trim()
    if (!name || selectedSubAreaIds.length === 0) {
      toast.error('Territory name and at least one area required')
      return
    }
    try {
      await createTerritory.mutateAsync({
        territoryName: name,
        subAreaIds: selectedSubAreaIds,
        assignMrIds: [...assignMrIds],
      })
      toast.success('Territory created')
      setMode('list')
      setSelectedIds(new Set())
      setNewTerritoryName('')
      setAssignMrIds(new Set())
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not create territory')
    }
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader title="Field visits (custom)" showBack />
      <div className="mx-auto w-full max-w-lg md:max-w-3xl px-4 py-4 space-y-4 md:px-8 lg:px-10">
        <p className="text-sm text-muted-foreground">
          Areas outside your tour program. Add doctors, file DCRs, then assign to a territory or MRs when ready.
        </p>

        <div className={dashboardPanelClass('p-4 space-y-3')}>
          <Label className="text-xs font-semibold">New custom area</Label>
          <div className="flex gap-2">
            <Input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="e.g. Village market route"
              className="rounded-xl"
            />
            <Button
              type="button"
              className="shrink-0 rounded-xl gap-1"
              disabled={createArea.isPending}
              onClick={() => void handleCreate()}
            >
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-xl"
            onClick={() => setMode(m => (m === 'assign' ? 'list' : 'assign'))}
          >
            <Link2 className="h-4 w-4 mr-1" />
            Assign to territory
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-xl"
            onClick={() => setMode(m => (m === 'create-territory' ? 'list' : 'create-territory'))}
          >
            <Layers className="h-4 w-4 mr-1" />
            New territory
          </Button>
        </div>

        {mode === 'assign' && (
          <div className={dashboardPanelClass('p-4 space-y-3')}>
            <p className="text-sm font-semibold">Assign selected areas to territory</p>
            <select
              value={pickTerritoryId}
              onChange={e => setPickTerritoryId(e.target.value)}
              className="w-full h-11 rounded-lg border border-input bg-background px-3 text-sm"
            >
              <option value="">Select territory</option>
              {realTerritories.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            <Button
              type="button"
              className="w-full rounded-xl"
              disabled={assignTerritory.isPending}
              onClick={() => void handleAssignTerritory()}
            >
              Confirm assign
            </Button>
          </div>
        )}

        {mode === 'create-territory' && (
          <div className={dashboardPanelClass('p-4 space-y-3')}>
            <p className="text-sm font-semibold">Create territory from selected areas</p>
            <Input
              value={newTerritoryName}
              onChange={e => setNewTerritoryName(e.target.value)}
              placeholder="New territory name"
              className="rounded-xl"
            />
            <p className="text-xs text-muted-foreground">Assign MRs to these sub-areas (optional)</p>
            <div className="max-h-40 overflow-y-auto space-y-2">
              {mrs.map(mr => (
                <label key={mr.id} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={assignMrIds.has(mr.id)}
                    onCheckedChange={() =>
                      setAssignMrIds(prev => {
                        const next = new Set(prev)
                        if (next.has(mr.id)) next.delete(mr.id)
                        else next.add(mr.id)
                        return next
                      })
                    }
                  />
                  {mr.full_name}
                </label>
              ))}
            </div>
            <Button
              type="button"
              className="w-full rounded-xl"
              disabled={createTerritory.isPending}
              onClick={() => void handleCreateTerritory()}
            >
              Create territory
            </Button>
          </div>
        )}

        {isLoading && <LoadingSpinner />}
        {isError && <EmptyState message="Could not load custom areas." />}
        {!isLoading && areas.length === 0 && (
          <EmptyState message="No custom areas yet. Create one above to add doctors and visits." />
        )}

        <ul className="space-y-2">
          {areas.map(a => (
            <li key={a.custom_area_id}>
              <div className={cnPanel('flex items-stretch gap-2 p-0 overflow-hidden')}>
                {(mode === 'assign' || mode === 'create-territory') && (
                  <div className="flex items-center pl-3">
                    <Checkbox
                      checked={selectedIds.has(a.custom_area_id)}
                      onCheckedChange={() => toggle(a.custom_area_id)}
                    />
                  </div>
                )}
                <button
                  type="button"
                  className="flex-1 text-left p-4 flex items-center gap-3 min-w-0"
                  onClick={() => navigate(`/manager/custom-areas/${a.custom_area_id}`)}
                >
                  <div className="h-10 w-10 rounded-xl bg-sky-500/10 flex items-center justify-center shrink-0">
                    <MapPin className="h-5 w-5 text-sky-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-foreground truncate">{a.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {a.territory_name ? `Territory: ${a.territory_name}` : 'Not assigned to territory'}
                    </p>
                    <div className="flex gap-3 mt-1 text-[11px] text-muted-foreground">
                      <span className="inline-flex items-center gap-0.5">
                        <Stethoscope className="h-3 w-3" /> {a.doctor_count} doctors
                      </span>
                      <span>{a.visit_count} calls logged</span>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <BottomNav role="manager" />
    </div>
  )
}

function cnPanel(className?: string) {
  return dashboardPanelClass(className)
}
