import { Camera, ImagePlus, PenLine } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { isNativeApp } from '@/lib/capacitor'
import { cn } from '@/lib/utils'

type Props = {
  disabled?: boolean
  onManual: () => void
  onCamera: () => void
  onUpload: () => void
  className?: string
  /** Compact 3-button row used on the area footer. */
  variant?: 'footer' | 'inline'
}

export default function VisitingCardIntakeControls({
  disabled,
  onManual,
  onCamera,
  onUpload,
  className,
  variant = 'footer',
}: Props) {
  if (!isNativeApp()) {
    return (
      <Button
        type="button"
        className={cn('w-full h-11 rounded-xl font-semibold touch-manipulation', className)}
        disabled={disabled}
        onClick={onManual}
      >
        <PenLine className="h-4 w-4 mr-2" />
        Add doctor to this area
      </Button>
    )
  }

  const btn =
    variant === 'footer'
      ? 'h-11 rounded-xl text-xs font-semibold touch-manipulation'
      : 'h-10 rounded-xl text-xs font-semibold touch-manipulation'

  return (
    <div className={cn('space-y-2', className)}>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-0.5">
        Add doctor
      </p>
      <div className="grid grid-cols-3 gap-2">
        <Button type="button" variant="outline" className={btn} disabled={disabled} onClick={onManual}>
          <PenLine className="h-3.5 w-3.5 mr-1" />
          Manual
        </Button>
        <Button type="button" className={btn} disabled={disabled} onClick={onCamera}>
          <Camera className="h-3.5 w-3.5 mr-1" />
          Camera
        </Button>
        <Button type="button" variant="secondary" className={btn} disabled={disabled} onClick={onUpload}>
          <ImagePlus className="h-3.5 w-3.5 mr-1" />
          Upload
        </Button>
      </div>
    </div>
  )
}

export function VisitingCardOcrButtons({
  disabled,
  onCamera,
  onUpload,
}: {
  disabled?: boolean
  onCamera: () => void
  onUpload: () => void
}) {
  if (!isNativeApp()) return null
  return (
    <div className="grid grid-cols-2 gap-2">
      <Button type="button" className="h-10 rounded-xl text-xs font-semibold" disabled={disabled} onClick={onCamera}>
        <Camera className="h-3.5 w-3.5 mr-1.5" />
        Scan card
      </Button>
      <Button type="button" variant="secondary" className="h-10 rounded-xl text-xs font-semibold" disabled={disabled} onClick={onUpload}>
        <ImagePlus className="h-3.5 w-3.5 mr-1.5" />
        Upload card
      </Button>
    </div>
  )
}
