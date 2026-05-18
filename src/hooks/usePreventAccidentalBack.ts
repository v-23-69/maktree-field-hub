import { useCallback, useEffect, useRef } from 'react'

/**
 * Blocks browser / gesture back until `goBack()` is called (explicit header Back).
 */
export function usePreventAccidentalBack(enabled = true) {
  const allowBackRef = useRef(false)

  const goBack = useCallback(() => {
    allowBackRef.current = true
    window.history.back()
  }, [])

  useEffect(() => {
    if (!enabled) return

    const guard = { maktreeBackGuard: true as const }
    const pushGuard = () => {
      window.history.pushState(guard, '', window.location.href)
    }

    pushGuard()
    pushGuard()

    const onPopState = () => {
      if (allowBackRef.current) return
      pushGuard()
    }

    const onPageShow = (event: PageTransitionEvent) => {
      if (!event.persisted) return
      allowBackRef.current = false
      pushGuard()
      pushGuard()
    }

    window.addEventListener('popstate', onPopState)
    window.addEventListener('pageshow', onPageShow)
    return () => {
      window.removeEventListener('popstate', onPopState)
      window.removeEventListener('pageshow', onPageShow)
    }
  }, [enabled])

  return { goBack }
}
