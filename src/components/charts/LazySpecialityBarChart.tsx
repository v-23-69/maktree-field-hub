import { lazy, Suspense } from 'react'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import type { SpecialityBarChartProps } from '@/components/charts/SpecialityBarChart'

const SpecialityBarChart = lazy(() => import('@/components/charts/SpecialityBarChart'))

export default function LazySpecialityBarChart(props: SpecialityBarChartProps) {
  const heightPx = props.heightPx ?? 240
  return (
    <Suspense
      fallback={
        <div className="flex w-full items-center justify-center" style={{ height: heightPx }} aria-hidden>
          <LoadingSpinner />
        </div>
      }
    >
      <SpecialityBarChart {...props} />
    </Suspense>
  )
}
