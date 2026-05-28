import PageHeader from '@/components/shared/PageHeader'
import BottomNav from '@/components/shared/BottomNav'
import ManagerVacantAreasGrid from '@/components/manager/ManagerVacantAreasGrid'
import { dashboardPageClass } from '@/components/dashboard/dashboard-shell'
import { cn } from '@/lib/utils'

export default function ManagerVacantAreasPage() {
  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader title="Vacant areas" showBack />

      <div className={cn(dashboardPageClass(), 'space-y-4')}>
        <p className="text-sm text-muted-foreground leading-relaxed">
          All territories and sub-area coverage. Tap a territory to view sub-areas, assign MRs, or
          see who is mapped.
        </p>

        <div className="rounded-2xl border border-border/80 bg-card/80 backdrop-blur-sm p-4 sm:p-5">
          <ManagerVacantAreasGrid columns="grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6" />
        </div>
      </div>

      <BottomNav role="manager" />
    </div>
  )
}
