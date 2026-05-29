import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import PageHeader from '@/components/shared/PageHeader'
import BottomNav from '@/components/shared/BottomNav'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/useAuth'
import { useManagersForMr } from '@/hooks/useManagers'
import { useApplyLeave, useMrLeaves } from '@/hooks/useLeaves'
import { formatDisplayDate } from '@/lib/dateUtils'
import { toastMrPendingManagerApproval } from '@/lib/mrApprovalToast'
import { LEAVE_CATEGORY_OPTIONS, leaveCategoryLabel } from '@/lib/leaveLabels'

export default function MRLeave() {
  const { user } = useAuth()
  const mrId = user?.id ?? ''
  const { data: leaves = [] } = useMrLeaves(mrId)
  const applyLeave = useApplyLeave()
  const {
    data: managers = [],
    isLoading: managersLoading,
    isError: managersError,
    error: managersQueryError,
  } = useManagersForMr(mrId)
  const [selectedManagerId, setSelectedManagerId] = useState<string | null>(null)
  const [leaveDate, setLeaveDate] = useState('')
  const [leaveType, setLeaveType] = useState<'full' | 'half_morning' | 'half_afternoon'>('full')
  const [leaveCategory, setLeaveCategory] = useState<'casual' | 'sick' | 'without_pay'>('casual')
  const [reason, setReason] = useState('')

  useEffect(() => {
    if (managers.length === 0) {
      setSelectedManagerId(null)
      return
    }
    setSelectedManagerId(prev => {
      if (prev && managers.some(m => m.id === prev)) return prev
      return managers[0].id
    })
  }, [managers])

  const managerId = selectedManagerId
  const managersErrMessage = managersQueryError instanceof Error ? managersQueryError.message : 'Could not load approvers'

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader title="Leave" showBack />
      <div className="p-4 md:px-6 space-y-4 max-w-2xl lg:max-w-4xl mx-auto">
        <p className="text-xs text-muted-foreground leading-relaxed">
          Choose the date, duration, leave type, and remarks. Your manager will approve or reject the request.
        </p>
        <div className="rounded-xl border border-border p-3 space-y-3">
          {managersLoading && <p className="text-xs text-muted-foreground">Loading approvers…</p>}
          {managersError && (
            <p className="text-xs text-destructive">
              {managersErrMessage}. If this persists, contact admin (leave approvals require the manager list to
              load).
            </p>
          )}
          {!managersLoading && !managersError && managers.length > 1 && (
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Send to</Label>
              <select
                value={selectedManagerId ?? ''}
                onChange={e => setSelectedManagerId(e.target.value || null)}
                className="h-10 w-full border rounded-lg px-2 text-sm bg-card"
              >
                {managers.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.full_name}
                    {m.employee_code ? ` (${m.employee_code})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date</Label>
            <Input type="date" value={leaveDate} onChange={e => setLeaveDate(e.target.value)} className="rounded-lg" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Duration</Label>
            <select
              value={leaveType}
              onChange={e => setLeaveType(e.target.value as typeof leaveType)}
              className="h-10 w-full border rounded-lg px-2 text-sm bg-card"
            >
              <option value="full">Full day</option>
              <option value="half_morning">Half day — morning</option>
              <option value="half_afternoon">Half day — afternoon</option>
            </select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Leave type</Label>
            <div className="grid grid-cols-1 gap-2">
              {LEAVE_CATEGORY_OPTIONS.map(o => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => setLeaveCategory(o.value)}
                  className={`rounded-lg border px-2 py-2 text-sm font-medium text-left ${
                    leaveCategory === o.value ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card'
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Remarks</Label>
            <Textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Reason / remarks"
              className="rounded-lg min-h-[88px]"
            />
          </div>
          <Button
            className="w-full rounded-xl font-semibold"
            disabled={!leaveDate || !reason.trim() || !managerId || managersLoading || managersError}
            onClick={() =>
              void applyLeave
                .mutateAsync({
                  mr_id: mrId,
                  manager_id: managerId,
                  leave_date: leaveDate,
                  leave_type: leaveType,
                  leave_category: leaveCategory,
                  reason: reason.trim(),
                })
                .then(() => {
                  setLeaveDate('')
                  setReason('')
                  toastMrPendingManagerApproval('Leave request sent')
                })
                .catch(err => toast.error(err instanceof Error ? err.message : 'Failed'))
            }
          >
            Apply for leave
          </Button>
          {!managersLoading && !managersError && managers.length === 0 && (
            <p className="text-xs text-destructive">
              No manager is available for approvals (none returned for your account). Ask admin to link you to a
              manager in the team map, or ensure at least one active manager exists.
            </p>
          )}
        </div>
        <div className="space-y-2">
          <p className="section-title">Your requests</p>
          {leaves.length === 0 ? (
            <p className="text-sm text-muted-foreground">No leave requests yet.</p>
          ) : (
            leaves.map(leave => (
              <div key={leave.id} className="rounded-xl border border-border p-3 space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-foreground">{formatDisplayDate(leave.leave_date)}</p>
                  <Badge
                    variant="outline"
                    className={
                      leave.status === 'approved'
                        ? 'border-emerald-500/40 text-emerald-800 dark:text-emerald-200'
                        : leave.status === 'rejected'
                          ? 'border-destructive/40 text-destructive'
                          : 'text-amber-800 dark:text-amber-200 border-amber-500/30'
                    }
                  >
                    {leave.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {leaveCategoryLabel(leave.leave_category)} ·{' '}
                  {leave.leave_type.replace('_', ' ')}
                </p>
                <p className="text-xs text-foreground">{leave.reason}</p>
                {leave.status === 'approved' && leave.approver?.full_name && (
                  <p className="text-[11px] font-medium text-primary">Approved by {leave.approver.full_name}</p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
      <BottomNav role="mr" />
    </div>
  )
}
