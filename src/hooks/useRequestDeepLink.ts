import { useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'

const TAB_PARAM_TO_KIND: Record<string, string> = {
  unlock: 'unlock',
  'late-dcr': 'late-dcr',
  'tour-program': 'tour-program',
  'tp-deletion': 'tp-deletion',
  leave: 'leave',
  'doctor-removal': 'doctor-removal',
  'doctor-add': 'doctor-add',
}

/** Scroll + highlight a request card opened from a push notification deep link. */
export function useRequestDeepLink(isLoading: boolean) {
  const [searchParams, setSearchParams] = useSearchParams()
  const handledRef = useRef<string | null>(null)

  const tabParam = searchParams.get('tab')
  const requestId = searchParams.get('requestId')
  const focusKind = tabParam ? TAB_PARAM_TO_KIND[tabParam] : null

  useEffect(() => {
    if (isLoading || !requestId) return

    const key = `${tabParam ?? ''}:${requestId}`
    if (handledRef.current === key) return

    const timer = window.setTimeout(() => {
      const el = document.getElementById(`request-${requestId}`)
      if (!el) return

      handledRef.current = key
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      el.classList.add('ring-2', 'ring-primary', 'ring-offset-2', 'ring-offset-background')
      window.setTimeout(() => {
        el.classList.remove('ring-2', 'ring-primary', 'ring-offset-2', 'ring-offset-background')
      }, 3200)

      const next = new URLSearchParams(searchParams)
      next.delete('tab')
      next.delete('requestId')
      setSearchParams(next, { replace: true })
    }, 350)

    return () => window.clearTimeout(timer)
  }, [isLoading, requestId, tabParam, searchParams, setSearchParams])

  return { focusKind, requestId }
}
