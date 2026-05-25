import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import PageHeader from '@/components/shared/PageHeader';
import BottomNav from '@/components/shared/BottomNav';
import EmptyState from '@/components/shared/EmptyState';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import LazySpecialityPieChart from '@/components/charts/LazySpecialityPieChart';
import {
  LazyManagerAnalyticsAreaChart,
  LazyManagerAnalyticsIntelChart,
  LazyManagerAnalyticsOverviewCharts,
} from '@/components/charts/LazyManagerAnalyticsRecharts';
import { useAuth } from '@/hooks/useAuth';
import { useManagerMrs } from '@/hooks/useManagerTeam';
import { useManagerAnalytics } from '@/hooks/useManagerAnalytics';
import { useCallsAndSpecialityAnalytics, type PeriodPreset } from '@/hooks/useFieldActivityAnalytics';
import { formatDisplayDate, todayInputDate } from '@/lib/dateUtils';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

function defaultMonthRange(): { from: string; to: string } {
  const today = new Date()
  const y = today.getFullYear()
  const m = String(today.getMonth() + 1).padStart(2, '0')
  const d = String(today.getDate()).padStart(2, '0')
  const to = `${y}-${m}-${d}`
  const from = `${y}-${m}-01`
  return { from, to }
}

export default function ManagerAnalytics() {
  const { user } = useAuth();
  const defaults = useMemo(() => defaultMonthRange(), []);
  const [includeSelf, setIncludeSelf] = useState(true);
  const [rangePreset, setRangePreset] = useState<'daily' | 'weekly' | 'monthly' | 'custom'>('monthly');
  const [fromDate, setFromDate] = useState(defaults.from);
  const [toDate, setToDate] = useState(defaults.to);
  const [run, setRun] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'area' | 'loyalty' | 'intel' | 'calls'>('overview');
  const [teamCallPreset, setTeamCallPreset] = useState<PeriodPreset>('monthly');
  const [loyaltyProduct, setLoyaltyProduct] = useState('');
  const [loyaltyArea, setLoyaltyArea] = useState('');

  const { data: mrs = [], isLoading: mrsLoading } = useManagerMrs(user?.id ?? '');
  const mrIds = useMemo(() => mrs.map(m => m.id), [mrs]);
  const { data: teamCallsOnly, isLoading: teamCallsLoading } = useCallsAndSpecialityAnalytics(
    mrIds,
    teamCallPreset,
    todayInputDate(),
    mrIds.length > 0,
  );
  const effectiveMrIds = useMemo(() => {
    const ids = new Set(mrIds)
    if (includeSelf && user?.id) ids.add(user.id)
    return Array.from(ids)
  }, [mrIds, includeSelf, user?.id])

  const { data: charts, isLoading: chartsLoading, isError } = useManagerAnalytics(
    effectiveMrIds,
    fromDate,
    toDate,
    run,
  );

  const productData = charts?.productPromotions ?? [];
  const mrData = charts?.mrVisits ?? [];
  const competitorData = charts?.competitorBrands ?? [];
  const areaPerformance = charts?.areaPerformance ?? [];
  const doctorLoyalty = charts?.doctorLoyalty ?? [];
  const competitorIntel = charts?.competitorIntel ?? [];
  const maxCompetitor = competitorData.length
    ? Math.max(...competitorData.map(c => c.count), 1)
    : 1;

  const totalVisits = charts?.totalVisits ?? 0;
  const uniqueDoctors = charts?.uniqueDoctorVisits ?? 0;

  const hasAnyChart =
    productData.length > 0 || mrData.length > 0 || competitorData.length > 0 || areaPerformance.length > 0 || doctorLoyalty.length > 0 || competitorIntel.length > 0;

  const applyPreset = (preset: 'daily' | 'weekly' | 'monthly' | 'custom') => {
    setRangePreset(preset)
    if (preset === 'custom') return
    const today = new Date()
    const y = today.getFullYear()
    const m = String(today.getMonth() + 1).padStart(2, '0')
    const d = String(today.getDate()).padStart(2, '0')
    const to = `${y}-${m}-${d}`
    let from = to
    if (preset === 'weekly') {
      const start = new Date(today)
      start.setDate(today.getDate() - 6)
      from = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`
    }
    if (preset === 'monthly') {
      from = `${y}-${m}-01`
    }
    setFromDate(from)
    setToDate(to)
    setRun(true)
  }

  const monthLabel = toDate ? toDate.slice(0, 7) : ''
  const { data: expenseSummaryRows = [] } = useQuery({
    queryKey: ['manager-expense-summary-overview', effectiveMrIds, monthLabel, run],
    enabled: run && !!monthLabel && effectiveMrIds.length > 0 && !!supabase,
    queryFn: async () => {
      if (!supabase) return []
      const { data, error } = await supabase
        .from('v_expense_monthly_summary')
        .select('mr_id, month, total_allotted, total_used')
        .in('mr_id', effectiveMrIds)
        .eq('month', `${monthLabel}-01`)
      if (error) throw error
      return data ?? []
    },
  })
  const { data: expenseByCategoryRows = [] } = useQuery({
    queryKey: ['manager-expense-category-overview', effectiveMrIds, monthLabel, run],
    enabled: run && !!monthLabel && effectiveMrIds.length > 0 && !!supabase,
    queryFn: async () => {
      if (!supabase) return []
      const { data, error } = await supabase
        .from('v_expense_by_category')
        .select('mr_id, month, category, total_amount')
        .in('mr_id', effectiveMrIds)
        .eq('month', `${monthLabel}-01`)
      if (error) throw error
      return data ?? []
    },
  })
  const expenseTotals = useMemo(() => {
    return expenseSummaryRows.reduce(
      (acc: { allotted: number; used: number }, row: any) => {
        acc.allotted += Number(row.total_allotted ?? 0)
        acc.used += Number(row.total_used ?? 0)
        return acc
      },
      { allotted: 0, used: 0 },
    )
  }, [expenseSummaryRows])
  const expenseByCategory = useMemo(() => {
    const m = new Map<string, number>()
    for (const row of expenseByCategoryRows as any[]) {
      const key = String(row.category ?? 'Other')
      m.set(key, (m.get(key) ?? 0) + Number(row.total_amount ?? 0))
    }
    return Array.from(m.entries()).map(([name, amount]) => ({ name, amount }))
  }, [expenseByCategoryRows])

  const loyaltyProducts = useMemo(
    () => Array.from(new Set(doctorLoyalty.map(d => d.product_name).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
    [doctorLoyalty],
  )
  const loyaltyAreas = useMemo(
    () => Array.from(new Set(doctorLoyalty.map(d => d.area).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
    [doctorLoyalty],
  )
  const filteredDoctorLoyalty = useMemo(
    () =>
      doctorLoyalty.filter(d =>
        (!loyaltyProduct || d.product_name === loyaltyProduct) &&
        (!loyaltyArea || d.area === loyaltyArea),
      ),
    [doctorLoyalty, loyaltyProduct, loyaltyArea],
  )

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader title="Analytics" />

      <div className="px-4 md:px-6 py-4 space-y-4 max-w-2xl lg:max-w-5xl mx-auto">
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

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <Button type="button" variant={rangePreset === 'daily' ? 'default' : 'outline'} className="h-9 text-xs" onClick={() => applyPreset('daily')}>Daily</Button>
          <Button type="button" variant={rangePreset === 'weekly' ? 'default' : 'outline'} className="h-9 text-xs" onClick={() => applyPreset('weekly')}>Weekly</Button>
          <Button type="button" variant={rangePreset === 'monthly' ? 'default' : 'outline'} className="h-9 text-xs" onClick={() => applyPreset('monthly')}>Monthly</Button>
          <Button type="button" variant={rangePreset === 'custom' ? 'default' : 'outline'} className="h-9 text-xs" onClick={() => applyPreset('custom')}>Custom</Button>
        </div>

        <label className="flex items-center gap-2 rounded-xl border bg-card px-3 py-2 text-xs">
          <input type="checkbox" checked={includeSelf} onChange={e => setIncludeSelf(e.target.checked)} />
          Include self data with MR team
        </label>

        <Button
          onClick={() => setRun(true)}
          disabled={!fromDate || !toDate || effectiveMrIds.length === 0 || (run && chartsLoading)}
          className="w-full touch-target rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
        >
          {run && chartsLoading ? 'Loading…' : 'Generate Report'}
        </Button>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          <Button type="button" variant={activeTab === 'overview' ? 'default' : 'outline'} className="text-xs h-9 px-2" onClick={() => setActiveTab('overview')}>Overview</Button>
          <Button type="button" variant={activeTab === 'area' ? 'default' : 'outline'} className="text-xs h-9 px-2" onClick={() => setActiveTab('area')}>Territory Performance</Button>
          <Button type="button" variant={activeTab === 'loyalty' ? 'default' : 'outline'} className="text-xs h-9 px-2" onClick={() => setActiveTab('loyalty')}>Doctor Loyalty</Button>
          <Button type="button" variant={activeTab === 'intel' ? 'default' : 'outline'} className="text-xs h-9 px-2" onClick={() => setActiveTab('intel')}>Competitor Intel</Button>
          <Button type="button" variant={activeTab === 'calls' ? 'default' : 'outline'} className="text-xs h-9 px-2" onClick={() => setActiveTab('calls')}>Team calls</Button>
        </div>

        {mrsLoading && <LoadingSpinner />}
        {!mrsLoading && effectiveMrIds.length === 0 && activeTab !== 'calls' && (
          <EmptyState message="No medical representatives are assigned to you yet." />
        )}

        {activeTab === 'calls' && (
          <div className="rounded-xl border bg-card p-4 shadow-sm space-y-4 animate-fade-in">
            <p className="text-xs text-muted-foreground">
              MR team only: one doctor selected on a submitted field DCR counts as one call. Manager field reports are not included.
            </p>
            <div className="flex flex-wrap gap-1 justify-end">
              {(['daily', 'weekly', 'monthly', 'all'] as const).map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setTeamCallPreset(p)}
                  className={cn(
                    'text-[10px] px-2 py-1 rounded-lg font-semibold border transition',
                    teamCallPreset === p ? 'bg-primary text-primary-foreground border-primary' : 'border-border bg-background text-muted-foreground',
                  )}
                >
                  {p === 'all' ? 'Till date' : p}
                </button>
              ))}
            </div>
            {mrIds.length === 0 ? (
              <EmptyState message="No medical representatives are assigned to you yet." />
            ) : teamCallsLoading ? (
              <LoadingSpinner />
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-muted/50 px-3 py-2">
                    <p className="text-[10px] text-muted-foreground font-medium">Total calls</p>
                    <p className="text-xl font-bold tabular-nums">{teamCallsOnly?.totalCalls ?? 0}</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 px-3 py-2">
                    <p className="text-[10px] text-muted-foreground font-medium">Average / active day</p>
                    <p className="text-xl font-bold text-primary tabular-nums">
                      {teamCallsOnly && teamCallsOnly.daysWithReports > 0 ? teamCallsOnly.avgPerDay.toFixed(1) : '—'}
                    </p>
                  </div>
                </div>
                {teamCallsOnly && teamCallsOnly.bySpeciality.length > 0 ? (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Visits by speciality</p>
                    <LazySpecialityPieChart
                      data={teamCallsOnly.bySpeciality}
                      heightPx={240}
                      outerRadius={80}
                      showSliceLabels
                      legendFontSize={11}
                    />
                  </div>
                ) : (
                  <EmptyState message="No submitted field DCR visits in this period yet." />
                )}
              </>
            )}
          </div>
        )}

        {run && chartsLoading && <LoadingSpinner />}
        {run && isError && (
          <p className="text-sm text-destructive text-center py-4">
            Could not load analytics. Ensure database views exist (v_monthly_support_summary, v_competitor_summary, v_visit_detail).
          </p>
        )}
        {run && !chartsLoading && !isError && !hasAnyChart && effectiveMrIds.length > 0 && (
          <EmptyState message="No data for selected period" />
        )}

        {run && !chartsLoading && !isError && hasAnyChart && activeTab === 'overview' && (
          <LazyManagerAnalyticsOverviewCharts
            fromDate={fromDate}
            toDate={toDate}
            totalVisits={totalVisits}
            uniqueDoctors={uniqueDoctors}
            productData={productData}
            mrData={mrData}
            competitorData={competitorData}
            maxCompetitor={maxCompetitor}
            monthLabel={monthLabel}
            expenseTotals={expenseTotals}
            expenseByCategory={expenseByCategory}
          />
        )}

        {run && !chartsLoading && !isError && activeTab === 'area' && (
          <div className="rounded-xl bg-card p-4 shadow-sm animate-fade-in">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Territory Ranking by Quantity
            </p>
            {areaPerformance.length === 0 ? (
              <EmptyState message="No territory performance data for selected period" />
            ) : (
              <LazyManagerAnalyticsAreaChart areaPerformance={areaPerformance} />
            )}
          </div>
        )}

        {run && !chartsLoading && !isError && activeTab === 'loyalty' && (
          <div className="rounded-xl bg-card p-4 shadow-sm animate-fade-in space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Doctor Loyalty
            </p>

            <div className="grid grid-cols-2 gap-2">
              <select
                value={loyaltyProduct}
                onChange={e => setLoyaltyProduct(e.target.value)}
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-xs"
              >
                <option value="">All Products</option>
                {loyaltyProducts.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <select
                value={loyaltyArea}
                onChange={e => setLoyaltyArea(e.target.value)}
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-xs"
              >
                <option value="">All Territories</option>
                {loyaltyAreas.map(a => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>

            {filteredDoctorLoyalty.length === 0 ? (
              <EmptyState message="No doctor loyalty data matches selected filters." />
            ) : (
              <div className="space-y-2">
                {filteredDoctorLoyalty.map((row, idx) => (
                  <div key={`${row.doctor_name}-${row.product_name}-${idx}`} className="rounded-lg border border-border bg-background p-3">
                    <p className="text-sm font-medium text-foreground">{row.doctor_name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {row.product_name} | {row.area || 'Territory'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Months written: {row.months_written} | Total qty: {row.total_qty}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {run && !chartsLoading && !isError && activeTab === 'intel' && (
          <div className="rounded-xl bg-card p-4 shadow-sm animate-fade-in">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Competitor Intelligence
            </p>
            {competitorIntel.length === 0 ? (
              <EmptyState message="No competitor intelligence data available." />
            ) : (
              <LazyManagerAnalyticsIntelChart competitorIntel={competitorIntel} />
            )}
          </div>
        )}
      </div>

      <BottomNav role="manager" />
    </div>
  );
}
