-- MR resignation: block portal login, preserve all historical data, keep manager read access.

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS is_resigned boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS resigned_at timestamptz,
  ADD COLUMN IF NOT EXISTS resigned_by uuid REFERENCES public.users(id);

COMMENT ON COLUMN public.users.is_resigned IS 'MR has resigned; login blocked but data retained for managers/admin.';

-- ---------------------------------------------------------------------------
-- list_mrs_for_manager: include resigned/inactive MRs so managers can inspect history
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.list_mrs_for_manager();

CREATE OR REPLACE FUNCTION public.list_mrs_for_manager()
RETURNS TABLE (
  id uuid,
  employee_code text,
  full_name text,
  role text,
  email text,
  is_active boolean,
  is_resigned boolean,
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
      AND u.is_active = true
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
      AND NOT EXISTS (SELECT 1 FROM mapped)
  )
  SELECT * FROM (
    SELECT * FROM mapped
    UNION ALL
    SELECT * FROM fallback
  ) s
  ORDER BY s.is_resigned ASC, s.is_active DESC, s.full_name;
$$;

GRANT EXECUTE ON FUNCTION public.list_mrs_for_manager() TO authenticated;

-- ---------------------------------------------------------------------------
-- Admin: mark MR as resigned (ban auth login, keep all data + manager map)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.mark_mr_resigned(p_mr_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_me uuid;
  v_role text;
  v_mr public.users%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  v_me := public.session_profile_id();
  v_role := public.current_user_role();

  IF v_role <> 'admin' THEN
    RAISE EXCEPTION 'Only admins can mark an MR as resigned';
  END IF;

  SELECT * INTO v_mr FROM public.users WHERE id = p_mr_id FOR UPDATE;
  IF NOT FOUND OR v_mr.role::text <> 'mr' THEN
    RAISE EXCEPTION 'User is not an MR';
  END IF;

  IF v_mr.is_resigned THEN
    RETURN;
  END IF;

  UPDATE public.users
  SET
    is_resigned = true,
    is_active = false,
    resigned_at = now(),
    resigned_by = v_me,
    updated_at = now()
  WHERE id = p_mr_id;

  IF v_mr.auth_user_id IS NOT NULL THEN
    UPDATE auth.users
    SET banned_until = 'infinity'::timestamptz
    WHERE id = v_mr.auth_user_id;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.mark_mr_resigned(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mark_mr_resigned(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- Admin: reinstate resigned MR (restore login)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.reinstate_mr(p_mr_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
  v_mr public.users%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  v_role := public.current_user_role();
  IF v_role <> 'admin' THEN
    RAISE EXCEPTION 'Only admins can reinstate an MR';
  END IF;

  SELECT * INTO v_mr FROM public.users WHERE id = p_mr_id FOR UPDATE;
  IF NOT FOUND OR v_mr.role::text <> 'mr' THEN
    RAISE EXCEPTION 'User is not an MR';
  END IF;

  UPDATE public.users
  SET
    is_resigned = false,
    is_active = true,
    resigned_at = NULL,
    resigned_by = NULL,
    updated_at = now()
  WHERE id = p_mr_id;

  IF v_mr.auth_user_id IS NOT NULL THEN
    UPDATE auth.users
    SET banned_until = NULL
    WHERE id = v_mr.auth_user_id;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.reinstate_mr(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reinstate_mr(uuid) TO authenticated;
