import { Capacitor } from '@capacitor/core'
import { App as CapApp } from '@capacitor/app'
import { SplashScreen } from '@capacitor/splash-screen'
import { StatusBar, Style } from '@capacitor/status-bar'

/** Brand primary — matches PWA theme_color and --primary in CSS. */
const STATUS_BAR_COLOR = '#2563EB'

export function isNativeApp(): boolean {
  return Capacitor.isNativePlatform()
}

/** Installed PWA / Add to Home Screen — keep opening login, not the public download page. */
export function isStandaloneWebApp(): boolean {
  if (typeof window === 'undefined') return false
  if (window.matchMedia('(display-mode: standalone)').matches) return true
  if ((navigator as Navigator & { standalone?: boolean }).standalone === true) return true
  return false
}

export function isAndroidApp(): boolean {
  return Capacitor.getPlatform() === 'android'
}

/** Blue status bar with white system icons (time, battery). */
export async function configureNativeStatusBar(): Promise<void> {
  if (!isNativeApp()) return

  try {
    await StatusBar.setOverlaysWebView({ overlay: false })
    await StatusBar.show()
    await StatusBar.setBackgroundColor({ color: STATUS_BAR_COLOR })
    await StatusBar.setStyle({ style: Style.Light })
  } catch {
    /* StatusBar plugin unavailable on some WebViews */
  }
}

/** Wire native shell behaviour (status bar, hardware back). */
export async function initNativeShell(): Promise<void> {
  if (!isNativeApp()) return

  await configureNativeStatusBar()
  await hideNativeSplash()

  void CapApp.addListener('backButton', ({ canGoBack }) => {
    if (canGoBack) {
      window.history.back()
      return
    }
    void CapApp.exitApp()
  })

  void CapApp.addListener('appStateChange', ({ isActive }) => {
    if (isActive) void configureNativeStatusBar()
  })

  void CapApp.addListener('resume', () => {
    void configureNativeStatusBar()
  })
}

/** Dismiss any Capacitor splash overlay so it cannot leave a logo strip at the top. */
export async function hideNativeSplash(): Promise<void> {
  if (!isNativeApp()) return
  try {
    await SplashScreen.hide()
  } catch {
    /* ignore */
  }
}
