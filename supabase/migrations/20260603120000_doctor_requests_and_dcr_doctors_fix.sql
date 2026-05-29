-- Route doctor add/deletion requests to mapped managers; list team pending requests;
-- DCR visit doctors limited to MR assigned sub-areas.

-- Backfill pending doctor add requests with wrong/null manager_id
UPDATE public.doctor_add_requests r
SET manager_id = sub.mgr
FROM (
  SELECT r2.id AS req_id,
         (
           SELECT mm.manager_id
           FROM public.mr_manager_map mm
           WHERE mm.mr_id = r2.mr_id
           ORDER BY mm.assigned_at DESC NULLS LAST
           LIMIT 1
         ) AS mgr
  FROM public.doctor_add_requests r2
  WHERE r2.status = 'pending'
) sub
WHERE r.id = sub.req_id
  AND sub.mgr IS NOT NULL
  AND (
    r.manager_id IS NULL
    OR NOT EXISTS (
      SELECT 1
      FROM public.mr_manager_map mm
      WHERE mm.mr_id = r.mr_id
        AND mm.manager_id = r.manager_id
    )
  );

UPDATE public.doctor_deletion_requests r
SET manager_id = sub.mgr
FROM (
  SELECT r2.id AS req_id,
         (
           SELECT mm.manager_id
           FROM public.mr_manager_map mm
           WHERE mm.mr_id = r2.mr_id
           ORDER BY mm.assigned_at DESC NULLS LAST
           LIMIT 1
         ) AS mgr
  FROM public.doctor_deletion_requests r2
  WHERE r2.status = 'pending'
) sub
WHERE r.id = sub.req_id
  AND sub.mgr IS NOT NULL
  AND (
    r.manager_id IS NULL
    OR NOT EXISTS (
      SELECT 1
      FROM public.mr_manager_map mm
      WHERE mm.mr_id = r.mr_id
        AND mm.manager_id = r.manager_id
    )
  );

CREATE OR REPLACE FUNCTION public.primary_manager_for_mr(p_mr_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT mm.manager_id
  FROM public.mr_manager_map mm
  WHERE mm.mr_id = p_mr_id
  ORDER BY mm.assigned_at DESC NULLS LAST
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.primary_manager_for_mr(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.submit_doctor_add_request(
  p_mr_id uuid,
  p_sub_area_id uuid,
  p_manager_id uuid DEFAULT NULL,
  p_payload jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_me_id uuid;
  v_role text;
  v_name text;
  v_req_id uuid;
  v_mgr uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  v_me_id := public.session_profile_id();
  v_role := public.current_user_role();

  IF v_me_id IS NULL THEN
    RAISE EXCEPTION 'Active user profile not found';
  END IF;

  IF v_role NOT IN ('admin', 'mr') OR (v_role = 'mr' AND v_me_id <> p_mr_id) THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.mr_sub_area_access msa
    WHERE msa.mr_id = p_mr_id AND msa.sub_area_id = p_sub_area_id
  ) THEN
    RAISE EXCEPTION 'You are not assigned to this sub-area';
  END IF;

  v_name := trim(COALESCE(p_payload -> 'doctor' ->> 'full_name', ''));
  IF length(v_name) < 1 THEN
    RAISE EXCEPTION 'Doctor name is required';
  END IF;

  IF trim(COALESCE(p_payload -> 'doctor' ->> 'speciality', '')) = '' THEN
    RAISE EXCEPTION 'Speciality is required';
  END IF;

  v_mgr := p_manager_id;
  IF v_mgr IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.mr_manager_map mm
    WHERE mm.mr_id = p_mr_id AND mm.manager_id = v_mgr
  ) THEN
    v_mgr := NULL;
  END IF;

  IF v_mgr IS NULL THEN
    v_mgr := public.primary_manager_for_mr(p_mr_id);
  END IF;

  IF v_mgr IS NULL THEN
    RAISE EXCEPTION 'No manager is assigned to your account. Contact admin.';
  END IF;

  INSERT INTO public.doctor_add_requests (mr_id, manager_id, sub_area_id, status, payload)
  VALUES (p_mr_id, v_mgr, p_sub_area_id, 'pending', p_payload)
  RETURNING id INTO v_req_id;

  BEGIN
    PERFORM public._notify_user(
      v_mgr,
      'doctor_add_request',
      'New doctor to approve',
      'New doctor: ' || v_name || ' — tap to review and approve.',
      '/manager/requests',
      jsonb_build_object('request_id', v_req_id, 'kind', 'doctor_add', 'mr_id', p_mr_id)
    );
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  RETURN v_req_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_doctor_add_request(uuid, uuid, uuid, jsonb) TO authenticated;

CREATE OR REPLACE FUNCTION public.list_doctor_add_requests_for_manager()
RETURNS SETOF public.doctor_add_requests
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.*
  FROM public.doctor_add_requests r
  WHERE r.status = 'pending'
    AND EXISTS (
      SELECT 1
      FROM public.mr_manager_map mm
      WHERE mm.manager_id = public.session_profile_id()
        AND mm.mr_id = r.mr_id
    )
  ORDER BY r.created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.list_doctor_add_requests_for_manager() TO authenticated;

CREATE OR REPLACE FUNCTION public.list_doctor_deletion_requests_for_manager()
RETURNS SETOF public.doctor_deletion_requests
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.*
  FROM public.doctor_deletion_requests r
  WHERE r.status = 'pending'
    AND EXISTS (
      SELECT 1
      FROM public.mr_manager_map mm
      WHERE mm.manager_id = public.session_profile_id()
        AND mm.mr_id = r.mr_id
    )
  ORDER BY r.created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.list_doctor_deletion_requests_for_manager() TO authenticated;

CREATE OR REPLACE FUNCTION public.list_doctors_for_mr_dcr(
  p_mr_id uuid,
  p_sub_area_ids uuid[] DEFAULT '{}'::uuid[]
)
RETURNS TABLE (
  id uuid,
  sub_area_id uuid,
  doctor_code text,
  full_name text,
  speciality text,
  qualification text,
  address text,
  city text,
  mobile text,
  birthday date,
  marriage_anniversary date,
  visit_frequency text,
  monthly_visit_target integer,
  is_active boolean,
  master_list_complete boolean,
  created_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_me uuid;
  v_role text;
BEGIN
  v_me := public.session_profile_id();
  IF v_me IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  v_role := public.current_user_role();

  IF v_role = 'admin' OR v_me = p_mr_id THEN
    NULL;
  ELSIF v_role = 'manager' AND (
    v_me = p_mr_id
    OR EXISTS (
      SELECT 1 FROM public.mr_manager_map mm
      WHERE mm.manager_id = v_me AND mm.mr_id = p_mr_id
    )
  ) THEN
    NULL;
  ELSE
    RAISE EXCEPTION 'Permission denied';
  END IF;

  RETURN QUERY
  SELECT
    d.id,
    d.sub_area_id,
    d.doctor_code,
    d.full_name,
    d.speciality,
    d.qualification,
    d.address,
    d.city,
    d.mobile,
    d.birthday,
    d.marriage_anniversary,
    d.visit_frequency::text,
    d.monthly_visit_target,
    d.is_active,
    d.master_list_complete,
    d.created_at
  FROM public.doctors d
  INNER JOIN public.mr_sub_area_access msa
    ON msa.mr_id = p_mr_id
   AND msa.sub_area_id = d.sub_area_id
  WHERE d.is_active = true
    AND (
      cardinality(p_sub_area_ids) = 0
      OR d.sub_area_id = ANY(p_sub_area_ids)
    )
  ORDER BY d.sub_area_id, d.full_name;
END;
$$;

GRANT EXECUTE ON FUNCTION public.list_doctors_for_mr_dcr(uuid, uuid[]) TO authenticated;
