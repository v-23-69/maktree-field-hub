import { Camera, ImagePlus, PenLine } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ENTRY_SOURCE_LABEL, type DoctorEntrySource } from '@/lib/visitingCard'

const ICON = {
  manual: PenLine,
  camera: Camera,
  upload: ImagePlus,
} as const

export default function DoctorEntrySourceBadge({
  source,
  className,
}: {
  source: DoctorEntrySource
  className?: string
}) {
  const Icon = ICON[source]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 text-[10px] font-semibold rounded-md px-1.5 py-0.5',
        source === 'manual' && 'bg-muted text-muted-foreground',
        source === 'camera' && 'bg-sky-500/15 text-sky-800 dark:text-sky-200',
        source === 'upload' && 'bg-violet-500/15 text-violet-800 dark:text-violet-200',
        className,
      )}
    >
      <Icon className="h-3 w-3" />
      {ENTRY_SOURCE_LABEL[source]}
    </span>
  )
}
