-- MR dashboard: v_target_achievement with security_invoker blocks direct REST SELECT for MRs
-- (join path through monthly_support_entries / reports). Use audited SECURITY DEFINER RPCs.

CREATE OR REPLACE FUNCTION public.list_target_achievement_for_mr(p_mr_id uuid DEFAULT NULL)
RETURNS TABLE (
  target_id uuid,
  mr_id uuid,
  mr_name text,
  mr_code text,
  product_name text,
  sub_area text,
  target_qty integer,
  start_date date,
  end_date date,
  achieved_qty bigint,
  achievement_pct numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_caller_id uuid;
  v_role text;
  v_mr_id uuid;
BEGIN
  SELECT u.id, u.role::text
  INTO v_caller_id, v_role
  FROM public.users u
  WHERE u.auth_user_id = auth.uid()
  LIMIT 1;

  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;

  v_mr_id := p_mr_id;

  IF v_role = 'mr' THEN
    IF v_mr_id IS NOT NULL AND v_mr_id IS DISTINCT FROM v_caller_id THEN
      RAISE EXCEPTION 'Forbidden' USING ERRCODE = '42501';
    END IF;
    v_mr_id := v_caller_id;
  ELSIF v_role = 'manager' THEN
    IF v_mr_id IS NULL THEN
      RAISE EXCEPTION 'mr_id is required' USING ERRCODE = '22023';
    END IF;
    IF NOT EXISTS (
      SELECT 1
      FROM public.mr_manager_map m
      WHERE m.manager_id = v_caller_id
        AND m.mr_id = v_mr_id
    ) THEN
      RAISE EXCEPTION 'Forbidden' USING ERRCODE = '42501';
    END IF;
  ELSIF v_role <> 'admin' THEN
    RAISE EXCEPTION 'Forbidden' USING ERRCODE = '42501';
  END IF;

  IF v_mr_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    v.target_id,
    v.mr_id,
    v.mr_name,
    v.mr_code,
    v.product_name,
    v.sub_area,
    v.target_qty,
    v.start_date,
    v.end_date,
    v.achieved_qty,
    v.achievement_pct
  FROM public.v_target_achievement v
  WHERE v.mr_id = v_mr_id
  ORDER BY v.end_date ASC;
END;
$$;

CREATE OR REPLACE FUNCTION public.list_target_achievement_for_target_ids(p_target_ids uuid[])
RETURNS TABLE (
  target_id uuid,
  mr_id uuid,
  mr_name text,
  mr_code text,
  product_name text,
  sub_area text,
  target_qty integer,
  start_date date,
  end_date date,
  achieved_qty bigint,
  achievement_pct numeric
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
  )
  SELECT
    v.target_id,
    v.mr_id,
    v.mr_name,
    v.mr_code,
    v.product_name,
    v.sub_area,
    v.target_qty,
    v.start_date,
    v.end_date,
    v.achieved_qty,
    v.achievement_pct
  FROM public.v_target_achievement v
  INNER JOIN me ON true
  WHERE v.target_id = ANY(COALESCE(p_target_ids, ARRAY[]::uuid[]))
    AND (
      me.role_name = 'admin'
      OR (
        me.role_name = 'manager'
        AND EXISTS (
          SELECT 1
          FROM public.targets t
          WHERE t.id = v.target_id
            AND t.set_by = me.id
        )
      )
    )
  ORDER BY v.end_date ASC;
$$;

REVOKE ALL ON FUNCTION public.list_target_achievement_for_mr(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.list_target_achievement_for_target_ids(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_target_achievement_for_mr(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_target_achievement_for_target_ids(uuid[]) TO authenticated;
