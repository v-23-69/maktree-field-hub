import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { GoogleAuth } from 'npm:google-auth-library@9'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-push-hook-secret',
}

type PushAction = {
  id: string
  label: string
  token: string
}

type PushMetadata = {
  subtitle?: string
  big_text?: string
  channel?: string
  actions?: PushAction[]
  [key: string]: unknown
}

type PushPayload = {
  user_id: string
  title: string
  body: string
  url?: string
  kind?: string
  notification_id?: string
  metadata?: PushMetadata
}

type ServiceAccount = {
  project_id: string
  client_email: string
  private_key: string
}

function parseServiceAccount(raw: string | undefined): ServiceAccount | null {
  if (!raw?.trim()) return null
  try {
    const parsed = JSON.parse(raw) as ServiceAccount
    if (!parsed.project_id || !parsed.client_email || !parsed.private_key) return null
    return parsed
  } catch {
    return null
  }
}

function channelForKind(kind: string | undefined, metadata?: PushMetadata): string {
  if (metadata?.channel && typeof metadata.channel === 'string') return metadata.channel
  if (!kind) return 'maktree_activity'
  if (
    [
      'doctor_add_request',
      'doctor_deletion_request',
      'leave_request',
      'late_dcr_request',
      'tp_deletion_request',
      'unlock_request',
      'tour_program_request',
      'account_blocked',
    ].includes(kind)
  ) {
    return 'maktree_alerts'
  }
  if (kind.includes('reminder') || kind === 'dcr_missed') return 'maktree_reminders'
  return 'maktree_activity'
}

async function getFcmAccessToken(sa: ServiceAccount): Promise<string> {
  const auth = new GoogleAuth({
    credentials: {
      client_email: sa.client_email,
      private_key: sa.private_key,
    },
    scopes: ['https://www.googleapis.com/auth/firebase.messaging'],
  })
  const client = await auth.getClient()
  const token = await client.getAccessToken()
  if (!token.token) throw new Error('Failed to obtain FCM access token')
  return token.token
}

function buildDataPayload(payload: PushPayload): Record<string, string> {
  const url = payload.url?.startsWith('/') ? payload.url : `/${payload.url ?? ''}`
  const meta = payload.metadata ?? {}
  const subtitle = typeof meta.subtitle === 'string' ? meta.subtitle : ''
  const bigText =
    typeof meta.big_text === 'string' && meta.big_text.trim() ? meta.big_text : payload.body ?? ''
  const actions = Array.isArray(meta.actions) ? meta.actions : []

  return {
    title: payload.title,
    body: payload.body ?? '',
    subtitle,
    big_text: bigText,
    url,
    kind: payload.kind ?? '',
    notification_id: payload.notification_id ?? '',
    channel_id: channelForKind(payload.kind, meta),
    actions: JSON.stringify(actions),
    // Hint for native service: render custom notification with action buttons.
    display_mode: hasQuickActions(payload) ? 'rich_actions' : 'standard',
  }
}

function hasQuickActions(payload: PushPayload): boolean {
  const actions = payload.metadata?.actions
  if (!Array.isArray(actions) || actions.length === 0) return false
  return actions.some(
    (action) =>
      action &&
      typeof action === 'object' &&
      typeof action.id === 'string' &&
      typeof action.token === 'string' &&
      action.token.length > 0,
  )
}

async function sendFcmMessage(
  accessToken: string,
  projectId: string,
  deviceToken: string,
  payload: PushPayload,
): Promise<void> {
  const data = buildDataPayload(payload)
  const channelId = data.channel_id || 'maktree_alerts'
  const displayBody =
    (data.big_text && data.big_text.trim()) || data.body || payload.title
  const quickActions = hasQuickActions(payload)

  // Approval notifications: data-only → MaktreeFirebaseMessagingService shows Approve/Decline.
  // FYI notifications: include notification block so they appear even without the custom service.
  const message: Record<string, unknown> = {
    token: deviceToken,
    data,
    android: {
      priority: 'HIGH',
    },
  }

  if (!quickActions) {
    message.notification = {
      title: payload.title,
      body: displayBody,
    }
    ;(message.android as Record<string, unknown>).notification = {
      channel_id: channelId,
    }
  }

  const response = await fetch(`https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`FCM error ${response.status}: ${text}`)
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const hookSecret = Deno.env.get('PUSH_HOOK_SECRET') ?? ''
    const incomingSecret = req.headers.get('x-push-hook-secret') ?? ''
    if (!hookSecret || hookSecret !== incomingSecret) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const sa = parseServiceAccount(Deno.env.get('FCM_SERVICE_ACCOUNT_JSON'))
    if (!sa) {
      return new Response(JSON.stringify({ error: 'FCM not configured' }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const payload = (await req.json()) as PushPayload
    if (!payload.user_id || !payload.title) {
      throw new Error('user_id and title are required')
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SERVICE_ROLE_KEY') ?? '',
    )

    const { data: tokens, error: tokenErr } = await supabaseAdmin
      .from('device_push_tokens')
      .select('token')
      .eq('user_id', payload.user_id)

    if (tokenErr) throw tokenErr
    if (!tokens?.length) {
      return new Response(JSON.stringify({ sent: 0, skipped: 'no_tokens' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const accessToken = await getFcmAccessToken(sa)
    const results = await Promise.allSettled(
      tokens.map((row) => sendFcmMessage(accessToken, sa.project_id, row.token, payload)),
    )

    const sent = results.filter((r) => r.status === 'fulfilled').length
    const failed = results.filter((r) => r.status === 'rejected').length
    const errors = results
      .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
      .map((r) => (r.reason instanceof Error ? r.reason.message : String(r.reason)))

    return new Response(JSON.stringify({ sent, failed, total: tokens.length, project_id: sa.project_id, errors }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
