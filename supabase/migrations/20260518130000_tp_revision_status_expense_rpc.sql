-- Tour program: edit tracking, richer TP status (areas + approved), today plan from approved TP only,
-- manager team expense status RPC (avoids RLS edge cases with bulk .in queries),
-- list_mrs_for_manager: only mapped MRs (no fallback to all MRs).

ALTER TABLE public.tour_programs
  ADD COLUMN IF NOT EXISTS edit_count integer NOT NULL DEFAULT 0;

-- ---------------------------------------------------------------------------
-- get_tp_status_for_user: add has_sub_area_access, current_month_tp_approved
-- ---------------------------------------------------------------------------
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
  v_has_areas boolean;
  v_current_approved boolean;
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

  SELECT EXISTS (
    SELECT 1 FROM mr_sub_area_access msa WHERE msa.mr_id = p_user_id
  ) INTO v_has_areas;

  SELECT status INTO v_current_tp_status
  FROM tour_programs WHERE mr_id = p_user_id AND month = v_current_month LIMIT 1;
  SELECT status INTO v_next_tp_status
  FROM tour_programs WHERE mr_id = p_user_id AND month = v_next_month LIMIT 1;

  v_current_approved := v_current_tp_status = 'approved';

  RETURN jsonb_build_object(
    'current_month', v_current_month,
    'current_month_tp_status', COALESCE(v_current_tp_status, 'not_created'),
    'current_month_tp_exists', v_current_tp_status IS NOT NULL,
    'current_month_tp_approved', v_current_approved,
    'has_sub_area_access', v_has_areas,
    'next_month', v_next_month,
    'next_month_tp_status', COALESCE(v_next_tp_status, 'not_created'),
    'next_month_tp_exists', v_next_tp_status IS NOT NULL,
    'deadline_date', v_deadline,
    'days_to_deadline', v_days_to_deadline,
    'is_overdue', v_is_overdue
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- get_today_tp_plan: only rows from APPROVED tour program for the month
-- ---------------------------------------------------------------------------
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
    AND tp.status = 'approved'
  LIMIT 1;

  RETURN COALESCE(v_result, '{}'::jsonb);
END;
$$;

-- ---------------------------------------------------------------------------
-- MR: move submitted/approved TP back to draft for edits (increments edit_count)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.begin_tour_program_revision(p_tour_program_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_me uuid;
  v_role text;
  v_cnt int;
BEGIN
  SELECT id, role::text INTO v_me, v_role
  FROM users WHERE auth_user_id = auth.uid() AND is_active = true LIMIT 1;

  IF v_me IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF v_role <> 'mr' THEN
    RAISE EXCEPTION 'Only MR accounts use revision; managers edit in place';
  END IF;

  UPDATE tour_programs tp
  SET
    status = 'draft',
    edit_count = tp.edit_count + 1,
    submitted_at = NULL,
    approved_at = NULL,
    manager_note = NULL,
    is_late = false
  WHERE tp.id = p_tour_program_id
    AND tp.mr_id = v_me
    AND tp.status IN ('submitted', 'approved');

  GET DIAGNOSTICS v_cnt = ROW_COUNT;
  IF v_cnt = 0 THEN
    RAISE EXCEPTION 'Tour program not found or not in revisable state';
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.begin_tour_program_revision(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- Manager: expense report status for mapped MRs on a date (single round-trip)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_manager_team_expense_report_statuses(p_report_date date)
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(
    (
      SELECT jsonb_agg(jsonb_build_object('mr_id', er.mr_id, 'status', er.status) ORDER BY er.mr_id)
      FROM expense_reports er
      WHERE er.report_date = p_report_date
        AND EXISTS (
          SELECT 1
          FROM users me
          INNER JOIN mr_manager_map mm ON mm.manager_id = me.id AND mm.mr_id = er.mr_id
          WHERE me.auth_user_id = auth.uid()
            AND me.role::text = 'manager'
            AND me.is_active = true
        )
    ),
    '[]'::jsonb
  );
$$;

GRANT EXECUTE ON FUNCTION public.get_manager_team_expense_report_statuses(date) TO authenticated;

CREATE OR REPLACE FUNCTION public.increment_tour_program_edit_count(p_tour_program_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  UPDATE tour_programs tp
  SET edit_count = tp.edit_count + 1
  WHERE tp.id = p_tour_program_id
    AND tp.mr_id = public.session_profile_id()
    AND tp.status = 'approved';
$$;

GRANT EXECUTE ON FUNCTION public.increment_tour_program_edit_count(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- list_mrs_for_manager: mapped MRs only (removes dangerous fallback)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.list_mrs_for_manager()
RETURNS TABLE (
  id uuid,
  employee_code text,
  full_name text,
  role text,
  email text,
  is_active boolean,
  auth_user_id uuid,
  must_change_password boolean,
  created_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT
    mr.id,
    mr.employee_code::text,
    mr.full_name::text,
    mr.role::text,
    mr.email::text,
    mr.is_active,
    mr.auth_user_id,
    mr.must_change_password,
    mr.created_at
  FROM public.users mr
  INNER JOIN public.mr_manager_map m ON m.mr_id = mr.id
  INNER JOIN public.users me ON me.id = m.manager_id
  WHERE me.auth_user_id = auth.uid()
    AND me.role::text = 'manager'
    AND mr.role::text = 'mr'
    AND mr.is_active = true
  ORDER BY mr.full_name;
$$;
