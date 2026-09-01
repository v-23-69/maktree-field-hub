import PageLoadingState from '@/components/shared/PageLoadingState'

type LoadingSpinnerProps = {
  fullScreen?: boolean
  compact?: boolean
  showLogo?: boolean
  message?: string
  className?: string
}

/** Branded loading state — Maktree logo + friendly status text. */
export default function LoadingSpinner({
  fullScreen = false,
  compact = false,
  showLogo = true,
  message,
  className,
}: LoadingSpinnerProps = {}) {
  return (
    <PageLoadingState
      fullScreen={fullScreen}
      compact={compact}
      showLogo={showLogo}
      message={message}
      className={className}
    />
  )
}
