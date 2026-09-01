-- Fix Approve/Decline from notification shade:
-- 1) doctor add approve failed on empty birthday text → date cast
-- 2) leave requests now resolve from shade (no app open required)

CREATE OR REPLACE FUNCTION public._optional_date(p_text text)
RETURNS date
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN NULLIF(trim(COALESCE(p_text, '')), '') IS NULL THEN NULL
    ELSE NULLIF(trim(p_text), '')::date
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
    public._optional_date(v_doc ->> 'birthday'),
    public._optional_date(v_doc ->> 'marriage_anniversary'),
    CASE WHEN v_doc ->> 'visit_frequency' IN ('weekly', 'fortnightly', 'monthly') THEN v_doc ->> 'visit_frequency' ELSE NULL END,
    LEAST(99, GREATEST(1, COALESCE((v_doc ->> 'monthly_visit_target')::int, 2))),
    true, false
  )
  RETURNING id INTO v_doctor_id;

  FOR v_chem IN SELECT * FROM jsonb_array_elements(COALESCE(v_req.payload -> 'chemists', '[]'::jsonb))
  LOOP
    v_chem_name := trim(COALESCE(v_chem ->> 'name', ''));
    IF length(v_chem_name) < 1 THEN
      CONTINUE;
    END IF;

    INSERT INTO public.chemists (sub_area_id, name, address, mobile, is_active)
    VALUES (
      v_req.sub_area_id,
      v_chem_name,
      NULLIF(trim(COALESCE(v_chem ->> 'address', '')), ''),
      NULLIF(trim(COALESCE(v_chem ->> 'mobile', '')), ''),
      true
    )
    ON CONFLICT (sub_area_id, lower(name)) DO UPDATE
      SET address = COALESCE(EXCLUDED.address, chemists.address),
          mobile = COALESCE(EXCLUDED.mobile, chemists.mobile),
          is_active = true
    RETURNING id INTO v_chem_id;

    INSERT INTO public.doctor_chemist_map (doctor_id, chemist_id)
    VALUES (v_doctor_id, v_chem_id)
    ON CONFLICT DO NOTHING;
  END LOOP;

  UPDATE public.doctor_add_requests
  SET status = 'approved', doctor_id = v_doctor_id,
      manager_note = NULLIF(trim(p_manager_note), ''), approved_by = p_manager_id, resolved_at = v_now
  WHERE id = p_request_id;

  PERFORM public._notify_user(
    v_req.mr_id,
    'doctor_add_approved',
    'Doctor approved',
    COALESCE(v_mgr_name, 'Your manager') || ' approved Dr. ' ||
      COALESCE(v_doc ->> 'full_name', 'this doctor') || ' on your master list.',
    '/mr/master-list',
    jsonb_build_object('request_id', p_request_id, 'doctor_id', v_doctor_id, 'entity_name', v_doc ->> 'full_name')
  );
END;
$$;

CREATE OR REPLACE FUNCTION public._quick_resolve_leave(
  p_manager_id uuid,
  p_leave_id uuid,
  p_action text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status text;
  v_leave public.leave_requests%ROWTYPE;
  v_mr_name text;
  v_resolver_name text;
BEGIN
  v_status := CASE WHEN p_action = 'approve' THEN 'approved' ELSE 'rejected' END;

  SELECT * INTO v_leave FROM public.leave_requests WHERE id = p_leave_id FOR UPDATE;
  IF NOT FOUND OR v_leave.status <> 'pending' THEN
    RAISE EXCEPTION 'Leave request not found or already resolved';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.mr_manager_map mm
    WHERE mm.manager_id = p_manager_id AND mm.mr_id = v_leave.mr_id
  ) AND v_leave.manager_id <> p_manager_id THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;

  UPDATE public.leave_requests
  SET
    status = v_status,
    resolved_at = now(),
    approved_by = CASE WHEN v_status = 'approved' THEN p_manager_id ELSE NULL END
  WHERE id = p_leave_id;

  SELECT full_name INTO v_mr_name FROM public.users WHERE id = v_leave.mr_id;
  SELECT full_name INTO v_resolver_name FROM public.users WHERE id = p_manager_id;

  IF v_status = 'approved' THEN
    PERFORM public._submit_leave_dcr_report(
      v_leave.mr_id,
      v_leave.leave_date,
      COALESCE(v_leave.reason, 'Leave without pay'),
      'without_pay'
    );

    BEGIN
      PERFORM public._notify_user(
        v_leave.mr_id,
        'leave_approved',
        'Leave approved',
        'Your leave without pay for ' || to_char(v_leave.leave_date, 'DD Mon YYYY') ||
          ' was approved' || CASE WHEN v_resolver_name IS NOT NULL THEN ' by ' || v_resolver_name ELSE '' END || '.',
        '/mr/report/history',
        jsonb_build_object('leave_id', p_leave_id, 'status', 'approved')
      );
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    PERFORM public._notify_mr_managers(
      v_leave.mr_id,
      'leave_resolved',
      'Leave approved',
      COALESCE(v_mr_name, 'Team member') || '''s leave for ' || to_char(v_leave.leave_date, 'DD Mon YYYY') ||
        ' was approved' || CASE WHEN v_resolver_name IS NOT NULL THEN ' by ' || v_resolver_name ELSE '' END || '.',
      '/manager/leaves',
      jsonb_build_object('leave_id', p_leave_id, 'mr_id', v_leave.mr_id, 'status', 'approved', 'resolved_by', p_manager_id),
      p_manager_id
    );
  ELSE
    BEGIN
      PERFORM public._notify_user(
        v_leave.mr_id,
        'leave_rejected',
        'Leave rejected',
        'Your leave request for ' || to_char(v_leave.leave_date, 'DD Mon YYYY') ||
          ' was rejected' || CASE WHEN v_resolver_name IS NOT NULL THEN ' by ' || v_resolver_name ELSE '' END || '.',
        '/mr/report/history',
        jsonb_build_object('leave_id', p_leave_id, 'status', 'rejected')
      );
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    PERFORM public._notify_mr_managers(
      v_leave.mr_id,
      'leave_resolved',
      'Leave rejected',
      COALESCE(v_mr_name, 'Team member') || '''s leave for ' || to_char(v_leave.leave_date, 'DD Mon YYYY') ||
        ' was rejected' || CASE WHEN v_resolver_name IS NOT NULL THEN ' by ' || v_resolver_name ELSE '' END || '.',
      '/manager/leaves',
      jsonb_build_object('leave_id', p_leave_id, 'mr_id', v_leave.mr_id, 'status', 'rejected', 'resolved_by', p_manager_id),
      p_manager_id
    );
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
      PERFORM public._quick_resolve_leave(v_tok.user_id, v_tok.request_id, v_action);
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
