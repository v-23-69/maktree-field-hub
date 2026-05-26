import { lazy, Suspense } from 'react'
import LoadingSpinner from '@/components/shared/LoadingSpinner'

const MrCallsDayChart = lazy(() => import('@/components/charts/MrCallsDayChart'))

export default function LazyMrCallsDayChart(props: { data: { date: string; calls: number }[] }) {
  return (
    <Suspense
      fallback={
        <div className="flex h-[220px] w-full items-center justify-center" aria-hidden>
          <LoadingSpinner />
        </div>
      }
    >
      <MrCallsDayChart {...props} />
    </Suspense>
  )
}
