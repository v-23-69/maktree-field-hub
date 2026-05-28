import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { formatDisplayDate } from '@/lib/dateUtils'
import type { ReportFormData } from '@/pages/mr/NewReport'
import { useAuth } from '@/hooks/useAuth'
import { useMarkStrike } from '@/hooks/useStrike'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import ReportStepFooter from '@/components/mr/ReportStepFooter'

type Props = {
  data: ReportFormData
  onBack: () => void
  onClearDraft: () => void
  hideFooter?: boolean
}

export default function ReportStrikeDcrStep({
  data,
  onBack,
  onClearDraft,
  hideFooter,
}: Props) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const markStrike = useMarkStrike()
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)

  const historyPath = user?.role === 'manager' ? '/manager/history' : '/mr/report/history'

  const handleSubmit = async () => {
    if (!user?.id || !data.date) {
      toast.error('Pick a date first')
      return
    }
    setBusy(true)
    try {
      await markStrike.mutateAsync({
        mr_id: user.id,
        strike_date: data.date,
        reason: reason.trim() || undefined,
      })
      toast.success('Strike DCR recorded')
      onClearDraft()
      navigate(historyPath)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Submit failed')
    } finally {
      setBusy(false)
    }
  }

  if (!user) return <LoadingSpinner />

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3">
        <p className="text-xs font-semibold text-destructive">Strike DCR</p>
        <p className="text-[11px] text-muted-foreground mt-1">
          Records a strike day for {formatDisplayDate(data.date)}. No doctor visits required.
        </p>
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Reason (optional)</Label>
        <Textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="Brief reason for strike…"
          className="min-h-[100px] rounded-xl"
        />
      </div>

      {hideFooter && (
        <ReportStepFooter
          onBack={onBack}
          onNext={() => void handleSubmit()}
          nextLabel={busy ? 'Submitting…' : 'Submit Strike DCR'}
          nextDisabled={busy}
        />
      )}
    </div>
  )
}
