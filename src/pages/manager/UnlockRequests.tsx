import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import { useManagerUnlockRequests, useResolveUnlockRequest } from '@/hooks/useUnlockRequests'
import PageHeader from '@/components/shared/PageHeader'
import BottomNav from '@/components/shared/BottomNav'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import EmptyState from '@/components/shared/EmptyState'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react'
import {
  useManagerPendingTourPrograms,
  useResolveTourProgram,
  useTourProgramEntries,
  useTpDeletionRequestsForManager,
  useResolveTourProgramDeletionRequest,
} from '@/hooks/useTourProgram'
import { useManagerMrs } from '@/hooks/useManagerTeam'
import { useAllAreas } from '@/hooks/useAreas'
import { supabase } from '@/lib/supabase'

export default function UnlockRequests() {
  const { user } = useAuth()
  const managerId = user?.id ?? ''

  const { data, isLoading, isError } = useManagerUnlockRequests(managerId)
  const resolve = useResolveUnlockRequest()

  const pending = data?.pending ?? []
  const resolved = data?.resolved ?? []
  const [tab, setTab] = useState<'unlock' | 'tour-programs' | 'tp-deletions'>('unlock')
  const { data: pendingTp = [] } = useManagerPendingTourPrograms(managerId)
  const resolveTp = useResolveTourProgram()
  const [tpNoteById, setTpNoteById] = useState<Record<string, string>>({})
  const [expandedTpId, setExpandedTpId] = useState<string | null>(null)
  const { data: tpEntries = [] } = useTourProgramEntries(expandedTpId ?? undefined)
  const { data: areas = [] } = useAllAreas()
  const subAreaNameById = new Map(
    areas.flatMap(area => (area.sub_areas ?? []).map(sa => [sa.id, `${area.name} / ${sa.name}`] as const)),
  )

  const { data: tpDeletionReqs = [] } = useTpDeletionRequestsForManager()
  const resolveTpDeletion = useResolveTourProgramDeletionRequest()
  const { data: teamMrs = [] } = useManagerMrs(managerId)
  const mrNameById = useMemo(() => new Map(teamMrs.map(m => [m.id, m.full_name?.trim() || 'MR'] as const)), [teamMrs])

  const mrLabel = (mrId: string) =>
    mrId === user?.id ? (user?.full_name?.trim() || 'You') : (mrNameById.get(mrId) ?? 'MR')

  const wwIds = useMemo(() => {
    const s = new Set<string>()
    for (const e of tpEntries) {
      for (const id of e.working_with_ids ?? []) {
        if (id) s.add(id)
      }
    }
    return [...s]
  }, [tpEntries])

  const { data: wwUsers = [] } = useQuery({
    queryKey: ['tp-pending-ww-names', wwIds.sort().join(',')],
    enabled: wwIds.length > 0 && !!supabase,
    queryFn: async () => {
      if (!supabase) return []
      const { data, error } = await supabase.from('users').select('id, full_name').in('id', wwIds)
      if (error) throw error
      return (data ?? []) as Array<{ id: string; full_name: string | null }>
    },
  })

  const wwNameById = useMemo(() => new Map(wwUsers.map(u => [u.id, u.full_name?.trim() || 'Colleague'])), [wwUsers])

  const formatTpEntryLine = (entry: (typeof tpEntries)[number]) => {
    const area = entry.sub_area_id ? subAreaNameById.get(entry.sub_area_id) ?? 'Area' : '—'
    const ww =
      (entry.working_with_ids ?? []).length > 0
        ? (entry.working_with_ids ?? []).map(id => wwNameById.get(id) ?? id.slice(0, 8)).join(' + ')
        : ''
    return { area, ww }
  }

  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectComment, setRejectComment] = useState('')
  const [tpDelNotes, setTpDelNotes] = useState<Record<string, string>>({})

  const pendingCount = pending.length
  const resolvedCount = resolved.length

  const statusBadge = (status: string) => {
    if (status === 'approved') {
      return <Badge className="bg-emerald-600/10 text-emerald-800 border-emerald-600/30">Approved</Badge>
    }
    if (status === 'rejected') {
      return <Badge className="bg-destructive/10 text-destructive border-destructive/30">Rejected</Badge>
    }
    return <Badge className="bg-amber-500/10 text-amber-900 border-amber-500/30">Pending</Badge>
  }

  const handleApprove = async (requestId: string) => {
    try {
      await resolve.mutateAsync({ requestId, action: 'approved' })
      toast.success('Unlock request approved')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Approve failed')
    } finally {
      setRejectingId(null)
      setRejectComment('')
    }
  }

  const handleReject = async (requestId: string) => {
    try {
      if (!rejectComment.trim()) {
        toast.error('Please enter your comment before rejecting.')
        return
      }
      await resolve.mutateAsync({
        requestId,
        action: 'rejected',
        managerComment: rejectComment,
      })
      toast.success('Unlock request rejected')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Reject failed')
    } finally {
      setRejectingId(null)
      setRejectComment('')
    }
  }

  const renderRequestCard = (req: any) => {
    const mrName = req.mr_full_name ?? ''
    return (
      <div
        key={req.id}
        className="rounded-xl bg-card border border-border p-4 shadow-sm space-y-3"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">
              {mrName || 'MR'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Requested: {req.requested_date ? String(req.requested_date) : '—'}
            </p>
          </div>
          {statusBadge(req.status)}
        </div>

        <div className="space-y-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Reason
          </p>
          <p className="text-sm text-foreground whitespace-pre-wrap">{req.reason}</p>
        </div>

        {req.status === 'pending' ? (
          <div className="flex gap-2">
            <Button
              type="button"
              className="flex-1 touch-target rounded-lg bg-emerald-600 text-white hover:bg-emerald-600/90"
              disabled={resolve.isPending}
              onClick={() => void handleApprove(req.id)}
            >
              <CheckCircle2 className="h-4 w-4 mr-1.5" />
              Approve
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1 touch-target rounded-lg border-destructive text-destructive hover:bg-destructive/5"
              disabled={resolve.isPending}
              onClick={() => {
                setRejectingId(prev => (prev === req.id ? null : req.id))
                setRejectComment('')
              }}
            >
              <XCircle className="h-4 w-4 mr-1.5" />
              Reject
            </Button>
          </div>
        ) : (
          <div className="text-xs text-muted-foreground">
            Manager comment: {req.manager_comment || '—'}
          </div>
        )}

        {req.status === 'pending' && rejectingId === req.id && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Rejection Comment
            </p>
            <Textarea
              value={rejectComment}
              onChange={e => setRejectComment(e.target.value)}
              placeholder="Add a note for the MR…"
              className="min-h-[120px] touch-target rounded-lg"
            />
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1 touch-target rounded-lg"
                onClick={() => {
                  setRejectingId(null)
                  setRejectComment('')
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="flex-1 touch-target rounded-lg bg-destructive text-white hover:bg-destructive/90"
                disabled={resolve.isPending || !rejectComment.trim()}
                onClick={() => void handleReject(req.id)}
              >
                <AlertTriangle className="h-4 w-4 mr-1.5" />
                Submit
              </Button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader title="Requests" />

      <div className="px-4 md:px-6 py-4 space-y-4 max-w-2xl lg:max-w-4xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <Button variant={tab === 'unlock' ? 'default' : 'outline'} className="w-full text-sm" onClick={() => setTab('unlock')}>Unlock</Button>
          <Button variant={tab === 'tour-programs' ? 'default' : 'outline'} className="w-full text-sm" onClick={() => setTab('tour-programs')}>Tour programs</Button>
          <Button variant={tab === 'tp-deletions' ? 'default' : 'outline'} className="w-full text-sm relative" onClick={() => setTab('tp-deletions')}>
            TP deletions
            {tpDeletionReqs.length > 0 && (
              <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5">{tpDeletionReqs.length}</Badge>
            )}
          </Button>
        </div>
        {isLoading && <LoadingSpinner />}
        {isError && <EmptyState message="Could not load unlock requests." />}

        {!isLoading && !isError && tab === 'unlock' && (
          <>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Pending ({pendingCount})
              </p>
              {pendingCount === 0 ? (
                <EmptyState message="No pending unlock requests." />
              ) : (
                <div className="space-y-3">
                  {pending.map(renderRequestCard)}
                </div>
              )}
            </div>

            <div className="space-y-2 pt-2 border-t border-border">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Resolved (last 30 days) ({resolvedCount})
              </p>
              {resolvedCount === 0 ? (
                <EmptyState message="No resolved requests in the last 30 days." />
              ) : (
                <div className="space-y-3">
                  {resolved.map(renderRequestCard)}
                </div>
              )}
            </div>
          </>
        )}

        {tab === 'tour-programs' && (
          <div className="space-y-3">
            {pendingTp.length === 0 ? (
              <EmptyState message="No pending tour programs." />
            ) : (
              pendingTp.map((tp: any) => (
                <div key={tp.id} className="rounded-xl border border-border/80 bg-card p-4 shadow-sm space-y-3">
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-foreground">MR: {tp.mr_name ?? tp.mr_id}</p>
                    <p className="text-xs text-muted-foreground">
                      Month:{' '}
                      <span className="font-semibold text-foreground">
                        {tp.month ? new Date(String(tp.month).slice(0, 10) + 'T00:00:00').toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) : '—'}
                      </span>
                    </p>
                    <div className="flex flex-wrap gap-2 items-center">
                      {tp.is_late && <Badge variant="destructive">Late submission</Badge>}
                      {(tp.edit_count ?? 0) > 0 && (
                        <Badge variant="secondary" className="text-[10px]">TP edits: {tp.edit_count}</Badge>
                      )}
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="w-full rounded-lg" onClick={() => setExpandedTpId(prev => (prev === tp.id ? null : tp.id))}>
                    {expandedTpId === tp.id ? 'Hide day-wise plan' : 'Review day-wise plan'}
                  </Button>
                  {expandedTpId === tp.id && (
                    <div className="rounded-xl border border-border/60 bg-muted/20 p-3 space-y-2 max-h-[55vh] overflow-y-auto">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Working days</p>
                      {tpEntries.length === 0 ? (
                        <p className="text-xs text-muted-foreground">No entries loaded.</p>
                      ) : (
                        tpEntries
                          .filter(e => e.day_type === 'working')
                          .map(entry => {
                            const { area, ww } = formatTpEntryLine(entry)
                            return (
                              <div key={entry.id} className="rounded-lg border border-border/50 bg-background px-3 py-2.5 space-y-1">
                                <p className="text-xs font-bold text-foreground">{entry.work_date}</p>
                                <p className="text-[11px] text-foreground">
                                  <span className="text-muted-foreground">Territory:</span> {area}
                                </p>
                                <p className="text-[11px] text-foreground">
                                  <span className="text-muted-foreground">Working with:</span> {ww || 'Solo'}
                                </p>
                                <p className="text-[10px] text-muted-foreground capitalize">Day type: {entry.day_type}</p>
                              </div>
                            )
                          })
                      )}
                    </div>
                  )}
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider" htmlFor={`tp-note-${tp.id}`}>
                      Manager note (required for reject)
                    </label>
                    <Textarea
                      id={`tp-note-${tp.id}`}
                      placeholder="Optional context for MR when rejecting…"
                      value={tpNoteById[tp.id] ?? ''}
                      onChange={e => setTpNoteById(prev => ({ ...prev, [tp.id]: e.target.value }))}
                      className="min-h-[72px] text-sm rounded-lg"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      className="rounded-lg bg-emerald-600 text-white hover:bg-emerald-600/90"
                      disabled={resolveTp.isPending}
                      onClick={() =>
                        void resolveTp
                          .mutateAsync({ tourProgramId: tp.id, action: 'approved' })
                          .then(() => toast.success('Tour program approved'))
                      }
                    >
                      Approve
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      className="rounded-lg"
                      disabled={resolveTp.isPending}
                      onClick={() => {
                        const note = (tpNoteById[tp.id] ?? '').trim()
                        if (!note) {
                          toast.error('Add a short note before rejecting.')
                          return
                        }
                        void resolveTp
                          .mutateAsync({
                            tourProgramId: tp.id,
                            action: 'rejected',
                            managerNote: note,
                          })
                          .then(() => toast.success('Tour program rejected'))
                      }}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'tp-deletions' && (
          <div className="space-y-3">
            {tpDeletionReqs.length === 0 ? (
              <EmptyState message="No pending tour program deletion requests." />
            ) : (
              tpDeletionReqs.map(req => (
                <div key={req.id} className="rounded-xl border border-border/80 bg-card p-4 shadow-sm space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-foreground truncate">{mrLabel(req.mr_id)}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Requested {req.created_at ? new Date(req.created_at).toLocaleString() : '—'}
                      </p>
                    </div>
                    <Badge className="bg-amber-500/10 text-amber-900 border-amber-500/30">Pending</Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground break-all">
                    Tour program: <span className="font-mono text-foreground">{req.tour_program_id ?? '—'}</span>
                  </p>
                  <div>
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider" htmlFor={`tpdel-note-${req.id}`}>
                      Note to MR (optional for approve)
                    </label>
                    <Textarea
                      id={`tpdel-note-${req.id}`}
                      value={tpDelNotes[req.id] ?? ''}
                      onChange={e => setTpDelNotes(prev => ({ ...prev, [req.id]: e.target.value }))}
                      className="mt-1 min-h-[64px] rounded-lg text-sm"
                      placeholder="Optional comment…"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      className="rounded-lg bg-emerald-600 text-white hover:bg-emerald-600/90"
                      disabled={resolveTpDeletion.isPending}
                      onClick={() =>
                        void resolveTpDeletion
                          .mutateAsync({
                            requestId: req.id,
                            approve: true,
                            managerNote: (tpDelNotes[req.id] ?? '').trim() || null,
                          })
                          .then(() => toast.success('Tour program removed'))
                          .catch(e => toast.error(e instanceof Error ? e.message : 'Failed'))
                      }
                    >
                      Approve delete
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      className="rounded-lg"
                      disabled={resolveTpDeletion.isPending}
                      onClick={() =>
                        void resolveTpDeletion
                          .mutateAsync({
                            requestId: req.id,
                            approve: false,
                            managerNote: (tpDelNotes[req.id] ?? '').trim() || null,
                          })
                          .then(() => toast.success('Request rejected'))
                          .catch(e => toast.error(e instanceof Error ? e.message : 'Failed'))
                      }
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <BottomNav role="manager" />
    </div>
  )
}

