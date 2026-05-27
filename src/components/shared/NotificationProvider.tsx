import type { ReactNode } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useNotificationAlerts } from '@/hooks/useUserNotifications'
import { useDcrReminders } from '@/hooks/useDcrReminders'

/** Wires polling alerts + DCR evening reminders for signed-in users. */
export default function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const userId = user?.id ?? ''

  useNotificationAlerts(userId)
  useDcrReminders(userId, user?.role === 'mr')

  return <>{children}</>
}
