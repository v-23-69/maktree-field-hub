-- RPCs for doctor_add_requests + user_notifications (run after 20260526180000 tables).

CREATE OR REPLACE FUNCTION public._notify_user(
  p_user_id uuid,
  p_kind text,
  p_title text,
  p_body text,
  p_url text DEFAULT '/',
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO public.user_notifications (user_id, kind, title, body, url, metadata)
  VALUES (p_user_id, p_kind, p_title, p_body, COALESCE(NULLIF(trim(p_url), ''), '/'), COALESCE(p_metadata, '{}'::jsonb))
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public._notify_user(uuid, text, text, text, text, jsonb) FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.submit_doctor_add_request(
  p_mr_id uuid,
  p_sub_area_id uuid,
  p_manager_id uuid,
  p_payload jsonb
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

  SELECT u.id, u.role::text INTO v_me_id, v_role
  FROM public.users u
  WHERE u.auth_user_id = auth.uid() AND u.is_active = true
  LIMIT 1;

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
  IF v_mgr IS NULL THEN
    SELECT mm.manager_id INTO v_mgr
    FROM public.mr_manager_map mm
    WHERE mm.mr_id = p_mr_id
    ORDER BY mm.assigned_at DESC NULLS LAST
    LIMIT 1;
  END IF;

  INSERT INTO public.doctor_add_requests (mr_id, manager_id, sub_area_id, status, payload)
  VALUES (p_mr_id, v_mgr, p_sub_area_id, 'pending', p_payload)
  RETURNING id INTO v_req_id;

  IF v_mgr IS NOT NULL THEN
    PERFORM public._notify_user(
      v_mgr,
      'doctor_add_request',
      'New doctor to approve',
      (SELECT u.full_name FROM public.users u WHERE u.id = p_mr_id) || ' added ' || v_name || ' — tap to review.',
      '/manager/requests',
      jsonb_build_object('request_id', v_req_id, 'kind', 'doctor_add')
    );
  END IF;

  RETURN v_req_id;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_doctor_add_request(uuid, uuid, uuid, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_doctor_add_request(uuid, uuid, uuid, jsonb) TO authenticated;

CREATE OR REPLACE FUNCTION public.resolve_doctor_add_request(
  p_request_id uuid,
  p_status text,
  p_manager_note text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_me_id uuid;
  v_role text;
  v_req public.doctor_add_requests%ROWTYPE;
  v_doc jsonb;
  v_doctor_id uuid;
  v_chem jsonb;
  v_chem_id uuid;
  v_chem_name text;
  v_now timestamptz := now();
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT u.id, u.role::text INTO v_me_id, v_role
  FROM public.users u
  WHERE u.auth_user_id = auth.uid() AND u.is_active = true
  LIMIT 1;

  IF v_me_id IS NULL THEN
    RAISE EXCEPTION 'Active user profile not found';
  END IF;

  SELECT * INTO v_req
  FROM public.doctor_add_requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found';
  END IF;

  IF v_req.status <> 'pending' THEN
    RAISE EXCEPTION 'Request already resolved';
  END IF;

  IF p_status NOT IN ('approved', 'rejected') THEN
    RAISE EXCEPTION 'Invalid status';
  END IF;

  IF v_role <> 'admin' AND NOT (
    v_role = 'manager'
    AND EXISTS (
      SELECT 1 FROM public.mr_manager_map mm
      WHERE mm.manager_id = v_me_id AND mm.mr_id = v_req.mr_id
    )
  ) THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;

  v_doc := v_req.payload -> 'doctor';

  IF p_status = 'rejected' THEN
    UPDATE public.doctor_add_requests
    SET
      status = 'rejected',
      manager_note = NULLIF(trim(p_manager_note), ''),
      approved_by = NULL,
      resolved_at = v_now
    WHERE id = p_request_id;

    PERFORM public._notify_user(
      v_req.mr_id,
      'doctor_add_rejected',
      'Doctor not approved',
      COALESCE(NULLIF(trim(p_manager_note), ''), 'Your manager did not approve adding ') ||
        COALESCE(v_doc ->> 'full_name', 'this doctor') || '.',
      '/mr/master-list',
      jsonb_build_object('request_id', p_request_id)
    );
    RETURN;
  END IF;

  INSERT INTO public.doctors (
    sub_area_id,
    doctor_code,
    full_name,
    speciality,
    qualification,
    address,
    city,
    mobile,
    birthday,
    marriage_anniversary,
    visit_frequency,
    monthly_visit_target,
    is_active,
    master_list_complete
  )
  VALUES (
    v_req.sub_area_id,
    '',
    trim(v_doc ->> 'full_name'),
    NULLIF(trim(COALESCE(v_doc ->> 'speciality', '')), ''),
    NULLIF(trim(COALESCE(v_doc ->> 'qualification', '')), ''),
    NULLIF(trim(COALESCE(v_doc ->> 'address', '')), ''),
    NULLIF(trim(COALESCE(v_doc ->> 'city', '')), ''),
    NULLIF(trim(COALESCE(v_doc ->> 'mobile', '')), ''),
    NULLIF(trim(COALESCE(v_doc ->> 'birthday', '')), ''),
    NULLIF(trim(COALESCE(v_doc ->> 'marriage_anniversary', '')), ''),
    CASE
      WHEN v_doc ->> 'visit_frequency' IN ('weekly', 'fortnightly', 'monthly')
      THEN v_doc ->> 'visit_frequency'
      ELSE NULL
    END,
    LEAST(99, GREATEST(1, COALESCE((v_doc ->> 'monthly_visit_target')::int, 2))),
    true,
    false
  )
  RETURNING id INTO v_doctor_id;

  FOR v_chem IN SELECT * FROM jsonb_array_elements(COALESCE(v_req.payload -> 'chemists', '[]'::jsonb))
  LOOP
    v_chem_name := trim(COALESCE(v_chem ->> 'name', ''));
    IF length(v_chem_name) < 1 THEN
      CONTINUE;
    END IF;

    INSERT INTO public.chemists (sub_area_id, name, owner_name, owner_contact, is_active)
    VALUES (
      v_req.sub_area_id,
      v_chem_name,
      NULLIF(trim(COALESCE(v_chem ->> 'owner_name', '')), ''),
      NULLIF(trim(COALESCE(v_chem ->> 'owner_contact', '')), ''),
      true
    )
    RETURNING id INTO v_chem_id;

    INSERT INTO public.chemist_doctor_map (chemist_id, doctor_id)
    VALUES (v_chem_id, v_doctor_id);
  END LOOP;

  PERFORM public.assign_sub_area_to_mr(v_req.mr_id, v_req.sub_area_id);

  UPDATE public.doctor_add_requests
  SET
    status = 'approved',
    doctor_id = v_doctor_id,
    manager_note = NULLIF(trim(p_manager_note), ''),
    approved_by = v_me_id,
    resolved_at = v_now
  WHERE id = p_request_id;

  PERFORM public._notify_user(
    v_req.mr_id,
    'doctor_add_approved',
    'Doctor approved',
    COALESCE(v_doc ->> 'full_name', 'Doctor') || ' is now active in your list.',
    '/mr/master-list?subAreaId=' || v_req.sub_area_id::text || '&doctorId=' || v_doctor_id::text,
    jsonb_build_object('doctor_id', v_doctor_id, 'request_id', p_request_id)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.resolve_doctor_add_request(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.resolve_doctor_add_request(uuid, text, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.notify_dcr_submitted_to_manager(
  p_mr_id uuid,
  p_report_date text,
  p_manager_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_mgr uuid;
  v_mr_name text;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN;
  END IF;

  v_mgr := p_manager_id;
  IF v_mgr IS NULL THEN
    SELECT mm.manager_id INTO v_mgr
    FROM public.mr_manager_map mm
    WHERE mm.mr_id = p_mr_id
    LIMIT 1;
  END IF;

  IF v_mgr IS NULL THEN
    RETURN;
  END IF;

  SELECT u.full_name INTO v_mr_name FROM public.users u WHERE u.id = p_mr_id;

  PERFORM public._notify_user(
    v_mgr,
    'dcr_submitted',
    'DCR submitted',
    COALESCE(v_mr_name, 'MR') || ' submitted DCR for ' || p_report_date || '.',
    '/manager/reports',
    jsonb_build_object('mr_id', p_mr_id, 'report_date', p_report_date)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.notify_dcr_submitted_to_manager(uuid, text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.notify_dcr_submitted_to_manager(uuid, text, uuid) TO authenticated;
