import { useState, useCallback, useEffect } from 'react';
import PageHeader from '@/components/shared/PageHeader';
import BottomNav from '@/components/shared/BottomNav';
import ReportStep1 from '@/components/mr/ReportStep1';
import ReportStep2 from '@/components/mr/ReportStep2';
import ReportStep3 from '@/components/mr/ReportStep3';
import ReportStep4 from '@/components/mr/ReportStep4';
import { cn } from '@/lib/utils';

export interface ReportFormData {
  date: string;
  workingWithId: string;
  selectedAreaIds: string[];
  selectedSubAreaIds: string[];
  visits: Record<string, {
    doctorId: string;
    productsPromoted: string[];
    chemistName: string;
    competitors: { brandName: string; quantity: number }[];
    monthlySupport: { productId: string; quantity: number }[];
  }>;
}

const STEPS = ['Basic Info', 'Areas', 'Visits', 'Submit'];
const DRAFT_KEY = 'maktree_report_draft';

function loadDraft(): ReportFormData | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

export default function NewReport() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<ReportFormData>(() => {
    const draft = loadDraft();
    return draft || {
      date: new Date().toISOString().split('T')[0],
      workingWithId: '',
      selectedAreaIds: [],
      selectedSubAreaIds: [],
      visits: {},
    };
  });

  // Auto-save draft to localStorage
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

      {/* Progress Bar */}
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
        {step === 2 && <ReportStep2 data={formData} onChange={updateData} onNext={() => setStep(3)} onBack={() => setStep(1)} />}
        {step === 3 && <ReportStep3 data={formData} onChange={updateData} onNext={() => setStep(4)} onBack={() => setStep(2)} />}
        {step === 4 && <ReportStep4 data={formData} onBack={() => setStep(3)} onClearDraft={clearDraft} />}
      </div>

      <BottomNav role="mr" />
    </div>
  );
}
