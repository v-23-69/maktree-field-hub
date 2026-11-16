import { useEffect, useState } from 'react'
import { App as CapApp } from '@capacitor/app'
import { toast } from 'sonner'
import { isAndroidApp } from '@/lib/capacitor'
import { AppUpdate } from '@/lib/appUpdateNative'

const UPDATE_ORIGIN = 'https://maktree.vercel.app'

type LatestRelease = {
  versionCode: number
  versionName: string
  url: string
}

export default function AppUpdateNotice() {
  const [release, setRelease] = useState<LatestRelease | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!isAndroidApp()) return
    let stopped = false
    const check = async () => {
      try {
        const info = await CapApp.getInfo()
        const installed = Number(info.build)
        if (!Number.isFinite(installed)) return
        const response = await fetch(`${UPDATE_ORIGIN}/downloads/latest.json?t=${Date.now()}`)
        if (!response.ok || stopped) return
        const body = await response.json() as Partial<LatestRelease>
        if (stopped) return
        if (!body.versionCode || !body.versionName || !body.url) return
        if (body.versionCode <= installed) {
          setRelease(null)
          return
        }
        const path = body.url.startsWith('http') ? body.url : `${UPDATE_ORIGIN}${body.url}`
        setRelease({ versionCode: body.versionCode, versionName: body.versionName, url: path })
      } catch {
        /* the app keeps working when the update check cannot reach the site */
      }
    }
    void check()
    return () => {
      stopped = true
    }
  }, [])

  if (!release) return null

  const update = async () => {
    setBusy(true)
    try {
      await AppUpdate.install({ url: release.url })
    } catch (error) {
      toast.message(error instanceof Error ? error.message : 'Could not start the update')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/45 p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="w-full max-w-md rounded-2xl bg-card p-5 shadow-xl sm:p-6" role="dialog" aria-labelledby="app-update-title">
        <p id="app-update-title" className="text-lg font-bold text-foreground">
          A new version of Maktree SFA is available
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Version {release.versionName} installs over this app. Your login stays. You do not delete the app.
        </p>
        <button
          type="button"
          onClick={() => void update()}
          disabled={busy}
          className="mt-5 h-12 w-full rounded-2xl bg-primary text-sm font-bold text-primary-foreground disabled:opacity-60"
        >
          {busy ? 'Downloading…' : 'Install update'}
        </button>
        <button
          type="button"
          onClick={() => setRelease(null)}
          className="mt-2 h-10 w-full text-sm font-semibold text-muted-foreground"
        >
          Later
        </button>
      </div>
    </div>
  )
}
