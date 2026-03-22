import { useState } from 'react';
import PageHeader from '@/components/shared/PageHeader';
import BottomNav from '@/components/shared/BottomNav';
import EmptyState from '@/components/shared/EmptyState';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { MOCK_USERS, MOCK_DOCTORS, MOCK_SUB_AREAS, PRODUCTS } from '@/lib/mock-data';
import { Download, FileSpreadsheet, ChevronDown, Pill, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

// Mock report data for display
const MOCK_REPORT_DETAIL = {
  workingWith: 'Sunita Verma',
  status: 'submitted' as const,
  doctors: [
    {
      id: '1', name: 'Dr. Anand Mehta', speciality: 'General Physician', subArea: 'Rohini',
      chemist: 'MedPlus Pharmacy',
      products: ['Maktree-D3', 'CalciMax Plus', 'IronBoost'],
      competitors: [{ brand: 'Shelcal 500', qty: 12 }, { brand: 'Celin 500', qty: 8 }],
      monthlySupport: [{ product: 'Maktree-D3', qty: 5 }, { product: 'IronBoost', qty: 3 }],
    },
    {
      id: '2', name: 'Dr. Kavita Joshi', speciality: 'Orthopedic', subArea: 'Rohini',
      chemist: 'Apollo Pharmacy',
      products: ['FlexiJoint', 'CalciMax Plus'],
      competitors: [{ brand: 'Shelcal HD', qty: 6 }],
      monthlySupport: [{ product: 'FlexiJoint', qty: 10 }],
    },
    {
      id: '3', name: 'Dr. Ramesh Gupta', speciality: 'Cardiologist', subArea: 'Pitampura',
      chemist: 'Jan Aushadhi',
      products: ['CardioShield', 'NeuroVit B12'],
      competitors: [],
      monthlySupport: [],
    },
  ],
};

export default function ManagerReports() {
  const [selectedMr, setSelectedMr] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [showReport, setShowReport] = useState(false);
  const [openCards, setOpenCards] = useState<Record<string, boolean>>({});

  const mrs = MOCK_USERS.filter(u => u.role === 'mr' && u.is_active);
  const mrUser = MOCK_USERS.find(u => u.id === selectedMr);

  const toggleCard = (id: string) => setOpenCards(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="min-h-screen bg-background pb-20">
      <PageHeader title="MR Reports" />

      <div className="px-4 py-4 space-y-4">
        <div className="space-y-3 rounded-xl bg-card p-4 shadow-sm animate-fade-in">
          <div className="space-y-2">
            <Label className="text-xs">Select MR</Label>
            <select
              value={selectedMr}
              onChange={e => setSelectedMr(e.target.value)}
              className="flex h-11 w-full rounded-lg border border-input bg-background px-3 text-sm touch-target"
            >
              <option value="">Choose MR</option>
              {mrs.map(m => <option key={m.id} value={m.id}>{m.full_name} ({m.employee_code})</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Select Date</Label>
            <Input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="touch-target rounded-lg" />
          </div>

          <Button
            onClick={() => setShowReport(true)}
            disabled={!selectedMr || !selectedDate}
            className="w-full touch-target rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
          >
            View Report
          </Button>
        </div>

        {showReport ? (
          <div className="space-y-4 animate-fade-in">
            {/* Download buttons */}
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 touch-target rounded-lg text-sm font-semibold border-primary/30 text-primary">
                <Download className="h-4 w-4 mr-1.5" /> Download PDF
              </Button>
              <Button variant="outline" className="flex-1 touch-target rounded-lg text-sm font-semibold border-accent/50 text-accent-foreground">
                <FileSpreadsheet className="h-4 w-4 mr-1.5" /> Download Excel
              </Button>
            </div>

            {/* Report header card */}
            <div className="rounded-xl bg-card p-4 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-foreground">{mrUser?.full_name}</p>
                  <p className="text-xs text-muted-foreground">{mrUser?.employee_code}</p>
                </div>
                <Badge className="bg-primary/10 text-primary border-0 hover:bg-primary/10 text-xs">
                  {MOCK_REPORT_DETAIL.status === 'submitted' ? 'Submitted' : 'Draft'}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1 border-t border-border">
                <span>{new Date(selectedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                <span>Working with: {MOCK_REPORT_DETAIL.workingWith}</span>
              </div>
            </div>

            {/* Doctor visit cards */}
            <div>
              <p className="text-sm font-medium text-foreground mb-3">Doctor Visits ({MOCK_REPORT_DETAIL.doctors.length})</p>
              <div className="space-y-2">
                {MOCK_REPORT_DETAIL.doctors.map(doc => (
                  <Collapsible key={doc.id} open={openCards[doc.id] || false} onOpenChange={() => toggleCard(doc.id)}>
                    <CollapsibleTrigger className="w-full">
                      <div className="flex items-center gap-3 rounded-xl bg-card p-3.5 shadow-sm text-left w-full active:scale-[0.98] transition-transform">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-foreground truncate">{doc.name}</p>
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0">{doc.subArea}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{doc.speciality}</p>
                        </div>
                        <ChevronDown className={cn(
                          'h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200',
                          openCards[doc.id] && 'rotate-180'
                        )} />
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="mx-1 rounded-b-xl bg-card px-3.5 pb-3.5 space-y-3 border-t border-border">
                        {/* Chemist */}
                        <div className="flex items-center gap-2 pt-2.5">
                          <Pill className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">Chemist:</span>
                          <span className="text-xs font-medium text-foreground">{doc.chemist}</span>
                        </div>

                        {/* Products */}
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5">Products Promoted</p>
                          <div className="flex flex-wrap gap-1">
                            {doc.products.map(p => (
                              <Badge key={p} className="text-[10px] bg-primary/10 text-primary border-0 hover:bg-primary/10">{p}</Badge>
                            ))}
                          </div>
                        </div>

                        {/* Competitors table */}
                        {doc.competitors.length > 0 && (
                          <div>
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5">Competitor Survey</p>
                            <div className="rounded-lg border border-border overflow-hidden">
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="bg-muted/50">
                                    <th className="text-left px-3 py-1.5 font-medium text-muted-foreground">Brand</th>
                                    <th className="text-right px-3 py-1.5 font-medium text-muted-foreground">Qty</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {doc.competitors.map((c, i) => (
                                    <tr key={i} className={i % 2 === 1 ? 'bg-muted/30' : ''}>
                                      <td className="px-3 py-1.5 text-foreground">{c.brand}</td>
                                      <td className="px-3 py-1.5 text-right text-foreground">{c.qty}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        {/* Monthly support table */}
                        {doc.monthlySupport.length > 0 && (
                          <div>
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5">Monthly Support</p>
                            <div className="rounded-lg border border-border overflow-hidden">
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="bg-muted/50">
                                    <th className="text-left px-3 py-1.5 font-medium text-muted-foreground">Product</th>
                                    <th className="text-right px-3 py-1.5 font-medium text-muted-foreground">Qty</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {doc.monthlySupport.map((ms, i) => (
                                    <tr key={i} className={i % 2 === 1 ? 'bg-muted/30' : ''}>
                                      <td className="px-3 py-1.5 text-foreground">{ms.product}</td>
                                      <td className="px-3 py-1.5 text-right text-foreground">{ms.qty}</td>
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
                ))}
              </div>
            </div>
          </div>
        ) : (
          <EmptyState message="Select an MR and date to view their report" />
        )}
      </div>

      <BottomNav role="manager" />
    </div>
  );
}
