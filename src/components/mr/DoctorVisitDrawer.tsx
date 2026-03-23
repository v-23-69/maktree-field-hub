import { useState, useEffect } from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Doctor, Product } from '@/types/database.types';
import type { VisitFormEntry } from '@/pages/mr/NewReport';
import { useChemistsByDoctor } from '@/hooks/useDoctors';
import { toast } from 'sonner';

const defaultCompetitors = (): { brandName: string; quantity: number }[] => [
  { brandName: '', quantity: 0 },
];
const defaultMonthly = (): { productId: string; quantity: number }[] => [
  { productId: '', quantity: 0 },
];

interface Props {
  open: boolean;
  onClose: () => void;
  doctorId: string | null;
  subAreaId: string;
  doctor: Doctor | null;
  products: Product[];
  existingVisit?: VisitFormEntry;
  onSave: (doctorId: string, subAreaId: string, visit: VisitFormEntry) => void;
}

export default function DoctorVisitDrawer({
  open,
  onClose,
  doctorId,
  subAreaId,
  doctor,
  products,
  existingVisit,
  onSave,
}: Props) {
  const [productsPromoted, setProductsPromoted] = useState<string[]>([]);
  const [chemistName, setChemistName] = useState('');
  const [competitors, setCompetitors] = useState(defaultCompetitors);
  const [monthlySupport, setMonthlySupport] = useState(defaultMonthly);

  const { data: linkedChemists = [] } = useChemistsByDoctor(doctorId ?? '');

  useEffect(() => {
    if (existingVisit) {
      setProductsPromoted(existingVisit.productsPromoted);
      setChemistName(existingVisit.chemistName);
      setCompetitors(
        existingVisit.competitors?.length
          ? existingVisit.competitors
          : defaultCompetitors(),
      );
      setMonthlySupport(
        existingVisit.monthlySupport?.length
          ? existingVisit.monthlySupport
          : defaultMonthly(),
      );
    } else {
      setProductsPromoted([]);
      setChemistName('');
      setCompetitors(defaultCompetitors());
      setMonthlySupport(defaultMonthly());
    }
  }, [existingVisit, doctorId, open]);

  if (!doctor || !doctorId) return null;

  const toggleProduct = (id: string) => {
    setProductsPromoted(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id],
    );
  };

  const q = chemistName.trim().toLowerCase();
  const suggestChemists = (
    q
      ? linkedChemists.filter(c => c.name.toLowerCase().includes(q))
      : linkedChemists
  ).slice(0, 10);

  const handleSave = () => {
    if (productsPromoted.length < 1) {
      toast.error('Select at least one product promoted');
      return;
    }
    onSave(doctorId, subAreaId, {
      doctorId,
      subAreaId,
      productsPromoted,
      chemistName,
      competitors,
      monthlySupport,
    });
    toast.success('Visit saved ✓');
  };

  return (
    <Drawer open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DrawerContent className="!mt-0 flex h-[100dvh] max-h-[100dvh] flex-col rounded-t-[10px] border bg-background p-0 gap-0">
        <DrawerHeader className="shrink-0 border-b border-border px-4 pb-3 pt-2">
          <DrawerTitle className="text-base break-words">{doctor.full_name}</DrawerTitle>
          <p className="text-xs text-muted-foreground">{doctor.speciality}</p>
        </DrawerHeader>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4 space-y-5">
          <div>
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Products Promoted
            </Label>
            <p className="text-[11px] text-muted-foreground mt-0.5 mb-2">Select at least one</p>
            <div className="grid grid-cols-2 gap-2 min-w-0">
              {products.map(p => {
                const on = productsPromoted.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => toggleProduct(p.id)}
                    className={cn(
                      'min-w-0 rounded-lg px-2 py-2.5 text-left text-xs font-medium leading-snug border-2 transition-all duration-150 active:scale-95 break-words hyphens-auto',
                      on
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-card text-foreground border-border hover:border-emerald-600/50',
                    )}
                  >
                    {p.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Chemist Name
            </Label>
            <Input
              value={chemistName}
              onChange={e => setChemistName(e.target.value)}
              placeholder="Type or pick a suggestion"
              className="mt-2 touch-target rounded-lg"
              autoComplete="off"
            />
            {suggestChemists.length > 0 && (
              <div className="mt-1.5 rounded-lg border border-border bg-muted/30 overflow-hidden">
                {suggestChemists.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setChemistName(c.name)}
                    className="w-full text-left px-3 py-2.5 text-sm text-foreground hover:bg-muted/80 border-b border-border last:border-0"
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Competitor Survey
            </Label>
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
                    min={0}
                    value={c.quantity || ''}
                    onChange={e => {
                      const next = [...competitors];
                      next[i] = {
                        ...next[i],
                        quantity: parseInt(e.target.value, 10) || 0,
                      };
                      setCompetitors(next);
                    }}
                    placeholder="Qty"
                    className="w-16 rounded-lg text-sm h-9"
                  />
                  {competitors.length > 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        setCompetitors(competitors.filter((_, j) => j !== i))
                      }
                      className="text-destructive p-1.5 shrink-0"
                      aria-label="Remove row"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() =>
                  setCompetitors([...competitors, { brandName: '', quantity: 0 }])
                }
                className="w-full rounded-lg text-xs"
              >
                <Plus className="h-3.5 w-3.5 mr-1" /> Add Competitor
              </Button>
            </div>
          </div>

          <div>
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Monthly Support
            </Label>
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
                    {products.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <Input
                    type="number"
                    min={0}
                    value={ms.quantity || ''}
                    onChange={e => {
                      const next = [...monthlySupport];
                      next[i] = {
                        ...next[i],
                        quantity: parseInt(e.target.value, 10) || 0,
                      };
                      setMonthlySupport(next);
                    }}
                    placeholder="Qty"
                    className="w-16 rounded-lg text-sm h-9"
                  />
                  {monthlySupport.length > 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        setMonthlySupport(monthlySupport.filter((_, j) => j !== i))
                      }
                      className="text-destructive p-1.5 shrink-0"
                      aria-label="Remove row"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() =>
                  setMonthlySupport([
                    ...monthlySupport,
                    { productId: '', quantity: 0 },
                  ])
                }
                className="w-full rounded-lg text-xs"
              >
                <Plus className="h-3.5 w-3.5 mr-1" /> Add Product
              </Button>
            </div>
          </div>
        </div>

        <div className="shrink-0 border-t border-border bg-background p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <Button
            type="button"
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
