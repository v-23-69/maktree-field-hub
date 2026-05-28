import DashboardTodayCard from '@/components/shared/DashboardTodayCard'
import type { AllowedReportDate } from '@/types/database.types'

type Props = {
  subAreaName?: string
  areaName?: string
  dcrDone: boolean
  dcrBlocked?: boolean
  expenseDone: boolean
  todayIsSunday: boolean
  pendingDcrs?: AllowedReportDate[]
  onStartDcr?: () => void
  onOpenPendingDcr?: (d: AllowedReportDate) => void
}

export default function MrDashboardTodayCard(props: Props) {
  return (
    <DashboardTodayCard
      {...props}
      expenseHref="/mr/expense"
      reportHref="/mr/report/new"
    />
  )
}
