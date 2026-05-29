-- Fix performance RPC (strike_reports.strike_date), role resolution from users table,
-- unlock-aware fillable dates, and manager unlock resolve RPC.

-- ---------------------------------------------------------------------------
-- current_user_role: JWT app_metadata first, then users.role
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(
    NULLIF(trim(auth.jwt() -> 'app_metadata' ->> 'role'), ''),
    (
      SELECT u.role::text
      FROM public.users u
      WHERE u.auth_user_id = auth.uid()
        AND u.is_active = true
      LIMIT 1
    ),
    ''
  );
$$;

-- ---------------------------------------------------------------------------
-- get_mr_performance_metrics: use strike_date (not report_date)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_mr_performance_metrics(p_mr_id uuid, p_from date, p_to date)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_me uuid;
  v_role text;
  v_is_manager_for boolean := false;
  v_from date := COALESCE(p_from, date_trunc('month', today_ist()::timestamp)::date);
  v_to date := COALESCE(p_to, today_ist());
  v_doctor_calls int := 0;
  v_chemist_meets int := 0;
  v_stockist_meets int := 0;
  v_field_days int := 0;
  v_sundays int := 0;
  v_holidays int := 0;
  v_strikes int := 0;
  v_leaves int := 0;
  v_expense_submitted_days int := 0;
BEGIN
  SELECT u.id, u.role::text INTO v_me, v_role
  FROM public.users u
  WHERE u.auth_user_id = auth.uid() AND u.is_active = true
  LIMIT 1;

  IF v_me IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  IF v_role = 'mr' THEN
    IF p_mr_id <> v_me THEN RAISE EXCEPTION 'Not allowed'; END IF;
  ELSIF v_role = 'manager' THEN
    v_is_manager_for := EXISTS (
      SELECT 1 FROM public.mr_manager_map mm
      WHERE mm.manager_id = v_me AND mm.mr_id = p_mr_id
    ) OR p_mr_id = v_me;
    IF NOT v_is_manager_for THEN RAISE EXCEPTION 'Not allowed'; END IF;
  ELSIF v_role <> 'admin' THEN
    RAISE EXCEPTION 'Not allowed';
  END IF;

  SELECT count(*)::int,
         count(DISTINCT rv.chemist_id)::int
    INTO v_doctor_calls, v_chemist_meets
  FROM public.daily_reports dr
  JOIN public.report_visits rv ON rv.report_id = dr.id
  WHERE dr.mr_id = p_mr_id
    AND dr.status = 'submitted'
    AND dr.report_date BETWEEN v_from AND v_to
    AND dr.report_kind = 'field';

  SELECT count(*)::int INTO v_stockist_meets
  FROM public.stockist_meets sm
  WHERE sm.user_id = p_mr_id
    AND sm.meet_date BETWEEN v_from AND v_to;

  SELECT count(DISTINCT er.report_date)::int INTO v_expense_submitted_days
  FROM public.expense_reports er
  WHERE er.mr_id = p_mr_id
    AND er.status = 'submitted'
    AND er.report_date BETWEEN v_from AND v_to;

  SELECT count(*)::int INTO v_sundays
  FROM generate_series(v_from, v_to, interval '1 day') d
  WHERE EXTRACT(DOW FROM d) = 0;

  SELECT count(DISTINCT h.holiday_date)::int INTO v_holidays
  FROM public.mr_holidays mh
  JOIN public.holidays h ON h.id = mh.holiday_id
  WHERE mh.mr_id = p_mr_id
    AND h.holiday_date BETWEEN v_from AND v_to
    AND mh.counts_as_leave = false;

  SELECT count(DISTINCT s.strike_date)::int INTO v_strikes
  FROM public.strike_reports s
  WHERE s.mr_id = p_mr_id
    AND s.strike_date BETWEEN v_from AND v_to;

  SELECT count(DISTINCT lr.leave_date)::int INTO v_leaves
  FROM public.leave_requests lr
  WHERE lr.mr_id = p_mr_id
    AND lr.status = 'approved'
    AND lr.leave_date BETWEEN v_from AND v_to;

  SELECT count(DISTINCT dr.report_date)::int INTO v_field_days
  FROM public.daily_reports dr
  WHERE dr.mr_id = p_mr_id
    AND dr.status = 'submitted'
    AND dr.report_kind = 'field'
    AND dr.report_date BETWEEN v_from AND v_to
    AND EXTRACT(DOW FROM dr.report_date) <> 0
    AND NOT EXISTS (
      SELECT 1
      FROM public.mr_holidays mh
      JOIN public.holidays h ON h.id = mh.holiday_id
      WHERE mh.mr_id = p_mr_id
        AND mh.counts_as_leave = false
        AND h.holiday_date = dr.report_date
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.strike_reports s
      WHERE s.mr_id = p_mr_id AND s.strike_date = dr.report_date
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.leave_requests lr
      WHERE lr.mr_id = p_mr_id AND lr.status = 'approved' AND lr.leave_date = dr.report_date
    );

  RETURN jsonb_build_object(
    'from', v_from,
    'to', v_to,
    'doctor_calls', v_doctor_calls,
    'doctor_call_avg', CASE WHEN v_field_days > 0 THEN round((v_doctor_calls::numeric / v_field_days)::numeric, 2) ELSE 0 END,
    'chemist_meets', v_chemist_meets,
    'stockist_meets', v_stockist_meets,
    'field_work_days', v_field_days,
    'sundays', v_sundays,
    'holidays', v_holidays,
    'leaves', v_leaves,
    'strikes', v_strikes,
    'expense_submitted_days', v_expense_submitted_days
  );
END;
$function$;

-- ---------------------------------------------------------------------------
-- is_report_date_fillable: default window, late slots, approved unlock for date
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_report_date_fillable(p_mr_id uuid, p_date date)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    p_date BETWEEN today_ist() - 2 AND today_ist()
    OR EXISTS (
      SELECT 1 FROM public.dcr_late_fill_slots s
      WHERE s.mr_id = p_mr_id
        AND s.report_date = p_date
        AND s.consumed_at IS NULL
    )
    OR EXISTS (
      SELECT 1 FROM public.report_unlock_requests r
      WHERE r.mr_id = p_mr_id
        AND r.status = 'approved'
        AND r.requested_date = p_date
    );
$$;

-- ---------------------------------------------------------------------------
-- resolve_report_unlock_request (manager; bypasses RLS JWT mismatch)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.resolve_report_unlock_request(
  p_request_id uuid,
  p_action text,
  p_manager_comment text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_me uuid;
  v_role text;
BEGIN
  IF p_action NOT IN ('approved', 'rejected') THEN
    RAISE EXCEPTION 'Invalid action';
  END IF;

  SELECT u.id, u.role::text INTO v_me, v_role
  FROM public.users u
  WHERE u.auth_user_id = auth.uid() AND u.is_active = true
  LIMIT 1;

  IF v_me IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF v_role NOT IN ('manager', 'admin') THEN
    RAISE EXCEPTION 'Not allowed';
  END IF;

  UPDATE public.report_unlock_requests r
  SET
    status = p_action,
    manager_comment = CASE
      WHEN p_action = 'rejected' THEN NULLIF(trim(p_manager_comment), '')
      ELSE NULL
    END,
    resolved_at = now()
  WHERE r.id = p_request_id
    AND r.manager_id = v_me
    AND r.status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found or already resolved';
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.resolve_report_unlock_request(uuid, text, text) TO authenticated;
