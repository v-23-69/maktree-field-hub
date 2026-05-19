import { todayInputDate } from '@/lib/dateUtils'

const PREFIX = 'mk-emp-bday'

export function birthdayDismissKey(recipientId: string, istYmd = todayInputDate()) {
  return `${PREFIX}-dismiss-${istYmd}-${recipientId}`
}

export function birthdayWishedKey(recipientId: string, senderId: string, istYmd = todayInputDate()) {
  return `${PREFIX}-wished-${istYmd}-${recipientId}-${senderId}`
}

export function isBirthdayDismissed(recipientId: string, istYmd = todayInputDate()) {
  try {
    return localStorage.getItem(birthdayDismissKey(recipientId, istYmd)) === '1'
  } catch {
    return false
  }
}

export function markBirthdayDismissed(recipientId: string, istYmd = todayInputDate()) {
  try {
    localStorage.setItem(birthdayDismissKey(recipientId, istYmd), '1')
  } catch {
    /* ignore */
  }
}

export function isBirthdayWishedLocally(recipientId: string, senderId: string, istYmd = todayInputDate()) {
  try {
    return localStorage.getItem(birthdayWishedKey(recipientId, senderId, istYmd)) === '1'
  } catch {
    return false
  }
}

export function markBirthdayWished(recipientId: string, senderId: string, istYmd = todayInputDate()) {
  try {
    localStorage.setItem(birthdayWishedKey(recipientId, senderId, istYmd), '1')
  } catch {
    /* ignore */
  }
}
