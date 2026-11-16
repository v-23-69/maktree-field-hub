-- Managers can remove a clinic pin that was saved in the wrong place.
-- The MR then captures it again while standing at that hospital.

CREATE OR REPLACE FUNCTION public.clear_doctor_location(p_doctor_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := public.current_app_user_id();
  v_sub uuid;
BEGIN
  IF v_uid IS NULL OR public.current_user_role() <> 'manager' THEN
    RAISE EXCEPTION 'Only a manager can delete a clinic location';
  END IF;

  SELECT sub_area_id INTO v_sub
  FROM public.doctors
  WHERE id = p_doctor_id;

  IF v_sub IS NULL THEN
    RAISE EXCEPTION 'Doctor not found';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.mr_sub_area_access msa
    JOIN public.mr_manager_map mm ON mm.mr_id = msa.mr_id
    WHERE msa.sub_area_id = v_sub
      AND mm.manager_id = v_uid
  ) AND NOT EXISTS (
    SELECT 1
    FROM public.mr_sub_area_access msa
    WHERE msa.mr_id = v_uid
      AND msa.sub_area_id = v_sub
  ) AND NOT EXISTS (
    SELECT 1
    FROM public.doctor_locations dl
    WHERE dl.doctor_id = p_doctor_id
      AND dl.captured_by = v_uid
  ) THEN
    RAISE EXCEPTION 'This doctor is not on your team';
  END IF;

  DELETE FROM public.field_activity_points
  WHERE doctor_id = p_doctor_id
    AND event_type = 'location_capture';

  DELETE FROM public.doctor_locations
  WHERE doctor_id = p_doctor_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.team_clinic_locations()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(jsonb_agg(to_jsonb(x) ORDER BY x.captured_at DESC), '[]'::jsonb)
  FROM (
    SELECT
      dl.doctor_id,
      d.full_name AS doctor_name,
      cap.full_name AS captured_by_name,
      dl.captured_at
    FROM public.doctor_locations dl
    JOIN public.doctors d ON d.id = dl.doctor_id
    LEFT JOIN public.users cap ON cap.id = dl.captured_by
    WHERE public.current_user_role() = 'manager'
      AND (
        EXISTS (
          SELECT 1
          FROM public.mr_sub_area_access msa
          JOIN public.mr_manager_map mm ON mm.mr_id = msa.mr_id
          WHERE msa.sub_area_id = d.sub_area_id
            AND mm.manager_id = public.current_app_user_id()
        )
        OR EXISTS (
          SELECT 1
          FROM public.mr_sub_area_access msa
          WHERE msa.mr_id = public.current_app_user_id()
            AND msa.sub_area_id = d.sub_area_id
        )
        OR dl.captured_by = public.current_app_user_id()
      )
  ) x;
$$;

REVOKE ALL ON FUNCTION public.clear_doctor_location(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.team_clinic_locations() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.clear_doctor_location(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.team_clinic_locations() TO authenticated;
