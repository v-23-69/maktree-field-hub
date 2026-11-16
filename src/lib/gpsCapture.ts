import { supabase } from '@/lib/supabase'

const LATER_MS = 30 * 60 * 1000
let tries = 0
let pausedUntil = 0
let managersTold = false
const listeners = new Set<() => void>()

export function gpsCapturePaused(): boolean {
  return Date.now() < pausedUntil
}

export function subscribeGpsCapture(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** Count a weak reading. After three, pause capture and tell the MR and managers once. */
export function noteWeakGps(): 'weak' | 'later' {
  if (gpsCapturePaused()) return 'later'
  tries += 1
  if (tries < 3) return 'weak'
  tries = 0
  pausedUntil = Date.now() + LATER_MS
  listeners.forEach(listener => listener())
  if (!managersTold && supabase) {
    managersTold = true
    void supabase.rpc('note_gps_weak')
  }
  return 'later'
}

export function noteGpsOk() {
  tries = 0
}
