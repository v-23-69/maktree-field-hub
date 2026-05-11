-- Working-with dropdown for managers (MRs + peer managers), RLS helpers for mr_holidays/strike_reports,
-- and batch assign sub-areas (depends on assign_sub_area_to_mr existing).

-- Caller profile id (bypasses RLS on users for stable checks)
CREATE OR REPLACE FUNCTION public.session_profile_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT u.id
  FROM public.users u
  WHERE u.auth_user_id = auth.uid()
    AND u.is_active = true
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.session_profile_id() TO authenticated;

CREATE OR REPLACE FUNCTION public.session_can_access_mr_row(p_mr_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users me
    WHERE me.auth_user_id = auth.uid()
      AND me.is_active = true
      AND (
        me.role::text = 'admin'
        OR me.id = p_mr_id
        OR (
          me.role::text = 'manager'
          AND EXISTS (
            SELECT 1
            FROM public.mr_manager_map mm
            WHERE mm.manager_id = me.id
              AND mm.mr_id = p_mr_id
          )
        )
      )
  );
$$;

GRANT EXECUTE ON FUNCTION public.session_can_access_mr_row(uuid) TO authenticated;

DROP POLICY IF EXISTS mr_holidays_select_by_role_scope ON public.mr_holidays;
DROP POLICY IF EXISTS mr_holidays_select_session_mr ON public.mr_holidays;
CREATE POLICY mr_holidays_select_session_mr
ON public.mr_holidays
FOR SELECT
TO authenticated
USING (public.session_can_access_mr_row(mr_holidays.mr_id));

-- Strike rows (MR dashboard): read if same MR visibility rules; insert only for own profile row.
ALTER TABLE public.strike_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS strike_reports_select_scope ON public.strike_reports;
CREATE POLICY strike_reports_select_scope
ON public.strike_reports
FOR SELECT
TO authenticated
USING (public.session_can_access_mr_row(strike_reports.mr_id));

DROP POLICY IF EXISTS strike_reports_insert_self ON public.strike_reports;
CREATE POLICY strike_reports_insert_self
ON public.strike_reports
FOR INSERT
TO authenticated
WITH CHECK (
  strike_reports.mr_id = public.session_profile_id()
);

GRANT SELECT, INSERT ON public.strike_reports TO authenticated;

-- Working-with Step 1: MR sees linked managers; manager sees team MRs + other managers.
CREATE OR REPLACE FUNCTION public.list_working_with_options_for_report()
RETURNS TABLE (
  id uuid,
  full_name text,
  employee_code text,
  role text,
  option_kind text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  WITH me AS (
    SELECT u.id, u.role::text AS role_name
    FROM public.users u
    WHERE u.auth_user_id = auth.uid()
    LIMIT 1
  ),
  mr_managers AS (
    SELECT mgr.id,
           mgr.full_name::text,
           mgr.employee_code::text,
           mgr.role::text AS role,
           'linked_manager'::text AS option_kind
    FROM public.users mgr
    INNER JOIN public.mr_manager_map m ON m.manager_id = mgr.id
    INNER JOIN me ON me.id = m.mr_id
    WHERE me.role_name = 'mr'
      AND mgr.role::text = 'manager'
      AND mgr.is_active = true
  ),
  mr_managers_fallback AS (
    SELECT mgr.id,
           mgr.full_name::text,
           mgr.employee_code::text,
           mgr.role::text AS role,
           'linked_manager'::text AS option_kind
    FROM public.users mgr
    CROSS JOIN me
    WHERE me.role_name = 'mr'
      AND mgr.role::text = 'manager'
      AND mgr.is_active = true
      AND NOT EXISTS (SELECT 1 FROM mr_managers)
  ),
  mgr_team AS (
    SELECT mr.id,
           mr.full_name::text,
           mr.employee_code::text,
           mr.role::text AS role,
           'team_mr'::text AS option_kind
    FROM public.users mr
    INNER JOIN public.mr_manager_map m ON m.mr_id = mr.id
    INNER JOIN me ON me.id = m.manager_id
    WHERE me.role_name = 'manager'
      AND mr.role::text = 'mr'
      AND mr.is_active = true
  ),
  mgr_peers AS (
    SELECT mgr.id,
           mgr.full_name::text,
           mgr.employee_code::text,
           mgr.role::text AS role,
           'peer_manager'::text AS option_kind
    FROM public.users mgr
    CROSS JOIN me
    WHERE me.role_name = 'manager'
      AND mgr.role::text = 'manager'
      AND mgr.is_active = true
      AND mgr.id <> me.id
  )
  SELECT DISTINCT ON (s.id)
    s.id,
    s.full_name,
    s.employee_code,
    s.role,
    s.option_kind
  FROM (
    SELECT * FROM mr_managers
    UNION ALL
    SELECT * FROM mr_managers_fallback
    UNION ALL
    SELECT * FROM mgr_team
    UNION ALL
    SELECT * FROM mgr_peers
  ) s
  ORDER BY s.id, s.full_name;
$$;

REVOKE ALL ON FUNCTION public.list_working_with_options_for_report() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_working_with_options_for_report() TO authenticated;

-- Batch assign (loops existing validator/inserter).
CREATE OR REPLACE FUNCTION public.assign_sub_areas_to_mr(p_mr_id uuid, p_sub_area_ids uuid[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sid uuid;
BEGIN
  IF p_sub_area_ids IS NULL THEN
    RETURN;
  END IF;
  FOREACH sid IN ARRAY p_sub_area_ids
  LOOP
    IF sid IS NOT NULL THEN
      PERFORM public.assign_sub_area_to_mr(p_mr_id, sid);
    END IF;
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION public.assign_sub_areas_to_mr(uuid, uuid[]) TO authenticated;
