import { useState, useEffect, useMemo } from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Plus,
  Trash2,
  Check,
  Package,
  Store,
  Banknote,
  Swords,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Doctor, Product } from '@/types/database.types';
import type { VisitFormEntry } from '@/pages/mr/NewReport';
import { useChemistsByDoctor, useChemistsBySubArea } from '@/hooks/useDoctors';
import { toast } from 'sonner';
import {
  isQuantityFilled,
  parseQuantityInput,
  quantityInputDisplay,
} from '@/lib/quantityInput';

const defaultCompetitors = (): { brandName: string; quantity: number | null }[] => [
  { brandName: '', quantity: null },
];
const defaultMonthly = (): { productId: string; quantity: number | null }[] => [
  { productId: '', quantity: null },
];

const qtyInputClass =
  'w-full max-w-[5.5rem] rounded-xl text-sm h-10 text-center tabular-nums font-semibold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none';

function VisitSection({
  icon: Icon,
  title,
  hint,
  required,
  children,
}: {
  icon: React.ElementType;
  title: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="glass-card !rounded-2xl p-4 space-y-3">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0 pt-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-bold text-foreground tracking-tight">{title}</h3>
            {required && (
              <span className="text-[10px] font-semibold uppercase tracking-wide text-destructive/90 bg-destructive/10 px-1.5 py-0.5 rounded-md">
                Required
              </span>
            )}
          </div>
          {hint && (
            <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{hint}</p>
          )}
        </div>
      </div>
      {children}
    </section>
  );
}

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
  const { data: areaChemists = [] } = useChemistsBySubArea(subAreaId);

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

  const allChemists = useMemo(() => {
    const seen = new Set<string>();
    const merged = [];
    for (const c of linkedChemists) {
      if (!seen.has(c.id)) {
        seen.add(c.id);
        merged.push(c);
      }
    }
    for (const c of areaChemists) {
      if (!seen.has(c.id)) {
        seen.add(c.id);
        merged.push(c);
      }
    }
    return merged;
  }, [linkedChemists, areaChemists]);

  if (!doctor || !doctorId) return null;

  const initials = doctor.full_name
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const toggleProduct = (id: string) => {
    setProductsPromoted(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id],
    );
  };

  const q = chemistName.trim().toLowerCase();
  const suggestChemists = (
    q ? allChemists.filter(c => c.name.toLowerCase().includes(q)) : allChemists
  ).slice(0, 8);

  const handleSave = () => {
    if (productsPromoted.length < 1) {
      toast.error('Select at least one product promoted');
      return;
    }

    for (const ms of monthlySupport) {
      const hasProduct = !!ms.productId.trim();
      const hasQty = isQuantityFilled(ms.quantity);
      if (hasProduct && !hasQty) {
        toast.error('Enter quantity for each monthly support product (0 is allowed)');
        return;
      }
      if (!hasProduct && hasQty) {
        toast.error('Select a brand for each monthly support quantity');
        return;
      }
    }

    const monthlyToSave = monthlySupport.filter(
      ms => ms.productId.trim() && isQuantityFilled(ms.quantity),
    );
    if (monthlyToSave.length < 1) {
      toast.error('Add at least one monthly support line with product and quantity');
      return;
    }

    for (const c of competitors) {
      const hasBrand = !!c.brandName.trim();
      const hasQty = isQuantityFilled(c.quantity);
      if (hasBrand && !hasQty) {
        toast.error('Enter quantity for each competitor brand (0 is allowed)');
        return;
      }
      if (!hasBrand && hasQty) {
        toast.error('Enter brand name for each competitor quantity');
        return;
      }
    }

    const competitorsToSave = competitors
      .filter(c => c.brandName.trim() && isQuantityFilled(c.quantity))
      .map(c => ({ brandName: c.brandName.trim(), quantity: c.quantity as number }));

    onSave(doctorId, subAreaId, {
      doctorId,
      subAreaId,
      productsPromoted,
      chemistName,
      competitors: competitorsToSave,
      monthlySupport: monthlyToSave.map(ms => ({
        productId: ms.productId,
        quantity: ms.quantity as number,
      })),
    });
    toast.success('Visit saved');
  };

  return (
    <Drawer open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DrawerContent className="!mt-0 flex h-[100dvh] max-h-[100dvh] flex-col rounded-t-2xl border bg-background p-0 gap-0 [&>div:first-child]:hidden">
        <DrawerHeader className="shrink-0 border-b border-border/80 px-4 pb-4 pt-3 space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 ring-2 ring-primary/10">
              <span className="text-sm font-bold text-primary">{initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <DrawerTitle className="text-base font-bold text-left leading-tight break-words">
                {doctor.full_name}
              </DrawerTitle>
              <p className="text-xs text-muted-foreground mt-0.5">{doctor.speciality}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="text-[10px] font-medium text-muted-foreground bg-muted/60 rounded-full px-2.5 py-1">
              {productsPromoted.length} product{productsPromoted.length === 1 ? '' : 's'}
            </span>
            {chemistName.trim() && (
              <span className="text-[10px] font-medium text-muted-foreground bg-muted/60 rounded-full px-2.5 py-1 truncate max-w-[10rem]">
                {chemistName.trim()}
              </span>
            )}
          </div>
        </DrawerHeader>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 space-y-4">
          <VisitSection
            icon={Package}
            title="Products promoted"
            hint="Tap to select all brands you promoted on this visit."
            required
          >
            {products.length === 0 ? (
              <p className="text-xs text-muted-foreground rounded-xl bg-muted/40 px-3 py-2.5">
                No products loaded. Check your connection and try again.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2 min-w-0">
                {products.map(p => {
                  const on = productsPromoted.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => toggleProduct(p.id)}
                      className={cn(
                        'relative min-w-0 rounded-xl px-3 py-3 text-left text-xs font-semibold leading-snug border-2 transition-all duration-150 active:scale-[0.98] break-words',
                        on
                          ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                          : 'bg-card text-foreground border-border/80 hover:border-primary/40',
                      )}
                    >
                      {on && (
                        <span className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary-foreground/20">
                          <Check className="h-3 w-3" strokeWidth={3} />
                        </span>
                      )}
                      <span className="pr-5">{p.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </VisitSection>

          <VisitSection
            icon={Store}
            title="Chemist"
            hint="Type a name or pick from suggestions linked to this doctor or area."
          >
            <div className="space-y-2">
              <Input
                value={chemistName}
                onChange={e => setChemistName(e.target.value)}
                placeholder="Chemist name"
                className="h-11 rounded-xl touch-target bg-card"
                autoComplete="off"
              />
              {suggestChemists.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-0.5">
                    Suggestions
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {suggestChemists.map(c => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setChemistName(c.name)}
                        className={cn(
                          'rounded-full px-3 py-1.5 text-xs font-medium border transition-all active:scale-95',
                          chemistName === c.name
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-muted/50 text-foreground border-border hover:border-primary/40',
                        )}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </VisitSection>

          <VisitSection
            icon={Banknote}
            title="Monthly support"
            hint="Add each brand with quantity (0 is allowed). All lines must be complete before saving."
            required
          >
            <div className="space-y-3">
              {monthlySupport.map((ms, i) => {
                return (
                  <div
                    key={i}
                    className="rounded-xl border border-border/70 bg-muted/30 p-3 space-y-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        Line {i + 1}
                      </span>
                      {monthlySupport.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            setMonthlySupport(monthlySupport.filter((_, j) => j !== i))
                          }
                          className="flex items-center gap-1 text-[11px] font-medium text-destructive hover:bg-destructive/10 rounded-lg px-2 py-1 transition-colors"
                          aria-label="Remove line"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-foreground">Brand / product</Label>
                      <select
                        value={ms.productId}
                        onChange={e => {
                          const next = [...monthlySupport];
                          next[i] = { ...next[i], productId: e.target.value };
                          setMonthlySupport(next);
                        }}
                        className="flex h-11 w-full rounded-xl border border-input bg-card px-3 text-sm font-medium"
                      >
                        <option value="">Select brand</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-foreground">Quantity</Label>
                      <Input
                        type="text"
                        inputMode="numeric"
                        autoComplete="off"
                        value={quantityInputDisplay(ms.quantity)}
                        onChange={e => {
                          const next = [...monthlySupport];
                          next[i] = {
                            ...next[i],
                            quantity: parseQuantityInput(e.target.value),
                          };
                          setMonthlySupport(next);
                        }}
                        placeholder="0"
                        className={cn(qtyInputClass, 'max-w-none w-full')}
                        aria-label="Monthly support quantity"
                      />
                    </div>
                  </div>
                );
              })}

              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() =>
                  setMonthlySupport([...monthlySupport, { productId: '', quantity: null }])
                }
                className="w-full rounded-xl h-10 text-xs font-semibold border-dashed"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Add another product
              </Button>
            </div>
          </VisitSection>

          <VisitSection
            icon={Swords}
            title="Competitor survey"
            hint="Optional competitor brands and quantities seen at the chemist (0 qty allowed)."
          >
            <div className="space-y-3">
              {competitors.map((c, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-border/70 bg-muted/30 p-3 space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Competitor {i + 1}
                    </span>
                    {competitors.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setCompetitors(competitors.filter((_, j) => j !== i))}
                        className="flex items-center gap-1 text-[11px] font-medium text-destructive hover:bg-destructive/10 rounded-lg px-2 py-1"
                        aria-label="Remove competitor"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-foreground">Brand name</Label>
                    <Input
                      value={c.brandName}
                      onChange={e => {
                        const next = [...competitors];
                        next[i] = { ...next[i], brandName: e.target.value };
                        setCompetitors(next);
                      }}
                      placeholder="Competitor brand"
                      className="h-11 rounded-xl bg-card"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-foreground">Quantity</Label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      autoComplete="off"
                      value={quantityInputDisplay(c.quantity)}
                      onChange={e => {
                        const next = [...competitors];
                        next[i] = {
                          ...next[i],
                          quantity: parseQuantityInput(e.target.value),
                        };
                        setCompetitors(next);
                      }}
                      placeholder="0"
                      className={cn(qtyInputClass, 'max-w-[6rem]')}
                      aria-label="Competitor quantity"
                    />
                  </div>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() =>
                  setCompetitors([...competitors, { brandName: '', quantity: null }])
                }
                className="w-full rounded-xl h-10 text-xs font-semibold border-dashed"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Add competitor
              </Button>
            </div>
          </VisitSection>
        </div>

        <div className="shrink-0 border-t border-border/80 bg-background/95 backdrop-blur-sm px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] space-y-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="w-full h-11 rounded-xl font-medium"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            className="w-full h-12 touch-target rounded-xl font-bold text-base shadow-md"
          >
            Save visit
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
