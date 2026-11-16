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
  const active = user?.role === 'mr' || user?.role === 'manager'
  const [coords, setCoords] = useState<Coords | null>(null)
  const [permission, setPermission] = useState<FieldLocationValue['permission']>('unknown')
  const [unlockedIds, setUnlockedIds] = useState<string[]>([])
  const [confirmingIds, setConfirmingIds] = useState<string[]>([])
  const [flagged, setFlagged] = useState(false)
  const [flagReason, setFlagReason] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [needsLocation, setNeedsLocation] = useState(false)
  const latest = useRef<Coords | null>(null)
  const gpsNoted = useRef(false)
  const iosWeb = typeof navigator !== 'undefined' && !isAndroidApp() && /iPhone|iPad/.test(navigator.userAgent)

  useEffect(() => {
    if (!active || !navigator.geolocation) {
      if (active && !navigator.geolocation) setPermission('unsupported')
      return
    }

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
        setNeedsLocation(false)
        setError(null)
      },
      err => {
        const denied = err.code === err.PERMISSION_DENIED
        setPermission(denied ? 'denied' : 'granted')
        setNeedsLocation(true)
        setError(err.message || 'Location is unavailable')
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 },
    )

    return () => navigator.geolocation.clearWatch(watch)
  }, [active])

  useEffect(() => {
    if (!active || user?.role !== 'mr' || !isAndroidApp() || !supabase) return
    let stopped = false
    const pushSession = async () => {
      const { data } = await supabase.auth.getSession()
      const session = data.session
      if (!session || stopped) return
      await FieldLocation.setSession({
        supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
        anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        accessToken: session.access_token,
        refreshToken: session.refresh_token,
      })
    }
    const applyStatus = async () => {
      const status = await FieldLocation.status()
      const off = !status.gpsEnabled || !status.locationGranted
      setNeedsLocation(off)
      setPermission(status.locationGranted ? 'granted' : 'denied')
      if (off) setError('Location is off')
    }
    const { data: auth } = supabase.auth.onAuthStateChange(() => {
      void pushSession()
    })
    void (async () => {
      try {
        await pushSession()
        if (stopped) return
        await FieldLocation.start()
        await applyStatus()
      } catch (err) {
        if (stopped) return
        setNeedsLocation(true)
        setPermission('denied')
        setError(err instanceof Error ? err.message : 'Location is off')
      }
    })()
    const resume = CapApp.addListener('resume', () => {
      void applyStatus()
    })
    return () => {
      stopped = true
      auth.subscription.unsubscribe()
      void resume.then(handle => handle.remove())
    }
  }, [active, user?.role])

  useEffect(() => {
    if (!active || user?.role !== 'mr' || !isAndroidApp()) return
    return () => {
      void FieldLocation.stop()
    }
  }, [active, user?.id, user?.role])

  useEffect(() => {
    if (!needsLocation || user?.role !== 'mr') return
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      void Notification.requestPermission()
    }
    showBrowserNotification({
      id: `gps-off-${new Date().toISOString().slice(0, 10)}`,
      title: 'Turn on location',
      body: 'Location is off. Open Maktree and tap Turn on location.',
      url: '/mr/plan',
    })
  }, [needsLocation, user?.role])

  const turnOnLocation = async () => {
    if (isAndroidApp()) {
      try {
        const status = await FieldLocation.status()
        if (!status.locationGranted || !status.backgroundGranted) {
          await FieldLocation.start()
        }
        const next = await FieldLocation.status()
        if (!next.gpsEnabled) await FieldLocation.openLocationSettings()
        setNeedsLocation(!next.gpsEnabled || !next.locationGranted)
        setPermission(next.locationGranted ? 'granted' : 'denied')
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Could not open location settings')
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
        setNeedsLocation(false)
        setError(null)
      },
      () => {
        toast.message('Allow location for Maktree in the browser or phone settings')
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 },
    )
  }

  useEffect(() => {
    if (!active || permission !== 'denied' || user?.role !== 'mr' || gpsNoted.current || !supabase) return
    gpsNoted.current = true
    void supabase.rpc('note_gps_off')
  }, [active, permission, user?.role])

  useEffect(() => {
    if (!active || !supabase) return
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
      if (user?.role !== 'mr') return
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
  }, [active, user?.role])

  const value = useMemo<FieldLocationValue>(() => ({
    coords,
    permission,
    unlockedIds,
    confirmingIds,
    flagged,
    flagReason,
    error,
  }), [coords, permission, unlockedIds, confirmingIds, flagged, flagReason, error])

  return (
    <FieldLocationContext.Provider value={value}>
      {children}
      {needsLocation && user?.role === 'mr' && (
        <div className="fixed inset-x-3 bottom-24 z-[70] rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-950 shadow-lg">
          <p className="text-sm font-bold">Turn on location</p>
          <p className="mt-1 text-xs leading-relaxed">
            Location is off. Turn it on so the route and live visits keep recording while Maktree is open or sitting in Recents.
            {iosWeb ? ' On iPhone, Apple only allows this while Maktree is on the screen.' : ''}
          </p>
          <button
            type="button"
            onClick={() => void turnOnLocation()}
            className="mt-3 h-10 rounded-xl bg-amber-600 px-4 text-sm font-bold text-white"
          >
            Turn on location
          </button>
        </div>
      )}
    </FieldLocationContext.Provider>
  )
}
