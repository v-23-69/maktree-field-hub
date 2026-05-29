import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { LIVE_QUERY_OPTIONS } from '@/lib/liveQueryOptions'

/** Single polled query for manager pending badge (one request bundle vs five hooks). */
export function useManagerPendingRequestsCount(managerId: string): number {
  const { data = 0 } = useQuery({
    queryKey: ['manager-pending-counts', managerId],
    enabled: !!managerId && !!supabase,
    ...LIVE_QUERY_OPTIONS,
    queryFn: async (): Promise<number> => {
      if (!supabase) return 0

      const [unlockRpc, lateDcrRpc, tpDelRpc, leavesRes, docDelRes, docAddRes, mrsRpc] =
        await Promise.all([
        supabase.rpc('list_unlock_requests_for_manager'),
        supabase.rpc('list_late_dcr_fill_requests_for_manager'),
        supabase.rpc('list_tour_program_deletion_requests_for_manager'),
        supabase
          .from('leave_requests')
          .select('id', { count: 'exact', head: true })
          .eq('manager_id', managerId)
          .eq('status', 'pending'),
        supabase
          .from('doctor_deletion_requests')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending'),
        supabase
          .from('doctor_add_requests')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending'),
        supabase.rpc('list_mrs_for_manager'),
      ])

      const unlockPending = unlockRpc.error
        ? 0
        : ((unlockRpc.data ?? []) as Array<{ status?: string }>).filter(
            r => r.status === 'pending',
          ).length

      const lateDcrPending = lateDcrRpc.error
        ? 0
        : ((lateDcrRpc.data ?? []) as Array<{ status?: string }>).filter(
            r => r.status === 'pending',
          ).length

      const tpDelPending = tpDelRpc.error ? 0 : (tpDelRpc.data ?? []).length

      const leavePending = leavesRes.error ? 0 : leavesRes.count ?? 0
      const docPending = docDelRes.error ? 0 : docDelRes.count ?? 0
      const docAddPending = docAddRes.error ? 0 : docAddRes.count ?? 0

      let tpSubmitPending = 0
      if (!mrsRpc.error) {
        const mrIds = ((mrsRpc.data ?? []) as Array<{ id: string }>).map(m => m.id)
        if (mrIds.length > 0) {
          const { count, error } = await supabase
            .from('tour_programs')
            .select('id', { count: 'exact', head: true })
            .in('mr_id', mrIds)
            .eq('status', 'submitted')
          tpSubmitPending = error ? 0 : count ?? 0
        }
      }

      return (
        unlockPending +
        lateDcrPending +
        tpDelPending +
        tpSubmitPending +
        leavePending +
        docPending +
        docAddPending
      )
    },
  })

  return data
}
