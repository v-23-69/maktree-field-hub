import { supabase } from '@/lib/supabase'

const LOCAL_TOKEN_KEY = 'maktree-push-token'

export function getStoredPushToken(): string | null {
  try {
    return localStorage.getItem(LOCAL_TOKEN_KEY)
  } catch {
    return null
  }
}

export async function registerDevicePushToken(
  token: string,
  platform: 'android' | 'ios' | 'web' = 'android',
): Promise<void> {
  if (!supabase || !token.trim()) return

  const { error } = await supabase.rpc('register_device_push_token', {
    p_token: token.trim(),
    p_platform: platform,
  })

  if (error) {
    console.error('[Push] failed to save token:', error.message)
    return
  }

  try {
    localStorage.setItem(LOCAL_TOKEN_KEY, token.trim())
  } catch {
    /* ignore */
  }
}

export async function unregisterDevicePushToken(): Promise<void> {
  const token = getStoredPushToken()
  if (!supabase || !token) return

  const { error } = await supabase.rpc('unregister_device_push_token', {
    p_token: token,
  })

  if (error) {
    console.error('[Push] failed to remove token:', error.message)
  }

  try {
    localStorage.removeItem(LOCAL_TOKEN_KEY)
  } catch {
    /* ignore */
  }
}
