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
  WITH me AS (
    SELECT u.id, u.role::text AS role_name
    FROM public.users u
    WHERE u.auth_user_id = auth.uid()
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
      mr.auth_user_id,
      mr.must_change_password,
      mr.created_at
    FROM public.users mr
    INNER JOIN public.mr_manager_map m ON m.mr_id = mr.id
    INNER JOIN me ON me.id = m.manager_id
    WHERE me.role_name = 'manager'
      AND mr.role::text = 'mr'
      AND mr.is_active = true
  ),
  fallback AS (
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
    CROSS JOIN me
    WHERE me.role_name = 'manager'
      AND mr.role::text = 'mr'
      AND mr.is_active = true
      AND NOT EXISTS (SELECT 1 FROM mapped)
  )
  SELECT * FROM (
    SELECT * FROM mapped
    UNION ALL
    SELECT * FROM fallback
  ) s
  ORDER BY s.full_name;
$$;

GRANT EXECUTE ON FUNCTION public.list_mrs_for_manager() TO authenticated;

