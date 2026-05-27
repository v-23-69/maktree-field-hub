import { useEffect, useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { LIVE_QUERY_OPTIONS } from '@/lib/liveQueryOptions'
import { showBrowserNotification } from '@/lib/notifications/showBrowserNotification'
import type { UserNotification } from '@/types/database.types'

export function useUserNotifications(userId: string) {
  return useQuery({
    queryKey: ['user-notifications', userId],
    enabled: !!userId && !!supabase,
    ...LIVE_QUERY_OPTIONS,
    queryFn: async (): Promise<UserNotification[]> => {
      if (!supabase) throw new Error('Supabase not configured')
      const { data, error } = await supabase
        .from('user_notifications')
        .select('id, user_id, kind, title, body, url, read_at, metadata, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50)
      if (error) throw error
      return (data ?? []) as UserNotification[]
    },
  })
}

export function useUnreadNotificationCount(userId: string): number {
  const { data = [] } = useUserNotifications(userId)
  return data.filter(n => !n.read_at).length
}

export function useMarkNotificationRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (p: { id: string; userId: string }) => {
      if (!supabase) throw new Error('Supabase not configured')
      const { error } = await supabase
        .from('user_notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', p.id)
        .eq('user_id', p.userId)
      if (error) throw error
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ['user-notifications', v.userId] })
    },
  })
}

/** Polls new notifications and fires system alerts (works when app is open / PWA foreground). */
export function useNotificationAlerts(userId: string) {
  const { data: notifications = [] } = useUserNotifications(userId)
  const lastSeenRef = useRef<string | null>(null)

  useEffect(() => {
    if (!userId || notifications.length === 0) return

    const newest = notifications[0]
    if (!newest) return

    if (lastSeenRef.current === null) {
      lastSeenRef.current = newest.id
      return
    }

    const fresh = notifications.filter(
      n => !n.read_at && new Date(n.created_at).getTime() > Date.now() - 5 * 60_000,
    )

    for (const n of fresh) {
      if (n.id === lastSeenRef.current) break
      showBrowserNotification({
        id: n.id,
        title: n.title,
        body: n.body,
        url: n.url,
        tag: n.kind,
      })
    }

    lastSeenRef.current = newest.id
  }, [notifications, userId])
}
