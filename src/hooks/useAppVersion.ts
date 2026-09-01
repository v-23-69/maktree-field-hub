import { useEffect, useState } from 'react'
import { App } from '@capacitor/app'
import { isNativeApp } from '@/lib/capacitor'

const WEB_VERSION = import.meta.env.VITE_APP_VERSION ?? '1.0.0'

export function useAppVersion(): { label: string; platform: 'android' | 'web' } {
  const [label, setLabel] = useState(() =>
    isNativeApp() ? `Maktree SFA v${WEB_VERSION}` : `Maktree SFA · Web v${WEB_VERSION}`,
  )

  useEffect(() => {
    if (!isNativeApp()) return

    void App.getInfo().then((info) => {
      setLabel(`Maktree SFA v${info.version} · build ${info.build}`)
    })
  }, [])

  return {
    label,
    platform: isNativeApp() ? 'android' : 'web',
  }
}
