-- Allow manager to complete multiple MR DCR imports on the same calendar day
-- by merging visits into one submitted field DCR (working_with_ids accumulates MRs).

CREATE OR REPLACE FUNCTION public.list_pending_dcr_imports_for_manager()
RETURNS TABLE (
  import_id uuid,
  mr_report_id uuid,
  mr_id uuid,
  mr_name text,
  report_date date,
  visit_count bigint,
  mr_submitted_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_mgr uuid := public.session_profile_id();
BEGIN
  IF v_mgr IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = v_mgr AND u.role::text = 'manager' AND u.is_active = true
  ) THEN
    RAISE EXCEPTION 'Manager account required';
  END IF;

  RETURN QUERY
  SELECT
    i.id AS import_id,
    i.mr_report_id,
    i.mr_id,
    COALESCE(mr.full_name, 'MR') AS mr_name,
    i.report_date,
    (
      SELECT COUNT(*)::bigint
      FROM public.report_visits rv
      WHERE rv.report_id = i.mr_report_id
    ) AS visit_count,
    dr.submitted_at AS mr_submitted_at
  FROM public.dcr_manager_imports i
  JOIN public.daily_reports dr ON dr.id = i.mr_report_id
  JOIN public.users mr ON mr.id = i.mr_id
  WHERE i.manager_id = v_mgr
    AND i.status = 'pending'
    AND dr.status = 'submitted'
    AND NOT EXISTS (
      SELECT 1 FROM public.daily_reports mgr_dr
      WHERE mgr_dr.mr_id = v_mgr
        AND mgr_dr.report_date = i.report_date
        AND mgr_dr.status = 'submitted'
        AND mgr_dr.report_kind = 'field'
        AND i.mr_id = ANY (COALESCE(mgr_dr.working_with_ids, '{}'::uuid[]))
    )
  ORDER BY i.report_date DESC, i.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_dcr_manager_import(
  p_import_id uuid,
  p_included_source_visit_ids uuid[],
  p_extra_visits jsonb DEFAULT '[]'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_mgr uuid := public.session_profile_id();
  v_import public.dcr_manager_imports%ROWTYPE;
  v_mgr_report_id uuid;
  v_visit_id uuid;
  v_extra jsonb;
  v_doctor_id uuid;
  v_sub_area_id uuid;
  v_new_visit_id uuid;
  v_chemist_name text;
  v_prod jsonb;
  v_comp jsonb;
  v_ms jsonb;
  v_ptr numeric;
BEGIN
  IF v_mgr IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_import
  FROM public.dcr_manager_imports i
  WHERE i.id = p_import_id
    AND i.manager_id = v_mgr
    AND i.status = 'pending'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Import not found or already completed';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.daily_reports dr
    WHERE dr.id = v_import.mr_report_id
      AND dr.status = 'submitted'
      AND dr.mr_id = v_import.mr_id
  ) THEN
    RAISE EXCEPTION 'Source MR report is not available';
  END IF;

  IF (
    COALESCE(cardinality(p_included_source_visit_ids), 0) = 0
    AND jsonb_array_length(COALESCE(p_extra_visits, '[]'::jsonb)) = 0
  ) THEN
    RAISE EXCEPTION 'Select at least one call to import';
  END IF;

  SELECT dr.id INTO v_mgr_report_id
  FROM public.daily_reports dr
  WHERE dr.mr_id = v_mgr
    AND dr.report_date = v_import.report_date
    AND dr.status = 'submitted'
    AND dr.report_kind = 'field'
  ORDER BY dr.submitted_at DESC NULLS LAST
  LIMIT 1;

  IF v_mgr_report_id IS NOT NULL THEN
    IF NOT (v_import.mr_id = ANY (COALESCE(
      (SELECT dr.working_with_ids FROM public.daily_reports dr WHERE dr.id = v_mgr_report_id),
      '{}'::uuid[]
    ))) THEN
      UPDATE public.daily_reports dr
      SET working_with_ids = array_append(COALESCE(dr.working_with_ids, '{}'::uuid[]), v_import.mr_id)
      WHERE dr.id = v_mgr_report_id;
    END IF;
  ELSE
    DELETE FROM public.daily_reports dr
    WHERE dr.mr_id = v_mgr
      AND dr.report_date = v_import.report_date
      AND dr.status = 'draft';

    INSERT INTO public.daily_reports (
      mr_id,
      manager_id,
      working_with_ids,
      report_date,
      status,
      report_kind,
      submitted_at
    )
    VALUES (
      v_mgr,
      NULL,
      ARRAY[v_import.mr_id],
      v_import.report_date,
      'submitted',
      'field',
      now()
    )
    RETURNING id INTO v_mgr_report_id;
  END IF;

  IF p_included_source_visit_ids IS NOT NULL THEN
    FOREACH v_visit_id IN ARRAY p_included_source_visit_ids
    LOOP
      IF EXISTS (
        SELECT 1
        FROM public.report_visits rv
        WHERE rv.id = v_visit_id
          AND rv.report_id = v_import.mr_report_id
      ) THEN
        PERFORM public.copy_report_visit(v_visit_id, v_mgr_report_id);
      END IF;
    END LOOP;
  END IF;

  IF p_extra_visits IS NOT NULL AND jsonb_array_length(p_extra_visits) > 0 THEN
    FOR v_extra IN SELECT value FROM jsonb_array_elements(p_extra_visits)
    LOOP
      v_doctor_id := (v_extra->>'doctor_id')::uuid;
      v_sub_area_id := (v_extra->>'doctor_sub_area_id')::uuid;
      IF v_doctor_id IS NULL THEN
        CONTINUE;
      END IF;

      INSERT INTO public.report_visits (report_id, doctor_id, visited_at)
      VALUES (v_mgr_report_id, v_doctor_id, now())
      ON CONFLICT (report_id, doctor_id) DO UPDATE
        SET visited_at = EXCLUDED.visited_at
      RETURNING id INTO v_new_visit_id;

      IF v_extra->'products_promoted' IS NOT NULL THEN
        DELETE FROM public.promoted_products WHERE visit_id = v_new_visit_id;
        FOR v_prod IN SELECT value FROM jsonb_array_elements(v_extra->'products_promoted')
        LOOP
          IF (v_prod#>>'{}') IS NOT NULL AND (v_prod#>>'{}') <> '' THEN
            INSERT INTO public.promoted_products (visit_id, product_id)
            VALUES (v_new_visit_id, (v_prod#>>'{}')::uuid);
          END IF;
        END LOOP;
      END IF;

      IF v_extra->'competitors' IS NOT NULL THEN
        DELETE FROM public.competitor_entries WHERE visit_id = v_new_visit_id;
        FOR v_comp IN SELECT value FROM jsonb_array_elements(v_extra->'competitors')
        LOOP
          IF COALESCE(trim(v_comp->>'brand_name'), '') <> '' THEN
            INSERT INTO public.competitor_entries (visit_id, brand_name, quantity)
            VALUES (
              v_new_visit_id,
              trim(v_comp->>'brand_name'),
              COALESCE((v_comp->>'quantity')::int, 0)
            );
          END IF;
        END LOOP;
      END IF;

      IF v_extra->'monthly_support' IS NOT NULL THEN
        DELETE FROM public.monthly_support_entries WHERE visit_id = v_new_visit_id;
        FOR v_ms IN SELECT value FROM jsonb_array_elements(v_extra->'monthly_support')
        LOOP
          IF (v_ms->>'product_id') IS NOT NULL AND (v_ms->>'product_id') <> '' THEN
            SELECT ROUND(COALESCE(p.ptr, 0)::numeric, 2) INTO v_ptr
            FROM public.products p
            WHERE p.id = (v_ms->>'product_id')::uuid;
            INSERT INTO public.monthly_support_entries (visit_id, product_id, quantity, amount_inr)
            VALUES (
              v_new_visit_id,
              (v_ms->>'product_id')::uuid,
              COALESCE((v_ms->>'quantity')::int, 0),
              ROUND(COALESCE(v_ptr, 0) * COALESCE((v_ms->>'quantity')::int, 0), 2)
            );
          END IF;
        END LOOP;
      END IF;

      v_chemist_name := COALESCE(trim(v_extra->>'chemist_name'), '');
      IF v_chemist_name <> '' AND v_sub_area_id IS NOT NULL THEN
        PERFORM public.upsert_chemist_for_visit(
          v_new_visit_id,
          v_doctor_id,
          v_sub_area_id,
          v_chemist_name
        );
      END IF;
    END LOOP;
  END IF;

  UPDATE public.dcr_manager_imports
  SET
    status = 'completed',
    manager_report_id = v_mgr_report_id,
    completed_at = now()
  WHERE id = p_import_id;

  RETURN v_mgr_report_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.list_pending_dcr_imports_for_manager() TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_dcr_manager_import(uuid, uuid[], jsonb) TO authenticated;
