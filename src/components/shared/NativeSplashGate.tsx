import { useEffect } from 'react'
import { hideNativeSplash, isNativeApp } from '@/lib/capacitor'

/** Ensure Capacitor splash overlay is fully dismissed (prevents top logo strip). */
export default function NativeSplashGate() {
  useEffect(() => {
    if (!isNativeApp()) return
    void hideNativeSplash()
  }, [])

  return null
}
