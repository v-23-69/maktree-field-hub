import { lazy, Suspense } from 'react'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import type { ManagerAnalyticsOverviewChartsProps } from '@/components/charts/ManagerAnalyticsRecharts'

const OverviewCharts = lazy(async () => {
  const mod = await import('@/components/charts/ManagerAnalyticsRecharts')
  return { default: mod.ManagerAnalyticsOverviewCharts }
})

const TerritoryCharts = lazy(async () => {
  const mod = await import('@/components/charts/TerritoryPerformanceCharts')
  return { default: mod.default }
})

const LoyaltyCharts = lazy(async () => {
  const mod = await import('@/components/charts/DoctorLoyaltyCharts')
  return { default: mod.default }
})

const IntelChart = lazy(async () => {
  const mod = await import('@/components/charts/ManagerAnalyticsRecharts')
  return { default: mod.ManagerAnalyticsIntelChart }
})

function ChartFallback({ heightPx = 176 }: { heightPx?: number }) {
  return (
    <div className="flex items-center justify-center w-full" style={{ height: heightPx }} aria-hidden>
      <LoadingSpinner />
    </div>
  )
}

export function LazyManagerAnalyticsOverviewCharts(props: ManagerAnalyticsOverviewChartsProps) {
  return (
    <Suspense fallback={<ChartFallback heightPx={320} />}>
      <OverviewCharts {...props} />
    </Suspense>
  )
}

export function LazyTerritoryPerformanceCharts(props: {
  areaPerformance: { area: string; qty: number }[]
  areaMonthlyTrend: { month: string; label: string; qty: number }[]
}) {
  return (
    <Suspense fallback={<ChartFallback heightPx={320} />}>
      <TerritoryCharts {...props} />
    </Suspense>
  )
}

export function LazyDoctorLoyaltyCharts(props: {
  rows: import('@/components/charts/DoctorLoyaltyCharts').DoctorLoyaltyRow[]
}) {
  return (
    <Suspense fallback={<ChartFallback heightPx={320} />}>
      <LoyaltyCharts {...props} />
    </Suspense>
  )
}

export function LazyManagerAnalyticsIntelChart(props: {
  competitorIntel: { area: string; brand: string; month: string; qty: number }[]
}) {
  return (
    <Suspense fallback={<ChartFallback heightPx={256} />}>
      <IntelChart {...props} />
    </Suspense>
  )
}
