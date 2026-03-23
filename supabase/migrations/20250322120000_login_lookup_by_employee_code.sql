-- Login needs to resolve employee_code → email before auth.signInWithPassword.
-- Direct SELECT on public.users as anon is often blocked by RLS or can cause policy
-- recursion (PostgREST returns 500). This function runs with definer rights and only
-- returns the minimum fields required for sign-in.

CREATE OR REPLACE FUNCTION public.login_lookup_by_employee_code(p_employee_code text)
RETURNS TABLE(email text, is_active boolean)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.email::text, u.is_active
  FROM public.users u
  WHERE lower(trim(u.employee_code)) = lower(trim(p_employee_code))
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.login_lookup_by_employee_code(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.login_lookup_by_employee_code(text) TO anon;
GRANT EXECUTE ON FUNCTION public.login_lookup_by_employee_code(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.login_lookup_by_employee_code(text) TO service_role;

COMMENT ON FUNCTION public.login_lookup_by_employee_code(text) IS
  'Allows anonymous login flow to map employee_code to auth email; used by the MR portal.';
