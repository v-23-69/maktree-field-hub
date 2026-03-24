import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import PageHeader from '@/components/shared/PageHeader'
import BottomNav from '@/components/shared/BottomNav'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/hooks/useAuth'
import { useManagersForMr } from '@/hooks/useManagers'
import { useApplyLeave, useMrLeaves } from '@/hooks/useLeaves'

export default function MRLeave() {
  const { user } = useAuth()
  const { data: leaves = [] } = useMrLeaves(user?.id ?? '')
  const applyLeave = useApplyLeave()
  const { data: managers = [] } = useManagersForMr(user?.id ?? '')
  const managerId = useMemo(() => managers[0]?.id ?? null, [managers])
  const [leaveDate, setLeaveDate] = useState('')
  const [leaveType, setLeaveType] = useState<'full' | 'half_morning' | 'half_afternoon'>('full')
  const [reason, setReason] = useState('')

  return (
    <div className="min-h-screen bg-background pb-20">
      <PageHeader title="Leave" showBack />
      <div className="p-4 space-y-4">
        <div className="rounded-xl border p-3 space-y-2">
          <Input type="date" value={leaveDate} onChange={e => setLeaveDate(e.target.value)} />
          <select value={leaveType} onChange={e => setLeaveType(e.target.value as typeof leaveType)} className="h-10 w-full border rounded-md px-2">
            <option value="full">Full Day</option>
            <option value="half_morning">Half Day Morning</option>
            <option value="half_afternoon">Half Day Afternoon</option>
          </select>
          <Textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Reason" />
          <Button
            className="w-full"
            onClick={() =>
              void applyLeave
                .mutateAsync({ mr_id: user?.id ?? '', manager_id: managerId, leave_date: leaveDate, leave_type: leaveType, reason })
                .then(() => {
                  setLeaveDate('')
                  setReason('')
                  toast.success('Leave request sent')
                })
                .catch(err => toast.error(err instanceof Error ? err.message : 'Failed'))
            }
          >
            Apply for Leave
          </Button>
        </div>
        <div className="space-y-2">
          {leaves.map(leave => (
            <div key={leave.id} className="rounded-xl border p-3">
              <p className="text-sm font-medium">{leave.leave_date} - {leave.leave_type}</p>
              <p className="text-xs text-muted-foreground">{leave.reason}</p>
              <p className="text-xs capitalize">{leave.status}</p>
            </div>
          ))}
        </div>
      </div>
      <BottomNav role="mr" />
    </div>
  )
}
