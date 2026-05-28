import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import AnalyticsDonutPie from '@/components/charts/AnalyticsDonutPie'
import { analyticsTooltipContent, barTooltipCursor } from '@/components/charts/analyticsChartTheme'
import { formatDisplayDate } from '@/lib/dateUtils'

type CountRow = { name: string; count: number }
type VisitRow = { name: string; visits: number }
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

      <div className="md:grid md:grid-cols-2 md:gap-5 lg:gap-6 space-y-5 md:space-y-0">
        {productData.length > 0 && (
          <div className="rounded-xl bg-card p-4 md:p-5 shadow-sm animate-fade-in">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Product-wise Promotions
            </p>
            <div className="h-52 md:h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={productData} layout="vertical" margin={{ left: 0, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={80} />
                  <Tooltip {...analyticsTooltipContent} cursor={barTooltipCursor} />
                  <Bar dataKey="count" fill="hsl(150, 62%, 26%)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {mrData.length > 0 && (
          <div className="rounded-xl bg-card p-4 md:p-5 shadow-sm animate-fade-in">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              MR-wise Visit Count
            </p>
            <div className="h-52 md:h-56">
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
      </div>

      <div className="md:grid md:grid-cols-2 md:gap-5 lg:gap-6 space-y-5 md:space-y-0">
        {competitorData.length > 0 && (
          <div className="rounded-xl bg-card p-4 md:p-5 shadow-sm animate-fade-in">
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

        <div className="rounded-xl bg-card p-4 md:p-5 shadow-sm animate-fade-in">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Expense Overview ({monthLabel || 'month'})
        </p>
        <p className="text-sm">
          Allotted: {expenseTotals.allotted.toFixed(0)} | Used: {expenseTotals.used.toFixed(0)} | Balance:{' '}
          {(expenseTotals.allotted - expenseTotals.used).toFixed(0)}
        </p>
        {expenseByCategory.length > 0 && (
          <div className="mt-3">
            <AnalyticsDonutPie
              data={expenseByCategory.map(row => ({
                key: row.name,
                label: row.name,
                value: row.amount,
              }))}
              valueLabel="Amount"
              maxHeightPx={220}
            />
          </div>
        )}
        </div>
      </div>
    </>
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
