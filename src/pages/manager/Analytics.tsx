import { useState, useMemo } from 'react';
import PageHeader from '@/components/shared/PageHeader';
import BottomNav from '@/components/shared/BottomNav';
import EmptyState from '@/components/shared/EmptyState';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '@/hooks/useAuth';
import { useManagerMrs } from '@/hooks/useManagerTeam';
import { useManagerAnalytics } from '@/hooks/useManagerAnalytics';
import { formatDisplayDate } from '@/lib/dateUtils';

export default function ManagerAnalytics() {
  const { user } = useAuth();
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [run, setRun] = useState(false);

  const { data: mrs = [], isLoading: mrsLoading } = useManagerMrs(user?.id ?? '');
  const mrIds = useMemo(() => mrs.map(m => m.id), [mrs]);

  const { data: charts, isLoading: chartsLoading, isError } = useManagerAnalytics(
    mrIds,
    fromDate,
    toDate,
    run,
  );

  const productData = charts?.productPromotions ?? [];
  const mrData = charts?.mrVisits ?? [];
  const competitorData = charts?.competitorBrands ?? [];
  const maxCompetitor = competitorData.length
    ? Math.max(...competitorData.map(c => c.count), 1)
    : 1;

  const totalVisits = charts?.totalVisits ?? 0;
  const uniqueDoctors = charts?.uniqueDoctorVisits ?? 0;

  const hasAnyChart =
    productData.length > 0 || mrData.length > 0 || competitorData.length > 0;

  return (
    <div className="min-h-screen bg-background pb-20">
      <PageHeader title="Analytics" />

      <div className="px-4 py-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-card p-3 shadow-sm space-y-1.5">
            <Label className="text-xs text-muted-foreground">From</Label>
            <Input type="date" value={fromDate} onChange={e => { setFromDate(e.target.value); setRun(false); }} className="rounded-lg text-sm h-10" />
          </div>
          <div className="rounded-xl bg-card p-3 shadow-sm space-y-1.5">
            <Label className="text-xs text-muted-foreground">To</Label>
            <Input type="date" value={toDate} onChange={e => { setToDate(e.target.value); setRun(false); }} className="rounded-lg text-sm h-10" />
          </div>
        </div>

        <Button
          onClick={() => setRun(true)}
          disabled={!fromDate || !toDate || mrIds.length === 0 || (run && chartsLoading)}
          className="w-full touch-target rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
        >
          {run && chartsLoading ? 'Loading…' : 'Generate Report'}
        </Button>

        {mrsLoading && <LoadingSpinner />}
        {!mrsLoading && mrIds.length === 0 && (
          <EmptyState message="No medical representatives are assigned to you yet." />
        )}

        {run && chartsLoading && <LoadingSpinner />}
        {run && isError && (
          <p className="text-sm text-destructive text-center py-4">
            Could not load analytics. Ensure database views exist (v_monthly_support_summary, v_competitor_summary, v_visit_detail).
          </p>
        )}
        {run && !chartsLoading && !isError && !hasAnyChart && mrIds.length > 0 && (
          <EmptyState message="No data for selected period" />
        )}

        {run && !chartsLoading && !isError && hasAnyChart && (
          <>
            <div className="rounded-xl bg-primary/10 border border-primary/20 p-4 animate-fade-in">
              <p className="text-sm font-semibold text-primary">
                {totalVisits} visits across {uniqueDoctors} doctor visit records
              </p>
              <p className="text-xs text-primary/70 mt-0.5">
                {formatDisplayDate(fromDate)} — {formatDisplayDate(toDate)}
              </p>
            </div>

            {productData.length > 0 && (
              <div className="rounded-xl bg-card p-4 shadow-sm animate-fade-in">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Product-wise Promotions</p>
                <div className="overflow-x-auto -mx-2">
                  <div className="min-w-[340px] h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={productData} layout="vertical" margin={{ left: 0, right: 16 }}>
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
            )}

            {mrData.length > 0 && (
              <div className="rounded-xl bg-card p-4 shadow-sm animate-fade-in">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">MR-wise Visit Count</p>
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={mrData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="visits" fill="hsl(37, 90%, 55%)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {competitorData.length > 0 && (
              <div className="rounded-xl bg-card p-4 shadow-sm animate-fade-in">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Top Competitor Brands</p>
                <div className="space-y-2.5">
                  {competitorData.map((c, i) => (
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
            )}
          </>
        )}
      </div>

      <BottomNav role="manager" />
    </div>
  );
}
