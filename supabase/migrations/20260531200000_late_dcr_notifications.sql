-- Notifications for late DCR request / grant / approval.

CREATE OR REPLACE FUNCTION public.grant_late_dcr_fill(p_mr_id uuid, p_dates date[])
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_me uuid;
  v_role text;
  v_active int;
  v_date date;
  v_granted date[] := '{}';
  v_count int := 0;
  v_cutoff date := today_ist() - 3;
  v_clean date[] := '{}';
  v_mgr_name text;
BEGIN
  SELECT u.id, u.role::text, u.full_name INTO v_me, v_role, v_mgr_name
  FROM public.users u
  WHERE u.auth_user_id = auth.uid() AND u.is_active = true
  LIMIT 1;

  IF v_me IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF v_role <> 'manager' THEN
    RAISE EXCEPTION 'Only managers can grant late DCR dates';
  END IF;

  IF p_mr_id <> v_me AND NOT EXISTS (
    SELECT 1 FROM public.mr_manager_map mm
    WHERE mm.manager_id = v_me AND mm.mr_id = p_mr_id
  ) THEN
    RAISE EXCEPTION 'This MR is not on your team';
  END IF;

  IF p_dates IS NULL OR cardinality(p_dates) = 0 THEN
    RAISE EXCEPTION 'Select at least one date';
  END IF;

  IF cardinality(p_dates) > 15 THEN
    RAISE EXCEPTION 'You can grant at most 15 dates per batch';
  END IF;

  v_active := public.count_active_late_fill_slots(p_mr_id);
  IF v_active > 0 THEN
    RAISE EXCEPTION 'Complete the % open late DCR(s) first before granting a new batch.', v_active;
  END IF;

  FOREACH v_date IN ARRAY p_dates LOOP
    IF v_date = ANY (v_clean) THEN CONTINUE; END IF;
    IF v_date > v_cutoff THEN
      RAISE EXCEPTION 'Date % is still in the normal filing window', v_date;
    END IF;
    IF EXISTS (
      SELECT 1 FROM public.daily_reports dr
      WHERE dr.mr_id = p_mr_id AND dr.report_date = v_date AND dr.status = 'submitted'
    ) THEN
      RAISE EXCEPTION 'A DCR is already submitted for %', v_date;
    END IF;
    IF public.dcr_day_type_for_mr(p_mr_id, v_date) NOT IN ('working', 'sunday', 'leave') THEN
      RAISE EXCEPTION 'Date % is not eligible (holiday/strike)', v_date;
    END IF;
    v_clean := array_append(v_clean, v_date);
  END LOOP;

  IF cardinality(v_clean) = 0 THEN
    RAISE EXCEPTION 'No eligible dates selected';
  END IF;

  FOREACH v_date IN ARRAY v_clean LOOP
    BEGIN
      INSERT INTO public.dcr_late_fill_slots (mr_id, report_date, granted_by, source)
      VALUES (p_mr_id, v_date, v_me, 'manager_grant');
      v_granted := array_append(v_granted, v_date);
      v_count := v_count + 1;
    EXCEPTION WHEN unique_violation THEN
      RAISE EXCEPTION 'Late DCR slot already open for %', v_date;
    END;
  END LOOP;

  BEGIN
    PERFORM public._notify_user(
      p_mr_id,
      'late_dcr_granted',
      'Late DCR dates opened',
      COALESCE(v_mgr_name, 'Your manager') || ' approved ' || v_count::text || ' late DCR date(s). File them from Pending DCRs on your dashboard.',
      '/mr/dashboard',
      jsonb_build_object('granted_count', v_count, 'granted_dates', v_granted, 'granted_by', v_me)
    );
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  RETURN jsonb_build_object('granted_count', v_count, 'granted_dates', v_granted);
END;
$$;

CREATE OR REPLACE FUNCTION public.request_late_dcr_fill(p_dates date[])
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_me uuid;
  v_request_id uuid;
  v_role text;
  v_manager uuid;
  v_active int;
  v_date date;
  v_clean date[] := '{}';
  v_cutoff date := today_ist() - 3;
  v_allowed date[];
  v_mr_name text;
BEGIN
  SELECT u.id, u.role::text, u.full_name INTO v_me, v_role, v_mr_name
  FROM public.users u
  WHERE u.auth_user_id = auth.uid() AND u.is_active = true
  LIMIT 1;

  IF v_me IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF v_role <> 'mr' THEN
    RAISE EXCEPTION 'Only MRs submit late DCR requests. Managers can grant dates directly.';
  END IF;

  v_active := public.count_active_late_fill_slots(v_me);
  IF v_active > 0 THEN
    RAISE EXCEPTION 'Complete your % pending late DCR(s) before requesting more.', v_active;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.dcr_late_fill_requests
    WHERE mr_id = v_me AND status = 'pending'
  ) THEN
    RAISE EXCEPTION 'You already have a pending late DCR request';
  END IF;

  IF p_dates IS NULL OR cardinality(p_dates) = 0 THEN
    RAISE EXCEPTION 'Select at least one date';
  END IF;

  IF cardinality(p_dates) > 15 THEN
    RAISE EXCEPTION 'You can request at most 15 dates at a time';
  END IF;

  SELECT array_agg(d ORDER BY d)
  INTO v_allowed
  FROM public.get_next_missed_late_batch_dates(v_me, 15) AS d;

  IF v_allowed IS NULL OR cardinality(v_allowed) = 0 THEN
    RAISE EXCEPTION 'No missed DCR dates available to request';
  END IF;

  FOREACH v_date IN ARRAY p_dates LOOP
    IF v_date > v_cutoff THEN
      RAISE EXCEPTION 'Date % is still in the normal filing window', v_date;
    END IF;
    IF NOT (v_date = ANY (v_allowed)) THEN
      RAISE EXCEPTION 'Date % is not in your current batch of requestable missed days', v_date;
    END IF;
    IF EXISTS (
      SELECT 1 FROM public.daily_reports dr
      WHERE dr.mr_id = v_me AND dr.report_date = v_date AND dr.status = 'submitted'
    ) THEN
      CONTINUE;
    END IF;
    IF v_date = ANY (v_clean) THEN
      CONTINUE;
    END IF;
    v_clean := array_append(v_clean, v_date);
  END LOOP;

  IF cardinality(v_clean) = 0 THEN
    RAISE EXCEPTION 'No eligible dates selected';
  END IF;

  SELECT mm.manager_id INTO v_manager
  FROM public.mr_manager_map mm
  WHERE mm.mr_id = v_me
  ORDER BY mm.assigned_at ASC
  LIMIT 1;

  IF v_manager IS NULL THEN
    RAISE EXCEPTION 'No manager assigned';
  END IF;

  INSERT INTO public.dcr_late_fill_requests (mr_id, manager_id, requested_dates)
  VALUES (v_me, v_manager, v_clean)
  RETURNING id INTO v_request_id;

  BEGIN
    PERFORM public._notify_user(
      v_manager,
      'late_dcr_request',
      'Late DCR approval needed',
      COALESCE(v_mr_name, 'An MR') || ' requested late DCR approval for '
        || cardinality(v_clean)::text || ' missed day(s).',
      '/manager/requests',
      jsonb_build_object('request_id', v_request_id, 'mr_id', v_me, 'requested_dates', v_clean)
    );
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  RETURN v_request_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.resolve_late_dcr_fill_request(
  p_request_id uuid,
  p_action text,
  p_manager_comment text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_me uuid;
  v_req public.dcr_late_fill_requests%ROWTYPE;
  v_date date;
  v_count int := 0;
  v_mgr_name text;
BEGIN
  IF p_action NOT IN ('approved', 'rejected') THEN
    RAISE EXCEPTION 'Invalid action';
  END IF;

  SELECT u.id, u.full_name INTO v_me, v_mgr_name
  FROM public.users u
  WHERE u.auth_user_id = auth.uid() AND u.is_active = true
  LIMIT 1;

  IF v_me IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_req
  FROM public.dcr_late_fill_requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found';
  END IF;

  IF v_req.manager_id <> v_me THEN
    RAISE EXCEPTION 'Not your request to resolve';
  END IF;

  IF v_req.status <> 'pending' THEN
    RAISE EXCEPTION 'Request already resolved';
  END IF;

  IF p_action = 'rejected' THEN
    UPDATE public.dcr_late_fill_requests
    SET
      status = 'rejected',
      manager_comment = NULLIF(trim(p_manager_comment), ''),
      reviewed_by = v_me,
      reviewed_at = now()
    WHERE id = p_request_id;

    BEGIN
      PERFORM public._notify_user(
        v_req.mr_id,
        'late_dcr_rejected',
        'Late DCR request declined',
        COALESCE(v_mgr_name, 'Your manager') || ' declined your late DCR request.'
          || CASE
            WHEN NULLIF(trim(p_manager_comment), '') IS NOT NULL
            THEN ' Note: ' || trim(p_manager_comment)
            ELSE ''
          END,
        '/mr/report/history',
        jsonb_build_object('request_id', p_request_id)
      );
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
    RETURN;
  END IF;

  IF public.count_active_late_fill_slots(v_req.mr_id) > 0 THEN
    RAISE EXCEPTION 'MR still has active late DCR slots';
  END IF;

  FOREACH v_date IN ARRAY v_req.requested_dates LOOP
    EXIT WHEN v_count >= 15;
    IF EXISTS (
      SELECT 1 FROM public.daily_reports dr
      WHERE dr.mr_id = v_req.mr_id AND dr.report_date = v_date AND dr.status = 'submitted'
    ) THEN
      CONTINUE;
    END IF;
    BEGIN
      INSERT INTO public.dcr_late_fill_slots (mr_id, report_date, granted_by, source, request_id)
      VALUES (v_req.mr_id, v_date, v_me, 'request_approved', p_request_id);
      v_count := v_count + 1;
    EXCEPTION WHEN unique_violation THEN
      NULL;
    END;
  END LOOP;

  IF v_count = 0 THEN
    RAISE EXCEPTION 'No dates could be approved';
  END IF;

  UPDATE public.dcr_late_fill_requests
  SET
    status = 'approved',
    manager_comment = NULLIF(trim(p_manager_comment), ''),
    reviewed_by = v_me,
    reviewed_at = now(),
    approved_dates = (
      SELECT array_agg(s.report_date ORDER BY s.report_date)
      FROM public.dcr_late_fill_slots s
      WHERE s.request_id = p_request_id
    )
  WHERE id = p_request_id;

  BEGIN
    PERFORM public._notify_user(
      v_req.mr_id,
      'late_dcr_granted',
      'Late DCR request approved',
      COALESCE(v_mgr_name, 'Your manager') || ' approved ' || v_count::text
        || ' late DCR date(s). File them from Pending DCRs on your dashboard.',
      '/mr/dashboard',
      jsonb_build_object('request_id', p_request_id, 'granted_count', v_count)
    );
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
END;
$$;
