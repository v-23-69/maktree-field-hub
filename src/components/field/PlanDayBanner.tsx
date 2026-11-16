import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useFieldDayBoard } from '@/hooks/useFieldPlan'

export default function PlanDayBanner({ date }: { date: string }) {
  const { user } = useAuth()
  const board = useFieldDayBoard(user?.role === 'mr' ? date : '')
  const status = board.data?.plan_status
  if (user?.role !== 'mr' || !status || status === 'approved' || status === 'pending') return null
  const text = status === 'rejected'
    ? 'Today’s plan was sent back. This DCR will carry that remark, and spot working stays off until a plan is approved.'
    : 'No daily plan for this day. You can file DCRs normally. The report will note that the plan was not submitted.'

  return (
    <div className="mb-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs leading-relaxed text-foreground">
      <p>{text}</p>
      <Link to={`/mr/plan?date=${date}`} className="mt-1 inline-block font-semibold text-primary">Open plan</Link>
    </div>
  )
}
