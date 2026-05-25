import { useNavigate } from 'react-router-dom'
import { MapPin } from 'lucide-react'
import StoryRingAvatar, { territoryAbbrev } from '@/components/shared/StoryRingAvatar'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import { useTerritoryAssignmentDetails, type TerritoryAssignmentDetail } from '@/hooks/useTerritoryVacancy'

interface Props {
  managerId: string
}

function territoryStats(t: TerritoryAssignmentDetail) {
  const total = t.sub_areas.length
  const assigned = t.sub_areas.filter(sa => sa.is_assigned).length
  return { total, assigned, hasCoverage: assigned > 0, vacant: total - assigned }
}

export default function ManagerVacantAreasStrip({ managerId: _managerId }: Props) {
  const navigate = useNavigate()
  const { data: territories = [], isLoading } = useTerritoryAssignmentDetails()

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border/80 bg-card/60 p-6 flex justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (territories.length === 0) return null

  return (
    <div className="rounded-2xl border border-border/80 bg-card/60 p-4 space-y-3">
      <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
        <MapPin className="h-3.5 w-3.5 text-primary" />
        Vacant areas
      </p>

      <div className="grid grid-cols-3 gap-x-2 gap-y-4 justify-items-center w-full">
        {territories.map(t => {
          const { total, assigned, hasCoverage, vacant } = territoryStats(t)
          const subtitle = hasCoverage ? `${assigned}/${total}` : `${vacant} open`
          return (
            <StoryRingAvatar
              key={t.area_id}
              size="sm"
              name={t.area_name}
              displayName={t.area_name}
              badgeText={territoryAbbrev(t.area_name)}
              status={hasCoverage ? 'active' : 'inactive'}
              subtitle={subtitle}
              className="min-w-0 max-w-[100px]"
              onClick={() => navigate(`/manager/vacant-areas/${t.area_id}`)}
            />
          )
        })}
      </div>
    </div>
  )
}
