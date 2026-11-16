import LoadingSpinner from '@/components/shared/LoadingSpinner'
import type { useVisitingCardIntake } from '@/hooks/useVisitingCardIntake'

type Intake = ReturnType<typeof useVisitingCardIntake>

export default function VisitingCardIntakeOverlay({ intake }: { intake: Intake }) {
  if (!intake.parsing) return null

  return (
    <div className="fixed inset-0 z-[300] bg-background/90 flex flex-col items-center justify-center gap-3 px-6">
      <LoadingSpinner />
      <p className="text-sm font-semibold text-foreground text-center">
        {intake.statusMessage || 'Working…'}
      </p>
      {intake.statusMessage === 'Reading visiting card…' && (
        <p className="text-xs text-muted-foreground text-center">
          Keep the app open. Check the preview before sending for approval.
        </p>
      )}
    </div>
  )
}
