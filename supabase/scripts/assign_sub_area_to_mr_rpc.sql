-- ============================================================================
-- REQUIRED for "Assign sub-area" / mr_sub_area_access inserts from the app.
-- If POST /rest/v1/rpc/assign_sub_area_to_mr returns 404, run this entire file once
-- in Supabase Dashboard → SQL Editor → Run.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.assign_sub_area_to_mr(p_mr_id uuid, p_sub_area_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_auth uuid := auth.uid();
  v_me_id uuid;
  v_role text;
BEGIN
  IF v_auth IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT u.id, u.role::text
  INTO v_me_id, v_role
  FROM public.users u
  WHERE u.auth_user_id = v_auth
    AND u.is_active = true
  LIMIT 1;

  IF v_me_id IS NULL THEN
    RAISE EXCEPTION 'Active user profile not found';
  END IF;

  IF v_role = 'admin' THEN
    NULL;
  ELSIF v_role = 'mr' AND p_mr_id = v_me_id THEN
    NULL;
  ELSIF v_role = 'manager'
    AND (
      p_mr_id = v_me_id
      OR EXISTS (
        SELECT 1
        FROM public.mr_manager_map mm
        WHERE mm.manager_id = v_me_id
          AND mm.mr_id = p_mr_id
      )
    ) THEN
    NULL;
  ELSE
    RAISE EXCEPTION 'Permission denied';
  END IF;

  INSERT INTO public.mr_sub_area_access (mr_id, sub_area_id)
  SELECT p_mr_id, p_sub_area_id
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.mr_sub_area_access x
    WHERE x.mr_id = p_mr_id
      AND x.sub_area_id = p_sub_area_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.assign_sub_area_to_mr(uuid, uuid) TO authenticated;

GRANT SELECT, INSERT, DELETE ON public.mr_sub_area_access TO authenticated;

-- Optional: confirm it exists
-- SELECT proname FROM pg_proc WHERE proname = 'assign_sub_area_to_mr';
