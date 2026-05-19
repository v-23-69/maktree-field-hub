import { useCallback, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

const GUARD_KEY = 'maktreeBackGuard'

/** Shared flag so header Back and hook agree on one intentional exit. */
let allowBackExit = false

export function setAllowBackExit(allowed: boolean) {
  allowBackExit = allowed
}

function isGuardState(state: unknown): boolean {
  return (
    typeof state === 'object' &&
    state !== null &&
    (state as { maktreeBackGuard?: boolean }).maktreeBackGuard === true
  )
}

/**
 * Programmatic back for header buttons. Pops our history guard (if any) then React Router back.
 */
export function performAppBack(navigate: ReturnType<typeof useNavigate>, custom?: () => void) {
  if (custom) {
    custom()
    return
  }
  allowBackExit = true
  if (isGuardState(window.history.state)) {
    window.history.back()
  }
  requestAnimationFrame(() => {
    allowBackExit = true
    navigate(-1)
  })
}

/**
 * Blocks browser / gesture back until `goBack()` or `performAppBack` is used.
 */
export function usePreventAccidentalBack(enabled = true) {
  const navigate = useNavigate()
  const allowBackRef = useRef(false)

  const goBack = useCallback(() => {
    performAppBack(navigate)
  }, [navigate])

  useEffect(() => {
    if (!enabled) return

    const guard = { [GUARD_KEY]: true as const }
    window.history.pushState(guard, '', window.location.href)

    const onPopState = () => {
      if (allowBackRef.current || allowBackExit) {
        allowBackRef.current = false
        allowBackExit = false
        return
      }
      window.history.pushState(guard, '', window.location.href)
    }

    const onPageShow = (event: PageTransitionEvent) => {
      if (!event.persisted) return
      allowBackRef.current = false
      allowBackExit = false
      window.history.pushState(guard, '', window.location.href)
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
