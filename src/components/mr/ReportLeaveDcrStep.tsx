import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import ReportStepFooter from '@/components/mr/ReportStepFooter'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { formatDisplayDate } from '@/lib/dateUtils'
import type { ReportFormData } from '@/pages/mr/NewReport'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import { toastMrPendingManagerApproval } from '@/lib/mrApprovalToast'

interface Props {
  data: ReportFormData
  onChange: (d: Partial<ReportFormData>) => void
  onBack: () => void
  onClearDraft: () => void
  hideFooter?: boolean
}

export default function ReportLeaveDcrStep({
  data,
  onChange,
  onBack,
  onClearDraft,
  hideFooter,
}: Props) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [busy, setBusy] = useState(false)

  const remark = data.leaveDcrRemark ?? ''

  const handleSubmit = async () => {
    if (!supabase || !user?.id) {
      toast.error('Not signed in')
      return
    }
    if (!data.date) {
      toast.error('Pick a date first')
      return
    }
    if (!remark.trim()) {
      toast.error('Please enter a remark')
      return
    }
    setBusy(true)
    try {
      const { error } = await supabase.rpc('submit_leave_dcr_request', {
        p_mr_id: user.id,
        p_leave_date: data.date,
        p_remark: remark.trim(),
      })
      if (error) throw error

      await queryClient.invalidateQueries({ queryKey: ['mr-leaves'] })
      await queryClient.invalidateQueries({ queryKey: ['manager-leaves'] })
      await queryClient.invalidateQueries({ queryKey: ['manager-pending-counts'] })
      await queryClient.invalidateQueries({ queryKey: ['user-notifications'] })
      toastMrPendingManagerApproval('Leave request sent for manager approval')
      onClearDraft()
      navigate('/mr/report/history')
    } catch (e) {
      console.error(e)
      toast.error(e instanceof Error ? e.message : 'Submit failed')
    } finally {
      setBusy(false)
    }
  }

  if (!user) return <LoadingSpinner />

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="rounded-xl border border-violet-500/25 bg-violet-500/5 p-3">
        <p className="text-xs font-semibold text-violet-800 dark:text-violet-200">Leave DCR</p>
        <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
          Submit leave without pay for this date. Your manager will approve or reject the request.
        </p>
      </div>

      <div className="glass-card p-3 space-y-1">
        <p className="text-xs text-muted-foreground">Date</p>
        <p className="text-sm font-semibold text-foreground">{formatDisplayDate(data.date)}</p>
      </div>

      <div className="rounded-xl border border-violet-500/30 bg-violet-500/10 px-3 py-2.5">
        <p className="text-sm font-semibold text-violet-900 dark:text-violet-100">Leave without pay</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">All leave requests are recorded as leave without pay.</p>
      </div>

      <div className="space-y-2">
        <Label>Remark</Label>
        <Textarea
          value={remark}
          onChange={e => onChange({ leaveDcrRemark: e.target.value, leaveDcrCategory: 'without_pay' })}
          placeholder="Brief remark for this leave day"
          className="min-h-[100px] rounded-xl"
        />
      </div>

      {hideFooter && (
        <ReportStepFooter
          onBack={onBack}
          onNext={() => void handleSubmit()}
          nextLabel={busy ? 'Submitting…' : 'Submit leave request'}
          nextDisabled={busy}
        />
      )}
    </div>
  )
}
