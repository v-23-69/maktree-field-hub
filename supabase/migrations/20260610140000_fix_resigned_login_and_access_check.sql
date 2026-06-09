-- Resigned/blocked login: remove auth.users ban (causes 500 on token endpoint),
-- check access before sign-in, and clear any existing bans.

-- ---------------------------------------------------------------------------
-- Pre-login access check (callable before auth — anon + authenticated)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_portal_login_allowed(p_email text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user public.users%ROWTYPE;
BEGIN
  IF trim(COALESCE(p_email, '')) = '' THEN
    RETURN jsonb_build_object('allowed', true);
  END IF;

  SELECT * INTO v_user
  FROM public.users u
  WHERE lower(trim(u.email)) = lower(trim(p_email))
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('allowed', true);
  END IF;

  IF v_user.is_blocked THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'blocked');
  END IF;

  IF v_user.is_resigned THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'resigned');
  END IF;

  IF NOT v_user.is_active THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'deactivated');
  END IF;

  RETURN jsonb_build_object('allowed', true);
END;
$$;

REVOKE ALL ON FUNCTION public.check_portal_login_allowed(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_portal_login_allowed(text) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- Clear auth bans that caused 500 errors on login
-- ---------------------------------------------------------------------------
UPDATE auth.users au
SET banned_until = NULL
FROM public.users u
WHERE u.auth_user_id = au.id
  AND (u.is_resigned = true OR u.is_blocked = true OR u.is_active = false);

-- ---------------------------------------------------------------------------
-- mark_mr_resigned: app-level block only (no auth.users ban)
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
END;
$$;

-- ---------------------------------------------------------------------------
-- reinstate_mr: restore portal access flags only
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
END;
$$;
