-- Hide resigned/inactive MRs from live team lists; keep them available for manager history.
-- Allow managers to clear auto-marked leave DCRs and open late-fill slots.
-- MR daily expense default is Rs 200.

-- ---------------------------------------------------------------------------
-- list_mrs_for_manager: active MRs only
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.list_mrs_for_manager()
RETURNS TABLE(
  id uuid,
  employee_code text,
  full_name text,
  role text,
  email text,
  is_active boolean,
  is_resigned boolean,
  auth_user_id uuid,
  must_change_password boolean,
  created_at timestamp with time zone
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  WITH me AS (
    SELECT u.id, u.role::text AS role_name
    FROM public.users u
    WHERE u.auth_user_id = auth.uid() AND u.is_active = true
    LIMIT 1
  ),
  mapped AS (
    SELECT
      mr.id,
      mr.employee_code::text,
      mr.full_name::text,
      mr.role::text,
      mr.email::text,
      mr.is_active,
      mr.is_resigned,
      mr.auth_user_id,
      mr.must_change_password,
      mr.created_at
    FROM public.users mr
    INNER JOIN public.mr_manager_map m ON m.mr_id = mr.id
    INNER JOIN me ON me.id = m.manager_id
    WHERE me.role_name = 'manager'
      AND mr.role::text = 'mr'
      AND COALESCE(mr.is_resigned, false) = false
      AND COALESCE(mr.is_active, true) = true
  ),
  fallback AS (
    SELECT
      mr.id,
      mr.employee_code::text,
      mr.full_name::text,
      mr.role::text,
      mr.email::text,
      mr.is_active,
      mr.is_resigned,
      mr.auth_user_id,
      mr.must_change_password,
      mr.created_at
    FROM public.users mr
    CROSS JOIN me
    WHERE me.role_name = 'manager'
      AND mr.role::text = 'mr'
      AND COALESCE(mr.is_resigned, false) = false
      AND COALESCE(mr.is_active, true) = true
      AND NOT EXISTS (SELECT 1 FROM mapped)
  )
  SELECT * FROM (
    SELECT * FROM mapped
    UNION ALL
    SELECT * FROM fallback
  ) s
  ORDER BY s.full_name;
$function$;

GRANT EXECUTE ON FUNCTION public.list_mrs_for_manager() TO authenticated;

-- ---------------------------------------------------------------------------
-- Former / resigned MRs for manager history (data preserved)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.list_former_mrs_for_manager()
RETURNS TABLE(
  id uuid,
  employee_code text,
  full_name text,
  role text,
  email text,
  is_active boolean,
  is_resigned boolean,
  resigned_at timestamp with time zone,
  auth_user_id uuid,
  must_change_password boolean,
  created_at timestamp with time zone
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  WITH me AS (
    SELECT u.id, u.role::text AS role_name
    FROM public.users u
    WHERE u.auth_user_id = auth.uid() AND u.is_active = true
    LIMIT 1
  )
  SELECT
    mr.id,
    mr.employee_code::text,
    mr.full_name::text,
    mr.role::text,
    mr.email::text,
    mr.is_active,
    mr.is_resigned,
    mr.resigned_at,
    mr.auth_user_id,
    mr.must_change_password,
    mr.created_at
  FROM public.users mr
  INNER JOIN public.mr_manager_map m ON m.mr_id = mr.id
  INNER JOIN me ON me.id = m.manager_id
  WHERE me.role_name = 'manager'
    AND mr.role::text = 'mr'
    AND (COALESCE(mr.is_resigned, false) = true OR COALESCE(mr.is_active, true) = false)
  ORDER BY mr.resigned_at DESC NULLS LAST, mr.full_name;
$function$;

REVOKE ALL ON FUNCTION public.list_former_mrs_for_manager() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_former_mrs_for_manager() TO authenticated;

-- ---------------------------------------------------------------------------
-- List auto-marked leave DCRs that block late fill
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.list_auto_marked_leave_dcrs(p_mr_id uuid)
RETURNS TABLE(
  report_id uuid,
  report_date date,
  leave_dcr_category text,
  leave_dcr_remark text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_me uuid;
  v_role text;
BEGIN
  SELECT u.id, u.role::text INTO v_me, v_role
  FROM public.users u
  WHERE u.auth_user_id = auth.uid() AND u.is_active = true
  LIMIT 1;

  IF v_me IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF v_role <> 'manager' THEN
    RAISE EXCEPTION 'Only managers can inspect auto-marked leave';
  END IF;

  IF p_mr_id <> v_me AND NOT EXISTS (
    SELECT 1 FROM public.mr_manager_map mm
    WHERE mm.manager_id = v_me AND mm.mr_id = p_mr_id
  ) THEN
    RAISE EXCEPTION 'This MR is not on your team';
  END IF;

  RETURN QUERY
  SELECT dr.id, dr.report_date, dr.leave_dcr_category, dr.leave_dcr_remark
  FROM public.daily_reports dr
  WHERE dr.mr_id = p_mr_id
    AND dr.status = 'submitted'
    AND dr.report_kind = 'leave'
    AND COALESCE(dr.leave_dcr_remark, '') ILIKE 'Auto-marked%'
  ORDER BY dr.report_date DESC;
END;
$function$;

REVOKE ALL ON FUNCTION public.list_auto_marked_leave_dcrs(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_auto_marked_leave_dcrs(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- Clear auto-marked leave and open late DCR slots for those dates
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.clear_auto_marked_leave_for_late_dcr(p_mr_id uuid, p_dates date[])
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_me uuid;
  v_role text;
  v_mgr_name text;
  v_date date;
  v_report_id uuid;
  v_visit_count int;
  v_cleared int := 0;
  v_granted int := 0;
  v_cleared_dates date[] := '{}';
  v_granted_dates date[] := '{}';
BEGIN
  SELECT u.id, u.role::text, u.full_name INTO v_me, v_role, v_mgr_name
  FROM public.users u
  WHERE u.auth_user_id = auth.uid() AND u.is_active = true
  LIMIT 1;

  IF v_me IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF v_role <> 'manager' THEN
    RAISE EXCEPTION 'Only managers can remove auto-marked leave';
  END IF;

  IF p_mr_id <> v_me AND NOT EXISTS (
    SELECT 1 FROM public.mr_manager_map mm
    WHERE mm.manager_id = v_me AND mm.mr_id = p_mr_id
  ) THEN
    RAISE EXCEPTION 'This MR is not on your team';
  END IF;

  IF EXISTS (SELECT 1 FROM public.users u WHERE u.id = p_mr_id AND u.role = 'mr' AND COALESCE(u.is_resigned, false)) THEN
    RAISE EXCEPTION 'Cannot open late DCR for a resigned MR';
  END IF;

  IF p_dates IS NULL OR cardinality(p_dates) = 0 THEN
    RAISE EXCEPTION 'Select at least one auto-leave date';
  END IF;

  IF cardinality(p_dates) > 15 THEN
    RAISE EXCEPTION 'You can clear at most 15 dates at a time';
  END IF;

  FOREACH v_date IN ARRAY p_dates LOOP
    SELECT dr.id INTO v_report_id
    FROM public.daily_reports dr
    WHERE dr.mr_id = p_mr_id
      AND dr.report_date = v_date
      AND dr.status = 'submitted'
      AND dr.report_kind = 'leave'
      AND COALESCE(dr.leave_dcr_remark, '') ILIKE 'Auto-marked%'
    LIMIT 1;

    IF v_report_id IS NULL THEN
      RAISE EXCEPTION 'No auto-marked leave DCR on %', v_date;
    END IF;

    SELECT count(*)::int INTO v_visit_count
    FROM public.report_visits rv
    WHERE rv.report_id = v_report_id;

    IF v_visit_count > 0 THEN
      RAISE EXCEPTION 'Cannot clear % — the leave DCR already has visits', v_date;
    END IF;

    DELETE FROM public.daily_reports WHERE id = v_report_id;
    v_cleared := v_cleared + 1;
    v_cleared_dates := array_append(v_cleared_dates, v_date);

    IF NOT EXISTS (
      SELECT 1 FROM public.dcr_late_fill_slots s
      WHERE s.mr_id = p_mr_id AND s.report_date = v_date AND s.consumed_at IS NULL
    ) THEN
      INSERT INTO public.dcr_late_fill_slots (mr_id, report_date, granted_by, source)
      VALUES (p_mr_id, v_date, v_me, 'manager_grant');
      v_granted := v_granted + 1;
      v_granted_dates := array_append(v_granted_dates, v_date);
    END IF;
  END LOOP;

  BEGIN
    PERFORM public._notify_user(
      p_mr_id,
      'late_dcr_granted',
      'Late DCR dates opened',
      COALESCE(v_mgr_name, 'Your manager')
        || ' removed auto-leave and opened '
        || v_granted::text
        || ' late DCR date(s). File them from Pending DCRs on your dashboard.',
      '/mr/dashboard',
      jsonb_build_object(
        'cleared_count', v_cleared,
        'granted_count', v_granted,
        'granted_dates', v_granted_dates,
        'granted_by', v_me
      )
    );
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  RETURN jsonb_build_object(
    'cleared_count', v_cleared,
    'granted_count', v_granted,
    'cleared_dates', v_cleared_dates,
    'granted_dates', v_granted_dates
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.clear_auto_marked_leave_for_late_dcr(uuid, date[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.clear_auto_marked_leave_for_late_dcr(uuid, date[]) TO authenticated;

-- ---------------------------------------------------------------------------
-- MR expense daily limit: Rs 200
-- ---------------------------------------------------------------------------
ALTER TABLE public.expense_reports ALTER COLUMN daily_limit SET DEFAULT 200.00;
ALTER TABLE public.expense_config ALTER COLUMN daily_limit SET DEFAULT 200.00;

UPDATE public.expense_reports er
SET daily_limit = 200.00
FROM public.users u
WHERE u.id = er.mr_id
  AND u.role = 'mr'
  AND er.status = 'draft'
  AND er.daily_limit = 300.00;

-- ---------------------------------------------------------------------------
-- Tushar: remove auto-leave on 4–6 Aug 2026 and open late DCR slots
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  v_mr uuid;
  v_mgr uuid;
  v_date date;
BEGIN
  SELECT id INTO v_mr
  FROM public.users
  WHERE employee_code = 'TELLTUSHARKADAM2' AND role = 'mr'
  LIMIT 1;

  IF v_mr IS NULL THEN
    RETURN;
  END IF;

  SELECT mm.manager_id INTO v_mgr
  FROM public.mr_manager_map mm
  WHERE mm.mr_id = v_mr
  ORDER BY mm.assigned_at ASC
  LIMIT 1;

  IF v_mgr IS NULL THEN
    SELECT id INTO v_mgr FROM public.users WHERE role = 'manager' AND is_active = true LIMIT 1;
  END IF;

  FOREACH v_date IN ARRAY ARRAY['2026-08-04', '2026-08-05', '2026-08-06']::date[] LOOP
    DELETE FROM public.daily_reports dr
    WHERE dr.mr_id = v_mr
      AND dr.report_date = v_date
      AND dr.report_kind = 'leave'
      AND COALESCE(dr.leave_dcr_remark, '') ILIKE 'Auto-marked%'
      AND NOT EXISTS (
        SELECT 1 FROM public.report_visits rv WHERE rv.report_id = dr.id
      );

    IF v_mgr IS NOT NULL AND NOT EXISTS (
      SELECT 1
      FROM public.dcr_late_fill_slots s
      WHERE s.mr_id = v_mr AND s.report_date = v_date AND s.consumed_at IS NULL
    ) THEN
      INSERT INTO public.dcr_late_fill_slots (mr_id, report_date, granted_by, source)
      VALUES (v_mr, v_date, v_mgr, 'manager_grant');
    END IF;
  END LOOP;

  IF v_mr IS NOT NULL THEN
    BEGIN
      PERFORM public._notify_user(
        v_mr,
        'late_dcr_granted',
        'Late DCR dates opened',
        'Auto-leave on 4–6 Aug was removed. Please file those DCRs from Pending DCRs on your dashboard.',
        '/mr/dashboard',
        jsonb_build_object(
          'granted_dates', ARRAY['2026-08-04', '2026-08-05', '2026-08-06']::date[]
        )
      );
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END IF;
END $$;
