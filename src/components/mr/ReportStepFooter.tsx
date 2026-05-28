import { Button } from '@/components/ui/button'

export interface ReportStepFooterProps {
  onBack?: () => void
  onNext?: () => void
  backLabel?: string
  nextLabel?: string
  nextDisabled?: boolean
  showBack?: boolean
  /** Pin to bottom of wizard shell (not fixed over content). */
  docked?: boolean
}

export default function ReportStepFooter({
  onBack,
  onNext,
  backLabel = 'Back',
  nextLabel = 'Next',
  nextDisabled = false,
  showBack = true,
  docked = false,
}: ReportStepFooterProps) {
  const buttons = (
    <div className="flex gap-3 max-w-lg md:max-w-2xl lg:max-w-3xl mx-auto w-full">
      {showBack && onBack && (
        <Button variant="outline" onClick={onBack} className="flex-1 touch-target rounded-lg min-h-11">
          {backLabel}
        </Button>
      )}
      {onNext && (
        <Button
          onClick={onNext}
          disabled={nextDisabled}
          className="flex-1 touch-target rounded-lg min-h-11 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold border border-primary/60 shadow-sm"
        >
          {nextLabel}
        </Button>
      )}
    </div>
  )

  if (docked) {
    return (
      <>
        <div className="w-full shrink-0 h-20" aria-hidden />
        <div className="fixed left-0 right-0 bottom-0 z-50 border-t border-border bg-background/95 backdrop-blur-md px-4 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-4px_24px_-8px_rgba(0,0,0,0.12)]">
          {buttons}
        </div>
      </>
    )
  }

  return (
    <>
      <div className="w-full shrink-0 h-20" aria-hidden />
      <div
        className="fixed left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-md px-4 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-4px_24px_-8px_rgba(0,0,0,0.12)]"
        style={{ bottom: 'calc(4.25rem + env(safe-area-inset-bottom, 0px))' }}
      >
        {buttons}
      </div>
    </>
  )
}
