-- Phase 2C: rich push payloads, quick-action tokens, personalized copy, account-blocked alert.

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public._user_display_name(p_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NULLIF(trim(u.full_name), '')
  FROM public.users u
  WHERE u.id = p_user_id;
$$;

REVOKE ALL ON FUNCTION public._user_display_name(uuid) FROM PUBLIC;

CREATE OR REPLACE FUNCTION public._notification_channel_for_kind(p_kind text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN p_kind IN (
      'doctor_add_request', 'doctor_deletion_request', 'leave_request',
      'late_dcr_request', 'tp_deletion_request', 'unlock_request',
      'tour_program_request', 'account_blocked'
    ) THEN 'maktree_alerts'
    WHEN p_kind LIKE '%reminder%' OR p_kind IN ('dcr_reminder', 'dcr_missed') THEN 'maktree_reminders'
    ELSE 'maktree_activity'
  END;
$$;

-- ---------------------------------------------------------------------------
-- One-time tokens for notification shade Approve / Decline
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notification_quick_action_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id uuid NOT NULL REFERENCES public.user_notifications(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  action_key text NOT NULL CHECK (action_key IN ('approve', 'reject')),
  token text NOT NULL UNIQUE,
  kind text NOT NULL,
  request_id uuid,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notification_quick_action_tokens_lookup
  ON public.notification_quick_action_tokens(token)
  WHERE used_at IS NULL;

ALTER TABLE public.notification_quick_action_tokens ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.notification_quick_action_tokens FROM PUBLIC;

-- ---------------------------------------------------------------------------
-- Enrich in-app row + push metadata (subtitle, big_text, actions, channel)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public._enrich_notification_push(p_notification_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

REVOKE ALL ON FUNCTION public._enrich_notification_push(uuid) FROM PUBLIC;

-- Push is dispatched from _enrich_notification_push (after metadata + action tokens).
-- The old AFTER INSERT trigger is removed in 20260831210000_fix_push_dispatch_after_enrich.sql.

CREATE OR REPLACE FUNCTION public._notify_user(
  p_user_id uuid,
  p_kind text,
  p_title text,
  p_body text,
  p_url text DEFAULT '/',
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  PERFORM set_config('row_security', 'off', true);
  INSERT INTO public.user_notifications (user_id, kind, title, body, url, metadata)
  VALUES (p_user_id, p_kind, p_title, p_body, COALESCE(NULLIF(trim(p_url), ''), '/'), COALESCE(p_metadata, '{}'::jsonb))
  RETURNING id INTO v_id;

  BEGIN
    PERFORM public._enrich_notification_push(v_id);
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public._notify_user(uuid, text, text, text, text, jsonb) FROM PUBLIC;

-- ---------------------------------------------------------------------------
-- Push dispatch helper (called after enrichment)
-- ---------------------------------------------------------------------------
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
  IF v_secret IS NULL THEN RETURN; END IF;

  SELECT * INTO v_row FROM public.user_notifications WHERE id = p_notification_id;
  IF NOT FOUND THEN RETURN; END IF;

  BEGIN
    PERFORM net.http_post(
      url := v_url,
      headers := jsonb_build_object('Content-Type', 'application/json', 'x-push-hook-secret', v_secret),
      body := jsonb_build_object(
        'user_id', v_row.user_id, 'title', v_row.title, 'body', v_row.body,
        'url', v_row.url, 'kind', v_row.kind, 'notification_id', v_row.id,
        'metadata', COALESCE(v_row.metadata, '{}'::jsonb)
      )
    );
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
END;
$$;

REVOKE ALL ON FUNCTION public._dispatch_push_notification(uuid) FROM PUBLIC;

-- ---------------------------------------------------------------------------
-- Quick resolve helpers (manager_id from token — no auth session required)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public._quick_resolve_doctor_add(
  p_manager_id uuid,
  p_request_id uuid,
  p_action text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status text;
  v_mgr_name text;
  v_req public.doctor_add_requests%ROWTYPE;
  v_doc jsonb;
BEGIN
  v_status := CASE WHEN p_action = 'approve' THEN 'approved' ELSE 'rejected' END;

  SELECT * INTO v_req FROM public.doctor_add_requests WHERE id = p_request_id FOR UPDATE;
  IF NOT FOUND OR v_req.status <> 'pending' THEN
    RAISE EXCEPTION 'Request not found or already resolved';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.mr_manager_map mm
    WHERE mm.manager_id = p_manager_id AND mm.mr_id = v_req.mr_id
  ) AND v_req.manager_id <> p_manager_id THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;

  SELECT public._user_display_name(p_manager_id) INTO v_mgr_name;

  IF v_status = 'rejected' THEN
    UPDATE public.doctor_add_requests
    SET status = 'rejected', resolved_at = now()
    WHERE id = p_request_id;

    v_doc := v_req.payload -> 'doctor';
    PERFORM public._notify_user(
      v_req.mr_id,
      'doctor_add_rejected',
      'Doctor add declined',
      COALESCE(v_mgr_name, 'Your manager') || ' declined adding Dr. ' ||
        COALESCE(v_doc ->> 'full_name', 'this doctor') || ' to your list.',
      '/mr/master-list',
      jsonb_build_object('request_id', p_request_id, 'entity_name', v_doc ->> 'full_name')
    );
    RETURN;
  END IF;

  PERFORM public._resolve_doctor_add_as_manager(p_manager_id, p_request_id, 'approved', NULL);
END;
$$;

CREATE OR REPLACE FUNCTION public._resolve_doctor_add_as_manager(
  p_manager_id uuid,
  p_request_id uuid,
  p_status text,
  p_manager_note text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_mgr_name text;
  v_req public.doctor_add_requests%ROWTYPE;
  v_doc jsonb;
  v_doctor_id uuid;
  v_chem jsonb;
  v_chem_id uuid;
  v_chem_name text;
  v_now timestamptz := now();
BEGIN
  IF p_status NOT IN ('approved', 'rejected') THEN
    RAISE EXCEPTION 'Invalid status';
  END IF;

  v_mgr_name := public._user_display_name(p_manager_id);

  SELECT * INTO v_req FROM public.doctor_add_requests WHERE id = p_request_id FOR UPDATE;
  IF NOT FOUND OR v_req.status <> 'pending' THEN
    RAISE EXCEPTION 'Request not found or already resolved';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.mr_manager_map mm
    WHERE mm.manager_id = p_manager_id AND mm.mr_id = v_req.mr_id
  ) AND v_req.manager_id <> p_manager_id THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;

  PERFORM set_config('row_security', 'off', true);
  v_doc := v_req.payload -> 'doctor';

  IF p_status = 'rejected' THEN
    UPDATE public.doctor_add_requests
    SET status = 'rejected', manager_note = NULLIF(trim(p_manager_note), ''), resolved_at = v_now
    WHERE id = p_request_id;

    PERFORM public._notify_user(
      v_req.mr_id,
      'doctor_add_rejected',
      'Doctor add declined',
      COALESCE(v_mgr_name, 'Your manager') || ' declined adding Dr. ' ||
        COALESCE(v_doc ->> 'full_name', 'this doctor') || ' to your list.',
      '/mr/master-list',
      jsonb_build_object('request_id', p_request_id, 'entity_name', v_doc ->> 'full_name')
    );
    RETURN;
  END IF;

  INSERT INTO public.doctors (
    sub_area_id, doctor_code, full_name, speciality, qualification, address, city, mobile,
    birthday, marriage_anniversary, visit_frequency, monthly_visit_target, is_active, master_list_complete
  )
  VALUES (
    v_req.sub_area_id, '', trim(v_doc ->> 'full_name'),
    NULLIF(trim(COALESCE(v_doc ->> 'speciality', '')), ''),
    NULLIF(trim(COALESCE(v_doc ->> 'qualification', '')), ''),
    NULLIF(trim(COALESCE(v_doc ->> 'address', '')), ''),
    NULLIF(trim(COALESCE(v_doc ->> 'city', '')), ''),
    NULLIF(trim(COALESCE(v_doc ->> 'mobile', '')), ''),
    NULLIF(trim(COALESCE(v_doc ->> 'birthday', '')), ''),
    NULLIF(trim(COALESCE(v_doc ->> 'marriage_anniversary', '')), ''),
    CASE WHEN v_doc ->> 'visit_frequency' IN ('weekly', 'fortnightly', 'monthly') THEN v_doc ->> 'visit_frequency' ELSE NULL END,
    LEAST(99, GREATEST(1, COALESCE((v_doc ->> 'monthly_visit_target')::int, 2))),
    true, false
  )
  RETURNING id INTO v_doctor_id;

  FOR v_chem IN SELECT * FROM jsonb_array_elements(COALESCE(v_req.payload -> 'chemists', '[]'::jsonb))
  LOOP
    v_chem_name := trim(COALESCE(v_chem ->> 'name', ''));
    IF length(v_chem_name) < 1 THEN CONTINUE; END IF;

    INSERT INTO public.chemists (sub_area_id, name, owner_name, owner_contact, is_active)
    VALUES (
      v_req.sub_area_id, v_chem_name,
      NULLIF(trim(COALESCE(v_chem ->> 'owner_name', '')), ''),
      NULLIF(trim(COALESCE(v_chem ->> 'owner_contact', '')), ''),
      true
    )
    RETURNING id INTO v_chem_id;

    INSERT INTO public.chemist_doctor_map (chemist_id, doctor_id) VALUES (v_chem_id, v_doctor_id);
  END LOOP;

  PERFORM public.assign_sub_area_to_mr(v_req.mr_id, v_req.sub_area_id);

  UPDATE public.doctor_add_requests
  SET status = 'approved', doctor_id = v_doctor_id,
      manager_note = NULLIF(trim(p_manager_note), ''), approved_by = p_manager_id, resolved_at = v_now
  WHERE id = p_request_id;

  PERFORM public._notify_user(
    v_req.mr_id,
    'doctor_add_approved',
    'Doctor approved',
    COALESCE(v_mgr_name, 'Your manager') || ' approved Dr. ' ||
      COALESCE(v_doc ->> 'full_name', 'Doctor') || ' — now active in your list.',
    '/mr/master-list?subAreaId=' || v_req.sub_area_id::text || '&doctorId=' || v_doctor_id::text,
    jsonb_build_object(
      'doctor_id', v_doctor_id,
      'request_id', p_request_id,
      'entity_name', v_doc ->> 'full_name',
      'manager_name', v_mgr_name
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION public._resolve_doctor_add_as_manager(uuid, uuid, text, text) FROM PUBLIC;

CREATE OR REPLACE FUNCTION public._quick_resolve_doctor_deletion(
  p_manager_id uuid,
  p_request_id uuid,
  p_action text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_req public.doctor_deletion_requests%ROWTYPE;
  v_status text;
BEGIN
  v_status := CASE WHEN p_action = 'approve' THEN 'approved' ELSE 'rejected' END;

  SELECT * INTO v_req FROM public.doctor_deletion_requests WHERE id = p_request_id FOR UPDATE;
  IF NOT FOUND OR v_req.status <> 'pending' THEN
    RAISE EXCEPTION 'Request not found or already resolved';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.mr_manager_map mm
    WHERE mm.manager_id = p_manager_id AND mm.mr_id = v_req.mr_id
  ) THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;

  UPDATE public.doctor_deletion_requests
  SET
    status = v_status,
    approved_by = CASE WHEN v_status = 'approved' THEN p_manager_id ELSE NULL END,
    resolved_at = now()
  WHERE id = p_request_id;

  IF v_status = 'approved' THEN
    UPDATE public.doctors SET is_active = false WHERE id = v_req.doctor_id;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.execute_notification_quick_action(
  p_token text,
  p_action text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tok public.notification_quick_action_tokens%ROWTYPE;
  v_action text;
BEGIN
  v_action := lower(trim(p_action));
  IF v_action NOT IN ('approve', 'reject') THEN
    RAISE EXCEPTION 'Invalid action';
  END IF;

  SELECT * INTO v_tok
  FROM public.notification_quick_action_tokens
  WHERE token = p_token
    AND used_at IS NULL
    AND expires_at > now()
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or expired token';
  END IF;

  IF v_tok.action_key <> v_action THEN
    RAISE EXCEPTION 'Token does not match action';
  END IF;

  UPDATE public.notification_quick_action_tokens
  SET used_at = now()
  WHERE id = v_tok.id;

  CASE v_tok.kind
    WHEN 'doctor_add_request' THEN
      PERFORM public._quick_resolve_doctor_add(v_tok.user_id, v_tok.request_id, v_action);
    WHEN 'doctor_deletion_request' THEN
      PERFORM public._quick_resolve_doctor_deletion(v_tok.user_id, v_tok.request_id, v_action);
    WHEN 'leave_request' THEN
      RAISE EXCEPTION 'quick_action_requires_app';
    WHEN 'late_dcr_request' THEN
      RAISE EXCEPTION 'quick_action_requires_app';
    WHEN 'tp_deletion_request' THEN
      RAISE EXCEPTION 'quick_action_requires_app';
    WHEN 'unlock_request' THEN
      RAISE EXCEPTION 'quick_action_requires_app';
    ELSE
      RAISE EXCEPTION 'Quick action not supported for this notification type';
  END CASE;

  RETURN jsonb_build_object('ok', true, 'kind', v_tok.kind, 'action', v_action);
END;
$$;

REVOKE ALL ON FUNCTION public.execute_notification_quick_action(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.execute_notification_quick_action(text, text) TO anon, authenticated;

-- Note: leave/late_dcr/tp/unlock quick actions require auth session in existing RPCs.
-- Doctor add/deletion use dedicated _quick_* paths above.

-- ---------------------------------------------------------------------------
-- Rich copy: doctor add submit + resolve
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.submit_doctor_add_request(
  p_mr_id uuid,
  p_sub_area_id uuid,
  p_manager_id uuid DEFAULT NULL,
  p_payload jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_me_id uuid;
  v_role text;
  v_mr_name text;
  v_name text;
  v_spec text;
  v_req_id uuid;
  v_mgr uuid;
  v_url text;
  v_body text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  v_me_id := public.session_profile_id();
  v_role := public.current_user_role();

  IF v_me_id IS NULL THEN
    RAISE EXCEPTION 'Active user profile not found';
  END IF;

  IF v_role NOT IN ('admin', 'mr') OR (v_role = 'mr' AND v_me_id <> p_mr_id) THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.mr_sub_area_access msa
    WHERE msa.mr_id = p_mr_id AND msa.sub_area_id = p_sub_area_id
  ) THEN
    RAISE EXCEPTION 'You are not assigned to this sub-area';
  END IF;

  v_name := trim(COALESCE(p_payload -> 'doctor' ->> 'full_name', ''));
  IF length(v_name) < 1 THEN
    RAISE EXCEPTION 'Doctor name is required';
  END IF;

  v_spec := trim(COALESCE(p_payload -> 'doctor' ->> 'speciality', ''));
  IF v_spec = '' THEN
    RAISE EXCEPTION 'Speciality is required';
  END IF;

  v_mgr := p_manager_id;
  IF v_mgr IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.mr_manager_map mm
    WHERE mm.mr_id = p_mr_id AND mm.manager_id = v_mgr
  ) THEN
    v_mgr := NULL;
  END IF;

  IF v_mgr IS NULL THEN
    v_mgr := public.primary_manager_for_mr(p_mr_id);
  END IF;

  IF v_mgr IS NULL THEN
    RAISE EXCEPTION 'No manager is assigned to your account. Contact admin.';
  END IF;

  SELECT public._user_display_name(p_mr_id) INTO v_mr_name;

  INSERT INTO public.doctor_add_requests (mr_id, manager_id, sub_area_id, status, payload)
  VALUES (p_mr_id, v_mgr, p_sub_area_id, 'pending', p_payload)
  RETURNING id INTO v_req_id;

  v_url := '/manager/requests?tab=doctor-add&requestId=' || v_req_id::text;
  v_body := COALESCE(v_mr_name, 'An MR') || ' requested to add Dr. ' || v_name ||
    ' (' || v_spec || '). Tap to review details.';

  BEGIN
    PERFORM public._notify_mr_managers(
      p_mr_id,
      'doctor_add_request',
      'Doctor add request',
      v_body,
      v_url,
      jsonb_build_object(
        'request_id', v_req_id,
        'kind', 'doctor_add',
        'mr_id', p_mr_id,
        'mr_name', v_mr_name,
        'entity_name', v_name,
        'speciality', v_spec,
        'tab', 'doctor-add',
        'big_text', v_body
      )
    );
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  RETURN v_req_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.resolve_doctor_add_request(
  p_request_id uuid,
  p_status text,
  p_manager_note text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_me_id uuid;
  v_role text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  v_me_id := public.session_profile_id();
  v_role := public.current_user_role();

  IF v_me_id IS NULL THEN
    RAISE EXCEPTION 'Active user profile not found';
  END IF;

  IF p_status NOT IN ('approved', 'rejected') THEN
    RAISE EXCEPTION 'Invalid status';
  END IF;

  IF v_role <> 'admin' AND NOT (
    v_role = 'manager'
    AND EXISTS (
      SELECT 1 FROM public.mr_manager_map mm
      JOIN public.doctor_add_requests r ON r.id = p_request_id
      WHERE mm.manager_id = v_me_id AND mm.mr_id = r.mr_id
    )
  ) THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;

  PERFORM public._resolve_doctor_add_as_manager(v_me_id, p_request_id, p_status, p_manager_note);
END;
$$;

GRANT EXECUTE ON FUNCTION public.resolve_doctor_add_request(uuid, text, text) TO authenticated;

-- ---------------------------------------------------------------------------
-- Account blocked → push alert
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trg_notify_user_blocked()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_blocked = true AND COALESCE(OLD.is_blocked, false) = false THEN
    BEGIN
      PERFORM public._notify_user(
        NEW.id,
        'account_blocked',
        'Account blocked',
        'Your Maktree SFA account has been blocked. Contact your manager or admin for help.',
        '/account-blocked',
        jsonb_build_object(
          'big_text', 'Your Maktree SFA account access is blocked. You cannot submit DCRs or use field features until this is resolved.',
          'user_id', NEW.id
        )
      );
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_users_blocked_notify ON public.users;
CREATE TRIGGER trg_users_blocked_notify
  AFTER UPDATE OF is_blocked ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_notify_user_blocked();

DROP TRIGGER IF EXISTS trg_user_notifications_send_push ON public.user_notifications;
