import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { analyticsTooltipContent, barTooltipCursor } from '@/components/charts/analyticsChartTheme'
import { formatDisplayDate } from '@/lib/dateUtils'

type CountRow = { name: string; count: number }
type VisitRow = { name: string; visits: number }
type AreaRow = { area: string; qty: number }
type CompetitorIntelRow = { area: string; brand: string; month: string; qty: number }
type ExpenseCategoryRow = { name: string; amount: number }

export type ManagerAnalyticsOverviewChartsProps = {
  fromDate: string
  toDate: string
  totalVisits: number
  uniqueDoctors: number
  productData: CountRow[]
  mrData: VisitRow[]
  competitorData: CountRow[]
  maxCompetitor: number
  monthLabel: string
  expenseTotals: { allotted: number; used: number }
  expenseByCategory: ExpenseCategoryRow[]
}

export function ManagerAnalyticsOverviewCharts({
  fromDate,
  toDate,
  totalVisits,
  uniqueDoctors,
  productData,
  mrData,
  competitorData,
  maxCompetitor,
  monthLabel,
  expenseTotals,
  expenseByCategory,
}: ManagerAnalyticsOverviewChartsProps) {
  return (
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
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Product-wise Promotions
          </p>
          <div className="overflow-x-auto -mx-2">
            <div className="min-w-[340px] h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={productData} layout="vertical" margin={{ left: 0, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={75} />
                  <Tooltip {...analyticsTooltipContent} cursor={barTooltipCursor} />
                  <Bar dataKey="count" fill="hsl(150, 62%, 26%)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {mrData.length > 0 && (
        <div className="rounded-xl bg-card p-4 shadow-sm animate-fade-in">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            MR-wise Visit Count
          </p>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mrData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip {...analyticsTooltipContent} cursor={barTooltipCursor} />
                <Bar dataKey="visits" fill="hsl(37, 90%, 55%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {competitorData.length > 0 && (
        <div className="rounded-xl bg-card p-4 shadow-sm animate-fade-in">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Top Competitor Brands
          </p>
          <div className="space-y-2.5">
            {competitorData.map((c, i) => (
              <div key={c.brand} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground font-medium">
                    {i + 1}. {c.brand}
                  </span>
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

      <div className="rounded-xl bg-card p-4 shadow-sm animate-fade-in">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Expense Overview ({monthLabel || 'month'})
        </p>
        <p className="text-sm">
          Allotted: {expenseTotals.allotted.toFixed(0)} | Used: {expenseTotals.used.toFixed(0)} | Balance:{' '}
          {(expenseTotals.allotted - expenseTotals.used).toFixed(0)}
        </p>
        {expenseByCategory.length > 0 && (
          <div className="h-44 mt-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={expenseByCategory}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip {...analyticsTooltipContent} cursor={barTooltipCursor} />
                <Bar dataKey="amount" fill="hsl(210, 80%, 55%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </>
  )
}

export function ManagerAnalyticsAreaChart({ areaPerformance }: { areaPerformance: AreaRow[] }) {
  return (
    <div className="min-w-[340px] h-64 overflow-x-auto">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={areaPerformance} layout="vertical" margin={{ left: 0, right: 16 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 11 }} />
          <YAxis dataKey="area" type="category" tick={{ fontSize: 10 }} width={85} />
          <Tooltip {...analyticsTooltipContent} cursor={barTooltipCursor} />
          <Bar dataKey="qty" fill="hsl(210, 90%, 45%)" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function ManagerAnalyticsIntelChart({
  competitorIntel,
}: {
  competitorIntel: CompetitorIntelRow[]
}) {
  return (
    <div className="min-w-[340px] h-64 overflow-x-auto">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={competitorIntel.slice(0, 20)}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="brand" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip
            {...analyticsTooltipContent}
            cursor={barTooltipCursor}
            formatter={(value, _name, props) => {
              const payload = props?.payload as CompetitorIntelRow | undefined
              return [value, `${payload?.area ?? ''} (${payload?.month || 'N/A'})`]
            }}
          />
          <Bar dataKey="qty" fill="hsl(6, 80%, 58%)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
