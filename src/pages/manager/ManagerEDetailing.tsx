import PageHeader from '@/components/shared/PageHeader'
import BottomNav from '@/components/shared/BottomNav'
import ManagerMediaExplorer from '@/components/manager/edetailing/ManagerMediaExplorer'
import { Tablet } from 'lucide-react'
import { dashboardPanelClass } from '@/components/dashboard/dashboard-shell'

export default function ManagerEDetailing() {
  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      <PageHeader title="E-Detailing" showBack />

      <main className="page-container space-y-4">
        <div className={dashboardPanelClass('p-4')}>
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-cyan-500/10 flex items-center justify-center shrink-0">
              <Tablet className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
            </div>
            <div className="text-sm space-y-1">
              <p className="font-semibold text-foreground">Manager gallery</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Only <strong>doctor specialities from your master list</strong> appear as categories.
                Add subfolders inside a category, upload images, then use <strong>Slideshow</strong> for presentations.
              </p>
            </div>
          </div>
        </div>

        <ManagerMediaExplorer />
      </main>

      <BottomNav role="manager" />
    </div>
  )
}
