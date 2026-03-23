import { useMemo, useState } from 'react'
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

export default function UnlockRequests() {
  const { user } = useAuth()
  const managerId = user?.id ?? ''

  const { data, isLoading, isError } = useManagerUnlockRequests(managerId)
  const resolve = useResolveUnlockRequest()

  const pending = data?.pending ?? []
  const resolved = data?.resolved ?? []

  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectComment, setRejectComment] = useState('')

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
      toast.success('Unlock request approved ✓')
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
      toast.success('Unlock request rejected ✓')
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
    <div className="min-h-screen bg-background pb-20">
      <PageHeader title="Requests" />

      <div className="px-4 py-4 space-y-4">
        {isLoading && <LoadingSpinner />}
        {isError && <EmptyState message="Could not load unlock requests." />}

        {!isLoading && !isError && (
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
      </div>

      <BottomNav role="manager" />
    </div>
  )
}

