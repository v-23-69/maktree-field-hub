import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import {
  useEmployeesBirthdayToday,
  useSendBirthdayWish,
} from '@/hooks/useEmployeeBirthdays'
import {
  isBirthdayDismissed,
  isBirthdayWishedLocally,
  markBirthdayDismissed,
  markBirthdayWished,
} from '@/lib/employeeBirthdayStorage'
import type { EmployeeBirthdayToday } from '@/types/database.types'
import EmployeeBirthdayWishDialog from './EmployeeBirthdayWishDialog'

function shouldShowWishModal(
  person: EmployeeBirthdayToday,
  currentUserId: string,
  wishedIds: Set<string>,
) {
  if (person.user_id === currentUserId) return false
  if (isBirthdayDismissed(person.user_id)) return false
  if (isBirthdayWishedLocally(person.user_id, currentUserId)) return false
  if (wishedIds.has(person.user_id)) return false
  return true
}

export default function EmployeeBirthdayProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth()
  const location = useLocation()
  const isPublicRoute = location.pathname === '/login' || location.pathname === '/blocked-complaint'

  const enabled = isAuthenticated && !!user && !isPublicRoute
  const { data: birthdays = [] } = useEmployeesBirthdayToday(enabled)
  const sendWish = useSendBirthdayWish()

  const [wishedRecipientIds, setWishedRecipientIds] = useState<Set<string>>(() => new Set())
  const [queueIndex, setQueueIndex] = useState(0)
  const [dialogOpen, setDialogOpen] = useState(false)

  const colleaguesQueue = useMemo(() => {
    if (!user) return []
    return birthdays.filter(p => shouldShowWishModal(p, user.id, wishedRecipientIds))
  }, [birthdays, user, wishedRecipientIds])

  const activePerson = colleaguesQueue[queueIndex] ?? null

  useEffect(() => {
    if (!enabled || colleaguesQueue.length === 0) {
      setDialogOpen(false)
      return
    }
    if (queueIndex >= colleaguesQueue.length) {
      setQueueIndex(0)
      return
    }
    const t = window.setTimeout(() => setDialogOpen(true), 600)
    return () => window.clearTimeout(t)
  }, [enabled, colleaguesQueue.length, queueIndex, activePerson?.user_id])

  const advanceQueue = useCallback(() => {
    setDialogOpen(false)
    setQueueIndex(i => i + 1)
  }, [])

  const handleSendWish = useCallback(
    async (message: string) => {
      if (!user || !activePerson) return
      await sendWish.mutateAsync({
        recipientId: activePerson.user_id,
        message,
      })
      markBirthdayWished(activePerson.user_id, user.id)
      setWishedRecipientIds(prev => new Set(prev).add(activePerson.user_id))
      toast.success(`Wishes sent to ${activePerson.full_name}!`)
      advanceQueue()
    },
    [user, activePerson, sendWish, advanceQueue],
  )

  const handleSendWishSafe = useCallback(
    async (message: string) => {
      try {
        await handleSendWish(message)
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Could not send wish')
      }
    },
    [handleSendWish],
  )

  const handleSkipToday = useCallback(() => {
    if (activePerson) markBirthdayDismissed(activePerson.user_id)
    advanceQueue()
  }, [activePerson, advanceQueue])

  return (
    <>
      {children}
      {enabled && (
        <EmployeeBirthdayWishDialog
          key={activePerson?.user_id ?? 'none'}
          person={activePerson}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSendWish={handleSendWishSafe}
          onSkipToday={handleSkipToday}
          isSending={sendWish.isPending}
        />
      )}
    </>
  )
}
