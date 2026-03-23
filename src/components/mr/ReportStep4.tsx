import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import { CheckCircle2, Calendar, Users, MapPin, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { formatDisplayDate } from '@/lib/dateUtils';
import type { ReportFormData } from '@/pages/mr/NewReport';
import { useAuth } from '@/hooks/useAuth';
import { useProducts } from '@/hooks/useProducts';
import { useDoctorsBySubAreas } from '@/hooks/useDoctors';
import { useMrSubAreas } from '@/hooks/useAreas';
import {
  findExistingDailyReport,
  saveReportVisit,
  useCreateReport,
  useSubmitReport,
} from '@/hooks/useReport';
import { useManagers } from '@/hooks/useManagers';
import { supabase } from '@/lib/supabase';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

interface Props {
  data: ReportFormData;
  onBack: () => void;
  onClearDraft: () => void;
}

export default function ReportStep4({ data, onBack, onClearDraft }: Props) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [openCards, setOpenCards] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: products = [], isLoading: productsLoading } = useProducts();
  const { data: doctors = [], isLoading: doctorsLoading } = useDoctorsBySubAreas(data.selectedSubAreaIds);
  const { data: subAreasFlat = [], isLoading: subAreasLoading } = useMrSubAreas(user?.id ?? '');
  const { data: managers = [] } = useManagers();

  const createReport = useCreateReport();
  const submitReport = useSubmitReport();

  const subAreaNameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const sa of subAreasFlat) {
      m.set(sa.id, sa.name);
    }
    return m;
  }, [subAreasFlat]);

  const areaNameBySubAreaId = useMemo(() => {
    const m = new Map<string, string>();
    for (const sa of subAreasFlat) {
      m.set(sa.id, sa.area?.name ?? '');
    }
    return m;
  }, [subAreasFlat]);

  const areaLabels = useMemo(() => {
    const names = new Set<string>();
    for (const id of data.selectedSubAreaIds) {
      const n = areaNameBySubAreaId.get(id);
      if (n) names.add(n);
    }
    return [...names].sort((a, b) => a.localeCompare(b));
  }, [data.selectedSubAreaIds, areaNameBySubAreaId]);

  const subAreasLabels = data.selectedSubAreaIds.map(
    id => subAreaNameById.get(id) ?? id,
  );

  const manager = useMemo(
    () => managers.find(m => m.id === data.workingWithId),
    [managers, data.workingWithId],
  );

  const visitedDoctorIds = Object.keys(data.visits);
  const visitedDoctors = visitedDoctorIds
    .map(id => doctors.find(d => d.id === id))
    .filter(Boolean);

  const productName = (id: string) => products.find(p => p.id === id)?.name ?? id;

  const toggleCard = (id: string) => {
    setOpenCards(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSubmit = async () => {
    if (!supabase) {
      toast.error('Supabase is not configured');
      return;
    }
    if (!user) {
      toast.error('You must be signed in');
      return;
    }

    setIsSubmitting(true);
    try {
      const existing = await findExistingDailyReport(
        supabase,
        user.id,
        data.date,
      );

      if (existing?.status === 'submitted') {
        toast.error('You have already submitted a report for this date.');
        return;
      }

      let reportId: string;
      if (existing?.status === 'draft') {
        reportId = existing.id;
      } else {
        const row = await createReport.mutateAsync({
          mrId: user.id,
          managerId: data.workingWithId || null,
          reportDate: data.date,
        });
        reportId = row.id;
      }

      const doctorById = new Map(doctors.map(d => [d.id, d]));

      for (const doctorId of visitedDoctorIds) {
        const doc = doctorById.get(doctorId);
        const v = data.visits[doctorId];
        if (!doc || !v) continue;
        const subAreaId = v.subAreaId || doc.sub_area_id;
        await saveReportVisit(supabase, {
          reportId,
          doctorId,
          doctorSubAreaId: subAreaId,
          visit: {
            productsPromoted: v.productsPromoted,
            chemistName: v.chemistName,
            competitors: v.competitors,
            monthlySupport: v.monthlySupport,
          },
        });
      }

      await submitReport.mutateAsync(reportId);

      await queryClient.invalidateQueries({ queryKey: ['mr-reports'] });
      await queryClient.invalidateQueries({ queryKey: ['daily-report'] });

      toast.success('Report submitted successfully! ✓');
      onClearDraft();
      navigate('/mr/report/history');
    } catch (e) {
      console.error(e);
      toast.error('Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
      setShowConfirm(false);
    }
  };

  const loadingMeta = productsLoading || doctorsLoading || subAreasLoading;

  if (loadingMeta) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-5 animate-fade-in pb-20">
      <h3 className="text-base font-semibold text-foreground">Review Your Report</h3>

      <div className="space-y-3">
        <div className="flex items-center gap-3 rounded-xl bg-card p-3 shadow-sm">
          <Calendar className="h-5 w-5 text-primary shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground">Date</p>
            <p className="text-sm font-medium text-foreground">{formatDisplayDate(data.date)}</p>
          </div>
        </div>

        {manager && (
          <div className="flex items-center gap-3 rounded-xl bg-card p-3 shadow-sm">
            <Users className="h-5 w-5 text-primary shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Working With</p>
              <p className="text-sm font-medium text-foreground">{manager.full_name}</p>
            </div>
          </div>
        )}

        <div className="flex items-start gap-3 rounded-xl bg-card p-3 shadow-sm">
          <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="text-xs text-muted-foreground">Areas Covered</p>
            <p className="text-sm font-medium text-foreground">{areaLabels.join(', ') || '—'}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{subAreasLabels.join(', ') || '—'}</p>
          </div>
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-foreground mb-3">Doctors Visited ({visitedDoctors.length})</p>
        {visitedDoctors.length === 0 ? (
          <p className="text-sm text-muted-foreground">No doctor visits added</p>
        ) : (
          <div className="space-y-2">
            {visitedDoctors.map(doc => {
              if (!doc) return null;
              const visit = data.visits[doc.id];
              const isOpen = openCards[doc.id] || false;
              return (
                <Collapsible key={doc.id} open={isOpen} onOpenChange={() => toggleCard(doc.id)}>
                  <CollapsibleTrigger className="w-full">
                    <div className="flex items-center gap-3 rounded-xl bg-card p-3 shadow-sm text-left w-full active:scale-[0.98] transition-transform">
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{doc.full_name}</p>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                          {visit.chemistName && <span>{visit.chemistName}</span>}
                          {visit.productsPromoted.length > 0 && (
                            <span>• {visit.productsPromoted.length} products</span>
                          )}
                          {visit.competitors.some(c => c.brandName.trim()) && (
                            <span>• {visit.competitors.filter(c => c.brandName.trim()).length} competitors</span>
                          )}
                        </div>
                      </div>
                      <ChevronDown className={cn(
                        'h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200',
                        isOpen && 'rotate-180'
                      )} />
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="px-3 pb-3 pt-1 ml-8 space-y-2">
                      {visit.productsPromoted.length > 0 && (
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Products Promoted</p>
                          <div className="flex flex-wrap gap-1">
                            {visit.productsPromoted.map(pid => (
                              <Badge key={pid} className="text-[10px] bg-primary/10 text-primary border-0 hover:bg-primary/10">
                                {productName(pid)}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {visit.competitors.some(c => c.brandName.trim()) && (
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Competitors</p>
                          {visit.competitors.filter(c => c.brandName.trim()).map((c, i) => (
                            <p key={i} className="text-xs text-foreground">{c.brandName} — {c.quantity} units</p>
                          ))}
                        </div>
                      )}
                      {visit.monthlySupport.some(m => m.productId) && (
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Monthly Support</p>
                          {visit.monthlySupport.filter(m => m.productId).map((ms, i) => (
                            <p key={i} className="text-xs text-foreground">{productName(ms.productId)} — {ms.quantity} units</p>
                          ))}
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </div>
        )}
      </div>

      <div className="fixed bottom-20 left-0 right-0 px-4 pb-3 pt-2 bg-background/95 backdrop-blur-sm border-t border-border">
        <div className="flex gap-3 max-w-lg mx-auto">
          <Button variant="outline" onClick={onBack} disabled={isSubmitting} className="flex-1 touch-target rounded-lg">Back</Button>
          <Button
            onClick={() => setShowConfirm(true)}
            disabled={isSubmitting}
            className="flex-1 touch-target rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
          >
            {isSubmitting ? 'Submitting…' : 'Submit Report'}
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        title="Submit Report?"
        description="Are you sure you want to submit? You cannot edit after submission."
        onConfirm={handleSubmit}
        confirmLabel="Submit"
        confirmDisabled={isSubmitting}
      />
    </div>
  );
}
