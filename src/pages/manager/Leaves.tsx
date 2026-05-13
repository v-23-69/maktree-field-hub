import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import PageHeader from '@/components/shared/PageHeader'
import BottomNav from '@/components/shared/BottomNav'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/useAuth'
import { useManagerLeaves, useResolveLeave } from '@/hooks/useLeaves'
import { useManagerDoctorDeletionRequests, useResolveDoctorDeletion } from '@/hooks/useDoctorDeletion'
import { formatDisplayDate } from '@/lib/dateUtils'

type MainTab = 'leave' | 'doctor-removals' | 'calendar'

export default function ManagerLeaves() {
  const { user } = useAuth()
  const managerId = user?.id ?? ''
  const { data: leaves = [] } = useManagerLeaves(managerId)
  const { data: doctorRemovalReqs = [] } = useManagerDoctorDeletionRequests(managerId)
  const resolveLeave = useResolveLeave()
  const resolveDoctorDeletion = useResolveDoctorDeletion()
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [docNotes, setDocNotes] = useState<Record<string, string>>({})
  const [leaveTab, setLeaveTab] = useState<'pending' | 'approved' | 'rejected'>('pending')
  const [mainTab, setMainTab] = useState<MainTab>('leave')

  const filteredLeaves = useMemo(() => {
    return leaves.filter(l => l.status === leaveTab)
  }, [leaves, leaveTab])

  const pendingDoctorRemovals = useMemo(
    () => doctorRemovalReqs.filter(r => r.status === 'pending'),
    [doctorRemovalReqs],
  )

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
    <div className="min-h-screen bg-background pb-24">
      <PageHeader title="Leaves & approvals" />
      <div className="p-4 md:px-6 space-y-3 max-w-2xl lg:max-w-4xl mx-auto">
        <div className="grid grid-cols-3 gap-2">
          <Button variant={mainTab === 'leave' ? 'default' : 'outline'} onClick={() => setMainTab('leave')}>
            Team leave
          </Button>
          <Button variant={mainTab === 'doctor-removals' ? 'default' : 'outline'} onClick={() => setMainTab('doctor-removals')}>
            Doctor removals
            {pendingDoctorRemovals.length > 0 && (
              <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5">
                {pendingDoctorRemovals.length}
              </Badge>
            )}
          </Button>
          <Button variant={mainTab === 'calendar' ? 'default' : 'outline'} onClick={() => setMainTab('calendar')}>
            Calendar
          </Button>
        </div>

        {mainTab === 'leave' && (
          <>
            <div className="grid grid-cols-3 gap-2">
              <Button variant={leaveTab === 'pending' ? 'default' : 'outline'} onClick={() => setLeaveTab('pending')}>
                Pending
              </Button>
              <Button variant={leaveTab === 'approved' ? 'default' : 'outline'} onClick={() => setLeaveTab('approved')}>
                Approved
              </Button>
              <Button variant={leaveTab === 'rejected' ? 'default' : 'outline'} onClick={() => setLeaveTab('rejected')}>
                Rejected
              </Button>
            </div>

            {leaveTab === 'pending' &&
              filteredLeaves.map(leave => (
                <div key={leave.id} className="rounded-xl border p-3 space-y-2">
                  <p className="text-sm font-semibold text-foreground">{leave.mr?.full_name ?? 'MR'}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDisplayDate(leave.leave_date)} · {leave.leave_type.replace('_', ' ')} ·{' '}
                    {(leave.leave_category ?? 'casual') === 'sick' ? 'Sick' : 'Casual'}
                  </p>
                  <p className="text-xs text-foreground">{leave.reason}</p>
                  <Input
                    value={notes[leave.id] ?? ''}
                    onChange={e => setNotes(prev => ({ ...prev, [leave.id]: e.target.value }))}
                    placeholder="Manager note"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={() =>
                        void resolveLeave
                          .mutateAsync({
                            leaveId: leave.id,
                            status: 'approved',
                            managerNote: notes[leave.id],
                            resolverUserId: managerId,
                          })
                          .then(() => toast.success('Approved'))
                      }
                    >
                      Approve
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() =>
                        void resolveLeave
                          .mutateAsync({
                            leaveId: leave.id,
                            status: 'rejected',
                            managerNote: notes[leave.id],
                            resolverUserId: managerId,
                          })
                          .then(() => toast.success('Rejected'))
                      }
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              ))}

            {leaveTab !== 'pending' &&
              filteredLeaves.map(leave => (
                <div key={leave.id} className="rounded-xl border p-3 space-y-1">
                  <p className="text-sm font-semibold text-foreground">{leave.mr?.full_name ?? 'MR'}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDisplayDate(leave.leave_date)} · {leave.leave_type.replace('_', ' ')}
                  </p>
                  <p className="text-xs text-foreground">{leave.reason}</p>
                  <Badge variant="outline" className="text-[10px]">
                    {leave.status}
                  </Badge>
                </div>
              ))}

            {filteredLeaves.length === 0 && (
              <p className="text-sm text-muted-foreground py-4 text-center">No {leaveTab} leave requests.</p>
            )}
          </>
        )}

        {mainTab === 'doctor-removals' && (
          <div className="space-y-3">
            {doctorRemovalReqs.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">No doctor removal requests.</p>
            )}
            {doctorRemovalReqs.map(req => (
              <div key={req.id} className="rounded-xl border p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-foreground">{req.mr?.full_name ?? 'MR'}</p>
                  <Badge variant="outline" className="text-[10px]">
                    {req.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Doctor: <span className="font-medium text-foreground">{req.doctor?.full_name ?? '—'}</span>
                  {req.doctor?.speciality ? ` · ${req.doctor.speciality}` : ''}
                </p>
                {req.reason && <p className="text-xs text-foreground">{req.reason}</p>}
                {req.status === 'pending' && (
                  <>
                    <Input
                      value={docNotes[req.id] ?? ''}
                      onChange={e => setDocNotes(prev => ({ ...prev, [req.id]: e.target.value }))}
                      placeholder="Manager note"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        onClick={() =>
                          void resolveDoctorDeletion
                            .mutateAsync({
                              requestId: req.id,
                              status: 'approved',
                              managerNote: docNotes[req.id],
                              resolverUserId: managerId,
                              doctorId: req.doctor_id,
                            })
                            .then(() => toast.success('Doctor deactivated'))
                            .catch(e => toast.error(e instanceof Error ? e.message : 'Failed'))
                        }
                      >
                        Approve removal
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() =>
                          void resolveDoctorDeletion
                            .mutateAsync({
                              requestId: req.id,
                              status: 'rejected',
                              managerNote: docNotes[req.id],
                              resolverUserId: managerId,
                              doctorId: req.doctor_id,
                            })
                            .then(() => toast.success('Request rejected'))
                            .catch(e => toast.error(e instanceof Error ? e.message : 'Failed'))
                        }
                      >
                        Reject
                      </Button>
                    </div>
                  </>
                )}
                {req.status !== 'pending' && req.manager_note && (
                  <p className="text-[11px] text-muted-foreground">Note: {req.manager_note}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {mainTab === 'calendar' && (
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
