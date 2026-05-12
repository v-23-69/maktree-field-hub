-- Fix timezone issues: Replace CURRENT_DATE (UTC) with IST-aware today_ist()
-- Also adds DCR pause logic and updates Working With RPC for MR peer visibility

-- Helper: returns today's date in IST
CREATE OR REPLACE FUNCTION public.today_ist()
RETURNS date
LANGUAGE sql STABLE
AS $$ SELECT (now() AT TIME ZONE 'Asia/Kolkata')::date; $$;

GRANT EXECUTE ON FUNCTION public.today_ist() TO authenticated;

-- Fix get_allowed_report_dates to use IST
CREATE OR REPLACE FUNCTION public.get_allowed_report_dates(p_mr_id uuid)
RETURNS TABLE(report_date date, already_submitted boolean, day_type text)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
SELECT
  d::DATE AS report_date,
  EXISTS (
    SELECT 1 FROM public.daily_reports dr
    WHERE dr.mr_id = p_mr_id
      AND dr.report_date = d::DATE
      AND dr.status = 'submitted'
  ) AS already_submitted,
  CASE
    WHEN EXTRACT(DOW FROM d::DATE) = 0 THEN 'sunday'
    WHEN EXISTS (
      SELECT 1 FROM public.mr_holidays mh
      JOIN public.holidays h ON h.id = mh.holiday_id
      WHERE mh.mr_id = p_mr_id
        AND h.holiday_date = d::DATE
        AND mh.counts_as_leave = FALSE
    ) THEN 'holiday'
    WHEN EXISTS (
      SELECT 1 FROM public.leave_requests
      WHERE mr_id = p_mr_id
        AND leave_date = d::DATE
        AND status = 'approved'
        AND leave_type = 'full'
    ) THEN 'leave'
    WHEN EXISTS (
      SELECT 1 FROM public.strike_reports
      WHERE mr_id = p_mr_id
        AND strike_date = d::DATE
    ) THEN 'strike'
    ELSE 'working'
  END AS day_type
FROM generate_series(
  today_ist() - INTERVAL '2 days',
  today_ist(),
  INTERVAL '1 day'
) AS d
WHERE EXTRACT(DOW FROM d::DATE) != 0
ORDER BY d DESC;
$$;

-- Fix check_report_block_status to use IST
CREATE OR REPLACE FUNCTION public.check_report_block_status(p_mr_id uuid)
RETURNS TABLE(is_blocked boolean, missed_dates date[], has_pending_request boolean)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_missed      DATE[] := '{}';
  v_check_date  DATE;
  v_has_report  BOOLEAN;
  v_is_excused  BOOLEAN;
  v_has_pending BOOLEAN;
  v_is_blocked  BOOLEAN;
  v_today       DATE := today_ist();
BEGIN
  FOR i IN 1..3 LOOP
    v_check_date := v_today - i;
    SELECT EXISTS (
      SELECT 1 FROM public.daily_reports
      WHERE mr_id = p_mr_id AND report_date = v_check_date AND status = 'submitted'
    ) INTO v_has_report;
    IF NOT v_has_report THEN
      SELECT EXISTS (
        SELECT 1 FROM public.leave_requests
        WHERE mr_id = p_mr_id AND leave_date = v_check_date AND status = 'approved' AND leave_type = 'full'
        UNION ALL
        SELECT 1 FROM public.mr_holidays mh
        JOIN public.holidays h ON h.id = mh.holiday_id
        WHERE mh.mr_id = p_mr_id AND h.holiday_date = v_check_date AND mh.counts_as_leave = FALSE
        UNION ALL
        SELECT 1 FROM public.strike_reports WHERE mr_id = p_mr_id AND strike_date = v_check_date
        UNION ALL
        SELECT 1 WHERE EXTRACT(DOW FROM v_check_date) = 0
      ) INTO v_is_excused;
      IF NOT v_is_excused THEN
        v_missed := array_append(v_missed, v_check_date);
      END IF;
    END IF;
  END LOOP;
  v_is_blocked := array_length(v_missed, 1) = 3;
  SELECT EXISTS (
    SELECT 1 FROM public.report_unlock_requests WHERE mr_id = p_mr_id AND status = 'pending'
  ) INTO v_has_pending;
  IF EXISTS (
    SELECT 1 FROM public.report_unlock_requests
    WHERE mr_id = p_mr_id AND status = 'approved' AND requested_date >= v_today - 1
  ) THEN
    v_is_blocked := FALSE;
  END IF;
  RETURN QUERY SELECT v_is_blocked, v_missed, v_has_pending;
END;
$$;

-- Fix get_today_tp_plan to use IST
CREATE OR REPLACE FUNCTION public.get_today_tp_plan(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_result jsonb;
  v_today date := today_ist();
BEGIN
  SELECT jsonb_build_object(
    'work_date', tpe.work_date,
    'sub_area_id', tpe.sub_area_id,
    'sub_area_name', sa.name,
    'area_id', a.id,
    'area_name', a.name,
    'working_with_ids', COALESCE(tpe.working_with_ids, '{}'::uuid[]),
    'day_type', tpe.day_type,
    'notes', tpe.notes,
    'tp_status', tp.status
  ) INTO v_result
  FROM tour_program_entries tpe
  JOIN tour_programs tp ON tp.id = tpe.tour_program_id
  LEFT JOIN sub_areas sa ON sa.id = tpe.sub_area_id
  LEFT JOIN areas a ON a.id = sa.area_id
  WHERE tp.mr_id = p_user_id
    AND tpe.work_date = v_today
    AND tp.month = date_trunc('month', v_today)::date
  LIMIT 1;
  RETURN COALESCE(v_result, '{}'::jsonb);
END;
$$;

-- Fix get_tp_status_for_user to use IST
CREATE OR REPLACE FUNCTION public.get_tp_status_for_user(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_today date := today_ist();
  v_current_month date;
  v_next_month date;
  v_deadline date;
  v_current_tp_status text;
  v_next_tp_status text;
  v_days_to_deadline int;
  v_is_overdue boolean;
BEGIN
  v_current_month := date_trunc('month', v_today)::date;
  v_next_month := (date_trunc('month', v_today) + interval '1 month')::date;
  v_deadline := (v_next_month - interval '2 days')::date;
  v_days_to_deadline := v_deadline - v_today;
  v_is_overdue := v_today >= v_next_month AND NOT EXISTS (
    SELECT 1 FROM tour_programs
    WHERE mr_id = p_user_id AND month = v_next_month
      AND status IN ('draft','submitted','approved')
  );
  SELECT status INTO v_current_tp_status
  FROM tour_programs WHERE mr_id = p_user_id AND month = v_current_month LIMIT 1;
  SELECT status INTO v_next_tp_status
  FROM tour_programs WHERE mr_id = p_user_id AND month = v_next_month LIMIT 1;
  RETURN jsonb_build_object(
    'current_month', v_current_month,
    'current_month_tp_status', COALESCE(v_current_tp_status, 'not_created'),
    'current_month_tp_exists', v_current_tp_status IS NOT NULL,
    'next_month', v_next_month,
    'next_month_tp_status', COALESCE(v_next_tp_status, 'not_created'),
    'next_month_tp_exists', v_next_tp_status IS NOT NULL,
    'deadline_date', v_deadline,
    'days_to_deadline', v_days_to_deadline,
    'is_overdue', v_is_overdue
  );
END;
$$;

-- Fix is_tp_submission_late to use IST
CREATE OR REPLACE FUNCTION public.is_tp_submission_late(p_month text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT today_ist() > (p_month::date + interval '5 days')::date;
$$;

-- Fix pause_accounts_missing_tp to use IST
CREATE OR REPLACE FUNCTION public.pause_accounts_missing_tp()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_current_month date;
  v_paused_count int := 0;
BEGIN
  v_current_month := date_trunc('month', today_ist())::date;
  UPDATE users u
  SET is_paused = true,
      paused_at = now(),
      pause_reason = 'Tour Program not created for ' || to_char(v_current_month, 'Month YYYY')
  WHERE u.role::text IN ('mr','manager')
    AND u.is_active = true
    AND u.is_paused = false
    AND NOT EXISTS (
      SELECT 1 FROM tour_programs tp
      WHERE tp.mr_id = u.id AND tp.month = v_current_month
        AND tp.status IN ('draft','submitted','approved')
    );
  GET DIAGNOSTICS v_paused_count = ROW_COUNT;
  RETURN jsonb_build_object('paused_count', v_paused_count, 'month', v_current_month);
END;
$$;

-- Fix get_doctor_alerts to use IST
CREATE OR REPLACE FUNCTION public.get_doctor_alerts(p_mr_id uuid)
RETURNS TABLE(doctor_id uuid, doctor_name text, alert_type text, alert_date date, days_until integer, sub_area text)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
SELECT
  d.id AS doctor_id,
  d.full_name AS doctor_name,
  'birthday' AS alert_type,
  d.birthday AS alert_date,
  (
    DATE_PART('doy',
      MAKE_DATE(
        EXTRACT(YEAR FROM today_ist())::INT,
        EXTRACT(MONTH FROM d.birthday)::INT,
        EXTRACT(DAY FROM d.birthday)::INT
      )
    ) - DATE_PART('doy', today_ist())
  )::INTEGER AS days_until,
  sa.name AS sub_area
FROM public.doctors d
JOIN public.sub_areas sa ON sa.id = d.sub_area_id
JOIN public.mr_sub_area_access msa ON msa.sub_area_id = sa.id
WHERE msa.mr_id = p_mr_id
  AND d.birthday IS NOT NULL
  AND d.is_active = TRUE
  AND (
    EXTRACT(MONTH FROM d.birthday) = EXTRACT(MONTH FROM today_ist())
    AND EXTRACT(DAY FROM d.birthday) BETWEEN
      EXTRACT(DAY FROM today_ist()) AND
      EXTRACT(DAY FROM today_ist() + INTERVAL '7 days')
  )

UNION ALL

SELECT
  d.id,
  d.full_name,
  'anniversary' AS alert_type,
  d.marriage_anniversary AS alert_date,
  (
    DATE_PART('doy',
      MAKE_DATE(
        EXTRACT(YEAR FROM today_ist())::INT,
        EXTRACT(MONTH FROM d.marriage_anniversary)::INT,
        EXTRACT(DAY FROM d.marriage_anniversary)::INT
      )
    ) - DATE_PART('doy', today_ist())
  )::INTEGER AS days_until,
  sa.name AS sub_area
FROM public.doctors d
JOIN public.sub_areas sa ON sa.id = d.sub_area_id
JOIN public.mr_sub_area_access msa ON msa.sub_area_id = sa.id
WHERE msa.mr_id = p_mr_id
  AND d.marriage_anniversary IS NOT NULL
  AND d.is_active = TRUE
  AND (
    EXTRACT(MONTH FROM d.marriage_anniversary) = EXTRACT(MONTH FROM today_ist())
    AND EXTRACT(DAY FROM d.marriage_anniversary) BETWEEN
      EXTRACT(DAY FROM today_ist()) AND
      EXTRACT(DAY FROM today_ist() + INTERVAL '7 days')
  )

ORDER BY days_until ASC;
$$;

-- New: Pause accounts that missed DCR for 2 consecutive working days
CREATE OR REPLACE FUNCTION public.pause_accounts_missing_dcr()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_today date := today_ist();
  v_paused_count int := 0;
  v_user RECORD;
  v_missed int;
  v_check_date date;
  v_has_report boolean;
  v_is_excused boolean;
BEGIN
  FOR v_user IN
    SELECT u.id FROM users u
    WHERE u.role::text IN ('mr','manager')
      AND u.is_active = true AND u.is_paused = false
  LOOP
    v_missed := 0;
    FOR i IN 1..2 LOOP
      v_check_date := v_today - i;
      IF EXTRACT(DOW FROM v_check_date) = 0 THEN CONTINUE; END IF;

      SELECT EXISTS (
        SELECT 1 FROM daily_reports
        WHERE mr_id = v_user.id AND report_date = v_check_date AND status = 'submitted'
      ) INTO v_has_report;

      IF NOT v_has_report THEN
        SELECT EXISTS (
          SELECT 1 FROM leave_requests
          WHERE mr_id = v_user.id AND leave_date = v_check_date AND status = 'approved' AND leave_type = 'full'
          UNION ALL
          SELECT 1 FROM mr_holidays mh JOIN holidays h ON h.id = mh.holiday_id
          WHERE mh.mr_id = v_user.id AND h.holiday_date = v_check_date AND mh.counts_as_leave = FALSE
          UNION ALL
          SELECT 1 FROM strike_reports WHERE mr_id = v_user.id AND strike_date = v_check_date
        ) INTO v_is_excused;
        IF NOT v_is_excused THEN
          v_missed := v_missed + 1;
        END IF;
      END IF;
    END LOOP;

    IF v_missed >= 2 THEN
      UPDATE users SET is_paused = true, paused_at = now(),
        pause_reason = 'DCR not submitted for 2 consecutive days'
      WHERE id = v_user.id;
      v_paused_count := v_paused_count + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object('paused_count', v_paused_count, 'checked_date', v_today);
END;
$$;

GRANT EXECUTE ON FUNCTION public.pause_accounts_missing_dcr() TO authenticated;

-- Update Working With RPC: MRs now see peer MRs (other MRs under same manager)
CREATE OR REPLACE FUNCTION public.list_working_with_options_for_report()
RETURNS TABLE(id uuid, full_name text, employee_code text, role text, option_kind text, profile_photo_url text)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_auth uuid := auth.uid();
  v_me_id uuid;
  v_role text;
BEGIN
  IF v_auth IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT u.id, u.role::text INTO v_me_id, v_role
  FROM public.users u WHERE u.auth_user_id = v_auth AND u.is_active = true LIMIT 1;
  IF v_me_id IS NULL THEN RAISE EXCEPTION 'Active user profile not found'; END IF;

  IF v_role = 'manager' THEN
    RETURN QUERY
      SELECT u.id, u.full_name, u.employee_code, u.role::text, 'team_mr'::text AS option_kind, u.profile_photo_url
      FROM public.users u
      WHERE u.is_active = true
        AND u.id IN (SELECT mm.mr_id FROM public.mr_manager_map mm WHERE mm.manager_id = v_me_id)
      UNION ALL
      SELECT u.id, u.full_name, u.employee_code, u.role::text, 'peer_manager'::text AS option_kind, u.profile_photo_url
      FROM public.users u
      WHERE u.is_active = true AND u.role = 'manager' AND u.id != v_me_id
      ORDER BY option_kind, full_name;

  ELSIF v_role = 'mr' THEN
    RETURN QUERY
      SELECT u.id, u.full_name, u.employee_code, u.role::text, 'linked_manager'::text AS option_kind, u.profile_photo_url
      FROM public.users u
      WHERE u.is_active = true
        AND u.id IN (SELECT mm.manager_id FROM public.mr_manager_map mm WHERE mm.mr_id = v_me_id)
      UNION ALL
      SELECT u.id, u.full_name, u.employee_code, u.role::text, 'team_mr'::text AS option_kind, u.profile_photo_url
      FROM public.users u
      WHERE u.is_active = true
        AND u.id != v_me_id
        AND u.id IN (
          SELECT mm2.mr_id FROM public.mr_manager_map mm2
          WHERE mm2.manager_id IN (
            SELECT mm.manager_id FROM public.mr_manager_map mm WHERE mm.mr_id = v_me_id
          )
        )
      ORDER BY option_kind, full_name;

  ELSE
    RETURN QUERY
      SELECT u.id, u.full_name, u.employee_code, u.role::text,
        CASE WHEN u.role = 'manager' THEN 'peer_manager'::text ELSE 'team_mr'::text END AS option_kind,
        u.profile_photo_url
      FROM public.users u
      WHERE u.is_active = true AND u.role IN ('mr','manager')
      ORDER BY u.role, u.full_name;
  END IF;
END;
$$;
