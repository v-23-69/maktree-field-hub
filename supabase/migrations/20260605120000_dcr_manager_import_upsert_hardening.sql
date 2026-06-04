-- Harden manager DCR import: lock/merge any same-day report row (avoid 409 on mr_id+report_date),
-- promote drafts, and block merge into leave/sunday/meeting DCRs with a clear error.

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
  v_existing_status text;
  v_existing_kind text;
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

  SELECT dr.id, dr.status, dr.report_kind
  INTO v_mgr_report_id, v_existing_status, v_existing_kind
  FROM public.daily_reports dr
  WHERE dr.mr_id = v_mgr
    AND dr.report_date = v_import.report_date
  ORDER BY
    CASE WHEN dr.status = 'submitted' THEN 0 WHEN dr.status = 'draft' THEN 1 ELSE 2 END,
    dr.submitted_at DESC NULLS LAST,
    dr.created_at DESC
  LIMIT 1
  FOR UPDATE;

  IF v_mgr_report_id IS NOT NULL THEN
    IF v_existing_status = 'submitted' AND v_existing_kind IS DISTINCT FROM 'field' THEN
      RAISE EXCEPTION 'You already filed a % DCR for this date. Import cannot add field calls to it.', v_existing_kind;
    END IF;

    IF v_existing_status = 'draft' THEN
      UPDATE public.daily_reports dr
      SET
        status = 'submitted',
        report_kind = 'field',
        submitted_at = COALESCE(dr.submitted_at, now()),
        working_with_ids = CASE
          WHEN v_import.mr_id = ANY (COALESCE(dr.working_with_ids, '{}'::uuid[]))
            THEN dr.working_with_ids
          ELSE array_append(COALESCE(dr.working_with_ids, '{}'::uuid[]), v_import.mr_id)
        END
      WHERE dr.id = v_mgr_report_id;
    ELSIF NOT (v_import.mr_id = ANY (
      COALESCE(
        (SELECT dr.working_with_ids FROM public.daily_reports dr WHERE dr.id = v_mgr_report_id),
        '{}'::uuid[]
      )
    )) THEN
      UPDATE public.daily_reports dr
      SET working_with_ids = array_append(COALESCE(dr.working_with_ids, '{}'::uuid[]), v_import.mr_id)
      WHERE dr.id = v_mgr_report_id;
    END IF;
  ELSE
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
    ON CONFLICT (mr_id, report_date) DO UPDATE SET
      working_with_ids = CASE
        WHEN v_import.mr_id = ANY (COALESCE(daily_reports.working_with_ids, '{}'::uuid[]))
          THEN daily_reports.working_with_ids
        ELSE array_append(COALESCE(daily_reports.working_with_ids, '{}'::uuid[]), v_import.mr_id)
      END,
      status = CASE
        WHEN daily_reports.status = 'draft' THEN 'submitted'
        ELSE daily_reports.status
      END,
      report_kind = CASE
        WHEN daily_reports.status = 'draft' THEN 'field'
        ELSE daily_reports.report_kind
      END,
      submitted_at = COALESCE(daily_reports.submitted_at, EXCLUDED.submitted_at)
    RETURNING id INTO v_mgr_report_id;

    SELECT dr.status, dr.report_kind
    INTO v_existing_status, v_existing_kind
    FROM public.daily_reports dr
    WHERE dr.id = v_mgr_report_id;

    IF v_existing_status = 'submitted' AND v_existing_kind IS DISTINCT FROM 'field' THEN
      RAISE EXCEPTION 'You already filed a % DCR for this date. Import cannot add field calls to it.', v_existing_kind;
    END IF;
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

GRANT EXECUTE ON FUNCTION public.complete_dcr_manager_import(uuid, uuid[], jsonb) TO authenticated;
