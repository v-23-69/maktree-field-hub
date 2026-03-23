-- MRs need manager names for "Working With" but RLS often blocks SELECT on other users' rows.
-- This RPC runs with definer rights and returns only safe columns.

CREATE OR REPLACE FUNCTION public.list_managers_for_mr()
RETURNS TABLE (
  id uuid,
  full_name text,
  employee_code text,
  role text
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
  mapped AS (
    SELECT mgr.id,
           mgr.full_name,
           mgr.employee_code,
           mgr.role::text AS role
    FROM public.users mgr
    INNER JOIN public.mr_manager_map m ON m.manager_id = mgr.id
    INNER JOIN me ON m.mr_id = me.id
    WHERE mgr.role::text = 'manager'
      AND mgr.is_active = true
  ),
  fallback AS (
    SELECT mgr.id,
           mgr.full_name,
           mgr.employee_code,
           mgr.role::text AS role
    FROM public.users mgr
    CROSS JOIN me
    WHERE me.role_name = 'mr'
      AND mgr.role::text = 'manager'
      AND mgr.is_active = true
      AND NOT EXISTS (SELECT 1 FROM mapped)
  )
  SELECT *
  FROM (
    SELECT * FROM mapped
    UNION ALL
    SELECT * FROM fallback
  ) s
  ORDER BY s.full_name;
$$;

REVOKE ALL ON FUNCTION public.list_managers_for_mr() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_managers_for_mr() TO authenticated;
