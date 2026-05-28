import { useNavigate } from 'react-router-dom'
import { ChevronRight, MapPin } from 'lucide-react'
import ManagerVacantAreasGrid from '@/components/manager/ManagerVacantAreasGrid'
import { cn } from '@/lib/utils'
import { dashboardPanelClass } from '@/components/dashboard/dashboard-shell'

interface Props {
  managerId: string
}

/** Compact vacant-areas preview (optional embed). */
export default function ManagerVacantAreasStrip({ managerId: _managerId }: Props) {
  const navigate = useNavigate()

  return (
    <div className={cn(dashboardPanelClass(), 'p-4 space-y-3')}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 text-primary" />
          Vacant areas
        </p>
        <button
          type="button"
          onClick={() => navigate('/manager/vacant-areas')}
          className="text-[10px] font-semibold text-primary flex items-center gap-0.5 hover:underline"
        >
          View all
          <ChevronRight className="h-3 w-3" />
        </button>
      </div>
      <ManagerVacantAreasGrid columns="grid-cols-3 sm:grid-cols-4" />
    </div>
  )
}
