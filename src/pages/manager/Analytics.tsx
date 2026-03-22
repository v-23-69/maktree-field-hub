import { useState } from 'react';
import PageHeader from '@/components/shared/PageHeader';
import BottomNav from '@/components/shared/BottomNav';
import EmptyState from '@/components/shared/EmptyState';
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

const maxCompetitor = Math.max(...COMPETITOR_DATA.map(c => c.count));

export default function ManagerAnalytics() {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [showResults, setShowResults] = useState(false);

  const totalVisits = MR_DATA.reduce((s, m) => s + m.visits, 0);
  const totalDoctors = 18;

  return (
    <div className="min-h-screen bg-background pb-20">
      <PageHeader title="Analytics" />

      <div className="px-4 py-4 space-y-4">
        {/* Date range cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-card p-3 shadow-sm space-y-1.5">
            <Label className="text-xs text-muted-foreground">From</Label>
            <Input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="rounded-lg text-sm h-10" />
          </div>
          <div className="rounded-xl bg-card p-3 shadow-sm space-y-1.5">
            <Label className="text-xs text-muted-foreground">To</Label>
            <Input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="rounded-lg text-sm h-10" />
          </div>
        </div>

        <Button
          onClick={() => setShowResults(true)}
          disabled={!fromDate || !toDate}
          className="w-full touch-target rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
        >
          Generate Report
        </Button>

        {showResults && (
          <>
            {/* Summary banner */}
            <div className="rounded-xl bg-primary/10 border border-primary/20 p-4 animate-fade-in">
              <p className="text-sm font-semibold text-primary">
                {totalVisits} visits across {totalDoctors} doctors
              </p>
              <p className="text-xs text-primary/70 mt-0.5">
                {new Date(fromDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} — {new Date(toDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>

            {/* Product promotions - horizontal bar */}
            <div className="rounded-xl bg-card p-4 shadow-sm animate-fade-in">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Product-wise Promotions</p>
              <div className="overflow-x-auto -mx-2">
                <div className="min-w-[340px] h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={PRODUCT_DATA} layout="vertical" margin={{ left: 0, right: 16 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={75} />
                      <Tooltip />
                      <Bar dataKey="count" fill="hsl(150, 62%, 26%)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* MR comparison - grouped bar */}
            <div className="rounded-xl bg-card p-4 shadow-sm animate-fade-in">
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

            {/* Competitor brands - ranked list */}
            <div className="rounded-xl bg-card p-4 shadow-sm animate-fade-in">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Top Competitor Brands</p>
              <div className="space-y-2.5">
                {COMPETITOR_DATA.map((c, i) => (
                  <div key={c.brand} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-foreground font-medium">{i + 1}. {c.brand}</span>
                      <span className="text-xs font-semibold text-muted-foreground">{c.count}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-destructive/60 transition-all"
                        style={{ width: `${(c.count / maxCompetitor) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      <BottomNav role="manager" />
    </div>
  );
}
