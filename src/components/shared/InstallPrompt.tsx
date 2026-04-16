import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'

const DISMISS_KEY = 'maktree-install-hint-dismissed'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  if (window.matchMedia('(display-mode: standalone)').matches) return true
  return (navigator as Navigator & { standalone?: boolean }).standalone === true
}

function isLikelyMobile(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(max-width: 768px)').matches || 'ontouchstart' in window
}

export default function InstallPrompt() {
  const { isAuthenticated, authReady } = useAuth()
  const nativeRef = useRef<BeforeInstallPromptEvent | null>(null)
  const [mode, setMode] = useState<'none' | 'native' | 'manual'>('none')

  useEffect(() => {
    if (!authReady || !isAuthenticated) return
    if (isStandalone()) return
    if (sessionStorage.getItem(DISMISS_KEY) === '1') return

    const handler = (e: Event) => {
      e.preventDefault()
      nativeRef.current = e as BeforeInstallPromptEvent
      setMode('native')
    }
    window.addEventListener('beforeinstallprompt', handler)

    let timer: ReturnType<typeof setTimeout> | undefined
    if (isLikelyMobile()) {
      timer = setTimeout(() => {
        if (!nativeRef.current) {
          setMode((m) => (m === 'none' ? 'manual' : m))
        }
      }, 4000)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      if (timer) clearTimeout(timer)
    }
  }, [authReady, isAuthenticated])

  const dismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, '1')
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
      ) : (
        <>
          <p className="mt-2 text-xs text-muted-foreground">
            If your browser does not offer Install here: on Android Chrome open the menu (⋮) and choose Install
            app or Add to Home screen. On iPhone, tap Share → Add to Home Screen, then open Maktree from that icon
            for full-screen app mode.
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
