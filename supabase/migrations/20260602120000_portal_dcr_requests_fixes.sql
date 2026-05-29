-- Doctor add approve: cast birthday/anniversary to date; DCR kinds stockist_visit + sales_closing.

CREATE OR REPLACE FUNCTION public.parse_optional_ymd(p_text text)
RETURNS date
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN p_text IS NULL OR length(trim(p_text)) = 0 THEN NULL
    WHEN trim(p_text) ~ '^\d{4}-\d{2}-\d{2}$' THEN trim(p_text)::date
    ELSE NULL
  END;
$$;

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

  v_me_id := public.session_profile_id();
  v_role := public.current_user_role();

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
    AND (
      v_req.manager_id = v_me_id
      OR EXISTS (
        SELECT 1 FROM public.mr_manager_map mm
        WHERE mm.manager_id = v_me_id AND mm.mr_id = v_req.mr_id
      )
    )
  ) THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;

  PERFORM set_config('row_security', 'off', true);

  v_doc := v_req.payload -> 'doctor';

  IF p_status = 'rejected' THEN
    UPDATE public.doctor_add_requests
    SET
      status = 'rejected',
      manager_note = NULLIF(trim(p_manager_note), ''),
      approved_by = NULL,
      resolved_at = v_now
    WHERE id = p_request_id;

    BEGIN
      PERFORM public._notify_user(
        v_req.mr_id,
        'doctor_add_rejected',
        'Doctor not approved',
        COALESCE(NULLIF(trim(p_manager_note), ''), 'Your manager did not approve adding ') ||
          COALESCE(v_doc ->> 'full_name', 'this doctor') || '.',
        '/mr/master-list',
        jsonb_build_object('request_id', p_request_id)
      );
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
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
    NULL,
    trim(v_doc ->> 'full_name'),
    NULLIF(trim(COALESCE(v_doc ->> 'speciality', '')), ''),
    NULLIF(trim(COALESCE(v_doc ->> 'qualification', '')), ''),
    NULLIF(trim(COALESCE(v_doc ->> 'address', '')), ''),
    NULLIF(trim(COALESCE(v_doc ->> 'city', '')), ''),
    NULLIF(trim(COALESCE(v_doc ->> 'mobile', '')), ''),
    public.parse_optional_ymd(v_doc ->> 'birthday'),
    public.parse_optional_ymd(v_doc ->> 'marriage_anniversary'),
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
    ON CONFLICT (sub_area_id, name)
    DO UPDATE SET
      is_active = true,
      owner_name = COALESCE(EXCLUDED.owner_name, public.chemists.owner_name),
      owner_contact = COALESCE(EXCLUDED.owner_contact, public.chemists.owner_contact)
    RETURNING id INTO v_chem_id;

    INSERT INTO public.chemist_doctor_map (chemist_id, doctor_id)
    VALUES (v_chem_id, v_doctor_id)
    ON CONFLICT (chemist_id, doctor_id) DO NOTHING;
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

  BEGIN
    PERFORM public._notify_user(
      v_req.mr_id,
      'doctor_add_approved',
      'Doctor approved',
      COALESCE(v_doc ->> 'full_name', 'Doctor') || ' is now active in your list.',
      '/mr/master-list?subAreaId=' || v_req.sub_area_id::text || '&doctorId=' || v_doctor_id::text,
      jsonb_build_object('doctor_id', v_doctor_id, 'request_id', p_request_id)
    );
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
END;
$$;

GRANT EXECUTE ON FUNCTION public.resolve_doctor_add_request(uuid, text, text) TO authenticated;

ALTER TABLE public.daily_reports
  ADD COLUMN IF NOT EXISTS stockist_id uuid REFERENCES public.stockists(id);

ALTER TABLE public.daily_reports
  DROP CONSTRAINT IF EXISTS daily_reports_report_kind_check;

ALTER TABLE public.daily_reports
  ADD CONSTRAINT daily_reports_report_kind_check
  CHECK (
    report_kind = ANY (
      ARRAY[
        'field'::text,
        'leave'::text,
        'sunday'::text,
        'strike'::text,
        'holiday'::text,
        'meeting'::text,
        'admin_day'::text,
        'stockist_visit'::text,
        'sales_closing'::text
      ]
    )
  );
