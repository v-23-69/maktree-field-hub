-- Native push (FCM): device token storage + optional pg_net dispatch on new notifications.
-- Requires Edge Function `send-push-notification` + secrets (see docs/firebase-setup.md).

CREATE EXTENSION IF NOT EXISTS pg_net;

CREATE TABLE IF NOT EXISTS public.device_push_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token text NOT NULL,
  platform text NOT NULL DEFAULT 'android',
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT device_push_tokens_token_unique UNIQUE (token),
  CONSTRAINT device_push_tokens_platform_check CHECK (platform IN ('android', 'ios', 'web'))
);

CREATE INDEX IF NOT EXISTS idx_device_push_tokens_user_id
  ON public.device_push_tokens(user_id);

ALTER TABLE public.device_push_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS device_push_tokens_select_own ON public.device_push_tokens;
CREATE POLICY device_push_tokens_select_own ON public.device_push_tokens
  FOR SELECT TO authenticated
  USING (
    user_id = public.session_profile_id()
  );

DROP POLICY IF EXISTS device_push_tokens_delete_own ON public.device_push_tokens;
CREATE POLICY device_push_tokens_delete_own ON public.device_push_tokens
  FOR DELETE TO authenticated
  USING (
    user_id = public.session_profile_id()
  );

GRANT SELECT, DELETE ON public.device_push_tokens TO authenticated;

CREATE OR REPLACE FUNCTION public.register_device_push_token(
  p_token text,
  p_platform text DEFAULT 'android'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_token text;
  v_platform text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  v_user_id := public.session_profile_id();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Active user profile not found';
  END IF;

  v_token := trim(COALESCE(p_token, ''));
  IF length(v_token) < 10 THEN
    RAISE EXCEPTION 'Invalid push token';
  END IF;

  v_platform := lower(trim(COALESCE(NULLIF(p_platform, ''), 'android')));
  IF v_platform NOT IN ('android', 'ios', 'web') THEN
    v_platform := 'android';
  END IF;

  PERFORM set_config('row_security', 'off', true);

  INSERT INTO public.device_push_tokens (user_id, token, platform, last_seen_at, updated_at)
  VALUES (v_user_id, v_token, v_platform, now(), now())
  ON CONFLICT (token) DO UPDATE SET
    user_id = EXCLUDED.user_id,
    platform = EXCLUDED.platform,
    last_seen_at = now(),
    updated_at = now();
END;
$$;

REVOKE ALL ON FUNCTION public.register_device_push_token(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.register_device_push_token(text, text) TO authenticated;

-- Internal hook secret (set once after deploying Edge Function — see docs/firebase-setup.md)
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;

CREATE TABLE IF NOT EXISTS private.push_dispatch_config (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

REVOKE ALL ON TABLE private.push_dispatch_config FROM PUBLIC;

CREATE OR REPLACE FUNCTION private.get_push_hook_secret()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = private, public
AS $$
  SELECT NULLIF(trim(value), '')
  FROM private.push_dispatch_config
  WHERE key = 'push_hook_secret'
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION private.get_push_hook_secret() FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.trigger_send_push_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private
AS $$
DECLARE
  v_url constant text := 'https://limgkjuywvudkxnantda.supabase.co/functions/v1/send-push-notification';
  v_secret text;
BEGIN
  v_secret := private.get_push_hook_secret();
  IF v_secret IS NULL THEN
    RETURN NEW;
  END IF;

  BEGIN
    PERFORM net.http_post(
      url := v_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-push-hook-secret', v_secret
      ),
      body := jsonb_build_object(
        'user_id', NEW.user_id,
        'title', NEW.title,
        'body', NEW.body,
        'url', NEW.url,
        'kind', NEW.kind,
        'notification_id', NEW.id
      )
    );
  EXCEPTION
    WHEN undefined_function THEN
      -- pg_net not enabled — in-app notifications still work; configure webhook manually.
      NULL;
    WHEN OTHERS THEN
      NULL;
  END;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_user_notifications_send_push ON public.user_notifications;
CREATE TRIGGER trg_user_notifications_send_push
  AFTER INSERT ON public.user_notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_send_push_notification();
