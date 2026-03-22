import { useState } from 'react';
import PageHeader from '@/components/shared/PageHeader';
import BottomNav from '@/components/shared/BottomNav';
import EmptyState from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MOCK_USERS } from '@/lib/mock-data';
import { Download } from 'lucide-react';

export default function ManagerReports() {
  const [selectedMr, setSelectedMr] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [showReport, setShowReport] = useState(false);

  const mrs = MOCK_USERS.filter(u => u.role === 'mr' && u.is_active);

  return (
    <div className="min-h-screen bg-background pb-20">
      <PageHeader title="MR Reports" />

      <div className="px-4 py-4 space-y-4">
        <div className="space-y-3 rounded-xl bg-card p-4 shadow-sm animate-fade-in-up">
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
          <div className="rounded-xl bg-card p-4 shadow-sm space-y-4 animate-fade-in-up">
            <h3 className="font-semibold text-foreground">Report for {selectedDate}</h3>
            <div className="text-sm text-muted-foreground space-y-2">
              <p><span className="font-medium text-foreground">Areas:</span> North Delhi — Rohini, Pitampura</p>
              <p><span className="font-medium text-foreground">Doctors Visited:</span> 3</p>

              <div className="border-t border-border pt-3 space-y-3">
                {['Dr. Anand Mehta', 'Dr. Kavita Joshi', 'Dr. Ramesh Gupta'].map(doc => (
                  <div key={doc} className="rounded-lg bg-background p-3">
                    <p className="font-medium text-foreground text-sm">{doc}</p>
                    <p className="text-xs text-muted-foreground mt-1">Products: Maktree-D3, CalciMax Plus</p>
                    <p className="text-xs text-muted-foreground">Chemist: MedPlus Pharmacy</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 touch-target rounded-lg text-xs">
                <Download className="h-4 w-4 mr-1" /> PDF
              </Button>
              <Button variant="outline" className="flex-1 touch-target rounded-lg text-xs">
                <Download className="h-4 w-4 mr-1" /> Excel
              </Button>
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
