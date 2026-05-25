import { lazy, Suspense } from 'react'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import type { SpecialityPieChartProps } from '@/components/charts/SpecialityPieChart'

const SpecialityPieChart = lazy(() => import('@/components/charts/SpecialityPieChart'))

export default function LazySpecialityPieChart(props: SpecialityPieChartProps) {
  const heightPx = props.heightPx ?? 200
  return (
    <Suspense
      fallback={
        <div
          className="flex w-full items-center justify-center"
          style={{ height: heightPx }}
          aria-hidden
        >
          <LoadingSpinner />
        </div>
      }
    >
      <SpecialityPieChart {...props} />
    </Suspense>
  )
}
