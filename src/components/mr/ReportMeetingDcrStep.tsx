import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import ReportStepFooter from '@/components/mr/ReportStepFooter'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { formatDisplayDate } from '@/lib/dateUtils'
import type { ReportFormData } from '@/pages/mr/NewReport'
import { useAuth } from '@/hooks/useAuth'
import {
  findExistingDailyReport,
  useCreateReport,
  useSubmitReport,
} from '@/hooks/useReport'
import { useWorkingWithReportOptions } from '@/hooks/useManagers'
import { useManagerMrs } from '@/hooks/useManagerTeam'
import { supabase } from '@/lib/supabase'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import {
  MEETING_DURATION_OPTIONS,
  MEETING_TYPE_OPTIONS,
  type MeetingDurationType,
  type MeetingTypeKind,
} from '@/lib/dcrLabels'

interface Props {
  data: ReportFormData
  onChange: (d: Partial<ReportFormData>) => void
  onBack: () => void
  onClearDraft: () => void
  hideFooter?: boolean
}

export default function ReportMeetingDcrStep({
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

  const { data: workingOpts = [] } = useWorkingWithReportOptions(user?.id, user?.role)
  const { data: teamMrs = [] } = useManagerMrs(user?.role === 'manager' ? (user?.id ?? '') : '')

  const attendeeOptions = useMemo(() => {
    const map = new Map<string, { id: string; name: string; roleLabel: string }>()
    for (const o of workingOpts) {
      const roleLabel =
        o.option_kind === 'team_mr' ? 'MR' : o.option_kind === 'peer_manager' ? 'Mgr' : 'Mgr'
      map.set(o.id, { id: o.id, name: o.full_name, roleLabel })
    }
    if (user?.role === 'manager') {
      for (const m of teamMrs) {
        if (m.id === user.id) continue
        map.set(m.id, { id: m.id, name: m.full_name ?? 'MR', roleLabel: 'MR' })
      }
    }
    if (user?.id) {
      map.set(user.id, {
        id: user.id,
        name: user.full_name ?? 'You',
        roleLabel: user.role === 'manager' ? 'Mgr' : 'MR',
      })
    }
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name))
  }, [workingOpts, teamMrs, user])

  const duration = (data.meetingDurationType ?? 'full_day') as MeetingDurationType
  const meetingType = (data.meetingType ?? 'weekly') as MeetingTypeKind
  const attendeeIds = data.meetingAttendeeIds ?? []
  const notes = data.meetingNotes ?? ''
  const startTime = data.meetingStartTime ?? '09:00'
  const endTime = data.meetingEndTime ?? '18:00'

  const toggleAttendee = (id: string) => {
    const next = attendeeIds.includes(id) ? attendeeIds.filter(x => x !== id) : [...attendeeIds, id]
    onChange({ meetingAttendeeIds: next })
  }

  const historyPath = user?.role === 'manager' ? '/manager/history' : '/mr/report/history'

  const handleSubmit = async () => {
    if (!supabase || !user?.id || !data.date) {
      toast.error('Not signed in or missing date')
      return
    }
    if (!notes.trim()) {
      toast.error('Enter what was discussed in the meeting')
      return
    }
    if (attendeeIds.length === 0) {
      toast.error('Select at least one person who attended')
      return
    }
    setBusy(true)
    try {
      const existing = await findExistingDailyReport(supabase, user.id, data.date)
      if (existing?.status === 'submitted') {
        toast.error('A report for this date is already submitted.')
        return
      }

      const payload = {
        mrId: user.id,
        managerId: null,
        workingWithIds: attendeeIds,
        reportDate: data.date,
        reportKind: 'meeting' as const,
        meetingDurationType: duration,
        meetingStartTime: startTime,
        meetingEndTime: endTime,
        meetingType,
        meetingAttendeeIds: attendeeIds,
        meetingNotes: notes.trim(),
      }

      let reportId = existing?.id
      if (!reportId) {
        const row = await createReport.mutateAsync(payload)
        reportId = row.id
      } else {
        const { error: upErr } = await supabase
          .from('daily_reports')
          .update({
            report_kind: 'meeting',
            working_with_ids: attendeeIds,
            meeting_duration_type: duration,
            meeting_start_time: startTime,
            meeting_end_time: endTime,
            meeting_type: meetingType,
            meeting_attendee_ids: attendeeIds,
            meeting_notes: notes.trim(),
            leave_dcr_category: null,
            leave_dcr_remark: null,
          })
          .eq('id', reportId)
        if (upErr) throw upErr
      }

      await submitReport.mutateAsync(reportId)
      await queryClient.invalidateQueries({ queryKey: ['mr-reports'] })
      toast.success('Meeting DCR submitted')
      onClearDraft()
      navigate(historyPath)
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
      <div className="rounded-xl border border-primary/25 bg-primary/5 p-3">
        <p className="text-xs font-semibold text-primary">Meeting DCR</p>
        <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
          Company meeting on {formatDisplayDate(data.date)} — duration, type, attendees, and discussion notes.
        </p>
      </div>

      <div className="space-y-2">
        <Label>Meeting duration</Label>
        <div className="grid grid-cols-2 gap-2">
          {MEETING_DURATION_OPTIONS.map(o => (
            <button
              key={o.value}
              type="button"
              onClick={() => onChange({ meetingDurationType: o.value })}
              className={cn(
                'rounded-xl border px-3 py-2.5 text-sm font-medium transition-all',
                duration === o.value ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card',
              )}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>From time</Label>
          <Input type="time" value={startTime} onChange={e => onChange({ meetingStartTime: e.target.value })} className="rounded-xl" />
        </div>
        <div className="space-y-2">
          <Label>To time</Label>
          <Input type="time" value={endTime} onChange={e => onChange({ meetingEndTime: e.target.value })} className="rounded-xl" />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Meeting type</Label>
        <div className="space-y-2">
          {MEETING_TYPE_OPTIONS.map(o => (
            <button
              key={o.value}
              type="button"
              onClick={() => onChange({ meetingType: o.value })}
              className={cn(
                'w-full rounded-xl border px-3 py-2.5 text-sm font-medium text-left transition-all',
                meetingType === o.value ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card',
              )}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Who attended?</Label>
        <p className="text-[11px] text-muted-foreground">Select MRs and managers present at the meeting.</p>
        <div className="flex flex-wrap gap-2">
          {attendeeOptions.map(p => {
            const selected = attendeeIds.includes(p.id)
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => toggleAttendee(p.id)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all',
                  selected ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card',
                )}
              >
                {p.name}
                <Badge variant="outline" className="text-[9px] h-4 px-1">
                  {p.roleLabel}
                </Badge>
              </button>
            )
          })}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Discussion notes</Label>
        <Textarea
          value={notes}
          onChange={e => onChange({ meetingNotes: e.target.value })}
          placeholder="What was discussed in the meeting?"
          className="min-h-[120px] rounded-xl"
        />
      </div>

      {hideFooter && (
        <ReportStepFooter
          onBack={onBack}
          onNext={() => void handleSubmit()}
          nextLabel={busy ? 'Submitting…' : 'Submit Meeting DCR'}
          nextDisabled={busy}
        />
      )}
    </div>
  )
}
