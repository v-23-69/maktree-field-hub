-- Allow users to remove their device token on logout (privacy + stale token cleanup).

CREATE OR REPLACE FUNCTION public.unregister_device_push_token(p_token text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_token text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  v_user_id := public.session_profile_id();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Active user profile not found';
  END IF;

  v_token := trim(COALESCE(p_token, ''));
  IF length(v_token) < 10 THEN
    RETURN;
  END IF;

  PERFORM set_config('row_security', 'off', true);

  DELETE FROM public.device_push_tokens
  WHERE token = v_token AND user_id = v_user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.unregister_device_push_token(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.unregister_device_push_token(text) TO authenticated;
