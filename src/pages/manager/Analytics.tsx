import { useState, useMemo } from 'react';
import { Users } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import BottomNav from '@/components/shared/BottomNav';
import EmptyState from '@/components/shared/EmptyState';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { Button } from '@/components/ui/button';
import TeamFieldCallsChart from '@/components/charts/TeamFieldCallsChart';
import ChartStatsSplit from '@/components/charts/ChartStatsSplit';
import LazySpecialityBarChart from '@/components/charts/LazySpecialityBarChart';
import { rollupSpecialityRows } from '@/lib/chartRollup';
import { AnalyticsDateRangePicker } from '@/components/analytics/analytics-date-range-picker';
import LazySpecialityPieChart from '@/components/charts/LazySpecialityPieChart';
import {
  LazyDoctorLoyaltyCharts,
  LazyManagerAnalyticsIntelChart,
  LazyManagerAnalyticsOverviewCharts,
  LazyTerritoryPerformanceCharts,
} from '@/components/charts/LazyManagerAnalyticsRecharts';
import { useManagerExpenseOverview } from '@/hooks/useManagerExpenseOverview';
import { useAuth } from '@/hooks/useAuth';
import { useManagerMrs } from '@/hooks/useManagerTeam';
import { useManagerAnalytics, type ManagerAnalyticsTab } from '@/hooks/useManagerAnalytics';
import {
  useCallsAndSpecialityAnalytics,
  useCallsRangeComparison,
  type PeriodPreset,
} from '@/hooks/useFieldActivityAnalytics';
import { buildDayComparisonChart, percentChange } from '@/lib/analyticsPeriodCompare';
import { todayInputDate } from '@/lib/dateUtils';
import { cn } from '@/lib/utils';
import { dashboardPageClass, dashboardPanelClass } from '@/components/dashboard/dashboard-shell';

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
  const [rangePreset, setRangePreset] = useState<'weekly' | 'monthly' | 'yearly' | 'custom'>('monthly');
  const [fromDate, setFromDate] = useState(defaults.from);
  const [toDate, setToDate] = useState(defaults.to);
  const [run, setRun] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'area' | 'loyalty' | 'intel' | 'calls'>('overview');
  const [teamCallPreset, setTeamCallPreset] = useState<PeriodPreset>('monthly');
  const [loyaltyProduct, setLoyaltyProduct] = useState('');
  const [loyaltyArea, setLoyaltyArea] = useState('');

  const { data: mrs = [], isLoading: mrsLoading } = useManagerMrs(user?.id ?? '');
  const mrIds = useMemo(() => mrs.map(m => m.id), [mrs]);
  const effectiveMrIds = useMemo(() => {
    const ids = new Set(mrIds)
    if (includeSelf && user?.id) ids.add(user.id)
    return Array.from(ids)
  }, [mrIds, includeSelf, user?.id])

  const analyticsTab: ManagerAnalyticsTab | null =
    activeTab === 'calls' ? null : activeTab

  const { data: teamCallsOnly, isLoading: teamCallsLoading } = useCallsAndSpecialityAnalytics(
    mrIds,
    teamCallPreset,
    todayInputDate(),
    activeTab === 'calls' && mrIds.length > 0,
  );

  const { data: charts, isLoading: chartsLoading, isError } = useManagerAnalytics(
    effectiveMrIds,
    fromDate,
    toDate,
    run && analyticsTab !== null,
    analyticsTab ?? 'overview',
  );

  const { data: rangeComparison } = useCallsRangeComparison(
    effectiveMrIds,
    fromDate,
    toDate,
    run && activeTab === 'overview' && effectiveMrIds.length > 0,
  );

  const teamComparisonChart = useMemo(
    () =>
      buildDayComparisonChart(
        rangeComparison?.current.byDay ?? [],
        rangeComparison?.previous.byDay ?? [],
      ),
    [rangeComparison?.current.byDay, rangeComparison?.previous.byDay],
  );
  const teamCallsChange = useMemo(
    () =>
      percentChange(
        rangeComparison?.current.totalCalls ?? 0,
        rangeComparison?.previous.totalCalls ?? 0,
      ),
    [rangeComparison?.current.totalCalls, rangeComparison?.previous.totalCalls],
  );

  const productData = charts?.productPromotions ?? [];
  const mrData = charts?.mrVisits ?? [];
  const competitorData = charts?.competitorBrands ?? [];
  const areaPerformance = charts?.areaPerformance ?? [];
  const areaMonthlyTrend = charts?.areaMonthlyTrend ?? [];
  const doctorLoyalty = charts?.doctorLoyalty ?? [];
  const competitorIntel = charts?.competitorIntel ?? [];
  const maxCompetitor = competitorData.length
    ? Math.max(...competitorData.map(c => c.count), 1)
    : 1;

  const totalVisits = charts?.totalVisits ?? 0;
  const uniqueDoctors = charts?.uniqueDoctorVisits ?? 0;

  const hasAnyChart =
    productData.length > 0 || mrData.length > 0 || competitorData.length > 0 || areaPerformance.length > 0 || doctorLoyalty.length > 0 || competitorIntel.length > 0;

  const monthLabel = toDate ? toDate.slice(0, 7) : ''
  const { data: expenseOverview } = useManagerExpenseOverview(
    effectiveMrIds,
    monthLabel ? `${monthLabel}-01` : '',
    run && activeTab === 'overview' && !!monthLabel && effectiveMrIds.length > 0,
  )
  const expenseTotals = expenseOverview?.totals ?? { allotted: 0, used: 0 }
  const expenseByCategory = expenseOverview?.byCategory ?? []

  const loyaltyProducts = useMemo(
    () => Array.from(new Set(doctorLoyalty.map(d => d.product_name).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
    [doctorLoyalty],
  )
  const loyaltyAreas = useMemo(
    () => Array.from(new Set(doctorLoyalty.map(d => d.area).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
    [doctorLoyalty],
  )
  const teamSpecialityChart = useMemo(
    () => rollupSpecialityRows(teamCallsOnly?.bySpeciality ?? [], 8),
    [teamCallsOnly?.bySpeciality],
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

      <div className={dashboardPageClass('py-4 space-y-4 md:space-y-5')}>
        <AnalyticsDateRangePicker
          fromDate={fromDate}
          toDate={toDate}
          preset={rangePreset}
          onPresetChange={preset => {
            setRangePreset(preset)
            if (preset !== 'custom') setRun(true)
          }}
          onRangeChange={(from, to) => {
            setFromDate(from)
            setToDate(to)
            setRun(false)
          }}
        />

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

        {run && activeTab === 'overview' && effectiveMrIds.length > 0 && !chartsLoading && (
          <TeamFieldCallsChart
            title="Team field calls"
            icon={<Users className="h-5 w-5" />}
            mainValue={String(rangeComparison?.current.totalCalls ?? totalVisits)}
            changeValue={teamCallsChange}
            chartData={teamComparisonChart}
          />
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 md:gap-3">
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
          <div className={cn(dashboardPanelClass(), 'p-4 md:p-5 space-y-4 animate-fade-in')}>
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <p className="text-sm font-semibold text-foreground">Team call volume</p>
              <div className="flex flex-wrap gap-1">
                {(['weekly', 'monthly', 'yearly'] as const).map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setTeamCallPreset(p)}
                    className={cn(
                      'text-[10px] px-2 py-1 rounded-lg font-semibold border transition capitalize',
                      teamCallPreset === p ? 'bg-primary text-primary-foreground border-primary' : 'border-border bg-background text-muted-foreground',
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            {mrIds.length === 0 ? (
              <EmptyState message="No medical representatives are assigned to you yet." />
            ) : teamCallsLoading ? (
              <LoadingSpinner />
            ) : (
              <>
                <ChartStatsSplit
                  chart={
                    teamSpecialityChart.length > 0 ? (
                      <LazySpecialityBarChart data={teamSpecialityChart} heightPx={200} />
                    ) : (
                      <p className="text-xs text-muted-foreground py-8 text-center">No calls in this period.</p>
                    )
                  }
                  stats={
                    <>
                      <div className="rounded-lg bg-muted/40 px-3 py-2.5 flex-1 sm:w-full">
                        <p className="text-[10px] text-muted-foreground">Total calls</p>
                        <p className="text-xl font-bold tabular-nums">{teamCallsOnly?.totalCalls ?? 0}</p>
                      </div>
                      <div className="rounded-lg bg-primary/5 border border-primary/15 px-3 py-2.5 flex-1 sm:w-full">
                        <p className="text-[10px] text-muted-foreground">Avg / active day</p>
                        <p className="text-xl font-bold text-primary tabular-nums">
                          {teamCallsOnly && teamCallsOnly.daysWithReports > 0
                            ? teamCallsOnly.avgPerDay.toFixed(1)
                            : '—'}
                        </p>
                      </div>
                    </>
                  }
                />
                {teamSpecialityChart.length > 0 && (
                  <div className="border-t border-border/60 pt-3 space-y-1 max-h-36 overflow-y-auto">
                    {teamSpecialityChart.map(row => (
                      <div key={row.speciality} className="flex justify-between gap-2 text-xs">
                        <span className="text-muted-foreground truncate">{row.speciality}</span>
                        <span className="font-semibold tabular-nums shrink-0">{row.visits}</span>
                      </div>
                    ))}
                  </div>
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
          <div className="animate-fade-in">
            {areaPerformance.length === 0 && areaMonthlyTrend.length === 0 ? (
              <EmptyState message="No territory performance data for selected period" />
            ) : (
              <LazyTerritoryPerformanceCharts
                areaPerformance={areaPerformance}
                areaMonthlyTrend={areaMonthlyTrend}
              />
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
              <LazyDoctorLoyaltyCharts rows={filteredDoctorLoyalty} />
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
