import { useState } from 'react'
import { MapPin } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useCaptureDoctorLocation } from '@/hooks/useFieldPlan'
import { SPOT_MAX_ACCURACY_M } from '@/lib/spotWorking'
import { cn } from '@/lib/utils'

async function readFix(): Promise<{ lat: number; lng: number; accuracy: number }> {
  if (!navigator.geolocation) throw new Error('This device has no GPS')
  const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 20000,
    })
  })
  const accuracy = pos.coords.accuracy
  if (!accuracy || accuracy < 1 || accuracy > SPOT_MAX_ACCURACY_M) {
    throw new Error('GPS is too weak. Move closer to a window or the clinic entrance and try again.')
  }
  return { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy }
}

export default function CaptureLocationButton({
  doctorId,
  locked,
  compact = false,
  className,
}: {
  doctorId: string
  /** True when a location already exists and this user cannot change it. */
  locked?: boolean
  compact?: boolean
  className?: string
}) {
  const capture = useCaptureDoctorLocation()
  const [busy, setBusy] = useState(false)

  const onClick = async () => {
    if (locked) {
      toast.message('This clinic location is locked. A manager can update it.')
      return
    }
    setBusy(true)
    try {
      const fix = await readFix()
      await capture.mutateAsync({ doctorId, ...fix })
      toast.success('Clinic location saved')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not save the location'
      toast.error(message)
    } finally {
      setBusy(false)
    }
  }

  if (compact) {
    return (
      <button
        type="button"
        onClick={() => void onClick()}
        disabled={busy}
        className={cn('shrink-0 rounded-lg p-2 text-primary hover:bg-primary/10 disabled:opacity-50', className)}
        aria-label={locked ? 'Clinic location locked' : 'Save clinic location'}
      >
        <MapPin className="h-4 w-4" />
      </button>
    )
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={cn('rounded-xl', className)}
      disabled={busy}
      onClick={() => void onClick()}
    >
      <MapPin className="mr-1.5 h-3.5 w-3.5" />
      {busy ? 'Reading GPS…' : locked ? 'Location locked' : 'Save clinic location'}
    </Button>
  )
}

export { readFix }
