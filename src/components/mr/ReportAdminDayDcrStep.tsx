import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import ReportStepFooter from '@/components/mr/ReportStepFooter'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { formatDisplayDate } from '@/lib/dateUtils'
import type { ReportFormData } from '@/pages/mr/NewReport'
import { useAuth } from '@/hooks/useAuth'
import {
  findExistingDailyReport,
  useCreateReport,
  useSubmitReport,
} from '@/hooks/useReport'
import { supabase } from '@/lib/supabase'
import LoadingSpinner from '@/components/shared/LoadingSpinner'

interface Props {
  data: ReportFormData
  onChange: (d: Partial<ReportFormData>) => void
  onBack: () => void
  onClearDraft: () => void
  hideFooter?: boolean
}

export default function ReportAdminDayDcrStep({
  data,
  onChange,
  onBack,
  onClearDraft,
  hideFooter,
}: Props) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const createReport = useCreateReport()
  const submitReport = useSubmitReport()
  const [busy, setBusy] = useState(false)

  const startTime = data.adminDayStartTime ?? '09:00'
  const endTime = data.adminDayEndTime ?? '18:00'
  const notes = data.adminDayNotes ?? ''

  const handleSubmit = async () => {
    if (!supabase || !user?.id || user.role !== 'manager') {
      toast.error('Admin day is for managers only')
      return
    }
    if (!data.date) {
      toast.error('Pick a date first')
      return
    }
    if (!notes.trim()) {
      toast.error('Describe what you did on this admin day')
      return
    }
    setBusy(true)
    try {
      const existing = await findExistingDailyReport(supabase, user.id, data.date)
      if (existing?.status === 'submitted') {
        toast.error('A report for this date is already submitted.')
        return
      }

      let reportId = existing?.id
      if (!reportId) {
        const row = await createReport.mutateAsync({
          mrId: user.id,
          managerId: null,
          workingWithIds: [],
          reportDate: data.date,
          reportKind: 'admin_day',
          adminDayStartTime: startTime,
          adminDayEndTime: endTime,
          adminDayNotes: notes.trim(),
        })
        reportId = row.id
      } else {
        const { error: upErr } = await supabase
          .from('daily_reports')
          .update({
            report_kind: 'admin_day',
            admin_day_start_time: startTime,
            admin_day_end_time: endTime,
            admin_day_notes: notes.trim(),
            working_with_ids: [],
            manager_id: null,
          })
          .eq('id', reportId)
        if (upErr) throw upErr
      }

      await submitReport.mutateAsync(reportId)
      await queryClient.invalidateQueries({ queryKey: ['mr-reports'] })
      toast.success('Admin day DCR submitted')
      onClearDraft()
      navigate('/manager/history')
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
      <div className="rounded-xl border border-violet-500/30 bg-violet-500/5 p-3">
        <p className="text-xs font-semibold text-violet-900 dark:text-violet-100">Admin day</p>
        <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
          Manager-only: office / admin work on {formatDisplayDate(data.date)}. MRs do not see this option.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>From time</Label>
          <Input
            type="time"
            value={startTime}
            onChange={e => onChange({ adminDayStartTime: e.target.value })}
            className="rounded-xl"
          />
        </div>
        <div className="space-y-2">
          <Label>To time</Label>
          <Input
            type="time"
            value={endTime}
            onChange={e => onChange({ adminDayEndTime: e.target.value })}
            className="rounded-xl"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>What did you do?</Label>
        <Textarea
          value={notes}
          onChange={e => onChange({ adminDayNotes: e.target.value })}
          placeholder="Describe admin / office work for this day"
          className="min-h-[120px] rounded-xl"
        />
      </div>

      {hideFooter && (
        <ReportStepFooter
          onBack={onBack}
          onNext={() => void handleSubmit()}
          nextLabel={busy ? 'Submitting…' : 'Submit Admin day'}
          nextDisabled={busy}
        />
      )}
    </div>
  )
}
