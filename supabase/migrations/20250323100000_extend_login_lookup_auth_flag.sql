-- Help the app distinguish "no Auth user linked" from wrong password (both look like 400 from Auth).

CREATE OR REPLACE FUNCTION public.login_lookup_by_employee_code(p_employee_code text)
RETURNS TABLE(email text, is_active boolean, has_auth_user boolean)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    u.email::text,
    u.is_active,
    (u.auth_user_id IS NOT NULL) AS has_auth_user
  FROM public.users u
  WHERE lower(trim(u.employee_code)) = lower(trim(p_employee_code))
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.login_lookup_by_employee_code(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.login_lookup_by_employee_code(text) TO anon;
GRANT EXECUTE ON FUNCTION public.login_lookup_by_employee_code(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.login_lookup_by_employee_code(text) TO service_role;
