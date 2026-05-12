import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'

const DISMISS_KEY = 'maktree-install-hint-dismissed'
const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  if (window.matchMedia('(display-mode: standalone)').matches) return true
  if ((navigator as Navigator & { standalone?: boolean }).standalone === true) return true
  if (document.referrer.includes('android-app://')) return true
  return false
}

function wasDismissedRecently(): boolean {
  try {
    const raw = localStorage.getItem(DISMISS_KEY)
    if (!raw) return false
    const ts = parseInt(raw, 10)
    return Date.now() - ts < DISMISS_DURATION_MS
  } catch {
    return false
  }
}

function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

export default function InstallPrompt() {
  const { authReady, isAuthenticated } = useAuth()
  const nativeRef = useRef<BeforeInstallPromptEvent | null>(null)
  const [mode, setMode] = useState<'none' | 'native' | 'manual-ios' | 'manual-android'>('none')

  useEffect(() => {
    if (!authReady || !isAuthenticated) return
    if (isStandalone() || wasDismissedRecently()) return

    const handler = (e: Event) => {
      e.preventDefault()
      nativeRef.current = e as BeforeInstallPromptEvent
      setMode('native')
    }
    window.addEventListener('beforeinstallprompt', handler)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [authReady, isAuthenticated])

  useEffect(() => {
    if (!authReady || !isAuthenticated) return
    if (isStandalone() || wasDismissedRecently()) return
    if (nativeRef.current) return

    const timer = setTimeout(() => {
      if (nativeRef.current) {
        setMode('native')
      } else if (isIOS()) {
        setMode('manual-ios')
      } else {
        setMode('manual-android')
      }
    }, 3000)

    return () => clearTimeout(timer)
  }, [authReady, isAuthenticated])

  const dismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())) } catch {}
    setMode('none')
  }

  if (!authReady || !isAuthenticated) return null
  if (isStandalone()) return null
  if (mode === 'none') return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 rounded-xl border bg-card p-3 shadow-md sm:bottom-6 sm:left-auto sm:right-6 sm:max-w-sm">
      <p className="text-sm font-medium">Install Maktree for quick access</p>
      {mode === 'native' && nativeRef.current ? (
        <div className="mt-2 grid grid-cols-2 gap-2">
          <Button
            size="sm"
            onClick={async () => {
              const ev = nativeRef.current
              if (!ev) return
              await ev.prompt()
              void ev.userChoice
              dismiss()
            }}
          >
            Install
          </Button>
          <Button size="sm" variant="outline" onClick={dismiss}>
            Dismiss
          </Button>
        </div>
      ) : mode === 'manual-ios' ? (
        <>
          <p className="mt-2 text-xs text-muted-foreground">
            Tap the Share button at the bottom of Safari, then tap "Add to Home Screen" to install.
          </p>
          <div className="mt-2">
            <Button size="sm" variant="outline" className="w-full" onClick={dismiss}>
              Got it
            </Button>
          </div>
        </>
      ) : (
        <>
          <p className="mt-2 text-xs text-muted-foreground">
            Open browser menu and tap "Install app" or "Add to Home screen" for full-screen app experience.
          </p>
          <div className="mt-2">
            <Button size="sm" variant="outline" className="w-full" onClick={dismiss}>
              Got it
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
