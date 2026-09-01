import { useEffect } from 'react'
import { PushNotifications } from '@capacitor/push-notifications'
import { isNativeApp } from '@/lib/capacitor'
import { registerDevicePushToken } from '@/lib/notifications/registerDevicePushToken'

/** Phase 2 only — requires android/app/google-services.json + Firebase secrets. */
function isNativePushEnabled(): boolean {
  return import.meta.env.VITE_ENABLE_NATIVE_PUSH === 'true'
}

/** Registers FCM token + handles native push taps (Android app). */
export function useNativePushRegistration(userId: string): void {
  useEffect(() => {
    if (!userId || !isNativeApp() || !isNativePushEnabled()) return

    let cancelled = false
    let removeRegistration: (() => void) | undefined
    let removeRegistrationError: (() => void) | undefined
    let removeNotificationReceived: (() => void) | undefined
    let removeNotificationAction: (() => void) | undefined

    const setup = async () => {
      try {
        // FCM payloads use channel_id maktree_alerts — create it before register().
        await PushNotifications.createChannel({
          id: 'maktree_alerts',
          name: 'Maktree Alerts',
          description: 'Approvals, DCR, leave, and urgent updates',
          importance: 5,
          visibility: 1,
          sound: 'default',
          vibration: true,
        })
        await PushNotifications.createChannel({
          id: 'maktree_activity',
          name: 'Maktree Activity',
          description: 'DCR submitted and general updates',
          importance: 3,
          visibility: 1,
          sound: 'default',
          vibration: false,
        })
        await PushNotifications.createChannel({
          id: 'maktree_reminders',
          name: 'Maktree Reminders',
          description: 'DCR reminders and scheduled alerts',
          importance: 3,
          visibility: 1,
          sound: 'default',
          vibration: true,
        })

        let perm = await PushNotifications.checkPermissions()
        if (perm.receive === 'prompt') {
          perm = await PushNotifications.requestPermissions()
        }
        if (perm.receive !== 'granted' || cancelled) return

        await PushNotifications.register()

        const regHandle = await PushNotifications.addListener('registration', token => {
          void registerDevicePushToken(token.value, 'android')
        })
        removeRegistration = () => void regHandle.remove()

        const errHandle = await PushNotifications.addListener('registrationError', err => {
          console.error('[Push] registration failed:', err)
        })
        removeRegistrationError = () => void errHandle.remove()

        const recvHandle = await PushNotifications.addListener('pushNotificationReceived', notification => {
          if (import.meta.env.DEV) {
            console.info('[Push] foreground notification:', notification)
          }
        })
        removeNotificationReceived = () => void recvHandle.remove()

        const actionHandle = await PushNotifications.addListener('pushNotificationActionPerformed', action => {
          const data = action.notification.data ?? {}
          const url = data.url
          const quickAction = data.quickAction
          const quickToken = data.quickToken

          if (typeof url === 'string' && url.length > 0) {
            let target = url.startsWith('/') ? url : `/${url}`
            if (typeof quickAction === 'string' && typeof quickToken === 'string') {
              const join = target.includes('?') ? '&' : '?'
              target = `${target}${join}quickAction=${encodeURIComponent(quickAction)}&quickToken=${encodeURIComponent(quickToken)}`
            }
            window.location.hash = target
          }
        })
        removeNotificationAction = () => void actionHandle.remove()
      } catch (err) {
        console.error('[Push] setup failed:', err)
      }
    }

    void setup()

    return () => {
      cancelled = true
      removeRegistration?.()
      removeRegistrationError?.()
      removeNotificationReceived?.()
      removeNotificationAction?.()
    }
  }, [userId])
}
