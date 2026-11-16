import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { App as CapApp } from '@capacitor/app'
import { useAuth } from '@/hooks/useAuth'
import { isAndroidApp } from '@/lib/capacitor'
import { FieldLocation } from '@/lib/fieldLocationNative'
import { supabase } from '@/lib/supabase'
import { showBrowserNotification } from '@/lib/notifications/showBrowserNotification'
import { toast } from 'sonner'

type Coords = { lat: number; lng: number; accuracy: number }

type ScanDoctor = { doctor_id: string; doctor_name: string }

type FieldLocationValue = {
  coords: Coords | null
  permission: 'unknown' | 'granted' | 'denied' | 'unsupported'
  unlockedIds: string[]
  confirmingIds: string[]
  flagged: boolean
  flagReason: string | null
  error: string | null
}

const FieldLocationContext = createContext<FieldLocationValue>({
  coords: null,
  permission: 'unknown',
  unlockedIds: [],
  confirmingIds: [],
  flagged: false,
  flagReason: null,
  error: null,
})

export function useFieldLocation() {
  return useContext(FieldLocationContext)
}

const announced = new Set<string>()

export function FieldLocationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const isMr = user?.role === 'mr'
  const [coords, setCoords] = useState<Coords | null>(null)
  const [permission, setPermission] = useState<FieldLocationValue['permission']>('unknown')
  const [unlockedIds, setUnlockedIds] = useState<string[]>([])
  const [confirmingIds, setConfirmingIds] = useState<string[]>([])
  const [flagged, setFlagged] = useState(false)
  const [flagReason, setFlagReason] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [gate, setGate] = useState<'check' | 'need' | 'ready'>(isMr ? 'check' : 'ready')
  const latest = useRef<Coords | null>(null)
  const gpsNoted = useRef(false)

  useEffect(() => {
    if (!isMr) {
      setGate('ready')
      return
    }
    let stopped = false
    setGate('check')
    const decide = async () => {
      if (isAndroidApp()) {
        try {
          await FieldLocation.stop()
        } catch {
          /* the recording service may already be gone */
        }
        try {
          const status = await FieldLocation.status()
          if (stopped) return
          const on = status.locationGranted && status.gpsEnabled
          setPermission(status.locationGranted ? 'granted' : 'denied')
          setGate(on ? 'ready' : 'need')
          if (!on) setError('Location is off')
        } catch {
          if (!stopped) setGate('need')
        }
        return
      }
      if (!navigator.geolocation) {
        setPermission('unsupported')
        setGate('need')
        return
      }
      try {
        const perm = await navigator.permissions.query({ name: 'geolocation' })
        if (stopped) return
        if (perm.state === 'granted') {
          setPermission('granted')
          setGate('ready')
          return
        }
        setPermission(perm.state === 'denied' ? 'denied' : 'unknown')
        setGate('need')
      } catch {
        if (!stopped) setGate('need')
      }
    }
    void decide()
    const resume = isAndroidApp()
      ? CapApp.addListener('resume', () => { void decide() })
      : null
    return () => {
      stopped = true
      void resume?.then(handle => handle.remove())
    }
  }, [isMr, user?.id])

  useEffect(() => {
    if (!isMr || gate !== 'ready' || !navigator.geolocation) return
    const watch = navigator.geolocation.watchPosition(
      pos => {
        const next = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        }
        latest.current = next
        setCoords(next)
        setPermission('granted')
        setError(null)
      },
      () => {
        setGate('need')
        setError('Location is off')
      },
      { enableHighAccuracy: true, maximumAge: 15000, timeout: 20000 },
    )
    return () => navigator.geolocation.clearWatch(watch)
  }, [gate, isMr])

  const turnOnLocation = async () => {
    if (isAndroidApp()) {
      try {
        const status = await FieldLocation.allow()
        if (!status.gpsEnabled) await FieldLocation.openLocationSettings()
        const next = await FieldLocation.status()
        const on = next.locationGranted && next.gpsEnabled
        setPermission(next.locationGranted ? 'granted' : 'denied')
        setGate(on ? 'ready' : 'need')
        if (!on) toast.message('Turn location on for Maktree, then come back.')
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Could not turn location on')
      }
      return
    }
    if (!navigator.geolocation) {
      toast.error('This browser has no GPS')
      return
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        latest.current = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        }
        setCoords(latest.current)
        setPermission('granted')
        setError(null)
        setGate('ready')
      },
      () => {
        setPermission('denied')
        setGate('need')
        toast.message('Allow location for Maktree, then continue.')
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 },
    )
  }

  useEffect(() => {
    if (!isMr || permission !== 'denied' || gpsNoted.current || !supabase) return
    gpsNoted.current = true
    void supabase.rpc('note_gps_off')
  }, [isMr, permission])

  useEffect(() => {
    if (!isMr || gate !== 'ready' || !supabase) return
    let stopped = false

    const tick = async () => {
      const here = latest.current
      if (!here || stopped) return
      const { data, error: scanError } = await supabase.rpc('spot_scan', {
        p_lat: here.lat,
        p_lng: here.lng,
        p_accuracy: here.accuracy,
      })
      if (scanError || stopped || !data) return
      const body = data as {
        flagged?: boolean
        flag_reason?: string | null
        unlocked?: ScanDoctor[]
        confirming?: ScanDoctor[]
      }
      setFlagged(body.flagged === true)
      setFlagReason(body.flag_reason ?? null)
      const unlocked = body.unlocked ?? []
      const confirming = body.confirming ?? []
      setUnlockedIds(unlocked.map(d => d.doctor_id))
      setConfirmingIds(confirming.map(d => d.doctor_id))
      for (const doctor of unlocked) {
        if (announced.has(doctor.doctor_id)) continue
        announced.add(doctor.doctor_id)
        toast.success(`DCR open for ${doctor.doctor_name}`)
        showBrowserNotification({
          id: `spot-${doctor.doctor_id}`,
          title: `DCR open for ${doctor.doctor_name}`,
          body: 'You are at the clinic. You can submit this DCR now.',
          url: '/mr/report/new',
        })
      }
    }

    const timer = window.setInterval(() => void tick(), 15000)
    const first = window.setTimeout(() => void tick(), 4000)
    return () => {
      stopped = true
      window.clearInterval(timer)
      window.clearTimeout(first)
    }
  }, [gate, isMr])

  const value = useMemo<FieldLocationValue>(() => ({
    coords,
    permission,
    unlockedIds,
    confirmingIds,
    flagged,
    flagReason,
    error,
  }), [coords, permission, unlockedIds, confirmingIds, flagged, flagReason, error])

  const blocked = isMr && gate !== 'ready'

  return (
    <FieldLocationContext.Provider value={value}>
      {blocked ? (
        <div className="fixed inset-0 z-[80] flex flex-col bg-background">
          <div className="flex flex-1 flex-col justify-center px-6">
            <p className="text-2xl font-bold text-foreground">Turn on location</p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {gate === 'check'
                ? 'Checking location…'
                : 'Turn location on first. Then you can enter Maktree, submit your plan, capture clinic locations, and fill your DCRs.'}
            </p>
          </div>
          {gate === 'need' && (
            <div className="px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
              <button
                type="button"
                onClick={() => void turnOnLocation()}
                className="h-12 w-full rounded-2xl bg-primary text-sm font-bold text-primary-foreground"
              >
                Turn on location
              </button>
            </div>
          )}
        </div>
      ) : children}
    </FieldLocationContext.Provider>
  )
}
