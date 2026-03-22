import { useState, useEffect } from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PRODUCTS } from '@/lib/mock-data';
import { Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Doctor } from '@/types/database.types';
import type { ReportFormData } from '@/pages/mr/NewReport';

type VisitData = ReportFormData['visits'][string];

interface Props {
  open: boolean;
  onClose: () => void;
  doctor: Doctor | null;
  existingVisit?: VisitData;
  onSave: (doctorId: string, visit: VisitData) => void;
}

export default function DoctorVisitDrawer({ open, onClose, doctor, existingVisit, onSave }: Props) {
  const [productsPromoted, setProductsPromoted] = useState<string[]>([]);
  const [chemistName, setChemistName] = useState('');
  const [competitors, setCompetitors] = useState<{ brandName: string; quantity: number }[]>([]);
  const [monthlySupport, setMonthlySupport] = useState<{ productId: string; quantity: number }[]>([]);

  useEffect(() => {
    if (existingVisit) {
      setProductsPromoted(existingVisit.productsPromoted);
      setChemistName(existingVisit.chemistName);
      setCompetitors(existingVisit.competitors);
      setMonthlySupport(existingVisit.monthlySupport);
    } else {
      setProductsPromoted([]);
      setChemistName('');
      setCompetitors([]);
      setMonthlySupport([]);
    }
  }, [existingVisit, doctor?.id]);

  if (!doctor) return null;

  const toggleProduct = (id: string) => {
    setProductsPromoted(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  };

  const handleSave = () => {
    onSave(doctor.id, { doctorId: doctor.id, productsPromoted, chemistName, competitors, monthlySupport });
  };

  return (
    <Drawer open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DrawerContent className="max-h-[90vh] flex flex-col">
        <DrawerHeader className="pb-2 shrink-0">
          <DrawerTitle className="text-base">{doctor.name}</DrawerTitle>
          <p className="text-xs text-muted-foreground">{doctor.speciality}</p>
        </DrawerHeader>

        <div className="overflow-y-auto flex-1 px-4 pb-24 space-y-5">
          {/* Products Promoted — 2-column grid */}
          <div>
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Products Promoted</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {PRODUCTS.map(p => (
                <button
                  key={p.id}
                  onClick={() => toggleProduct(p.id)}
                  className={cn(
                    'rounded-lg px-3 py-2.5 text-xs font-medium border transition-all duration-150 active:scale-95',
                    productsPromoted.includes(p.id)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-card text-primary border-primary/40'
                  )}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* Chemist Name */}
          <div>
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Chemist Name</Label>
            <Input
              value={chemistName}
              onChange={e => setChemistName(e.target.value)}
              placeholder="Enter chemist name"
              className="mt-2 touch-target rounded-lg"
            />
          </div>

          {/* Competitor Survey — card rows */}
          <div>
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Competitor Survey</Label>
            <div className="space-y-2 mt-2">
              {competitors.map((c, i) => (
                <div key={i} className="flex items-center gap-2 rounded-xl bg-muted/50 p-3">
                  <Input
                    value={c.brandName}
                    onChange={e => {
                      const next = [...competitors];
                      next[i] = { ...next[i], brandName: e.target.value };
                      setCompetitors(next);
                    }}
                    placeholder="Brand name"
                    className="flex-1 rounded-lg text-sm h-9"
                  />
                  <Input
                    type="number"
                    value={c.quantity || ''}
                    onChange={e => {
                      const next = [...competitors];
                      next[i] = { ...next[i], quantity: parseInt(e.target.value) || 0 };
                      setCompetitors(next);
                    }}
                    placeholder="Qty"
                    className="w-16 rounded-lg text-sm h-9"
                  />
                  <button onClick={() => setCompetitors(competitors.filter((_, j) => j !== i))} className="text-destructive p-1.5 shrink-0">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCompetitors([...competitors, { brandName: '', quantity: 0 }])}
                className="w-full rounded-lg text-xs"
              >
                <Plus className="h-3.5 w-3.5 mr-1" /> Add Competitor
              </Button>
            </div>
          </div>

          {/* Monthly Support — card rows */}
          <div>
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Monthly Support</Label>
            <div className="space-y-2 mt-2">
              {monthlySupport.map((ms, i) => (
                <div key={i} className="flex items-center gap-2 rounded-xl bg-muted/50 p-3">
                  <select
                    value={ms.productId}
                    onChange={e => {
                      const next = [...monthlySupport];
                      next[i] = { ...next[i], productId: e.target.value };
                      setMonthlySupport(next);
                    }}
                    className="flex-1 h-9 rounded-lg border border-input bg-card px-2 text-sm"
                  >
                    <option value="">Select product</option>
                    {PRODUCTS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  <Input
                    type="number"
                    value={ms.quantity || ''}
                    onChange={e => {
                      const next = [...monthlySupport];
                      next[i] = { ...next[i], quantity: parseInt(e.target.value) || 0 };
                      setMonthlySupport(next);
                    }}
                    placeholder="Qty"
                    className="w-16 rounded-lg text-sm h-9"
                  />
                  <button onClick={() => setMonthlySupport(monthlySupport.filter((_, j) => j !== i))} className="text-destructive p-1.5 shrink-0">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMonthlySupport([...monthlySupport, { productId: '', quantity: 0 }])}
                className="w-full rounded-lg text-xs"
              >
                <Plus className="h-3.5 w-3.5 mr-1" /> Add Product
              </Button>
            </div>
          </div>
        </div>

        {/* Fixed Save Button */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t border-border">
          <Button
            onClick={handleSave}
            className="w-full touch-target rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
          >
            Save Visit
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
