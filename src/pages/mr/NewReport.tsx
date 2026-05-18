import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { todayInputDate } from '@/lib/dateUtils';
import PageHeader from '@/components/shared/PageHeader';
import BottomNav from '@/components/shared/BottomNav';
import ReportStep1 from '@/components/mr/ReportStep1';
import ReportStep2 from '@/components/mr/ReportStep2';
import ReportStep3 from '@/components/mr/ReportStep3';
import ReportStep4 from '@/components/mr/ReportStep4';
import ReportSundayDcrStep from '@/components/mr/ReportSundayDcrStep';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useReportBlockStatus, useRequestReportUnlock } from '@/hooks/useReport';
import { useTpStatus } from '@/hooks/useTourProgram';
import { useWorkingWithReportOptions } from '@/hooks/useManagers';
import { supabase } from '@/lib/supabase';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle, Calendar } from 'lucide-react';
import { toast } from 'sonner';

/** One saved doctor visit (local form state). */
export interface VisitFormEntry {
  doctorId: string
  subAreaId: string
  productsPromoted: string[]
  chemistName: string
  competitors: { brandName: string; quantity: number }[]
  monthlySupport: { productId: string; quantity: number }[]
}

export interface ReportFormData {
  date: string
  workingWithId: string
  workingWithIds: string[]
  selectedSubAreaIds: string[]
  visits: Record<string, VisitFormEntry>
  tpAutoFilled?: boolean
  /** MR: 'leave' when selected date is an approved full-day leave (Leave DCR flow). 'sunday' for Sunday DCR. */
  reportKind?: 'field' | 'leave' | 'sunday'
  leaveDcrCategory?: 'casual' | 'sick' | ''
  leaveDcrRemark?: string
}

const STEPS = ['Basic Info', 'Areas', 'Visits', 'Submit'];
const LEAVE_STEPS = ['Date', 'Leave DCR'];
const DRAFT_KEY = 'maktree_report_draft';

function migrateDraft(raw: unknown): ReportFormData | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  if (typeof o.date !== 'string') return null
  return {
    date: o.date,
    workingWithId: typeof o.workingWithId === 'string' ? o.workingWithId : '',
    workingWithIds: Array.isArray(o.workingWithIds)
      ? (o.workingWithIds as string[])
      : typeof o.workingWithId === 'string' && o.workingWithId
        ? [o.workingWithId]
        : [],
    selectedSubAreaIds: Array.isArray(o.selectedSubAreaIds)
      ? (o.selectedSubAreaIds as string[])
      : [],
    visits: typeof o.visits === 'object' && o.visits !== null
      ? migrateVisits(o.visits as Record<string, unknown>)
      : {},
    tpAutoFilled: typeof o.tpAutoFilled === 'boolean' ? o.tpAutoFilled : false,
    reportKind: o.reportKind === 'leave' ? 'leave' : o.reportKind === 'sunday' ? 'sunday' : 'field',
    leaveDcrCategory: o.leaveDcrCategory === 'sick' || o.leaveDcrCategory === 'casual' ? o.leaveDcrCategory : '',
    leaveDcrRemark: typeof o.leaveDcrRemark === 'string' ? o.leaveDcrRemark : '',
  }
}

function migrateVisits(v: Record<string, unknown>): Record<string, VisitFormEntry> {
  const out: Record<string, VisitFormEntry> = {}
  for (const [k, val] of Object.entries(v)) {
    if (!val || typeof val !== 'object') continue
    const e = val as Record<string, unknown>
    const doctorId = typeof e.doctorId === 'string' ? e.doctorId : k
    const subAreaId = typeof e.subAreaId === 'string' ? e.subAreaId : ''
    out[k] = {
      doctorId,
      subAreaId,
      productsPromoted: Array.isArray(e.productsPromoted)
        ? (e.productsPromoted as string[])
        : [],
      chemistName: typeof e.chemistName === 'string' ? e.chemistName : '',
      competitors: Array.isArray(e.competitors)
        ? (e.competitors as { brandName: string; quantity: number }[])
        : [{ brandName: '', quantity: 0 }],
      monthlySupport: Array.isArray(e.monthlySupport)
        ? (e.monthlySupport as { productId: string; quantity: number }[])
        : [{ productId: '', quantity: 0 }],
    }
  }
  return out
}

function loadDraft(): ReportFormData | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (raw) return migrateDraft(JSON.parse(raw));
  } catch { /* ignore */ }
  return null;
}

export default function NewReport() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const mrId = user?.id ?? ''

  const { data: tpStatus, isLoading: tpLoading } = useTpStatus(mrId)
  const { data: wwSanitizeOpts = [] } = useWorkingWithReportOptions(user?.id, user?.role)

  const [step, setStep] = useState(1);
  const [unlockReason, setUnlockReason] = useState('')
  const [formData, setFormData] = useState<ReportFormData>(() => {
    const draft = loadDraft();
    return draft || {
      date: todayInputDate(),
      workingWithId: '',
      workingWithIds: [],
      selectedSubAreaIds: [],
      visits: {},
      tpAutoFilled: false,
      reportKind: 'field',
      leaveDcrCategory: '',
      leaveDcrRemark: '',
    };
  });

  useEffect(() => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(formData));
  }, [formData]);

  useEffect(() => {
    if (user?.role !== 'mr' || wwSanitizeOpts.length === 0) return
    const allowed = new Set(wwSanitizeOpts.map(o => o.id))
    setFormData(prev => {
      const cur = prev.workingWithIds
      const next = cur.filter(id => allowed.has(id))
      if (next.length === cur.length) return prev
      return { ...prev, workingWithIds: next, workingWithId: next[0] ?? '' }
    })
  }, [user?.role, wwSanitizeOpts])

  useEffect(() => {
    const applyTourPlanAutofill = async () => {
      if (!supabase || !mrId || !formData.date) return
      const { data, error } = await supabase.rpc('get_tour_plan_for_date', {
        p_mr_id: mrId,
        p_date: formData.date,
      })
      if (error) return
      const row = Array.isArray(data) ? data[0] : data
      if (!row) return
      setFormData(prev => {
        const next = { ...prev }
        let changed = false
        const wIds = (row.working_with_ids as string[] | undefined) ?? []
        if (wIds.length > 0 && next.workingWithIds.length === 0) {
          next.workingWithIds = wIds
          next.workingWithId = wIds[0] ?? ''
          changed = true
        } else if (row.working_with && !next.workingWithId) {
          next.workingWithId = row.working_with as string
          next.workingWithIds = [row.working_with as string]
          changed = true
        }
        if (row.sub_area_id) {
          const sid = row.sub_area_id as string
          if (!next.selectedSubAreaIds.includes(sid)) {
            next.selectedSubAreaIds = [sid, ...next.selectedSubAreaIds]
            changed = true
          }
        }
        if (changed) next.tpAutoFilled = true
        return next
      })
    }
    void applyTourPlanAutofill()
  }, [mrId, formData.date])

  const updateData = useCallback((partial: Partial<ReportFormData>) => {
    setFormData(prev => ({ ...prev, ...partial }));
  }, []);

  const clearDraft = useCallback(() => {
    localStorage.removeItem(DRAFT_KEY);
  }, []);

  const {
    data: blockStatus,
    isLoading: blockLoading,
    isError: blockError,
  } = useReportBlockStatus(mrId)
  const requestUnlock = useRequestReportUnlock()

  const navRole = user?.role === 'manager' ? 'manager' : 'mr';
  const currentMonthTpMissing = tpStatus && !tpStatus.current_month_tp_exists;

  if (blockLoading || tpLoading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <PageHeader title="New Daily Report" showBack />
        <div className="px-4 py-6">
          <LoadingSpinner />
        </div>
        <BottomNav role={navRole} />
      </div>
    )
  }

  if (currentMonthTpMissing) {
    const monthLabel = tpStatus ? new Date(tpStatus.current_month + 'T00:00:00').toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) : 'this month';
    return (
      <div className="min-h-screen bg-background pb-20">
        <PageHeader title="New Daily Report" showBack />
        <div className="px-4 py-8 max-w-lg mx-auto space-y-5">
          <div className="rounded-2xl border-2 border-amber-500/30 bg-amber-500/5 p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Tour Program Required</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  You must create your Tour Program for <span className="font-semibold text-foreground">{monthLabel}</span> before filling DCR reports.
                </p>
              </div>
            </div>
            <Button
              onClick={() => navigate(navRole === 'manager' ? '/manager/tour-program' : '/mr/tour-program')}
              className="w-full rounded-2xl h-12 text-sm font-bold"
            >
              <Calendar className="mr-2 h-5 w-5" />
              Create Tour Program
            </Button>
          </div>
        </div>
        <BottomNav role={navRole} />
      </div>
    )
  }

  if (blockError) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <PageHeader title="New Daily Report" showBack />
        <div className="px-4 py-6">
          <p className="text-sm text-destructive">Could not load report block status.</p>
        </div>
        <BottomNav role={navRole} />
      </div>
    )
  }

  if (blockStatus?.is_blocked) {
    if (blockStatus.has_pending_request) {
      return (
        <div className="min-h-screen bg-background pb-20">
          <PageHeader title="New Daily Report" showBack />
          <div className="px-4 py-6 space-y-4">
            <div className="flex items-center gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4">
              <AlertTriangle className="h-5 w-5 text-amber-700" />
              <div>
                <p className="text-base font-semibold text-foreground">Unlock Request Pending</p>
                <p className="text-sm text-muted-foreground">
                  Your request has been sent to your manager. Please wait for approval.
                </p>
              </div>
            </div>
          </div>
          <BottomNav role={navRole} />
        </div>
      )
    }

    return (
      <div className="min-h-screen bg-background pb-20">
        <PageHeader title="New Daily Report" showBack />
        <div className="px-4 py-6 space-y-4">
          <div className="flex items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4">
            <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
            <div className="space-y-1">
              <p className="text-base font-semibold text-foreground">
                Report Submission Blocked
              </p>
              <p className="text-sm text-muted-foreground">
                You have not submitted reports for {blockStatus.missed_dates.join(', ')}.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Reason
            </label>
            <Textarea
              value={unlockReason}
              onChange={e => setUnlockReason(e.target.value)}
              placeholder="Please explain why reports were not submitted"
              className="min-h-[120px] touch-target rounded-lg"
            />
          </div>

          <Button
            type="button"
            disabled={requestUnlock.isPending || !unlockReason.trim()}
            onClick={async () => {
              try {
                await requestUnlock.mutateAsync({
                  mrId,
                  reason: unlockReason,
                })
                toast.success('Unlock request sent')
                setUnlockReason('')
              } catch (e) {
                toast.error(e instanceof Error ? e.message : 'Request failed')
              }
            }}
            className="w-full touch-target rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
          >
            {requestUnlock.isPending ? 'Sending…' : 'Send Unlock Request'}
          </Button>
        </div>
        <BottomNav role={navRole} />
      </div>
    )
  }

  const leaveFlow = user?.role === 'mr' && formData.reportKind === 'leave'
  const sundayFlow = formData.reportKind === 'sunday'
  const stepLabels = sundayFlow ? ['Date', 'Sunday DCR'] : leaveFlow ? LEAVE_STEPS : STEPS

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader title="New Daily Report" showBack />

      {/* Step indicator */}
      <div className="px-4 md:px-6 pt-4 pb-2 max-w-lg md:max-w-2xl lg:max-w-3xl mx-auto">
        <div className="flex items-center gap-1">
          {stepLabels.map((s, i) => {
            const visualStep = sundayFlow
              ? (step >= 5 ? 2 : step)
              : leaveFlow
                ? (step >= 2 ? 2 : step)
                : step
            const isActive = i + 1 === visualStep
            const isCompleted = i + 1 < visualStep
            return (
              <div key={s} className="flex-1 flex flex-col items-center gap-1.5">
                <div className="w-full flex items-center">
                  <div className={cn(
                    'h-[5px] w-full rounded-full transition-colors duration-300',
                    isCompleted || isActive ? 'bg-primary' : 'bg-muted'
                  )} />
                </div>
                <span className={cn(
                  'text-[10px] font-semibold transition-colors tracking-wide',
                  isActive ? 'text-primary' : isCompleted ? 'text-primary/60' : 'text-muted-foreground/50'
                )}>
                  {s}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="px-4 md:px-6 py-3 max-w-lg md:max-w-2xl lg:max-w-3xl mx-auto">
        {step === 1 && (
          <ReportStep1
            data={formData}
            onChange={updateData}
            onNext={() => {
              if (sundayFlow) setStep(5)
              else setStep(2)
            }}
          />
        )}
        {step === 5 && sundayFlow && (
          <ReportSundayDcrStep data={formData} onBack={() => setStep(1)} onClearDraft={clearDraft} />
        )}
        {step === 2 && leaveFlow && (
          <ReportLeaveDcrStep
            data={formData}
            onChange={updateData}
            onBack={() => setStep(1)}
            onClearDraft={clearDraft}
          />
        )}
        {step === 2 && !leaveFlow && !sundayFlow && (
          <ReportStep2
            data={formData}
            onChange={updateData}
            onNext={() => setStep(3)}
            onBack={() => setStep(1)}
          />
        )}
        {step === 3 && (
          <ReportStep3
            data={formData}
            onChange={updateData}
            onNext={() => setStep(4)}
            onBack={() => setStep(2)}
          />
        )}
        {step === 4 && (
          <ReportStep4
            data={formData}
            onBack={() => setStep(3)}
            onClearDraft={clearDraft}
          />
        )}
      </div>

      <BottomNav role={navRole} />
    </div>
  );
}
