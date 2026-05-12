-- TP Enforcement: account pause, unpause, deadline checks, today plan

-- 1. Add pause columns to users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_paused boolean DEFAULT false;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS paused_at timestamptz;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS paused_by uuid;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS pause_reason text;

-- 2. get_tp_status_for_user: returns current & next month TP status, deadline info
CREATE OR REPLACE FUNCTION public.get_tp_status_for_user(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_current_month date;
  v_next_month date;
  v_deadline date;
  v_current_tp_status text;
  v_next_tp_status text;
  v_days_to_deadline int;
  v_is_overdue boolean;
BEGIN
  v_current_month := date_trunc('month', CURRENT_DATE)::date;
  v_next_month := (date_trunc('month', CURRENT_DATE) + interval '1 month')::date;
  v_deadline := (v_next_month - interval '2 days')::date;
  v_days_to_deadline := v_deadline - CURRENT_DATE;
  v_is_overdue := CURRENT_DATE >= v_next_month AND NOT EXISTS (
    SELECT 1 FROM tour_programs
    WHERE mr_id = p_user_id AND month = v_next_month
      AND status IN ('draft','submitted','approved')
  );

  SELECT status INTO v_current_tp_status
  FROM tour_programs
  WHERE mr_id = p_user_id AND month = v_current_month
  LIMIT 1;

  SELECT status INTO v_next_tp_status
  FROM tour_programs
  WHERE mr_id = p_user_id AND month = v_next_month
  LIMIT 1;

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

GRANT EXECUTE ON FUNCTION public.get_tp_status_for_user(uuid) TO authenticated;

-- 3. get_today_tp_plan: returns today's TP entry details for dashboard
CREATE OR REPLACE FUNCTION public.get_today_tp_plan(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_result jsonb;
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
    AND tpe.work_date = CURRENT_DATE
    AND tp.month = date_trunc('month', CURRENT_DATE)::date
  LIMIT 1;

  RETURN COALESCE(v_result, '{}'::jsonb);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_today_tp_plan(uuid) TO authenticated;

-- 4. unpause_user: manager can unpause MR, admin can unpause manager
CREATE OR REPLACE FUNCTION public.unpause_user(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_caller_id uuid;
  v_caller_role text;
  v_target_role text;
BEGIN
  SELECT id, role::text INTO v_caller_id, v_caller_role
  FROM users WHERE auth_user_id = auth.uid() AND is_active = true;

  SELECT role::text INTO v_target_role
  FROM users WHERE id = p_user_id;

  IF v_target_role = 'mr' AND v_caller_role NOT IN ('manager','admin') THEN
    RAISE EXCEPTION 'Only managers or admins can unpause MRs';
  END IF;
  IF v_target_role = 'manager' AND v_caller_role <> 'admin' THEN
    RAISE EXCEPTION 'Only admins can unpause managers';
  END IF;

  IF v_caller_role = 'manager' THEN
    IF NOT EXISTS (
      SELECT 1 FROM mr_manager_map WHERE manager_id = v_caller_id AND mr_id = p_user_id
    ) THEN
      RAISE EXCEPTION 'You can only unpause your own MRs';
    END IF;
  END IF;

  UPDATE users SET is_paused = false, paused_at = NULL, paused_by = NULL, pause_reason = NULL
  WHERE id = p_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.unpause_user(uuid) TO authenticated;

-- 5. pause_accounts_missing_tp: callable by admin/cron to pause accounts with no TP
CREATE OR REPLACE FUNCTION public.pause_accounts_missing_tp()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_current_month date;
  v_paused_count int := 0;
BEGIN
  v_current_month := date_trunc('month', CURRENT_DATE)::date;

  UPDATE users u
  SET is_paused = true,
      paused_at = now(),
      pause_reason = 'Tour Program not created for ' || to_char(v_current_month, 'Month YYYY')
  WHERE u.role::text IN ('mr','manager')
    AND u.is_active = true
    AND u.is_paused = false
    AND NOT EXISTS (
      SELECT 1 FROM tour_programs tp
      WHERE tp.mr_id = u.id
        AND tp.month = v_current_month
        AND tp.status IN ('draft','submitted','approved')
    );

  GET DIAGNOSTICS v_paused_count = ROW_COUNT;

  RETURN jsonb_build_object('paused_count', v_paused_count, 'month', v_current_month);
END;
$$;

GRANT EXECUTE ON FUNCTION public.pause_accounts_missing_tp() TO authenticated;

-- 6. Update get_tour_plan_for_date to include working_with_ids and accept non-approved TPs
DROP FUNCTION IF EXISTS public.get_tour_plan_for_date(uuid, date);

CREATE OR REPLACE FUNCTION public.get_tour_plan_for_date(p_mr_id uuid, p_date date)
RETURNS TABLE(
  sub_area_id uuid,
  sub_area_name text,
  area_id uuid,
  area_name text,
  working_with uuid,
  working_with_ids uuid[]
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
SELECT
  sa.id,
  sa.name,
  a.id,
  a.name,
  tpe.working_with,
  COALESCE(tpe.working_with_ids, '{}'::uuid[])
FROM public.tour_program_entries tpe
JOIN public.tour_programs tp ON tp.id = tpe.tour_program_id
JOIN public.sub_areas sa ON sa.id = tpe.sub_area_id
JOIN public.areas a ON a.id = sa.area_id
WHERE tp.mr_id = p_mr_id
  AND tpe.work_date = p_date
  AND tp.status IN ('draft','submitted','approved')
  AND tpe.day_type = 'working'
LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_tour_plan_for_date(uuid, date) TO authenticated;
