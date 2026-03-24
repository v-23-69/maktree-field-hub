import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import PageHeader from '@/components/shared/PageHeader'
import BottomNav from '@/components/shared/BottomNav'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/hooks/useAuth'
import { useManagerLeaves, useResolveLeave } from '@/hooks/useLeaves'

export default function ManagerLeaves() {
  const { user } = useAuth()
  const { data: leaves = [] } = useManagerLeaves(user?.id ?? '')
  const resolveLeave = useResolveLeave()
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [tab, setTab] = useState<'pending' | 'approved' | 'rejected' | 'calendar'>('pending')
  const filteredLeaves = useMemo(() => {
    if (tab === 'calendar') return leaves
    return leaves.filter(l => l.status === tab)
  }, [leaves, tab])
  const monthGrid = useMemo(() => {
    const map = new Map<string, typeof leaves>()
    for (const leave of leaves) {
      const month = String(leave.leave_date).slice(0, 7)
      const existing = map.get(month) ?? []
      existing.push(leave)
      map.set(month, existing)
    }
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]))
  }, [leaves])

  return (
    <div className="min-h-screen bg-background pb-20">
      <PageHeader title="Leaves" />
      <div className="p-4 space-y-3">
        <div className="grid grid-cols-4 gap-2">
          <Button variant={tab === 'pending' ? 'default' : 'outline'} onClick={() => setTab('pending')}>Pending</Button>
          <Button variant={tab === 'approved' ? 'default' : 'outline'} onClick={() => setTab('approved')}>Approved</Button>
          <Button variant={tab === 'rejected' ? 'default' : 'outline'} onClick={() => setTab('rejected')}>Rejected</Button>
          <Button variant={tab === 'calendar' ? 'default' : 'outline'} onClick={() => setTab('calendar')}>Calendar</Button>
        </div>

        {tab !== 'calendar' && filteredLeaves.map(leave => (
          <div key={leave.id} className="rounded-xl border p-3 space-y-2">
            <p className="text-sm font-medium">{leave.leave_date} - {leave.leave_type}</p>
            <p className="text-xs text-muted-foreground">{leave.reason}</p>
            <Input
              value={notes[leave.id] ?? ''}
              onChange={e => setNotes(prev => ({ ...prev, [leave.id]: e.target.value }))}
              placeholder="Manager note"
            />
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={() =>
                  void resolveLeave
                    .mutateAsync({ leaveId: leave.id, status: 'approved', managerNote: notes[leave.id] })
                    .then(() => toast.success('Approved'))
                }
              >
                Approve
              </Button>
              <Button
                variant="destructive"
                onClick={() =>
                  void resolveLeave
                    .mutateAsync({ leaveId: leave.id, status: 'rejected', managerNote: notes[leave.id] })
                    .then(() => toast.success('Rejected'))
                }
              >
                Reject
              </Button>
            </div>
          </div>
        ))}

        {tab === 'calendar' && (
          <div className="space-y-3">
            {monthGrid.map(([month, list]) => (
              <div key={month} className="rounded-xl border p-3 space-y-2">
                <p className="text-sm font-semibold">{month}</p>
                {list.map(leave => (
                  <p
                    key={leave.id}
                    className={`text-xs ${
                      leave.status === 'approved'
                        ? 'text-emerald-700'
                        : leave.status === 'pending'
                          ? 'text-amber-700'
                          : 'text-destructive'
                    }`}
                  >
                    {leave.leave_date} - {leave.leave_type} ({leave.status})
                  </p>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
      <BottomNav role="manager" />
    </div>
  )
}
