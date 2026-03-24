CREATE OR REPLACE FUNCTION public.upsert_chemist_for_visit(
  p_visit_id uuid,
  p_doctor_id uuid,
  p_doctor_sub_area_id uuid,
  p_chemist_name text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_chemist_id uuid;
BEGIN
  IF p_chemist_name IS NULL OR btrim(p_chemist_name) = '' THEN
    UPDATE public.report_visits
    SET chemist_id = NULL
    WHERE id = p_visit_id;
    RETURN NULL;
  END IF;

  INSERT INTO public.chemists (sub_area_id, name)
  VALUES (p_doctor_sub_area_id, btrim(p_chemist_name))
  ON CONFLICT (sub_area_id, name)
  DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO v_chemist_id;

  INSERT INTO public.chemist_doctor_map (chemist_id, doctor_id)
  VALUES (v_chemist_id, p_doctor_id)
  ON CONFLICT (chemist_id, doctor_id) DO NOTHING;

  UPDATE public.report_visits
  SET chemist_id = v_chemist_id
  WHERE id = p_visit_id;

  RETURN v_chemist_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.upsert_chemist_for_visit(uuid, uuid, uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.list_unlock_requests_for_manager()
RETURNS TABLE (
  id uuid,
  mr_id uuid,
  manager_id uuid,
  reason text,
  status text,
  manager_comment text,
  requested_date timestamptz,
  resolved_at timestamptz,
  created_at timestamptz,
  mr_full_name text
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
  mine AS (
    SELECT r.*
    FROM public.report_unlock_requests r
    INNER JOIN me ON me.id = r.manager_id
    WHERE me.role_name = 'manager'
  )
  SELECT
    r.id,
    r.mr_id,
    r.manager_id,
    r.reason::text,
    r.status::text,
    r.manager_comment::text,
    r.requested_date,
    r.resolved_at,
    r.created_at,
    u.full_name::text AS mr_full_name
  FROM mine r
  LEFT JOIN public.users u ON u.id = r.mr_id
  ORDER BY r.created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.list_unlock_requests_for_manager() TO authenticated;

CREATE OR REPLACE FUNCTION public.list_report_issues_for_manager()
RETURNS TABLE (
  id uuid,
  report_id uuid,
  mr_id uuid,
  issue_text text,
  report_date date,
  status text,
  manager_note text,
  created_at timestamptz,
  mr_full_name text
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
  my_mrs AS (
    SELECT DISTINCT m.mr_id
    FROM public.mr_manager_map m
    INNER JOIN me ON me.id = m.manager_id
    WHERE me.role_name = 'manager'
  )
  SELECT
    i.id,
    i.report_id,
    i.mr_id,
    i.issue_text::text,
    i.report_date,
    i.status::text,
    i.manager_note::text,
    i.created_at,
    u.full_name::text AS mr_full_name
  FROM public.report_issues i
  INNER JOIN my_mrs mm ON mm.mr_id = i.mr_id
  LEFT JOIN public.users u ON u.id = i.mr_id
  WHERE i.status::text IN ('open', 'reviewed')
  ORDER BY i.created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.list_report_issues_for_manager() TO authenticated;

CREATE OR REPLACE FUNCTION public.list_targets_for_setter()
RETURNS TABLE (
  id uuid,
  mr_id uuid,
  product_id uuid,
  sub_area_id uuid,
  target_qty integer,
  achieved_qty integer,
  start_date date,
  end_date date,
  set_by uuid,
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
  )
  SELECT
    t.id,
    t.mr_id,
    t.product_id,
    t.sub_area_id,
    t.target_qty,
    t.achieved_qty,
    t.start_date,
    t.end_date,
    t.set_by,
    t.created_at
  FROM public.targets t
  INNER JOIN me ON me.id = t.set_by
  WHERE me.role_name IN ('manager', 'admin')
  ORDER BY t.created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.list_targets_for_setter() TO authenticated;

