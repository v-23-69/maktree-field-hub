import { useState } from 'react';
import PageHeader from '@/components/shared/PageHeader';
import BottomNav from '@/components/shared/BottomNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const PRODUCT_DATA = [
  { name: 'Maktree-D3', count: 45 },
  { name: 'CalciMax', count: 38 },
  { name: 'IronBoost', count: 32 },
  { name: 'GastroEase', count: 28 },
  { name: 'NeuroVit', count: 22 },
  { name: 'CardioShield', count: 18 },
  { name: 'DermaGlow', count: 15 },
  { name: 'RespiClear', count: 12 },
  { name: 'FlexiJoint', count: 8 },
];

const MR_DATA = [
  { name: 'Rajesh K.', visits: 48 },
  { name: 'Priya S.', visits: 42 },
  { name: 'Amit P.', visits: 35 },
];

const COMPETITOR_DATA = [
  { brand: 'Shelcal 500', count: 24 },
  { brand: 'Celin 500', count: 18 },
  { brand: 'Becosules', count: 15 },
  { brand: 'Zincovit', count: 12 },
  { brand: 'Dolo 650', count: 9 },
];

export default function ManagerAnalytics() {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [showResults, setShowResults] = useState(false);

  return (
    <div className="min-h-screen bg-background pb-20">
      <PageHeader title="Analytics" />

      <div className="px-4 py-4 space-y-4">
        <div className="rounded-xl bg-card p-4 shadow-sm space-y-3 animate-fade-in-up">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">From</Label>
              <Input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="rounded-lg text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">To</Label>
              <Input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="rounded-lg text-sm" />
            </div>
          </div>
          <Button
            onClick={() => setShowResults(true)}
            disabled={!fromDate || !toDate}
            className="w-full touch-target rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
          >
            Generate Report
          </Button>
        </div>

        {showResults && (
          <>
            <div className="rounded-xl bg-card p-4 shadow-sm animate-fade-in-up">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Total Doctor Visits</p>
              <p className="text-3xl font-bold text-foreground">125</p>
            </div>

            <div className="rounded-xl bg-card p-4 shadow-sm animate-fade-in-up">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Product-wise Promotions</p>
              <div className="overflow-x-auto -mx-2">
                <div className="min-w-[340px] h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={PRODUCT_DATA} layout="vertical" margin={{ left: 0, right: 16 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={70} />
                      <Tooltip />
                      <Bar dataKey="count" fill="hsl(150, 62%, 26%)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-card p-4 shadow-sm animate-fade-in-up">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Top Competitor Brands</p>
              <div className="space-y-2">
                {COMPETITOR_DATA.map((c, i) => (
                  <div key={c.brand} className="flex items-center justify-between text-sm">
                    <span className="text-foreground">{i + 1}. {c.brand}</span>
                    <span className="font-medium text-muted-foreground">{c.count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl bg-card p-4 shadow-sm animate-fade-in-up">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">MR-wise Visit Count</p>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={MR_DATA}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="visits" fill="hsl(37, 90%, 55%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}
      </div>

      <BottomNav role="manager" />
    </div>
  );
}
