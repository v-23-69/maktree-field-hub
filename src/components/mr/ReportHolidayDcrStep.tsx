import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { formatDisplayDate } from '@/lib/dateUtils'
import type { ReportFormData } from '@/pages/mr/NewReport'
import { useAuth } from '@/hooks/useAuth'
import {
  findExistingDailyReport,
  useAllowedReportDates,
  useCreateReport,
  useSubmitReport,
} from '@/hooks/useReport'
import { supabase } from '@/lib/supabase'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import ReportStepFooter from '@/components/mr/ReportStepFooter'
import { toastMrPendingManagerApproval } from '@/lib/mrApprovalToast'

type Props = {
  data: ReportFormData
  onBack: () => void
  onClearDraft: () => void
  hideFooter?: boolean
}

export default function ReportHolidayDcrStep({
  data,
  onBack,
  onClearDraft,
  hideFooter,
}: Props) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const createReport = useCreateReport()
  const submitReport = useSubmitReport()
  const { data: allowedDates = [] } = useAllowedReportDates(user?.id ?? '')
  const [busy, setBusy] = useState(false)

  const isManager = user?.role === 'manager'
  const selectedDateRow = allowedDates.find(d => d.report_date === data.date)
  const isGrantedHoliday = selectedDateRow?.day_type === 'holiday'
  const needsApproval = !isManager && !isGrantedHoliday
  const historyPath = isManager ? '/manager/history' : '/mr/report/history'

  const handleSubmit = async () => {
    if (!user?.id || !data.date) {
      toast.error('Pick a date first')
      return
    }
    if (!supabase) {
      toast.error('Supabase not configured')
      return
    }
    setBusy(true)
    try {
      if (needsApproval) {
        const { error } = await supabase.rpc('submit_holiday_dcr_request', {
          p_mr_id: user.id,
          p_holiday_date: data.date,
          p_remark: 'Holiday DCR request',
        })
        if (error) throw error
        toastMrPendingManagerApproval('Holiday request sent')
        onClearDraft()
        navigate(historyPath)
        return
      }

      const existing = await findExistingDailyReport(supabase, user.id, data.date)
      if (!existing) {
        const row = await createReport.mutateAsync({
          mrId: user.id,
          managerId: null,
          workingWithIds: [],
          reportDate: data.date,
          reportKind: 'holiday',
        })
        await submitReport.mutateAsync(row.id)
      } else if (existing.status !== 'submitted') {
        await submitReport.mutateAsync(existing.id)
      }
      toast.success('Holiday DCR recorded')
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
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3">
        <p className="text-xs font-semibold text-amber-900 dark:text-amber-100">Holiday DCR</p>
        <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
          {needsApproval
            ? `Request a holiday for ${formatDisplayDate(data.date)}. Your manager will approve or reject it. No field visits until it is approved.`
            : `Confirms no field activity on ${formatDisplayDate(data.date)}. No doctor visits required.`}
        </p>
      </div>

      {hideFooter && (
        <ReportStepFooter
          onBack={onBack}
          onNext={() => void handleSubmit()}
          nextLabel={
            busy
              ? needsApproval
                ? 'Sending…'
                : 'Submitting…'
              : needsApproval
                ? 'Send for approval'
                : 'Submit Holiday DCR'
          }
          nextDisabled={busy}
        />
      )}
    </div>
  )
}
