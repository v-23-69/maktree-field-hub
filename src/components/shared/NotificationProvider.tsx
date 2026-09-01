import type { ReactNode } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useNotificationAlerts } from '@/hooks/useUserNotifications'
import { useDcrReminders } from '@/hooks/useDcrReminders'
import { useNativePushRegistration } from '@/hooks/useNativePushRegistration'
import { usePushQuickActionHandler } from '@/hooks/usePushQuickActionHandler'

/** Wires polling alerts + DCR evening reminders for signed-in users. */
export default function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const userId = user?.id ?? ''

  useNotificationAlerts(userId)
  useDcrReminders(userId, user?.role === 'mr')
  useNativePushRegistration(userId)
  usePushQuickActionHandler(!!userId)

  return <>{children}</>
}
