-- Functions, visit guards, and scheduled alerts for spot working.

CREATE OR REPLACE FUNCTION public.submit_field_plan(
  p_plan_date date,
  p_kind text,
  p_working_with uuid[] DEFAULT '{}',
  p_doctor_ids uuid[] DEFAULT '{}',
  p_note text DEFAULT NULL,
  p_replaces_doctor_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := public.current_app_user_id();
  v_role text := public.current_user_role();
  v_window text;
  v_auto boolean := false;
  v_status text;
  v_mode text;
  v_plan_id uuid;
  v_existing public.field_plans%ROWTYPE;
  v_doc uuid;
  v_order integer := 0;
  v_sub uuid;
  v_count integer;
  v_ww uuid;
  v_names text;
  v_ids uuid[];
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not signed in';
  END IF;
  IF v_role NOT IN ('mr', 'manager') THEN
    RAISE EXCEPTION 'Only field users submit a plan';
  END IF;
  IF p_kind NOT IN ('daily', 'priority_call') THEN
    RAISE EXCEPTION 'Unknown plan type';
  END IF;

  SELECT ARRAY(SELECT DISTINCT x FROM unnest(COALESCE(p_doctor_ids, '{}'::uuid[])) AS x) INTO v_ids;
  v_count := COALESCE(array_length(v_ids, 1), 0);

  IF p_plan_date < public.spot_working_start_date() THEN
    RAISE EXCEPTION 'Plans and Priority Calls start on %', to_char(public.spot_working_start_date(), 'DD Mon');
  END IF;

  IF p_kind = 'daily' THEN
    v_window := public._daily_plan_window(p_plan_date);
    IF v_window = 'locked' THEN
      RAISE EXCEPTION 'Tomorrow''s plan opens at 6:00 PM today';
    ELSIF v_window = 'too_far' THEN
      RAISE EXCEPTION 'You can submit a plan only for today or tomorrow';
    ELSIF v_window = 'closed' THEN
      RAISE EXCEPTION 'Today''s plan closed at 11:00 AM. File DCRs normally — the day will show that the plan was not submitted';
    END IF;
    IF v_count < 10 THEN
      RAISE EXCEPTION 'Select at least 10 doctor calls (maximum 16)';
    END IF;
    IF v_count > 16 THEN
      RAISE EXCEPTION 'A daily plan can include at most 16 doctor calls';
    END IF;
  ELSE
    IF p_plan_date < public.spot_working_start_date() THEN
      RAISE EXCEPTION 'Priority Calls start on %', to_char(public.spot_working_start_date(), 'DD Mon');
    END IF;
    IF p_plan_date <> public.today_ist() THEN
      RAISE EXCEPTION 'A Priority Call is only for today';
    END IF;
    IF v_count < 1 THEN
      RAISE EXCEPTION 'Select at least one doctor for the Priority Call';
    END IF;
    IF v_count > 16 THEN
      RAISE EXCEPTION 'A Priority Call can include at most 16 doctors';
    END IF;
    IF (
      SELECT COUNT(*)
      FROM public.field_plan_calls c
      JOIN public.field_plans fp ON fp.id = c.plan_id
      WHERE fp.user_id = v_uid AND fp.plan_date = p_plan_date AND fp.kind = 'priority_call'
    ) + v_count > 16 THEN
      RAISE EXCEPTION 'Priority Calls for today can include at most 16 doctors';
    END IF;
  END IF;

  IF p_working_with IS NULL THEN
    p_working_with := '{}';
  END IF;
  FOREACH v_ww IN ARRAY p_working_with LOOP
    IF v_role = 'mr' AND NOT EXISTS (
      SELECT 1 FROM public.mr_manager_map mm
      JOIN public.users u ON u.id = mm.manager_id
      WHERE mm.mr_id = v_uid AND mm.manager_id = v_ww
        AND u.is_active = true AND u.role = 'manager'
    ) THEN
      RAISE EXCEPTION 'Choose Solo or one of your managers';
    END IF;
    IF v_role = 'manager' AND NOT EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = v_ww AND u.role = 'manager' AND u.is_active = true AND u.id <> v_uid
    ) THEN
      RAISE EXCEPTION 'Choose Solo or another manager';
    END IF;
  END LOOP;

  FOREACH v_doc IN ARRAY v_ids LOOP
    SELECT d.sub_area_id INTO v_sub
    FROM public.doctors d
    WHERE d.id = v_doc AND d.is_active = true;
    IF v_sub IS NULL THEN
      RAISE EXCEPTION 'One of the selected doctors is not active';
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM public.mr_sub_area_access msa
      WHERE msa.mr_id = v_uid AND msa.sub_area_id = v_sub
    ) THEN
      RAISE EXCEPTION 'You can only plan doctors inside your territory';
    END IF;
  END LOOP;

  IF p_kind = 'daily' THEN
    SELECT * INTO v_existing
    FROM public.field_plans
    WHERE user_id = v_uid AND plan_date = p_plan_date AND kind = 'daily';

    IF v_existing.id IS NOT NULL AND v_existing.status = 'approved' THEN
      RAISE EXCEPTION 'This plan is already approved. Add a doctor with a Priority Call';
    END IF;
    IF v_existing.id IS NOT NULL AND v_existing.status = 'missed' THEN
      RAISE EXCEPTION 'The plan window for this day is closed';
    END IF;

    SELECT COALESCE(s.auto_approve, false) INTO v_auto
    FROM public.mr_plan_settings s WHERE s.mr_id = v_uid;

    IF v_role = 'manager' OR COALESCE(v_auto, false) THEN
      v_status := 'approved';
      v_mode := 'auto';
    ELSE
      v_status := 'pending';
      v_mode := 'manual';
    END IF;

    IF v_existing.id IS NULL THEN
      INSERT INTO public.field_plans (
        user_id, plan_date, kind, status, working_with_ids, note,
        submitted_at, approved_at, approved_by, approval_mode
      ) VALUES (
        v_uid, p_plan_date, 'daily', v_status, COALESCE(p_working_with, '{}'),
        NULLIF(trim(COALESCE(p_note, '')), ''),
        now(),
        CASE WHEN v_status = 'approved' THEN now() ELSE NULL END,
        CASE WHEN v_status = 'approved' THEN v_uid ELSE NULL END,
        v_mode
      ) RETURNING id INTO v_plan_id;
    ELSE
      UPDATE public.field_plans SET
        status = v_status,
        working_with_ids = COALESCE(p_working_with, '{}'),
        note = NULLIF(trim(COALESCE(p_note, '')), ''),
        submitted_at = now(),
        approved_at = CASE WHEN v_status = 'approved' THEN now() ELSE NULL END,
        approved_by = CASE WHEN v_status = 'approved' THEN v_uid ELSE NULL END,
        approval_mode = v_mode,
        updated_at = now()
      WHERE id = v_existing.id
      RETURNING id INTO v_plan_id;
      DELETE FROM public.field_plan_calls WHERE plan_id = v_plan_id;
    END IF;
  ELSE
    INSERT INTO public.field_plans (
      user_id, plan_date, kind, status, working_with_ids, note,
      replaces_doctor_id, submitted_at, approved_at, approved_by, approval_mode
    ) VALUES (
      v_uid, p_plan_date, 'priority_call', 'approved', COALESCE(p_working_with, '{}'),
      NULLIF(trim(COALESCE(p_note, '')), ''),
      p_replaces_doctor_id, now(), now(), v_uid, 'auto'
    ) RETURNING id INTO v_plan_id;
  END IF;

  FOREACH v_doc IN ARRAY v_ids LOOP
    SELECT d.sub_area_id INTO v_sub FROM public.doctors d WHERE d.id = v_doc;
    INSERT INTO public.field_plan_calls (plan_id, doctor_id, sub_area_id, sort_order)
    VALUES (v_plan_id, v_doc, v_sub, v_order);
    v_order := v_order + 1;
  END LOOP;

  SELECT string_agg(d.full_name, ', ' ORDER BY c.sort_order) INTO v_names
  FROM public.field_plan_calls c
  JOIN public.doctors d ON d.id = c.doctor_id
  WHERE c.plan_id = v_plan_id;

  INSERT INTO public.field_activity_points (user_id, work_date, event_type, plan_id, metadata)
  VALUES (
    v_uid, public.today_ist(),
    CASE WHEN p_kind = 'priority_call' THEN 'priority_call' ELSE 'plan_submit' END,
    v_plan_id,
    jsonb_build_object('doctors', v_names, 'kind', p_kind, 'plan_date', p_plan_date)
  );

  IF v_role = 'mr' THEN
    PERFORM public._notify_mr_managers(
      v_uid,
      CASE WHEN p_kind = 'priority_call' THEN 'priority_call' ELSE 'field_plan' END,
      CASE
        WHEN p_kind = 'priority_call' THEN 'Priority Call'
        WHEN v_status = 'approved' THEN 'Daily plan auto-approved'
        ELSE 'Daily plan to approve'
      END,
      CASE
        WHEN p_kind = 'priority_call' THEN
          (SELECT full_name FROM public.users WHERE id = v_uid) || ' added a Priority Call for ' || COALESCE(v_names, 'a doctor') || '.'
        WHEN v_status = 'approved' THEN
          (SELECT full_name FROM public.users WHERE id = v_uid) || ' submitted ' || to_char(p_plan_date, 'DD Mon') || ' plan (' || v_count || ' calls). Auto-approved.'
        ELSE
          (SELECT full_name FROM public.users WHERE id = v_uid) || ' submitted ' || to_char(p_plan_date, 'DD Mon') || ' plan (' || v_count || ' calls). Tap to approve.'
      END,
      '/manager/plan?date=' || p_plan_date::text,
      jsonb_build_object('plan_id', v_plan_id, 'plan_date', p_plan_date, 'mr_id', v_uid)
    );
  ELSE
    PERFORM public._notify_user(
      mgr.id,
      'field_plan',
      CASE WHEN p_kind = 'priority_call' THEN 'Manager Priority Call' ELSE 'Manager daily plan' END,
      (SELECT full_name FROM public.users WHERE id = v_uid) || ' submitted '
        || to_char(p_plan_date, 'DD Mon') || ': ' || COALESCE(v_names, 'plan'),
      '/manager/plan?date=' || p_plan_date::text,
      jsonb_build_object('plan_id', v_plan_id, 'plan_date', p_plan_date)
    )
    FROM public.users mgr
    WHERE mgr.role = 'manager' AND mgr.is_active = true AND mgr.id <> v_uid;
  END IF;

  RETURN v_plan_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.review_field_plan(
  p_plan_id uuid,
  p_approve boolean,
  p_note text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := public.current_app_user_id();
  v_plan public.field_plans%ROWTYPE;
  v_name text;
BEGIN
  IF public.current_user_role() <> 'manager' THEN
    RAISE EXCEPTION 'Only a manager can approve a plan';
  END IF;
  SELECT * INTO v_plan FROM public.field_plans WHERE id = p_plan_id;
  IF v_plan.id IS NULL OR v_plan.kind <> 'daily' THEN
    RAISE EXCEPTION 'Plan not found';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.mr_manager_map mm
    WHERE mm.manager_id = v_uid AND mm.mr_id = v_plan.user_id
  ) THEN
    RAISE EXCEPTION 'This MR is not on your team';
  END IF;
  IF v_plan.status <> 'pending' THEN
    RAISE EXCEPTION 'This plan is not waiting for approval';
  END IF;

  UPDATE public.field_plans SET
    status = CASE WHEN p_approve THEN 'approved' ELSE 'rejected' END,
    approved_at = CASE WHEN p_approve THEN now() ELSE NULL END,
    approved_by = v_uid,
    approval_mode = 'manual',
    note = COALESCE(NULLIF(trim(COALESCE(p_note, '')), ''), note),
    updated_at = now()
  WHERE id = p_plan_id;

  SELECT full_name INTO v_name FROM public.users WHERE id = v_uid;
  PERFORM public._notify_user(
    v_plan.user_id,
    'field_plan',
    CASE WHEN p_approve THEN 'Plan approved' ELSE 'Plan needs a change' END,
    CASE
      WHEN p_approve THEN v_name || ' approved your plan for ' || to_char(v_plan.plan_date, 'DD Mon') || '.'
      ELSE v_name || ' sent your plan back' || COALESCE('. ' || NULLIF(trim(COALESCE(p_note, '')), ''), '.')
    END,
    '/mr/plan?date=' || v_plan.plan_date::text,
    jsonb_build_object('plan_id', p_plan_id, 'plan_date', v_plan.plan_date)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.set_mr_plan_auto_approve(p_mr_id uuid, p_enabled boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := public.current_app_user_id();
BEGIN
  IF public.current_user_role() <> 'manager' THEN
    RAISE EXCEPTION 'Only a manager can change auto-approve';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.mr_manager_map mm
    WHERE mm.manager_id = v_uid AND mm.mr_id = p_mr_id
  ) THEN
    RAISE EXCEPTION 'This MR is not on your team';
  END IF;
  INSERT INTO public.mr_plan_settings (mr_id, auto_approve, updated_by)
  VALUES (p_mr_id, p_enabled, v_uid)
  ON CONFLICT (mr_id) DO UPDATE SET
    auto_approve = EXCLUDED.auto_approve,
    updated_by = EXCLUDED.updated_by,
    updated_at = now();
END;
$$;

CREATE OR REPLACE FUNCTION public.capture_doctor_location(
  p_doctor_id uuid,
  p_lat double precision,
  p_lng double precision,
  p_accuracy double precision
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := public.current_app_user_id();
  v_role text := public.current_user_role();
  v_sub uuid;
  v_exists boolean;
BEGIN
  IF v_uid IS NULL OR v_role NOT IN ('mr', 'manager') THEN
    RAISE EXCEPTION 'Not allowed';
  END IF;
  IF p_lat IS NULL OR p_lng IS NULL OR p_accuracy IS NULL
     OR p_accuracy < 1 OR p_accuracy > 80
     OR p_lat NOT BETWEEN -90 AND 90 OR p_lng NOT BETWEEN -180 AND 180 THEN
    RAISE EXCEPTION 'Wait for a stronger GPS fix, then capture the clinic again';
  END IF;

  SELECT sub_area_id INTO v_sub FROM public.doctors WHERE id = p_doctor_id AND is_active = true;
  IF v_sub IS NULL THEN
    RAISE EXCEPTION 'Doctor not found';
  END IF;

  IF v_role = 'mr' AND NOT EXISTS (
    SELECT 1 FROM public.mr_sub_area_access msa
    WHERE msa.mr_id = v_uid AND msa.sub_area_id = v_sub
  ) THEN
    RAISE EXCEPTION 'This doctor is outside your territory';
  END IF;

  SELECT EXISTS (SELECT 1 FROM public.doctor_locations WHERE doctor_id = p_doctor_id) INTO v_exists;
  IF v_exists AND v_role <> 'manager' THEN
    RAISE EXCEPTION 'This clinic location is locked. Only a manager can update it';
  END IF;

  IF v_exists THEN
    UPDATE public.doctor_locations SET
      latitude = p_lat,
      longitude = p_lng,
      accuracy_m = p_accuracy,
      updated_by = v_uid,
      updated_at = now()
    WHERE doctor_id = p_doctor_id;
  ELSE
    INSERT INTO public.doctor_locations (doctor_id, latitude, longitude, accuracy_m, captured_by)
    VALUES (p_doctor_id, p_lat, p_lng, p_accuracy, v_uid);
  END IF;

  INSERT INTO public.field_activity_points (
    user_id, latitude, longitude, accuracy_m, event_type, doctor_id, metadata
  ) VALUES (
    v_uid, p_lat, p_lng, p_accuracy, 'location_capture', p_doctor_id,
    jsonb_build_object('updated', v_exists)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.note_gps_off()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := public.current_app_user_id();
  v_name text;
BEGIN
  IF v_uid IS NULL OR public.current_user_role() <> 'mr' THEN
    RETURN;
  END IF;
  IF public._user_is_field_off(v_uid, public.today_ist()) THEN
    RETURN;
  END IF;

  SELECT full_name INTO v_name FROM public.users WHERE id = v_uid;
  IF public._scheduled_notify_once(
    v_uid, 'gps_off', 'mr',
    'Location is off',
    'Turn location on and keep Maktree open during field work so calls can unlock at the clinic.',
    '/mr/plan',
    jsonb_build_object('channel', 'maktree_reminders')
  ) THEN
    INSERT INTO public.field_activity_points (user_id, event_type, metadata)
    VALUES (v_uid, 'gps_off', jsonb_build_object('source', 'permission'));
    PERFORM public._notify_mr_managers(
      v_uid, 'gps_off',
      'MR location is off',
      COALESCE(v_name, 'An MR') || ' has location turned off in Maktree.',
      '/manager/activity?mrId=' || v_uid::text,
      jsonb_build_object('mr_id', v_uid, 'channel', 'maktree_reminders')
    );
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.spot_scan(
  p_lat double precision,
  p_lng double precision,
  p_accuracy double precision
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := public.current_app_user_id();
  v_role text := public.current_user_role();
  v_prev record;
  v_flag boolean := false;
  v_reason text;
  v_secs double precision;
  v_dist double precision;
  v_skip boolean := false;
  v_unlocked jsonb := '[]'::jsonb;
  v_confirming jsonb := '[]'::jsonb;
  v_call record;
  v_n integer;
  v_span double precision;
  v_doc_name text;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not signed in';
  END IF;
  IF p_lat IS NULL OR p_lng IS NULL
     OR p_lat NOT BETWEEN -90 AND 90 OR p_lng NOT BETWEEN -180 AND 180
     OR (abs(p_lat) < 0.0001 AND abs(p_lng) < 0.0001) THEN
    RAISE EXCEPTION 'Location is invalid';
  END IF;

  IF p_accuracy IS NULL OR p_accuracy < 1 OR p_accuracy > 80 THEN
    v_flag := true;
    v_reason := 'weak_gps';
  END IF;

  SELECT latitude, longitude, recorded_at
  INTO v_prev
  FROM public.field_activity_points
  WHERE user_id = v_uid AND latitude IS NOT NULL
  ORDER BY recorded_at DESC
  LIMIT 1;

  IF v_prev.recorded_at IS NOT NULL THEN
    v_secs := EXTRACT(EPOCH FROM (now() - v_prev.recorded_at));
    v_dist := public.haversine_m(v_prev.latitude, v_prev.longitude, p_lat, p_lng);
    IF v_secs > 1 AND v_secs < 600 AND (v_dist / v_secs) > 40 THEN
      v_flag := true;
      v_reason := 'impossible_travel';
    END IF;
    IF v_secs < 12 AND v_dist < 25 THEN
      v_skip := true;
    END IF;
  END IF;

  IF NOT v_skip THEN
    INSERT INTO public.field_activity_points (
      user_id, latitude, longitude, accuracy_m, event_type, flagged, flag_reason
    ) VALUES (
      v_uid, p_lat, p_lng, p_accuracy, 'ping', v_flag, v_reason
    );
  END IF;

  IF v_role <> 'mr' OR v_flag THEN
    RETURN jsonb_build_object(
      'ok', true, 'flagged', v_flag, 'flag_reason', v_reason,
      'unlocked', '[]'::jsonb, 'confirming', '[]'::jsonb
    );
  END IF;

  FOR v_call IN
    SELECT DISTINCT c.doctor_id, dl.latitude, dl.longitude, d.full_name
    FROM public.field_plan_calls c
    JOIN public.field_plans fp ON fp.id = c.plan_id
    JOIN public.doctor_locations dl ON dl.doctor_id = c.doctor_id
    JOIN public.doctors d ON d.id = c.doctor_id
    WHERE fp.user_id = v_uid
      AND fp.plan_date = public.today_ist()
      AND public._visit_spot_mode(v_uid, public.today_ist(), c.doctor_id) = 'spot'
      AND public.haversine_m(p_lat, p_lng, dl.latitude, dl.longitude) <= 800
  LOOP
    SELECT COUNT(*), EXTRACT(EPOCH FROM (MAX(s.recorded_at) - MIN(s.recorded_at)))
    INTO v_n, v_span
    FROM (
      SELECT p.recorded_at
      FROM public.field_activity_points p
      WHERE p.user_id = v_uid
        AND p.recorded_at > now() - interval '4 minutes'
        AND p.flagged = false
        AND p.latitude IS NOT NULL
        AND p.accuracy_m BETWEEN 1 AND 80
        AND public.haversine_m(p.latitude, p.longitude, v_call.latitude, v_call.longitude) <= 800
      ORDER BY p.recorded_at DESC
      LIMIT 6
    ) s;

    IF COALESCE(v_n, 0) >= 2 AND COALESCE(v_span, 0) >= 10 THEN
      v_unlocked := v_unlocked || jsonb_build_array(jsonb_build_object(
        'doctor_id', v_call.doctor_id, 'doctor_name', v_call.full_name
      ));
      v_doc_name := v_call.full_name;
      IF public._scheduled_notify_once(
        v_uid, 'spot_dcr_open', v_call.doctor_id::text,
        'DCR open for ' || v_doc_name,
        'You are at the clinic. You can submit the DCR for ' || v_doc_name || ' now.',
        '/mr/report/new',
        jsonb_build_object('doctor_id', v_call.doctor_id, 'channel', 'maktree_reminders')
      ) THEN
        INSERT INTO public.field_activity_points (
          user_id, latitude, longitude, accuracy_m, event_type, doctor_id, metadata
        ) VALUES (
          v_uid, p_lat, p_lng, p_accuracy, 'dcr_open', v_call.doctor_id,
          jsonb_build_object('doctor_name', v_doc_name)
        );
      END IF;
    ELSE
      v_confirming := v_confirming || jsonb_build_array(jsonb_build_object(
        'doctor_id', v_call.doctor_id, 'doctor_name', v_call.full_name
      ));
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'ok', true, 'flagged', false, 'flag_reason', NULL,
    'unlocked', v_unlocked, 'confirming', v_confirming
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.field_day_board(p_date date DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := public.current_app_user_id();
  v_date date := COALESCE(p_date, public.today_ist());
  v_plan public.field_plans%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not signed in';
  END IF;
  SELECT * INTO v_plan
  FROM public.field_plans
  WHERE user_id = v_uid AND plan_date = v_date AND kind = 'daily';

  RETURN jsonb_build_object(
    'date', v_date,
    'role', public.current_user_role(),
    'plan_status', COALESCE(v_plan.status, 'none'),
    'plan_id', v_plan.id,
    'approval_mode', v_plan.approval_mode,
    'working_with_ids', COALESCE(v_plan.working_with_ids, '{}'::uuid[]),
    'submitted_at', v_plan.submitted_at,
    'calls', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'call_id', c.id,
        'doctor_id', c.doctor_id,
        'doctor_name', d.full_name,
        'speciality', d.speciality,
        'sub_area_id', c.sub_area_id,
        'sub_area_name', sa.name,
        'area_name', ar.name,
        'source', fp.kind,
        'outcome', c.outcome,
        'has_location', dl.doctor_id IS NOT NULL,
        'latitude', dl.latitude,
        'longitude', dl.longitude
      ) ORDER BY fp.kind, c.sort_order, d.full_name)
      FROM public.field_plan_calls c
      JOIN public.field_plans fp ON fp.id = c.plan_id
      JOIN public.doctors d ON d.id = c.doctor_id
      LEFT JOIN public.sub_areas sa ON sa.id = c.sub_area_id
      LEFT JOIN public.areas ar ON ar.id = sa.area_id
      LEFT JOIN public.doctor_locations dl ON dl.doctor_id = c.doctor_id
      WHERE fp.user_id = v_uid AND fp.plan_date = v_date
        AND fp.status IN ('pending', 'approved', 'rejected', 'missed')
    ), '[]'::jsonb)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.field_activity_day(p_user_id uuid, p_date date)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_name text;
  v_plan text;
  v_submitted timestamptz;
  v_first timestamptz;
BEGIN
  IF NOT public._field_can_see_user(p_user_id) THEN
    RAISE EXCEPTION 'Not allowed';
  END IF;
  SELECT full_name INTO v_name FROM public.users WHERE id = p_user_id;
  SELECT status, submitted_at INTO v_plan, v_submitted
  FROM public.field_plans
  WHERE user_id = p_user_id AND plan_date = p_date AND kind = 'daily';
  SELECT MIN(dr.submitted_at) INTO v_first
  FROM public.daily_reports dr
  WHERE dr.mr_id = p_user_id AND dr.report_date = p_date AND dr.status = 'submitted';

  RETURN jsonb_build_object(
    'user_id', p_user_id,
    'user_name', v_name,
    'date', p_date,
    'plan_status', COALESCE(v_plan, 'none'),
    'plan_submitted_at', v_submitted,
    'first_dcr_at', v_first,
    'points', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', p.id,
        'at', p.recorded_at,
        'lat', p.latitude,
        'lng', p.longitude,
        'accuracy', p.accuracy_m,
        'event', p.event_type,
        'doctor_id', p.doctor_id,
        'doctor_name', d.full_name,
        'flagged', p.flagged,
        'flag_reason', p.flag_reason,
        'metadata', p.metadata
      ) ORDER BY p.recorded_at)
      FROM public.field_activity_points p
      LEFT JOIN public.doctors d ON d.id = p.doctor_id
      WHERE p.user_id = p_user_id AND p.work_date = p_date
    ), '[]'::jsonb),
    'visits', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'doctor_id', rv.doctor_id,
        'doctor_name', d.full_name,
        'at', rv.visited_at,
        'unavailable', rv.doctor_unavailable,
        'note', rv.unavailable_note,
        'lat', rv.spot_latitude,
        'lng', rv.spot_longitude,
        'waived', rv.plan_waived,
        'products', COALESCE((
          SELECT jsonb_agg(pr.name ORDER BY pr.name)
          FROM public.promoted_products pp
          JOIN public.products pr ON pr.id = pp.product_id
          WHERE pp.visit_id = rv.id
        ), '[]'::jsonb)
      ) ORDER BY rv.visited_at)
      FROM public.report_visits rv
      JOIN public.daily_reports dr ON dr.id = rv.report_id
      JOIN public.doctors d ON d.id = rv.doctor_id
      WHERE dr.mr_id = p_user_id AND dr.report_date = p_date
    ), '[]'::jsonb)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.field_month_summary(p_user_id uuid, p_month date)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_start date := date_trunc('month', p_month)::date;
  v_end date := (date_trunc('month', p_month) + interval '1 month')::date;
BEGIN
  IF NOT public._field_can_see_user(p_user_id) THEN
    RAISE EXCEPTION 'Not allowed';
  END IF;
  RETURN jsonb_build_object(
    'user_id', p_user_id,
    'month', to_char(v_start, 'YYYY-MM'),
    'plans_approved', (
      SELECT COUNT(*) FROM public.field_plans
      WHERE user_id = p_user_id AND kind = 'daily' AND status = 'approved'
        AND plan_date >= v_start AND plan_date < v_end
    ),
    'plans_missed', (
      SELECT COUNT(*) FROM public.field_plans
      WHERE user_id = p_user_id AND kind = 'daily' AND status = 'missed'
        AND plan_date >= v_start AND plan_date < v_end
    ),
    'priority_calls', (
      SELECT COUNT(*) FROM public.field_plans
      WHERE user_id = p_user_id AND kind = 'priority_call'
        AND plan_date >= v_start AND plan_date < v_end
    ),
    'calls_done', (
      SELECT COUNT(*) FROM public.report_visits rv
      JOIN public.daily_reports dr ON dr.id = rv.report_id
      WHERE dr.mr_id = p_user_id AND dr.status = 'submitted'
        AND dr.report_date >= v_start AND dr.report_date < v_end
        AND rv.doctor_unavailable = false
    ),
    'unavailable', (
      SELECT COUNT(*) FROM public.report_visits rv
      JOIN public.daily_reports dr ON dr.id = rv.report_id
      WHERE dr.mr_id = p_user_id AND dr.report_date >= v_start AND dr.report_date < v_end
        AND rv.doctor_unavailable = true
    ),
    'days', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'date', day::date,
        'plan_status', COALESCE(fp.status, 'none'),
        'visits', COALESCE(vc.n, 0),
        'pings', COALESCE(pc.n, 0)
      ) ORDER BY day)
      FROM generate_series(v_start, v_end - 1, interval '1 day') AS day
      LEFT JOIN public.field_plans fp
        ON fp.user_id = p_user_id AND fp.plan_date = day::date AND fp.kind = 'daily'
      LEFT JOIN LATERAL (
        SELECT COUNT(*) AS n
        FROM public.report_visits rv
        JOIN public.daily_reports dr ON dr.id = rv.report_id
        WHERE dr.mr_id = p_user_id AND dr.report_date = day::date
      ) vc ON true
      LEFT JOIN LATERAL (
        SELECT COUNT(*) AS n
        FROM public.field_activity_points p
        WHERE p.user_id = p_user_id AND p.work_date = day::date AND p.latitude IS NOT NULL
      ) pc ON true
      WHERE fp.id IS NOT NULL OR COALESCE(vc.n, 0) > 0 OR COALESCE(pc.n, 0) > 0
    ), '[]'::jsonb)
  );
END;
$$;
