import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { formatDisplayDate } from '@/lib/dateUtils'
import type { ReportFormData } from '@/pages/mr/NewReport'
import { useAuth } from '@/hooks/useAuth'
import { useMarkSundayDcr } from '@/hooks/useReport'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import ReportStepFooter from '@/components/mr/ReportStepFooter'

interface Props {
  data: ReportFormData
  onBack: () => void
  onClearDraft: () => void
  hideFooter?: boolean
}

export default function ReportSundayDcrStep({
  data,
  onBack,
  onClearDraft,
  hideFooter,
}: Props) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const markSunday = useMarkSundayDcr()
  const [busy, setBusy] = useState(false)

  const historyPath = user?.role === 'manager' ? '/manager/history' : '/mr/report/history'

  const handleSubmit = async () => {
    if (!data.date) {
      toast.error('Pick a date first')
      return
    }
    setBusy(true)
    try {
      await markSunday.mutateAsync(data.date)
      toast.success('Sunday DCR submitted')
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
      <div className="rounded-xl border border-sky-500/30 bg-sky-500/5 p-3">
        <p className="text-xs font-semibold text-sky-900 dark:text-sky-100">Sunday DCR</p>
        <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
          Confirms you had no field visits on this Sunday. No doctor entries are required.
        </p>
      </div>

      <div className="glass-card p-3 space-y-1">
        <p className="text-xs text-muted-foreground">Date</p>
        <p className="text-sm font-semibold text-foreground">{formatDisplayDate(data.date)}</p>
      </div>

      {hideFooter && (
        <ReportStepFooter
          onBack={onBack}
          onNext={() => void handleSubmit()}
          nextLabel={busy ? 'Submitting…' : 'Submit Sunday DCR'}
          nextDisabled={busy}
        />
      )}
    </div>
  )
}
