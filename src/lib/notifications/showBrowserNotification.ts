import { normalizeNotificationUrl } from '@/lib/notifications/notificationRoutes'

export type BrowserNotificationPayload = {
  id: string
  title: string
  body: string
  url: string
  tag?: string
}

const shownIds = new Set<string>()
const MAX_TRACKED = 200

function trackShown(id: string) {
  shownIds.add(id)
  if (shownIds.size > MAX_TRACKED) {
    const first = shownIds.values().next().value
    if (first) shownIds.delete(first)
  }
}

export function hasShownNotification(id: string): boolean {
  return shownIds.has(id)
}

/** System notification (WhatsApp-style on mobile when PWA installed + permission granted). */
export function showBrowserNotification(payload: BrowserNotificationPayload): void {
  if (typeof window === 'undefined' || !('Notification' in window)) return
  if (Notification.permission !== 'granted') return
  if (hasShownNotification(payload.id)) return

  const url = normalizeNotificationUrl(payload.url)
  const tag = payload.tag ?? payload.id

  trackShown(payload.id)

  const show = () => {
    try {
      const n = new Notification(payload.title, {
        body: payload.body,
        tag,
        icon: '/android-chrome-192x192.png',
        badge: '/android-chrome-192x192.png',
        data: { url, id: payload.id },
        requireInteraction: false,
      })
      n.onclick = () => {
        window.focus()
        window.location.hash = url.startsWith('/') ? url : `/${url}`
        n.close()
      }
    } catch {
      /* ignore — some browsers block without gesture */
    }
  }

  if ('serviceWorker' in navigator) {
    void navigator.serviceWorker.ready
      .then(reg => {
        if (reg.showNotification) {
          return reg.showNotification(payload.title, {
            body: payload.body,
            tag,
            icon: '/android-chrome-192x192.png',
            badge: '/android-chrome-192x192.png',
            data: { url, id: payload.id },
          })
        }
        show()
      })
      .catch(() => show())
  } else {
    show()
  }
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'denied'
  if (Notification.permission === 'granted') return 'granted'
  if (Notification.permission === 'denied') return 'denied'
  return Notification.requestPermission()
}
