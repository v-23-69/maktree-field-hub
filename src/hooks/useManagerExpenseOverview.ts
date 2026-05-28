import { useQuery } from '@tanstack/react-query'
import { fetchManagerExpenseOverview } from '@/lib/managerExpenseOverview'
import { ANALYTICS_QUERY_OPTIONS } from '@/lib/analyticsQueryOptions'

export function useManagerExpenseOverview(
  mrIds: string[],
  monthYmd: string,
  enabled: boolean,
) {
  return useQuery({
    queryKey: ['manager-expense-overview', mrIds, monthYmd],
    ...ANALYTICS_QUERY_OPTIONS,
    queryFn: () => fetchManagerExpenseOverview(mrIds, monthYmd),
    enabled: enabled && mrIds.length > 0 && !!monthYmd,
  })
}
