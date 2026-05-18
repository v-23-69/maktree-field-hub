import { Button } from '@/components/ui/button'

interface Props {
  onBack?: () => void
  onNext?: () => void
  backLabel?: string
  nextLabel?: string
  nextDisabled?: boolean
  showBack?: boolean
}

/** Fixed footer for DCR wizard steps — sits above bottom nav with safe-area padding. */
export default function ReportStepFooter({
  onBack,
  onNext,
  backLabel = 'Back',
  nextLabel = 'Next',
  nextDisabled = false,
  showBack = true,
}: Props) {
  return (
    <div
      className="fixed left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-md px-4 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
      style={{ bottom: 'calc(4.25rem + env(safe-area-inset-bottom, 0px))' }}
    >
      <div className="flex gap-3 max-w-lg mx-auto">
        {showBack && onBack && (
          <Button variant="outline" onClick={onBack} className="flex-1 touch-target rounded-lg">
            {backLabel}
          </Button>
        )}
        {onNext && (
          <Button
            onClick={onNext}
            disabled={nextDisabled}
            className="flex-1 touch-target rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
          >
            {nextLabel}
          </Button>
        )}
      </div>
    </div>
  )
}
