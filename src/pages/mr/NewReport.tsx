import { useState, useCallback } from 'react';
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

const STEPS = ['Basic Info', 'Areas', 'Doctor Visits', 'Review'];

export default function NewReport() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<ReportFormData>({
    date: new Date().toISOString().split('T')[0],
    workingWithId: '',
    selectedAreaIds: [],
    selectedSubAreaIds: [],
    visits: {},
  });

  const updateData = useCallback((partial: Partial<ReportFormData>) => {
    setFormData(prev => ({ ...prev, ...partial }));
  }, []);

  return (
    <div className="min-h-screen bg-background pb-20">
      <PageHeader title="New Daily Report" showBack />

      {/* Progress */}
      <div className="px-4 pt-3 pb-2">
        <div className="flex items-center gap-1 mb-2">
          {STEPS.map((s, i) => (
            <div key={s} className="flex-1 flex flex-col items-center gap-1">
              <div className={cn(
                'h-1.5 w-full rounded-full transition-colors',
                i + 1 <= step ? 'bg-primary' : 'bg-muted'
              )} />
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground text-center">Step {step} of 4 — {STEPS[step - 1]}</p>
      </div>

      <div className="px-4 py-3">
        {step === 1 && <ReportStep1 data={formData} onChange={updateData} onNext={() => setStep(2)} />}
        {step === 2 && <ReportStep2 data={formData} onChange={updateData} onNext={() => setStep(3)} onBack={() => setStep(1)} />}
        {step === 3 && <ReportStep3 data={formData} onChange={updateData} onNext={() => setStep(4)} onBack={() => setStep(2)} />}
        {step === 4 && <ReportStep4 data={formData} onBack={() => setStep(3)} />}
      </div>

      <BottomNav role="mr" />
    </div>
  );
}
