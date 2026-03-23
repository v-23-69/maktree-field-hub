import { useState, useMemo } from 'react';
import PageHeader from '@/components/shared/PageHeader';
import BottomNav from '@/components/shared/BottomNav';
import EmptyState from '@/components/shared/EmptyState';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useAuth } from '@/hooks/useAuth';
import { useManagerMrs } from '@/hooks/useManagerTeam';
import { useManagerReportByMrAndDate } from '@/hooks/useReport';
import type { ReportVisit } from '@/types/database.types';
import { Download, FileSpreadsheet, ChevronDown, Pill, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDisplayDate } from '@/lib/dateUtils';

export default function ManagerReports() {
  const { user } = useAuth();
  const [selectedMr, setSelectedMr] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [showReport, setShowReport] = useState(false);
  const [openCards, setOpenCards] = useState<Record<string, boolean>>({});

  const { data: mrs = [], isLoading: mrsLoading, isError: mrsError } = useManagerMrs(user?.id ?? '');
  const { data: report, isLoading: reportLoading, isError: reportError } = useManagerReportByMrAndDate(
    showReport ? selectedMr : '',
    showReport ? selectedDate : '',
  );

  const mrUser = useMemo(() => mrs.find(u => u.id === selectedMr), [mrs, selectedMr]);

  const visits: ReportVisit[] = report?.visits ?? [];
  const sortedVisits = useMemo(
    () => [...visits].sort((a, b) => {
      const na = a.doctor?.full_name ?? '';
      const nb = b.doctor?.full_name ?? '';
      return na.localeCompare(nb);
    }),
    [visits],
  );

  const toggleCard = (id: string) => setOpenCards(prev => ({ ...prev, [id]: !prev[id] }));

  const handleViewReport = () => {
    setShowReport(true);
    setOpenCards({});
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <PageHeader title="MR Reports" />

      <div className="px-4 py-4 space-y-4">
        <div className="space-y-3 rounded-xl bg-card p-4 shadow-sm animate-fade-in">
          <div className="space-y-2">
            <Label className="text-xs">Select MR</Label>
            {mrsLoading ? (
              <LoadingSpinner />
            ) : (
              <select
                value={selectedMr}
                onChange={e => { setSelectedMr(e.target.value); setShowReport(false); }}
                className="flex h-11 w-full rounded-lg border border-input bg-background px-3 text-sm touch-target"
              >
                <option value="">Choose MR</option>
                {mrs.map(m => <option key={m.id} value={m.id}>{m.full_name} ({m.employee_code})</option>)}
              </select>
            )}
            {mrsError && (
              <p className="text-xs text-destructive">Could not load MR list</p>
            )}
            {!mrsLoading && !mrsError && mrs.length === 0 && (
              <p className="text-xs text-muted-foreground">No MRs assigned to you yet.</p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Select Date</Label>
            <Input type="date" value={selectedDate} onChange={e => { setSelectedDate(e.target.value); setShowReport(false); }} className="touch-target rounded-lg" />
          </div>

          <Button
            onClick={handleViewReport}
            disabled={!selectedMr || !selectedDate}
            className="w-full touch-target rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
          >
            View Report
          </Button>
        </div>

        {showReport && selectedMr && selectedDate && (
          <>
            {reportLoading && <LoadingSpinner />}
            {reportError && (
              <p className="text-sm text-destructive text-center py-4">Could not load this report</p>
            )}
            {!reportLoading && !reportError && !report && (
              <EmptyState message="No report found for this MR on the selected date." />
            )}
            {!reportLoading && !reportError && report && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 touch-target rounded-lg text-sm font-semibold border-primary/30 text-primary" type="button">
                    <Download className="h-4 w-4 mr-1.5" /> Download PDF
                  </Button>
                  <Button variant="outline" className="flex-1 touch-target rounded-lg text-sm font-semibold border-accent/50 text-accent-foreground" type="button">
                    <FileSpreadsheet className="h-4 w-4 mr-1.5" /> Download Excel
                  </Button>
                </div>

                <div className="rounded-xl bg-card p-4 shadow-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-foreground">{mrUser?.full_name}</p>
                      <p className="text-xs text-muted-foreground">{mrUser?.employee_code}</p>
                    </div>
                    <Badge className="bg-primary/10 text-primary border-0 hover:bg-primary/10 text-xs capitalize">
                      {report.status === 'submitted' ? 'Submitted' : 'Draft'}
                    </Badge>
                  </div>
                  <div className="flex flex-col gap-1 text-xs text-muted-foreground pt-1 border-t border-border">
                    <span className="flex items-center gap-1 min-w-0">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span className="truncate">{formatDisplayDate(selectedDate)}</span>
                    </span>
                    {report.manager && (
                      <span>Working with: {(report.manager as { full_name?: string }).full_name ?? '—'}</span>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-foreground mb-3">Doctor Visits ({sortedVisits.length})</p>
                  {sortedVisits.length === 0 ? (
                    <EmptyState message="No visits recorded for this report." />
                  ) : (
                    <div className="space-y-2">
                      {sortedVisits.map(visit => {
                        const doc = visit.doctor;
                        const subName = doc?.sub_area?.name ?? '—';
                        const chemistName = visit.chemist?.name ?? '—';
                        const products =
                          (visit.promoted_products ?? [])
                            .map(pp => pp.product?.name)
                            .filter(Boolean) as string[];
                        const competitors = visit.competitor_entries ?? [];
                        const monthly = visit.monthly_support_entries ?? [];
                        const cardKey = visit.id;

                        return (
                          <Collapsible key={cardKey} open={openCards[cardKey] || false} onOpenChange={() => toggleCard(cardKey)}>
                            <CollapsibleTrigger className="w-full">
                              <div className="flex items-center gap-3 rounded-xl bg-card p-3.5 shadow-sm text-left w-full active:scale-[0.98] transition-transform">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className="text-sm font-semibold text-foreground truncate">{doc?.full_name ?? 'Doctor'}</p>
                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0">{subName}</Badge>
                                  </div>
                                  <p className="text-xs text-muted-foreground">{doc?.speciality ?? ''}</p>
                                </div>
                                <ChevronDown className={cn(
                                  'h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200',
                                  openCards[cardKey] && 'rotate-180'
                                )} />
                              </div>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <div className="mx-1 rounded-b-xl bg-card px-3.5 pb-3.5 space-y-3 border-t border-border">
                                <div className="flex items-center gap-2 pt-2.5">
                                  <Pill className="h-3.5 w-3.5 text-muted-foreground" />
                                  <span className="text-xs text-muted-foreground">Chemist:</span>
                                  <span className="text-xs font-medium text-foreground">{chemistName}</span>
                                </div>

                                {products.length > 0 && (
                                  <div>
                                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5">Products Promoted</p>
                                    <div className="flex flex-wrap gap-1">
                                      {products.map(p => (
                                        <Badge key={p} className="text-[10px] bg-primary/10 text-primary border-0 hover:bg-primary/10">{p}</Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {competitors.length > 0 && (
                                  <div>
                                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5">Competitor Survey</p>
                                    <div className="rounded-lg border border-border overflow-x-auto max-w-full">
                                      <table className="w-full text-xs min-w-[240px]">
                                        <thead>
                                          <tr className="bg-muted/50">
                                            <th className="text-left px-3 py-1.5 font-medium text-muted-foreground">Brand</th>
                                            <th className="text-right px-3 py-1.5 font-medium text-muted-foreground">Qty</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {competitors.map((c, i) => (
                                            <tr key={c.id ?? i} className={i % 2 === 1 ? 'bg-muted/30' : ''}>
                                              <td className="px-3 py-1.5 text-foreground">{c.brand_name}</td>
                                              <td className="px-3 py-1.5 text-right text-foreground">{c.quantity}</td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                )}

                                {monthly.length > 0 && (
                                  <div>
                                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5">Monthly Support</p>
                                    <div className="rounded-lg border border-border overflow-x-auto max-w-full">
                                      <table className="w-full text-xs min-w-[240px]">
                                        <thead>
                                          <tr className="bg-muted/50">
                                            <th className="text-left px-3 py-1.5 font-medium text-muted-foreground">Product</th>
                                            <th className="text-right px-3 py-1.5 font-medium text-muted-foreground">Qty</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {monthly.map((row, i) => (
                                            <tr key={row.id ?? i} className={i % 2 === 1 ? 'bg-muted/30' : ''}>
                                              <td className="px-3 py-1.5 text-foreground">{row.product?.name ?? '—'}</td>
                                              <td className="px-3 py-1.5 text-right text-foreground">{row.quantity}</td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
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
              </div>
            )}
          </>
        )}

        {!showReport && (
          <EmptyState message="Select an MR and date to view their report" />
        )}
      </div>

      <BottomNav role="manager" />
    </div>
  );
}
