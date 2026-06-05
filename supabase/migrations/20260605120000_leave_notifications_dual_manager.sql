-- Leave DCR approval flow, dual-manager notifications, auto leave-without-pay,
-- mark-all-read, and notify-all-managers on DCR submit.

-- ---------------------------------------------------------------------------
-- Notify all mapped managers for an MR (optionally exclude one)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public._notify_mr_managers(
  p_mr_id uuid,
  p_kind text,
  p_title text,
  p_body text,
  p_url text DEFAULT '/',
  p_metadata jsonb DEFAULT '{}'::jsonb,
  p_exclude_manager_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_mgr uuid;
BEGIN
  PERFORM set_config('row_security', 'off', true);
  FOR v_mgr IN
    SELECT DISTINCT mm.manager_id
    FROM public.mr_manager_map mm
    JOIN public.users u ON u.id = mm.manager_id AND u.is_active = true
    WHERE mm.mr_id = p_mr_id
      AND (p_exclude_manager_id IS NULL OR mm.manager_id <> p_exclude_manager_id)
  LOOP
    BEGIN
      PERFORM public._notify_user(v_mgr, p_kind, p_title, p_body, p_url, p_metadata);
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public._notify_mr_managers(uuid, text, text, text, text, jsonb, uuid) FROM PUBLIC;

-- ---------------------------------------------------------------------------
-- Internal: submit a leave DCR report (bypasses fillable window — for approvals & auto-mark)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public._submit_leave_dcr_report(
  p_mr_id uuid,
  p_report_date date,
  p_remark text,
  p_category text DEFAULT 'without_pay'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_report_id uuid;
BEGIN
  PERFORM set_config('row_security', 'off', true);

  SELECT id INTO v_report_id
  FROM public.daily_reports
  WHERE mr_id = p_mr_id AND report_date = p_report_date
  LIMIT 1;

  IF v_report_id IS NULL THEN
    INSERT INTO public.daily_reports (
      mr_id, manager_id, working_with_ids, report_date, status, submitted_at,
      report_kind, leave_dcr_category, leave_dcr_remark
    ) VALUES (
      p_mr_id, NULL, '{}', p_report_date, 'submitted', now(),
      'leave', p_category, p_remark
    )
    RETURNING id INTO v_report_id;
  ELSE
    UPDATE public.daily_reports
    SET
      status = 'submitted',
      submitted_at = now(),
      report_kind = 'leave',
      leave_dcr_category = p_category,
      leave_dcr_remark = p_remark,
      working_with_ids = '{}',
      manager_id = NULL
    WHERE id = v_report_id
    RETURNING id INTO v_report_id;
  END IF;

  RETURN v_report_id;
END;
$$;

REVOKE ALL ON FUNCTION public._submit_leave_dcr_report(uuid, date, text, text) FROM PUBLIC;

-- ---------------------------------------------------------------------------
-- MR submits leave via Leave DCR form → pending leave_request + notify all managers
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.submit_leave_dcr_request(
  p_mr_id uuid,
  p_leave_date date,
  p_remark text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_me uuid;
  v_role text;
  v_mr_name text;
  v_leave_id uuid;
  v_mgr uuid;
  v_existing uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  v_me := public.session_profile_id();
  v_role := public.current_user_role();

  IF v_me IS NULL OR (v_role = 'mr' AND v_me <> p_mr_id) OR v_role NOT IN ('mr', 'admin') THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;

  IF trim(COALESCE(p_remark, '')) = '' THEN
    RAISE EXCEPTION 'Remark is required';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.daily_reports
    WHERE mr_id = p_mr_id AND report_date = p_leave_date AND status = 'submitted'
  ) THEN
    RAISE EXCEPTION 'A report for this date is already submitted';
  END IF;

  SELECT id INTO v_existing
  FROM public.leave_requests
  WHERE mr_id = p_mr_id AND leave_date = p_leave_date AND status = 'pending'
  LIMIT 1;

  IF v_existing IS NOT NULL THEN
    RAISE EXCEPTION 'A pending leave request already exists for this date';
  END IF;

  SELECT manager_id INTO v_mgr
  FROM public.mr_manager_map
  WHERE mr_id = p_mr_id
  ORDER BY assigned_at ASC NULLS LAST
  LIMIT 1;

  SELECT full_name INTO v_mr_name FROM public.users WHERE id = p_mr_id;

  INSERT INTO public.leave_requests (
    mr_id, manager_id, leave_date, leave_type, leave_category, reason, status
  ) VALUES (
    p_mr_id, v_mgr, p_leave_date, 'full', 'without_pay', trim(p_remark), 'pending'
  )
  RETURNING id INTO v_leave_id;

  PERFORM public._notify_mr_managers(
    p_mr_id,
    'leave_request',
    'Leave request',
    COALESCE(v_mr_name, 'Team member') || ' requested leave without pay for ' || to_char(p_leave_date, 'DD Mon YYYY') || '.',
    '/manager/leaves',
    jsonb_build_object('leave_id', v_leave_id, 'mr_id', p_mr_id, 'leave_date', p_leave_date, 'status', 'pending')
  );

  RETURN v_leave_id;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_leave_dcr_request(uuid, date, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_leave_dcr_request(uuid, date, text) TO authenticated;

-- ---------------------------------------------------------------------------
-- Manager resolves leave → submit leave DCR on approve; notify MR + other managers
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.resolve_leave_request(
  p_leave_id uuid,
  p_status text,
  p_manager_note text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_me uuid;
  v_role text;
  v_leave public.leave_requests%ROWTYPE;
  v_mr_name text;
  v_resolver_name text;
  v_status text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  v_me := public.session_profile_id();
  v_role := public.current_user_role();
  v_status := lower(trim(p_status));

  IF v_status NOT IN ('approved', 'rejected') THEN
    RAISE EXCEPTION 'Invalid status';
  END IF;

  SELECT * INTO v_leave FROM public.leave_requests WHERE id = p_leave_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Leave request not found';
  END IF;

  IF v_leave.status <> 'pending' THEN
    RAISE EXCEPTION 'Leave request already resolved';
  END IF;

  IF v_role NOT IN ('admin', 'manager') THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;

  IF v_role = 'manager' AND NOT EXISTS (
    SELECT 1 FROM public.mr_manager_map mm
    WHERE mm.manager_id = v_me AND mm.mr_id = v_leave.mr_id
  ) AND v_leave.manager_id <> v_me THEN
    RAISE EXCEPTION 'Not your team member';
  END IF;

  UPDATE public.leave_requests
  SET
    status = v_status,
    manager_note = NULLIF(trim(p_manager_note), ''),
    resolved_at = now(),
    approved_by = CASE WHEN v_status = 'approved' THEN v_me ELSE NULL END
  WHERE id = p_leave_id;

  SELECT full_name INTO v_mr_name FROM public.users WHERE id = v_leave.mr_id;
  SELECT full_name INTO v_resolver_name FROM public.users WHERE id = v_me;

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
      jsonb_build_object('leave_id', p_leave_id, 'mr_id', v_leave.mr_id, 'status', 'approved', 'resolved_by', v_me),
      v_me
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
      jsonb_build_object('leave_id', p_leave_id, 'mr_id', v_leave.mr_id, 'status', 'rejected', 'resolved_by', v_me),
      v_me
    );
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.resolve_leave_request(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.resolve_leave_request(uuid, text, text) TO authenticated;

-- ---------------------------------------------------------------------------
-- Mark all notifications read for current user
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.mark_all_notifications_read()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_me uuid;
  v_count integer;
BEGIN
  v_me := public.session_profile_id();
  IF v_me IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  UPDATE public.user_notifications
  SET read_at = now()
  WHERE user_id = v_me AND read_at IS NULL;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.mark_all_notifications_read() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mark_all_notifications_read() TO authenticated;

-- ---------------------------------------------------------------------------
-- Auto-mark missed DCRs (outside 2-day window) as leave without pay — MR only
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.auto_mark_missed_dcr_leave_without_pay(p_mr_id uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_mr uuid;
  v_today date := today_ist();
  v_check date;
  v_marked integer := 0;
  v_has_report boolean;
  v_is_excused boolean;
BEGIN
  PERFORM set_config('row_security', 'off', true);

  FOR v_mr IN
    SELECT u.id FROM public.users u
    WHERE u.role = 'mr' AND u.is_active = true
      AND (p_mr_id IS NULL OR u.id = p_mr_id)
  LOOP
    FOR v_check IN
      SELECT d::date
      FROM generate_series(v_today - 60, v_today - 3, INTERVAL '1 day') AS d
    LOOP
      IF EXTRACT(DOW FROM v_check) = 0 THEN
        CONTINUE;
      END IF;

      SELECT EXISTS (
        SELECT 1 FROM public.daily_reports
        WHERE mr_id = v_mr AND report_date = v_check AND status = 'submitted'
      ) INTO v_has_report;

      IF v_has_report THEN
        CONTINUE;
      END IF;

      SELECT EXISTS (
        SELECT 1 FROM public.dcr_late_fill_slots s
        WHERE s.mr_id = v_mr AND s.report_date = v_check AND s.consumed_at IS NULL
        UNION ALL
        SELECT 1 FROM public.leave_requests lr
        WHERE lr.mr_id = v_mr AND lr.leave_date = v_check AND lr.status = 'pending'
        UNION ALL
        SELECT 1 FROM public.mr_holidays mh
        JOIN public.holidays h ON h.id = mh.holiday_id
        WHERE mh.mr_id = v_mr AND h.holiday_date = v_check AND mh.counts_as_leave = FALSE
        UNION ALL
        SELECT 1 FROM public.strike_reports WHERE mr_id = v_mr AND strike_date = v_check
      ) INTO v_is_excused;

      IF v_is_excused THEN
        CONTINUE;
      END IF;

      PERFORM public._submit_leave_dcr_report(
        v_mr,
        v_check,
        'Auto-marked: DCR not submitted within filing window',
        'without_pay'
      );
      v_marked := v_marked + 1;
    END LOOP;
  END LOOP;

  RETURN jsonb_build_object('marked_count', v_marked, 'checked_on', v_today);
END;
$$;

REVOKE ALL ON FUNCTION public.auto_mark_missed_dcr_leave_without_pay(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.auto_mark_missed_dcr_leave_without_pay(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- Notify ALL mapped managers when DCR is submitted (fix single-manager LIMIT 1)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.notify_dcr_submitted_to_manager(
  p_mr_id uuid,
  p_report_date text,
  p_manager_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_mr_name text;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN;
  END IF;

  SELECT full_name INTO v_mr_name FROM public.users WHERE id = p_mr_id;

  IF p_manager_id IS NOT NULL THEN
    BEGIN
      PERFORM public._notify_user(
        p_manager_id,
        'dcr_submitted',
        'DCR submitted',
        COALESCE(v_mr_name, 'Team member') || ' submitted DCR for ' || p_report_date || '.',
        '/manager/reports',
        jsonb_build_object('mr_id', p_mr_id, 'report_date', p_report_date)
      );
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END IF;

  PERFORM public._notify_mr_managers(
    p_mr_id,
    'dcr_submitted',
    'DCR submitted',
    COALESCE(v_mr_name, 'Team member') || ' submitted DCR for ' || p_report_date || '.',
    '/manager/reports',
    jsonb_build_object('mr_id', p_mr_id, 'report_date', p_report_date),
    p_manager_id
  );
END;
$$;
