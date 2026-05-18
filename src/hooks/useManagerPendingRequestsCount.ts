import { useMemo } from 'react'
import { useManagerUnlockRequests } from '@/hooks/useUnlockRequests'
import { useTpDeletionRequestsForManager, useManagerPendingTourPrograms } from '@/hooks/useTourProgram'
import { useManagerLeaves } from '@/hooks/useLeaves'
import { useManagerDoctorDeletionRequests } from '@/hooks/useDoctorDeletion'

/** Total pending items a manager should review (unlock, TP, leaves, doctor removals). */
export function useManagerPendingRequestsCount(managerId: string) {
  const { data: unlockData } = useManagerUnlockRequests(managerId)
  const { data: tpDeletions = [] } = useTpDeletionRequestsForManager()
  const { data: pendingTp = [] } = useManagerPendingTourPrograms(managerId)
  const { data: leaves = [] } = useManagerLeaves(managerId)
  const { data: doctorRemovals = [] } = useManagerDoctorDeletionRequests(managerId)

  return useMemo(() => {
    const unlock = unlockData?.pending?.length ?? 0
    const tpDel = tpDeletions.length
    const tpSubmit = pendingTp.length
    const leave = leaves.filter(l => l.status === 'pending').length
    const doc = doctorRemovals.filter(r => r.status === 'pending').length
    return unlock + tpDel + tpSubmit + leave + doc
  }, [unlockData, tpDeletions, pendingTp, leaves, doctorRemovals])
}
