import { useEffect, useRef, useSyncExternalStore } from 'react'
import {
  acknowledgeVisitingCardIntake,
  getVisitingCardIntakeSnapshot,
  runVisitingCardIntake,
  subscribeVisitingCardIntake,
} from '@/lib/visitingCardIntakeStore'
import type { VisitingCardIntake } from '@/lib/visitingCard'

export function useVisitingCardIntake() {
  const snap = useSyncExternalStore(subscribeVisitingCardIntake, getVisitingCardIntakeSnapshot)
  return {
    start: runVisitingCardIntake,
    parsing: snap.phase === 'parsing' || snap.phase === 'working',
    statusMessage: snap.message,
    completed: snap.completed,
    acknowledge: acknowledgeVisitingCardIntake,
  }
}

/** Apply a finished scan even if the camera remounted this screen. */
export function useApplyVisitingCardResult(onResult: (intake: VisitingCardIntake) => void) {
  const { completed, acknowledge } = useVisitingCardIntake()
  const onResultRef = useRef(onResult)
  onResultRef.current = onResult

  useEffect(() => {
    if (!completed) return
    onResultRef.current(completed)
    acknowledge()
  }, [completed, acknowledge])
}
