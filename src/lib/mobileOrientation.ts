/** Lock portrait on phones; allow rotation on tablets (768px+). */
export function initMobilePortraitLock() {
  if (typeof window === 'undefined') return

  const tryLock = () => {
    if (window.innerWidth >= 768) return

    const orientation = screen.orientation as ScreenOrientation & {
      lock?: (o: OrientationLockType) => Promise<void>
    }
    if (orientation?.lock) {
      void orientation.lock('portrait').catch(() => {
        /* unsupported on some iOS builds */
      })
    }
  }

  tryLock()
  window.addEventListener('resize', tryLock, { passive: true })
}
