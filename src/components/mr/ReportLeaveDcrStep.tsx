import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
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
}

export default function ReportLeaveDcrStep({ data, onChange, onBack, onClearDraft }: Props) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const createReport = useCreateReport()
  const submitReport = useSubmitReport()
  const [busy, setBusy] = useState(false)

  const cat = (data.leaveDcrCategory === 'sick' ? 'sick' : 'casual') as 'casual' | 'sick'
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
          reportKind: 'leave',
          leaveDcrCategory: cat,
          leaveDcrRemark: remark.trim(),
        })
        reportId = row.id
      } else {
        const { error: upErr } = await supabase
          .from('daily_reports')
          .update({
            report_kind: 'leave',
            leave_dcr_category: cat,
            leave_dcr_remark: remark.trim(),
            working_with_ids: [],
            manager_id: null,
          })
          .eq('id', reportId)
        if (upErr) throw upErr
      }

      await submitReport.mutateAsync(reportId)
      await queryClient.invalidateQueries({ queryKey: ['mr-reports'] })
      await queryClient.invalidateQueries({ queryKey: ['daily-report'] })
      await queryClient.invalidateQueries({ queryKey: ['allowed-report-dates'] })
      toast.success('Leave DCR submitted')
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
    <div className="space-y-5 animate-fade-in pb-24">
      <div className="rounded-xl border border-primary/25 bg-primary/5 p-3">
        <p className="text-xs font-semibold text-primary">Leave DCR</p>
        <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
          For approved full-day leave you still submit a short Leave DCR (type + remark). No doctor visits are required.
        </p>
      </div>

      <div className="glass-card p-3 space-y-1">
        <p className="text-xs text-muted-foreground">Date</p>
        <p className="text-sm font-semibold text-foreground">{formatDisplayDate(data.date)}</p>
      </div>

      <div className="space-y-2">
        <Label>Leave type</Label>
        <div className="grid grid-cols-2 gap-2">
          {(['casual', 'sick'] as const).map(k => (
            <button
              key={k}
              type="button"
              onClick={() => onChange({ leaveDcrCategory: k })}
              className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition-all active:scale-[0.98] ${
                cat === k ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card'
              }`}
            >
              {k === 'casual' ? 'Casual leave' : 'Sick leave'}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Remark</Label>
        <Textarea
          value={remark}
          onChange={e => onChange({ leaveDcrRemark: e.target.value })}
          placeholder="Brief remark for this leave day"
          className="min-h-[100px] rounded-xl"
        />
      </div>

      <div className="fixed bottom-20 left-0 right-0 px-4 pb-3 pt-2 bg-background/95 backdrop-blur-md border-t border-border/40">
        <div className="max-w-lg mx-auto flex gap-2">
          <Button type="button" variant="outline" className="flex-1 rounded-2xl" onClick={onBack} disabled={busy}>
            Back
          </Button>
          <Button type="button" className="flex-1 rounded-2xl font-bold" onClick={() => void handleSubmit()} disabled={busy}>
            {busy ? 'Submitting…' : 'Submit Leave DCR'}
          </Button>
        </div>
      </div>
    </div>
  )
}
