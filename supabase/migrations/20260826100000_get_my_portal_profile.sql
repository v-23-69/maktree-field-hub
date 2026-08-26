-- Fast login profile lookup that does not depend on PostgREST table RLS planning.
CREATE OR REPLACE FUNCTION public.get_my_portal_profile()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'id', u.id,
    'auth_user_id', u.auth_user_id,
    'employee_code', u.employee_code,
    'full_name', u.full_name,
    'email', u.email,
    'role', u.role,
    'is_active', u.is_active,
    'is_blocked', u.is_blocked,
    'block_reason', u.block_reason,
    'is_resigned', u.is_resigned,
    'is_paused', u.is_paused,
    'pause_reason', u.pause_reason,
    'profile_photo_url', u.profile_photo_url,
    'designation', u.designation,
    'mobile', u.mobile,
    'created_at', u.created_at,
    'updated_at', u.updated_at
  )
  FROM public.users u
  WHERE u.auth_user_id = auth.uid()
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_my_portal_profile() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_portal_profile() TO authenticated;
