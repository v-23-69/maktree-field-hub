import { useState, useCallback, useEffect } from 'react';
import { todayInputDate } from '@/lib/dateUtils';
import PageHeader from '@/components/shared/PageHeader';
import BottomNav from '@/components/shared/BottomNav';
import ReportStep1 from '@/components/mr/ReportStep1';
import ReportStep2 from '@/components/mr/ReportStep2';
import ReportStep3 from '@/components/mr/ReportStep3';
import ReportStep4 from '@/components/mr/ReportStep4';
import { cn } from '@/lib/utils';

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
  selectedSubAreaIds: string[]
  visits: Record<string, VisitFormEntry>
}

const STEPS = ['Basic Info', 'Areas', 'Visits', 'Submit'];
const DRAFT_KEY = 'maktree_report_draft';

function migrateDraft(raw: unknown): ReportFormData | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  if (typeof o.date !== 'string') return null
  return {
    date: o.date,
    workingWithId: typeof o.workingWithId === 'string' ? o.workingWithId : '',
    selectedSubAreaIds: Array.isArray(o.selectedSubAreaIds)
      ? (o.selectedSubAreaIds as string[])
      : [],
    visits: typeof o.visits === 'object' && o.visits !== null
      ? migrateVisits(o.visits as Record<string, unknown>)
      : {},
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
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<ReportFormData>(() => {
    const draft = loadDraft();
    return draft || {
      date: todayInputDate(),
      workingWithId: '',
      selectedSubAreaIds: [],
      visits: {},
    };
  });

  useEffect(() => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(formData));
  }, [formData]);

  const updateData = useCallback((partial: Partial<ReportFormData>) => {
    setFormData(prev => ({ ...prev, ...partial }));
  }, []);

  const clearDraft = useCallback(() => {
    localStorage.removeItem(DRAFT_KEY);
  }, []);

  return (
    <div className="min-h-screen bg-background pb-20">
      <PageHeader title="New Daily Report" showBack />

      <div className="px-4 pt-3 pb-2">
        <div className="flex items-center gap-0">
          {STEPS.map((s, i) => {
            const isActive = i + 1 === step;
            const isCompleted = i + 1 < step;
            return (
              <div key={s} className="flex-1 flex flex-col items-center">
                <div className="w-full flex items-center">
                  <div className={cn(
                    'h-1.5 w-full transition-colors duration-300',
                    i === 0 && 'rounded-l-full',
                    i === STEPS.length - 1 && 'rounded-r-full',
                    isCompleted || isActive ? 'bg-primary' : 'bg-muted'
                  )} />
                </div>
                <span className={cn(
                  'text-[10px] mt-1.5 font-medium transition-colors',
                  isActive ? 'text-primary' : isCompleted ? 'text-primary/70' : 'text-muted-foreground'
                )}>
                  {s}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="px-4 py-3">
        {step === 1 && <ReportStep1 data={formData} onChange={updateData} onNext={() => setStep(2)} />}
        {step === 2 && (
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

      <BottomNav role="mr" />
    </div>
  );
}
