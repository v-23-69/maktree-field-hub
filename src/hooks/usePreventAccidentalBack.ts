import { useCallback, useEffect, useRef } from 'react'

/**
 * Blocks browser back gestures / hardware back until `goBack()` is called
 * (e.g. from an explicit header Back button).
 */
export function usePreventAccidentalBack(enabled = true) {
  const allowBackRef = useRef(false)

  const goBack = useCallback(() => {
    allowBackRef.current = true
    window.history.back()
  }, [])

  useEffect(() => {
    if (!enabled) return

    const guardState = { maktreeBackGuard: true as const }
    window.history.pushState(guardState, '')

    const onPopState = () => {
      if (allowBackRef.current) return
      window.history.pushState(guardState, '')
    }

    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [enabled])

  return { goBack }
}
