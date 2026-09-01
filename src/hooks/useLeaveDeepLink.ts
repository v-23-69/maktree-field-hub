import { useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'

/** Open pending leave tab and scroll to leaveId from push notification. */
export function useLeaveDeepLink(isReady: boolean) {
  const [searchParams, setSearchParams] = useSearchParams()
  const handledRef = useRef<string | null>(null)
  const leaveId = searchParams.get('leaveId')

  useEffect(() => {
    if (!isReady || !leaveId) return
    if (handledRef.current === leaveId) return

    const timer = window.setTimeout(() => {
      const el = document.getElementById(`leave-${leaveId}`)
      if (!el) return

      handledRef.current = leaveId
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      el.classList.add('ring-2', 'ring-primary', 'ring-offset-2', 'ring-offset-background')
      window.setTimeout(() => {
        el.classList.remove('ring-2', 'ring-primary', 'ring-offset-2', 'ring-offset-background')
      }, 3200)

      const next = new URLSearchParams(searchParams)
      next.delete('leaveId')
      setSearchParams(next, { replace: true })
    }, 350)

    return () => window.clearTimeout(timer)
  }, [isReady, leaveId, searchParams, setSearchParams])

  return leaveId
}
