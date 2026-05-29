import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import PageHeader from '@/components/shared/PageHeader'
import BottomNav from '@/components/shared/BottomNav'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/useAuth'
import { useManagerOwnLeaves, useUpsertManagerOwnLeave } from '@/hooks/useLeaves'
import { formatDisplayDate } from '@/lib/dateUtils'
import { LEAVE_CATEGORY_OPTIONS, leaveCategoryLabel } from '@/lib/leaveLabels'

export default function ManagerSelfLeavePage() {
  const { user } = useAuth()
  const managerId = user?.id ?? ''
  const { data: rows = [] } = useManagerOwnLeaves(managerId)
  const upsert = useUpsertManagerOwnLeave()
  const [leaveDate, setLeaveDate] = useState('')
  const [leaveCategory, setLeaveCategory] = useState<'casual' | 'sick' | 'without_pay'>('casual')
  const [remark, setRemark] = useState('')

  const sorted = useMemo(() => [...rows].sort((a, b) => b.leave_date.localeCompare(a.leave_date)), [rows])

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader title="My leave" showBack />
      <div className="p-4 md:px-6 space-y-4 max-w-2xl mx-auto">
        <p className="text-xs text-muted-foreground leading-relaxed">
          Log your own leave days here. No approval workflow — this is for your records only. MRs do not see manager leave.
        </p>
        <div className="rounded-xl border border-border p-3 space-y-3">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Add / update day</Label>
          <Input type="date" value={leaveDate} onChange={e => setLeaveDate(e.target.value)} className="rounded-lg" />
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
          <Textarea value={remark} onChange={e => setRemark(e.target.value)} placeholder="Remark (optional)" className="rounded-lg min-h-[72px]" />
          <Button
            className="w-full rounded-xl"
            disabled={!leaveDate || upsert.isPending}
            onClick={() =>
              void upsert
                .mutateAsync({
                  manager_id: managerId,
                  leave_date: leaveDate,
                  leave_category: leaveCategory,
                  remark,
                })
                .then(() => {
                  toast.success('Leave saved')
                  setRemark('')
                })
                .catch(e => toast.error(e instanceof Error ? e.message : 'Failed'))
            }
          >
            Save leave day
          </Button>
        </div>
        <div className="space-y-2">
          <p className="section-title">Your logged leave</p>
          {sorted.length === 0 ? (
            <p className="text-sm text-muted-foreground">No entries yet.</p>
          ) : (
            sorted.map(r => (
              <div key={r.id} className="rounded-xl border border-border p-3 flex justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-foreground">{formatDisplayDate(r.leave_date)}</p>
                  <p className="text-xs text-muted-foreground">{leaveCategoryLabel(r.leave_category)}</p>
                  {r.remark && <p className="text-xs text-foreground mt-1">{r.remark}</p>}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      <BottomNav role="manager" />
    </div>
  )
}
