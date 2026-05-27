import { useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { todayInputDate } from '@/lib/dateUtils'
import { NOTIFICATION_ROUTES } from '@/lib/notifications/notificationRoutes'
import { showBrowserNotification } from '@/lib/notifications/showBrowserNotification'

const IST = 'Asia/Kolkata'
const REMINDER_HOURS = [20, 23] as const

function istHourNow(): number {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: IST,
    hour: 'numeric',
    hour12: false,
  }).formatToParts(new Date())
  const h = parts.find(p => p.type === 'hour')?.value
  return h ? parseInt(h, 10) : -1
}

function reminderStorageKey(mrId: string, date: string, hour: number) {
  return `dcr-reminder:${mrId}:${date}:${hour}`
}

export function useDcrReminders(mrId: string, enabled: boolean) {
  const today = todayInputDate()
  const firedRef = useRef<Set<number>>(new Set())

  const { data: submitted = false } = useQuery({
    queryKey: ['dcr-today-submitted', mrId, today],
    enabled: enabled && !!mrId && !!supabase,
    staleTime: 60_000,
    refetchInterval: 5 * 60_000,
    queryFn: async (): Promise<boolean> => {
      if (!supabase) return false
      const { data, error } = await supabase
        .from('daily_reports')
        .select('id')
        .eq('mr_id', mrId)
        .eq('report_date', today)
        .in('status', ['submitted', 'approved'])
        .limit(1)
      if (error) return false
      return (data?.length ?? 0) > 0
    },
  })

  useEffect(() => {
    if (!enabled || !mrId || submitted) return

    const tick = () => {
      const hour = istHourNow()
      if (!REMINDER_HOURS.includes(hour as (typeof REMINDER_HOURS)[number])) return
      if (firedRef.current.has(hour)) return

      const key = reminderStorageKey(mrId, today, hour)
      if (typeof localStorage !== 'undefined' && localStorage.getItem(key)) {
        firedRef.current.add(hour)
        return
      }

      const title = hour === 20 ? 'DCR reminder — 8 PM' : 'DCR reminder — 11 PM'
      const body =
        hour === 20
          ? "You haven't submitted today's DCR yet. Tap to fill it now."
          : "Last call: submit today's DCR before the day ends."

      showBrowserNotification({
        id: key,
        title,
        body,
        url: NOTIFICATION_ROUTES.mrDcrNew,
        tag: 'dcr_reminder',
      })

      try {
        localStorage.setItem(key, new Date().toISOString())
      } catch {
        /* ignore */
      }
      firedRef.current.add(hour)
    }

    tick()
    const id = window.setInterval(tick, 60_000)
    return () => window.clearInterval(id)
  }, [enabled, mrId, submitted, today])
}
