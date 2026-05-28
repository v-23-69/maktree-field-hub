import { useNavigate } from 'react-router-dom'
import StoryRingAvatar, { territoryAbbrev } from '@/components/shared/StoryRingAvatar'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import EmptyState from '@/components/shared/EmptyState'
import {
  useTerritoryAssignmentDetails,
  type TerritoryAssignmentDetail,
} from '@/hooks/useTerritoryVacancy'
import { cn } from '@/lib/utils'

function territoryStats(t: TerritoryAssignmentDetail) {
  const total = t.sub_areas.length
  const assigned = t.sub_areas.filter(sa => sa.is_assigned).length
  return { total, assigned, hasCoverage: assigned > 0, vacant: total - assigned }
}

type Props = {
  className?: string
  columns?: string
}

/** Territory coverage rings — assigned / total sub-areas per area. */
export default function ManagerVacantAreasGrid({
  className,
  columns = 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5',
}: Props) {
  const navigate = useNavigate()
  const { data: territories = [], isLoading, isError } = useTerritoryAssignmentDetails()

  if (isLoading) {
    return (
      <div className={cn('flex justify-center py-12', className)}>
        <LoadingSpinner />
      </div>
    )
  }

  if (isError) {
    return <EmptyState message="Could not load territory coverage." />
  }

  if (territories.length === 0) {
    return <EmptyState message="No territories configured yet." />
  }

  return (
    <div
      className={cn(
        'grid gap-x-3 gap-y-5 justify-items-center w-full',
        columns,
        className,
      )}
    >
      {territories.map(t => {
        const { total, assigned, hasCoverage, vacant } = territoryStats(t)
        const subtitle = hasCoverage ? `${assigned}/${total}` : `${vacant} open`
        return (
          <StoryRingAvatar
            key={t.area_id}
            size="md"
            name={t.area_name}
            displayName={t.area_name}
            badgeText={territoryAbbrev(t.area_name)}
            status={hasCoverage ? 'active' : 'inactive'}
            subtitle={subtitle}
            className="min-w-0 max-w-[108px]"
            onClick={() => navigate(`/manager/vacant-areas/${t.area_id}`)}
          />
        )
      })}
    </div>
  )
}
