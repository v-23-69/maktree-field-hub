import LoadingSpinner from '@/components/shared/LoadingSpinner'
import EmptyState from '@/components/shared/EmptyState'
import PerformanceMetricsGrid from '@/components/performance/PerformanceMetricsGrid'
import { useMrPerformanceMetrics } from '@/hooks/usePerformance'

interface Props {
  mrId: string
}

export default function TeamMrAnalyticsTab({ mrId }: Props) {
  const { data: perf, isLoading, isError } = useMrPerformanceMetrics(mrId)

  return (
    <div className="space-y-4 animate-fade-in">
      <p className="text-sm text-muted-foreground">
        Performance counts for this MR (current calendar month).
      </p>

      {isLoading && <LoadingSpinner />}
      {isError && (
        <EmptyState message="Could not load performance metrics for this MR." />
      )}
      {!isLoading && perf && <PerformanceMetricsGrid metrics={perf} />}
    </div>
  )
}
