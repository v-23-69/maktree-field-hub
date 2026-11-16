import { useState } from 'react'
import { MapPin } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useCaptureDoctorLocation } from '@/hooks/useFieldPlan'
import { gpsCapturePaused, noteGpsOk, noteWeakGps } from '@/lib/gpsCapture'
import { SPOT_MAX_ACCURACY_M } from '@/lib/spotWorking'
import { cn } from '@/lib/utils'

async function readFix(): Promise<{ lat: number; lng: number; accuracy: number }> {
  if (gpsCapturePaused()) {
    throw new Error('GPS_LATER')
  }
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
    throw new Error(noteWeakGps() === 'later' ? 'GPS_LATER' : 'GPS_WEAK')
  }
  noteGpsOk()
  return { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy }
}

export default function CaptureLocationButton({
  doctorId,
  locked,
  captured = false,
  compact = false,
  className,
}: {
  doctorId: string
  /** True when a location already exists and this user cannot change it. */
  locked?: boolean
  /** True when this clinic already has a saved location. */
  captured?: boolean
  compact?: boolean
  className?: string
}) {
  const capture = useCaptureDoctorLocation()
  const [busy, setBusy] = useState(false)
  const saved = locked || captured

  const onClick = async () => {
    if (saved) {
      toast.message('Clinic location is saved. A manager can update it.')
      return
    }
    setBusy(true)
    try {
      const fix = await readFix()
      await capture.mutateAsync({ doctorId, ...fix })
      toast.success('Clinic location saved')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not save the location'
      if (message === 'GPS_LATER' || message === 'GPS_WEAK') {
        toast.message(message === 'GPS_LATER'
          ? 'GPS is having trouble on this phone. Try the clinic location later.'
          : 'GPS is too weak. Step near the clinic entrance and try again.')
      } else if (/denied|permission/i.test(message)) {
        toast.message('Turn location on, then capture the clinic again.')
      } else {
        toast.error(message)
      }
    } finally {
      setBusy(false)
    }
  }

  if (compact && saved) {
    return (
      <span
        className={cn('inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-emerald-600', className)}
        aria-label="Location saved"
      >
        <MapPin className="h-4 w-4" />
      </span>
    )
  }

  if (compact) {
    return (
      <button
        type="button"
        onClick={() => void onClick()}
        disabled={busy}
        className={cn(
          'shrink-0 rounded-lg bg-red-600 px-2.5 py-1.5 text-[11px] font-bold leading-none text-white disabled:opacity-60',
          className,
        )}
      >
        {busy ? 'Reading…' : 'Capture location'}
      </button>
    )
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={cn('rounded-xl', saved ? 'text-emerald-700' : 'border-red-600 text-red-600', className)}
      disabled={busy}
      onClick={() => void onClick()}
    >
      <MapPin className="mr-1.5 h-3.5 w-3.5" />
      {busy ? 'Reading GPS…' : saved ? 'Location saved' : 'Capture location'}
    </Button>
  )
}

export { readFix }
