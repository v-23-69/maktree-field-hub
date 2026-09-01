import { useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { executePushQuickAction, readQuickActionFromHash, stripQuickActionFromHash } from '@/lib/notifications/pushQuickAction'

declare global {
  interface Window {
    MaktreePushBridge?: {
      consumePendingQuickAction?: () => string | null
      consumePendingQuickToken?: () => string | null
    }
  }
}

function readNativePendingQuickAction(): { action: 'approve' | 'reject'; token: string } | null {
  const bridge = window.MaktreePushBridge
  if (!bridge?.consumePendingQuickAction || !bridge?.consumePendingQuickToken) {
    return null
  }

  const action = bridge.consumePendingQuickAction()
  const token = bridge.consumePendingQuickToken()
  if (action !== 'approve' && action !== 'reject') return null
  if (!token) return null
  return { action, token }
}

/** When app opens from notification Approve/Decline, run quick RPC or show toast. */
export function usePushQuickActionHandler(enabled: boolean): void {
  const handledRef = useRef<string | null>(null)

  useEffect(() => {
    if (!enabled) return

    const run = async () => {
      const fromHash = readQuickActionFromHash()
      const fromNative = readNativePendingQuickAction()
      const payload = fromHash ?? fromNative
      if (!payload) return

      const key = `${payload.action}:${payload.token}`
      if (handledRef.current === key) return
      handledRef.current = key

      stripQuickActionFromHash()

      const result = await executePushQuickAction(payload.token, payload.action)
      if (result.ok) {
        toast.success(payload.action === 'approve' ? 'Approved from notification' : 'Declined from notification')
        return
      }

      if (result.requiresApp) {
        toast.message('Confirm this action in the app', {
          description: 'This request type needs a quick review in the app.',
        })
        return
      }

      if (result.error) {
        toast.error(result.error)
      }
    }

    const timer = window.setTimeout(() => {
      void run()
    }, 600)

    return () => window.clearTimeout(timer)
  }, [enabled])
}
