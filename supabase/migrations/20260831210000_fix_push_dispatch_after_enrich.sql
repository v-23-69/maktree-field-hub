-- Fix push dispatch timing: send after metadata enrichment, not on raw INSERT.

CREATE OR REPLACE FUNCTION public._dispatch_push_notification(p_notification_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private
AS $$
DECLARE
  v_url constant text := 'https://limgkjuywvudkxnantda.supabase.co/functions/v1/send-push-notification';
  v_secret text;
  v_row public.user_notifications%ROWTYPE;
BEGIN
  v_secret := private.get_push_hook_secret();
  IF v_secret IS NULL THEN
    RETURN;
  END IF;

  SELECT * INTO v_row FROM public.user_notifications WHERE id = p_notification_id;
  IF NOT FOUND THEN
    RETURN;
  END IF;

  BEGIN
    PERFORM net.http_post(
      url := v_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-push-hook-secret', v_secret
      ),
      body := jsonb_build_object(
        'user_id', v_row.user_id,
        'title', v_row.title,
        'body', v_row.body,
        'url', v_row.url,
        'kind', v_row.kind,
        'notification_id', v_row.id,
        'metadata', COALESCE(v_row.metadata, '{}'::jsonb)
      )
    );
  EXCEPTION
    WHEN undefined_function THEN NULL;
    WHEN OTHERS THEN NULL;
  END;
END;
$$;

REVOKE ALL ON FUNCTION public._dispatch_push_notification(uuid) FROM PUBLIC;

CREATE OR REPLACE FUNCTION public._enrich_notification_push(p_notification_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_row public.user_notifications%ROWTYPE;
  v_meta jsonb;
  v_subtitle text;
  v_big text;
  v_channel text;
  v_request_id uuid;
  v_mr_name text;
  v_entity text;
  v_actions jsonb := '[]'::jsonb;
  v_token_approve text;
  v_token_reject text;
  v_actionable boolean := false;
BEGIN
  SELECT * INTO v_row FROM public.user_notifications WHERE id = p_notification_id;
  IF NOT FOUND THEN
    RETURN;
  END IF;

  v_meta := COALESCE(v_row.metadata, '{}'::jsonb);
  v_mr_name := COALESCE(v_meta ->> 'mr_name', public._user_display_name((v_meta ->> 'mr_id')::uuid));
  v_entity := COALESCE(v_meta ->> 'entity_name', v_meta ->> 'doctor_name', '');

  v_request_id := COALESCE(
    NULLIF(v_meta ->> 'request_id', '')::uuid,
    NULLIF(v_meta ->> 'leave_id', '')::uuid
  );

  v_channel := public._notification_channel_for_kind(v_row.kind);

  v_subtitle := CASE v_row.kind
    WHEN 'doctor_add_request' THEN
      COALESCE(v_mr_name, 'MR') ||
      CASE WHEN v_entity <> '' THEN ' · Dr. ' || v_entity ELSE '' END
    WHEN 'doctor_deletion_request' THEN
      COALESCE(v_mr_name, 'MR') ||
      CASE WHEN v_entity <> '' THEN ' · remove Dr. ' || v_entity ELSE '' END
    WHEN 'leave_request' THEN
      COALESCE(v_mr_name, 'MR') || ' · leave without pay'
    WHEN 'late_dcr_request' THEN
      COALESCE(v_mr_name, 'MR') || ' · late DCR dates'
    WHEN 'dcr_submitted' THEN
      COALESCE(v_mr_name, 'MR') || ' · DCR filed'
    WHEN 'unlock_request' THEN COALESCE(v_mr_name, 'MR') || ' · DCR unlock'
    WHEN 'tp_deletion_request' THEN COALESCE(v_mr_name, 'MR') || ' · tour program'
    WHEN 'account_blocked' THEN 'Maktree SFA · account access'
    ELSE COALESCE(v_mr_name, 'Maktree SFA')
  END;

  v_big := COALESCE(NULLIF(trim(v_meta ->> 'big_text'), ''), v_row.body);

  v_actionable := v_row.kind IN (
    'doctor_add_request', 'doctor_deletion_request', 'leave_request',
    'late_dcr_request', 'tp_deletion_request', 'unlock_request'
  ) AND v_request_id IS NOT NULL;

  IF v_actionable THEN
    v_token_approve := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
    v_token_reject := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');

    INSERT INTO public.notification_quick_action_tokens (
      notification_id, user_id, action_key, token, kind, request_id, expires_at
    ) VALUES
      (p_notification_id, v_row.user_id, 'approve', v_token_approve, v_row.kind, v_request_id, now() + interval '15 minutes'),
      (p_notification_id, v_row.user_id, 'reject', v_token_reject, v_row.kind, v_request_id, now() + interval '15 minutes');

    v_actions := jsonb_build_array(
      jsonb_build_object('id', 'approve', 'label', 'Approve', 'token', v_token_approve),
      jsonb_build_object('id', 'reject', 'label', 'Decline', 'token', v_token_reject)
    );
  END IF;

  UPDATE public.user_notifications
  SET metadata = v_meta || jsonb_build_object(
    'subtitle', v_subtitle,
    'big_text', v_big,
    'channel', v_channel,
    'actions', v_actions,
    'notification_id', p_notification_id
  )
  WHERE id = p_notification_id;

  PERFORM public._dispatch_push_notification(p_notification_id);
END;
$$;

DROP TRIGGER IF EXISTS trg_user_notifications_send_push ON public.user_notifications;
