import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  useMarkNotificationRead,
  useUnreadNotificationCount,
  useUserNotifications,
} from '@/hooks/useUserNotifications'
import { normalizeNotificationUrl } from '@/lib/notifications/notificationRoutes'
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

interface Props {
  userId: string
}

export default function NotificationBell({ userId }: Props) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const unread = useUnreadNotificationCount(userId)
  const { data: notifications = [] } = useUserNotifications(userId)
  const markRead = useMarkNotificationRead()

  const onOpen = () => {
    setOpen(true)
    void requestNotificationPermission()
  }

  const openNotification = (id: string, url: string, read: boolean) => {
    if (!read) {
      void markRead.mutateAsync({ id, userId })
    }
    setOpen(false)
    navigate(normalizeNotificationUrl(url))
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
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
      >
        <Bell className="h-5 w-5 text-foreground" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[17px] px-0.5 h-[17px] text-[9px] rounded-full bg-destructive text-white flex items-center justify-center border-2 border-background font-bold">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0">
          <SheetHeader className="px-4 pt-4 pb-3 border-b border-border/60 text-left">
            <SheetTitle className="text-base">Notifications</SheetTitle>
            <SheetDescription className="text-xs">
              Tap a message to open the related page. Enable alerts in your phone settings for reminders at 8 PM and 11 PM.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-12 px-4">No notifications yet.</p>
            ) : (
              <ul className="divide-y divide-border/60">
                {notifications.map(n => {
                  const isUnread = !n.read_at
                  const dateLabel = n.created_at.slice(0, 10)
                  return (
                    <li key={n.id}>
                      <button
                        type="button"
                        onClick={() => openNotification(n.id, n.url, !isUnread)}
                        className={cn(
                          'w-full text-left px-4 py-3.5 flex gap-3 hover:bg-muted/40 active:bg-muted/60 transition-colors touch-manipulation',
                          isUnread && 'bg-primary/5',
                        )}
                      >
                        <div
                          className={cn(
                            'mt-0.5 h-10 w-10 shrink-0 rounded-full flex items-center justify-center',
                            isUnread ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground',
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
                                isUnread ? 'font-bold text-foreground' : 'font-medium text-foreground/90',
                              )}
                            >
                              {n.title}
                            </p>
                            <span className="text-[10px] text-muted-foreground shrink-0 tabular-nums">
                              {formatDisplayDate(dateLabel).split(',')[0]}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>
                        </div>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          {notifications.some(n => !n.read_at) && (
            <div className="p-3 border-t border-border/60">
              <Button
                type="button"
                variant="outline"
                className="w-full rounded-xl text-sm"
                disabled={markRead.isPending}
                onClick={() => {
                  const unreadList = notifications.filter(n => !n.read_at)
                  void Promise.all(
                    unreadList.map(n => markRead.mutateAsync({ id: n.id, userId })),
                  )
                }}
              >
                Mark all as read
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}
