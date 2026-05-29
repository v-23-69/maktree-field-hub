import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Check, ChevronRight, ClipboardList } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  useMarkNotificationRead,
  useUnreadNotificationCount,
  useUserNotifications,
} from '@/hooks/useUserNotifications'
import { useManagerPendingRequestsCount } from '@/hooks/useManagerPendingRequestsCount'
import { requestNotificationPermission } from '@/lib/notifications/showBrowserNotification'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { formatDisplayDate } from '@/lib/dateUtils'
import type { UserNotification, UserRole } from '@/types/database.types'
import { normalizeNotificationUrl, NOTIFICATION_ROUTES } from '@/lib/notifications/notificationRoutes'

const TERMINAL_REQUEST_STATUSES = new Set([
  'approved',
  'rejected',
  'declined',
  'resolved',
  'completed',
  'done',
  'cancelled',
  'canceled',
])

function shouldKeepUnread(n: UserNotification): boolean {
  const url = normalizeNotificationUrl(n.url)
  const kind = (n.kind ?? '').toLowerCase()
  const status = (n.metadata as { status?: string } | null)?.status?.toLowerCase()
  const isRequestLike =
    url.startsWith(NOTIFICATION_ROUTES.managerRequests) ||
    kind.includes('request') ||
    kind.includes('approval') ||
    kind.includes('leave') ||
    kind.includes('unlock') ||
    kind.includes('complaint') ||
    kind.includes('late_dcr')
  if (!isRequestLike) return false
  if (!status) return true
  return !TERMINAL_REQUEST_STATUSES.has(status)
}

interface Props {
  userId: string
  role: UserRole
}

export default function NotificationBell({ userId, role }: Props) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const unread = useUnreadNotificationCount(userId)
  const pendingApprovals = useManagerPendingRequestsCount(role === 'manager' ? userId : '')
  const { data: notifications = [] } = useUserNotifications(userId)
  const markRead = useMarkNotificationRead()

  const badgeCount = unread + (role === 'manager' ? pendingApprovals : 0)

  const onOpen = () => {
    setOpen(true)
    void requestNotificationPermission()
  }

  useEffect(() => {
    if (!open || notifications.length === 0) return
    const toMark = notifications.filter(n => !n.read_at && !shouldKeepUnread(n))
    if (toMark.length === 0) return
    void Promise.all(toMark.map(n => markRead.mutateAsync({ id: n.id, userId })))
  }, [open, notifications, userId, markRead])

  const openNotification = (id: string, url: string, n: UserNotification) => {
    if (!n.read_at && !shouldKeepUnread(n)) {
      void markRead.mutateAsync({ id, userId })
    }
    setOpen(false)
    navigate(normalizeNotificationUrl(url))
  }

  const goToRequests = () => {
    setOpen(false)
    navigate(NOTIFICATION_ROUTES.managerRequests)
  }

  return (
    <>
      <button
        type="button"
        onClick={onOpen}
        className={cn(
          'relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
          'hover:bg-foreground/5 active:scale-95 transition-transform touch-manipulation',
        )}
        aria-label={
          badgeCount > 0 ? `Notifications, ${badgeCount} unread or pending` : 'Notifications'
        }
      >
        <Bell className="h-5 w-5 text-foreground" />
        {badgeCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[17px] px-0.5 h-[17px] text-[9px] rounded-full bg-destructive text-white flex items-center justify-center border-2 border-background font-bold">
            {badgeCount > 99 ? '99+' : badgeCount}
          </span>
        )}
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0">
          <SheetHeader className="px-4 pt-4 pb-3 border-b border-border/60 text-left">
            <SheetTitle className="text-base">Notifications</SheetTitle>
            <SheetDescription className="text-xs">
              {role === 'manager'
                ? 'Alerts, DCR updates, and approval requests in one place.'
                : 'Tap a message to open the related page. Enable alerts for DCR reminders at 8 PM and 11 PM.'}
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto">
            {role === 'manager' && pendingApprovals > 0 && (
              <div className="p-3 border-b border-border/60 bg-amber-500/5">
                <button
                  type="button"
                  onClick={goToRequests}
                  className="w-full flex items-center gap-3 rounded-xl border border-amber-500/40 bg-card px-3 py-3 text-left hover:bg-amber-500/10 active:bg-amber-500/15 transition-colors touch-manipulation"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300">
                    <ClipboardList className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-foreground">
                      {pendingApprovals} approval{pendingApprovals !== 1 ? 's' : ''} waiting
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Leave, tour program, doctor add/remove, unlock & more
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
                </button>
              </div>
            )}

            {notifications.length === 0 && !(role === 'manager' && pendingApprovals > 0) ? (
              <p className="text-sm text-muted-foreground text-center py-12 px-4">
                No notifications yet.
              </p>
            ) : notifications.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6 px-4">
                No other alerts right now. Use the card above for pending approvals.
              </p>
            ) : (
              <ul className="divide-y divide-border/60">
                {notifications.map(n => {
                  const isUnread = !n.read_at
                  const dateLabel = n.created_at.slice(0, 10)
                  return (
                    <li key={n.id}>
                      <button
                        type="button"
                        onClick={() => openNotification(n.id, n.url, n)}
                        className={cn(
                          'w-full text-left px-4 py-3.5 flex gap-3 hover:bg-muted/40 active:bg-muted/60 transition-colors touch-manipulation',
                          isUnread && 'bg-primary/5',
                        )}
                      >
                        <div
                          className={cn(
                            'mt-0.5 h-10 w-10 shrink-0 rounded-full flex items-center justify-center',
                            isUnread
                              ? 'bg-primary/15 text-primary'
                              : 'bg-muted text-muted-foreground',
                          )}
                        >
                          {isUnread ? (
                            <Bell className="h-4 w-4" />
                          ) : (
                            <Check className="h-4 w-4" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline justify-between gap-2">
                            <p
                              className={cn(
                                'text-sm truncate',
                                isUnread
                                  ? 'font-bold text-foreground'
                                  : 'font-medium text-foreground/90',
                              )}
                            >
                              {n.title}
                            </p>
                            <span className="text-[10px] text-muted-foreground shrink-0 tabular-nums">
                              {formatDisplayDate(dateLabel).split(',')[0]}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                            {n.body}
                          </p>
                        </div>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

        </SheetContent>
      </Sheet>
    </>
  )
}
