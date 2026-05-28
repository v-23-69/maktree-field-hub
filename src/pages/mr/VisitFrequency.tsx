import { useState } from 'react'
import PageHeader from '@/components/shared/PageHeader'
import BottomNav from '@/components/shared/BottomNav'
import VisitFrequencyByAreaSection from '@/components/mr/VisitFrequencyByAreaSection'
import { useAuth } from '@/hooks/useAuth'
import { todayInputDate } from '@/lib/dateUtils'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { dashboardPageClass } from '@/components/dashboard/dashboard-shell'

export default function MRVisitFrequencyPage() {
  const { user } = useAuth()
  const [month, setMonth] = useState(() => todayInputDate().slice(0, 7))

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader title="Visit frequency" showBack />
      <div className={dashboardPageClass()}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-1">
            <Label htmlFor="vf-month" className="text-xs font-semibold text-muted-foreground">
              Month
            </Label>
            <Input
              id="vf-month"
              type="month"
              value={month}
              onChange={e => setMonth(e.target.value)}
              className="h-11 rounded-xl w-[180px]"
            />
          </div>
        </div>

        {user?.id ? (
          <VisitFrequencyByAreaSection mrId={user.id} month={month} embedded={false} />
        ) : null}
      </div>
      <BottomNav role="mr" />
    </div>
  )
}
