import { toast } from 'sonner'
import { captureVisitingCardPhoto } from '@/lib/visitingCardCapture'
import { parseVisitingCard } from '@/lib/parseVisitingCard'
import type { DoctorEntrySource, VisitingCardIntake } from '@/lib/visitingCard'

export type CaptureKind = Exclude<DoctorEntrySource, 'manual'>

export type VisitingCardIntakeState = {
  phase: 'idle' | 'working' | 'parsing' | 'ready'
  message: string
  completed: VisitingCardIntake | null
}

const idle: VisitingCardIntakeState = { phase: 'idle', message: '', completed: null }

let state: VisitingCardIntakeState = idle
let running = false
const listeners = new Set<() => void>()

function emit(next: VisitingCardIntakeState) {
  state = next
  listeners.forEach(listener => listener())
}

export function subscribeVisitingCardIntake(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function getVisitingCardIntakeSnapshot(): VisitingCardIntakeState {
  return state
}

function sleep(ms: number) {
  return new Promise<void>(resolve => setTimeout(resolve, ms))
}

/** Front photo, then back photo immediately. Cancel on the second shot = front only. Survives camera remount. */
export async function runVisitingCardIntake(kind: CaptureKind): Promise<void> {
  if (running) return
  running = true
  emit({
    phase: 'working',
    message: kind === 'camera' ? 'Opening camera…' : 'Opening gallery…',
    completed: null,
  })

  try {
    const front = await captureVisitingCardPhoto(kind, 'front')
    if (!front) {
      emit(idle)
      return
    }

    toast.message(
      kind === 'camera'
        ? 'Now capture the back. Tap Cancel if the back is blank.'
        : 'Now pick the back photo. Tap Cancel if the back is blank.',
    )
    emit({
      phase: 'working',
      message: kind === 'camera' ? 'Opening camera for the back…' : 'Pick the back of the card…',
      completed: null,
    })
    await sleep(650)

    const back = await captureVisitingCardPhoto(kind, 'back')
    const images = back ? [front, back] : [front]

    emit({ phase: 'parsing', message: 'Reading visiting card…', completed: null })
    const completed = await parseVisitingCard({ source: kind, images })
    emit({ phase: 'ready', message: '', completed })
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'Could not read the visiting card.')
    emit(idle)
  } finally {
    running = false
  }
}

export function acknowledgeVisitingCardIntake() {
  emit(idle)
}
