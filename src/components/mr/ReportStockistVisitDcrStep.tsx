import { useEffect, useMemo, useState } from 'react'
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
import { useUpsertStockistMeet } from '@/hooks/useStockistMeets'
import { useStockists } from '@/hooks/useStockists'
import { useMyHqAreas } from '@/hooks/useMyHq'
import { supabase } from '@/lib/supabase'
import LoadingSpinner from '@/components/shared/LoadingSpinner'

interface Props {
  data: ReportFormData
  onChange: (d: Partial<ReportFormData>) => void
  onBack: () => void
  onClearDraft: () => void
  hideFooter?: boolean
}

export default function ReportStockistVisitDcrStep({
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
  const upsertMeet = useUpsertStockistMeet()
  const [busy, setBusy] = useState(false)

  const userId = user?.id ?? ''
  const { data: myHqs = [] } = useMyHqAreas(userId)
  const hasMultipleHqs = myHqs.length > 1
  const hqAreaId = data.stockistHqAreaId ?? myHqs[0]?.area_id ?? ''
  const effectiveHq = hasMultipleHqs ? hqAreaId : myHqs[0]?.area_id ?? ''

  useEffect(() => {
    if (myHqs.length > 0 && !data.stockistHqAreaId) {
      onChange({ stockistHqAreaId: myHqs[0].area_id })
    }
  }, [myHqs, data.stockistHqAreaId, onChange])

  const { data: stockists = [] } = useStockists(effectiveHq || null)
  const stockistId = data.stockistId ?? ''
  const meetTime = data.stockistMeetTime ?? '10:00'
  const notes = data.stockistNotes ?? ''

  const canSubmit = useMemo(
    () => !!stockistId && !!data.date && (!hasMultipleHqs || !!effectiveHq),
    [stockistId, data.date, hasMultipleHqs, effectiveHq],
  )

  const historyPath = user?.role === 'manager' ? '/manager/history' : '/mr/report/history'

  const handleSubmit = async () => {
    if (!supabase || !userId) return
    if (!stockistId) {
      toast.error('Select a stockist')
      return
    }
    setBusy(true)
    try {
      const existing = await findExistingDailyReport(supabase, userId, data.date)
      if (existing?.status === 'submitted' && existing.report_kind !== 'stockist_visit') {
        toast.error('A different DCR is already submitted for this date.')
        return
      }

      let reportId = existing?.id
      if (!reportId) {
        const row = await createReport.mutateAsync({
          mrId: userId,
          managerId: user?.role === 'mr' ? null : null,
          workingWithIds: [],
          reportDate: data.date,
          reportKind: 'stockist_visit',
          stockistId,
        })
        reportId = row.id
      } else {
        const { error: upErr } = await supabase
          .from('daily_reports')
          .update({
            report_kind: 'stockist_visit',
            stockist_id: stockistId,
            working_with_ids: [],
          })
          .eq('id', reportId)
        if (upErr) throw upErr
      }

      await upsertMeet.mutateAsync({
        userId,
        meetDate: data.date,
        meetTime: meetTime || null,
        stockistId,
        notes: notes.trim() || null,
      })

      await submitReport.mutateAsync(reportId)
      await queryClient.invalidateQueries({ queryKey: ['mr-reports'] })
      await queryClient.invalidateQueries({ queryKey: ['stockist-meets'] })
      toast.success('Stockist visit DCR submitted')
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
      <div className="rounded-xl border border-primary/30 bg-primary/5 p-3">
        <p className="text-xs font-semibold text-primary">Stockist visit</p>
        <p className="text-[11px] text-muted-foreground mt-1">
          Log stockist meeting for {formatDisplayDate(data.date)} as your working mode DCR.
        </p>
      </div>

      {hasMultipleHqs && (
        <div className="space-y-2">
          <Label>HQ (Territory)</Label>
          <select
            value={hqAreaId}
            onChange={e => onChange({ stockistHqAreaId: e.target.value, stockistId: '' })}
            className="w-full rounded-xl border border-border/70 bg-background px-3 py-3 text-sm"
          >
            {myHqs.map(a => (
              <option key={a.area_id} value={a.area_id}>
                {a.area_name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="space-y-2">
        <Label>Stockist</Label>
        <select
          value={stockistId}
          onChange={e => onChange({ stockistId: e.target.value })}
          disabled={stockists.length === 0}
          className="w-full rounded-xl border border-border/70 bg-background px-3 py-3 text-sm disabled:opacity-60"
        >
          <option value="">Select stockist</option>
          {stockists.map(s => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label>Time (optional)</Label>
        <Input
          type="time"
          value={meetTime}
          onChange={e => onChange({ stockistMeetTime: e.target.value })}
          className="rounded-xl"
        />
      </div>

      <div className="space-y-2">
        <Label>Notes (optional)</Label>
        <Textarea
          value={notes}
          onChange={e => onChange({ stockistNotes: e.target.value })}
          placeholder="Discussion points, orders, etc."
          className="min-h-[100px] rounded-xl"
        />
      </div>

      {hideFooter && (
        <ReportStepFooter
          onBack={onBack}
          onNext={() => void handleSubmit()}
          nextLabel={busy ? 'Submitting…' : 'Submit stockist visit'}
          nextDisabled={busy || !canSubmit}
        />
      )}
    </div>
  )
}
