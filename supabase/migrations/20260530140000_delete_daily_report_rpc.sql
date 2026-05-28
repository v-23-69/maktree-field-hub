-- Reliable DCR delete for managers (team + self) and MR own reports.

CREATE OR REPLACE FUNCTION public.delete_daily_report(p_report_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_mr_id uuid;
  v_role text;
  v_me uuid;
BEGIN
  SELECT dr.mr_id INTO v_mr_id
  FROM public.daily_reports dr
  WHERE dr.id = p_report_id;

  IF v_mr_id IS NULL THEN
    RAISE EXCEPTION 'Report not found';
  END IF;

  v_me := public.session_profile_id();
  IF v_me IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT u.role::text INTO v_role
  FROM public.users u
  WHERE u.id = v_me;

  IF v_role = 'admin' OR v_mr_id = v_me THEN
    NULL;
  ELSIF v_role = 'manager' AND EXISTS (
    SELECT 1
    FROM public.mr_manager_map mm
    WHERE mm.manager_id = v_me AND mm.mr_id = v_mr_id
  ) THEN
    NULL;
  ELSIF v_role = 'manager' AND v_mr_id = v_me THEN
    NULL;
  ELSE
    RAISE EXCEPTION 'Not allowed to delete this report';
  END IF;

  DELETE FROM public.daily_reports WHERE id = p_report_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_daily_report(uuid) TO authenticated;
