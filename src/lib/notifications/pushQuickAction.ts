import { supabase } from '@/lib/supabase'

export type QuickPushAction = 'approve' | 'reject'

/** Execute Approve/Decline from a push notification token (Phase 2C). */
export async function executePushQuickAction(
  token: string,
  action: QuickPushAction,
): Promise<{ ok: boolean; requiresApp?: boolean; error?: string }> {
  if (!supabase) {
    return { ok: false, error: 'Supabase not configured' }
  }

  const { data, error } = await supabase.rpc('execute_notification_quick_action', {
    p_token: token,
    p_action: action,
  })

  if (error) {
    const msg = error.message ?? 'Action failed'
    if (msg.includes('quick_action_requires_app')) {
      return { ok: false, requiresApp: true, error: msg }
    }
    return { ok: false, error: msg }
  }

  return { ok: !!(data as { ok?: boolean } | null)?.ok }
}

/** Read quick-action params from hash query (?quickAction=approve&quickToken=...) */
export function readQuickActionFromHash(): { action: QuickPushAction; token: string } | null {
  if (typeof window === 'undefined') return null

  const hash = window.location.hash.replace(/^#/, '')
  const qIndex = hash.indexOf('?')
  if (qIndex < 0) return null

  const params = new URLSearchParams(hash.slice(qIndex + 1))
  const action = params.get('quickAction')
  const token = params.get('quickToken')

  if (action !== 'approve' && action !== 'reject') return null
  if (!token) return null

  return { action, token }
}

export function stripQuickActionFromHash(): void {
  if (typeof window === 'undefined') return

  const hash = window.location.hash.replace(/^#/, '')
  const qIndex = hash.indexOf('?')
  if (qIndex < 0) return

  const path = hash.slice(0, qIndex)
  const params = new URLSearchParams(hash.slice(qIndex + 1))
  params.delete('quickAction')
  params.delete('quickToken')

  const rest = params.toString()
  window.location.hash = rest ? `${path}?${rest}` : path
}
