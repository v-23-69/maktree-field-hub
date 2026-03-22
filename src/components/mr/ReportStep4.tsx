import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import { CheckCircle2, Calendar, Users, MapPin, ChevronDown } from 'lucide-react';
import { MOCK_USERS, MOCK_AREAS, MOCK_SUB_AREAS, MOCK_DOCTORS, PRODUCTS } from '@/lib/mock-data';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { ReportFormData } from '@/pages/mr/NewReport';

interface Props {
  data: ReportFormData;
  onBack: () => void;
  onClearDraft: () => void;
}

export default function ReportStep4({ data, onBack, onClearDraft }: Props) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [openCards, setOpenCards] = useState<Record<string, boolean>>({});
  const navigate = useNavigate();

  const manager = MOCK_USERS.find(u => u.id === data.workingWithId);
  const areas = data.selectedAreaIds.map(id => MOCK_AREAS.find(a => a.id === id)?.name).filter(Boolean);
  const subAreas = data.selectedSubAreaIds.map(id => MOCK_SUB_AREAS.find(s => s.id === id)?.name).filter(Boolean);
  const visitedDoctors = Object.keys(data.visits).map(id => MOCK_DOCTORS.find(d => d.id === id)).filter(Boolean);

  const handleSubmit = () => {
    onClearDraft();
    toast.success('Report submitted successfully!');
    navigate('/mr/dashboard');
  };

  const toggleCard = (id: string) => {
    setOpenCards(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getProductName = (id: string) => PRODUCTS.find(p => p.id === id)?.name || id;

  return (
    <div className="space-y-5 animate-fade-in pb-20">
      <h3 className="text-base font-semibold text-foreground">Review Your Report</h3>

      <div className="space-y-3">
        <div className="flex items-center gap-3 rounded-xl bg-card p-3 shadow-sm">
          <Calendar className="h-5 w-5 text-primary shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground">Date</p>
            <p className="text-sm font-medium text-foreground">{new Date(data.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
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
            <p className="text-sm font-medium text-foreground">{areas.join(', ')}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{subAreas.join(', ')}</p>
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
              const visit = data.visits[doc!.id];
              const isOpen = openCards[doc!.id] || false;
              return (
                <Collapsible key={doc!.id} open={isOpen} onOpenChange={() => toggleCard(doc!.id)}>
                  <CollapsibleTrigger className="w-full">
                    <div className="flex items-center gap-3 rounded-xl bg-card p-3 shadow-sm text-left w-full active:scale-[0.98] transition-transform">
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{doc!.name}</p>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                          {visit.chemistName && <span>{visit.chemistName}</span>}
                          {visit.productsPromoted.length > 0 && (
                            <span>• {visit.productsPromoted.length} products</span>
                          )}
                          {visit.competitors.length > 0 && (
                            <span>• {visit.competitors.length} competitors</span>
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
                                {getProductName(pid)}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {visit.competitors.length > 0 && (
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Competitors</p>
                          {visit.competitors.map((c, i) => (
                            <p key={i} className="text-xs text-foreground">{c.brandName} — {c.quantity} units</p>
                          ))}
                        </div>
                      )}
                      {visit.monthlySupport.length > 0 && (
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Monthly Support</p>
                          {visit.monthlySupport.map((ms, i) => (
                            <p key={i} className="text-xs text-foreground">{getProductName(ms.productId)} — {ms.quantity} units</p>
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
          <Button variant="outline" onClick={onBack} className="flex-1 touch-target rounded-lg">Back</Button>
          <Button
            onClick={() => setShowConfirm(true)}
            className="flex-1 touch-target rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
          >
            Submit Report
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
      />
    </div>
  );
}
