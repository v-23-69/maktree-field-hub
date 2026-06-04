-- Manager "Field visits (custom)" — areas outside tour program with doctors, chemists, territory assign.

ALTER TABLE public.sub_areas
  ADD COLUMN IF NOT EXISTS is_manager_custom boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS created_by_manager_id uuid REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE public.daily_reports
  ADD COLUMN IF NOT EXISTS manager_dcr_origin text
    CHECK (
      manager_dcr_origin IS NULL
      OR manager_dcr_origin IN ('standard', 'custom', 'import', 'mixed')
    );

CREATE TABLE IF NOT EXISTS public.manager_custom_areas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  manager_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  sub_area_id uuid NOT NULL REFERENCES public.sub_areas(id) ON DELETE CASCADE,
  territory_area_id uuid REFERENCES public.areas(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT manager_custom_areas_name_trim CHECK (char_length(trim(name)) > 0),
  UNIQUE (manager_id, sub_area_id),
  UNIQUE (manager_id, name)
);

CREATE INDEX IF NOT EXISTS idx_manager_custom_areas_manager
  ON public.manager_custom_areas (manager_id);

ALTER TABLE public.manager_custom_areas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS manager_custom_areas_mgr ON public.manager_custom_areas;
CREATE POLICY manager_custom_areas_mgr ON public.manager_custom_areas
  FOR ALL TO authenticated
  USING (
    public.current_user_role() = 'admin'
    OR manager_id = public.session_profile_id()
  )
  WITH CHECK (
    public.current_user_role() = 'admin'
    OR manager_id = public.session_profile_id()
  );

-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public._manager_custom_pool_area_id(p_manager_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_area_id uuid;
  v_code text;
  v_mgr_name text;
BEGIN
  v_code := 'MGR-CUST-' || left(replace(p_manager_id::text, '-', ''), 8);

  SELECT a.id INTO v_area_id
  FROM public.areas a
  WHERE a.code = v_code
  LIMIT 1;

  IF v_area_id IS NOT NULL THEN
    RETURN v_area_id;
  END IF;

  SELECT COALESCE(NULLIF(trim(u.full_name), ''), 'Manager') INTO v_mgr_name
  FROM public.users u
  WHERE u.id = p_manager_id;

  INSERT INTO public.areas (name, code, is_active)
  VALUES ('Field visits (custom) — ' || v_mgr_name, v_code, true)
  RETURNING id INTO v_area_id;

  RETURN v_area_id;
END;
$$;

-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_manager_custom_area(p_name text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_mgr uuid := public.session_profile_id();
  v_pool_area uuid;
  v_sub_area_id uuid;
  v_custom_id uuid;
  v_code text;
  v_trim text := trim(COALESCE(p_name, ''));
BEGIN
  IF v_mgr IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF v_trim = '' THEN
    RAISE EXCEPTION 'Area name is required';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.manager_custom_areas m
    WHERE m.manager_id = v_mgr AND lower(trim(m.name)) = lower(v_trim)
  ) THEN
    RAISE EXCEPTION 'A custom area with this name already exists';
  END IF;

  v_pool_area := public._manager_custom_pool_area_id(v_mgr);
  v_code := 'MCA-' || left(replace(gen_random_uuid()::text, '-', ''), 10);

  INSERT INTO public.sub_areas (area_id, name, code, is_active, is_manager_custom, created_by_manager_id)
  VALUES (v_pool_area, v_trim, v_code, true, true, v_mgr)
  RETURNING id INTO v_sub_area_id;

  INSERT INTO public.manager_custom_areas (manager_id, name, sub_area_id, territory_area_id)
  VALUES (v_mgr, v_trim, v_sub_area_id, NULL)
  RETURNING id INTO v_custom_id;

  INSERT INTO public.mr_sub_area_access (mr_id, sub_area_id)
  VALUES (v_mgr, v_sub_area_id)
  ON CONFLICT DO NOTHING;

  RETURN v_custom_id;
END;
$$;

-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.list_manager_custom_areas()
RETURNS TABLE (
  custom_area_id uuid,
  name text,
  sub_area_id uuid,
  territory_area_id uuid,
  territory_name text,
  doctor_count bigint,
  visit_count bigint,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    m.id AS custom_area_id,
    m.name,
    m.sub_area_id,
    m.territory_area_id,
    a.name AS territory_name,
    (
      SELECT COUNT(*)::bigint FROM public.doctors d
      WHERE d.sub_area_id = m.sub_area_id AND d.is_active = true
    ) AS doctor_count,
    (
      SELECT COUNT(*)::bigint
      FROM public.report_visits rv
      INNER JOIN public.doctors d ON d.id = rv.doctor_id
      INNER JOIN public.daily_reports dr ON dr.id = rv.report_id
      WHERE d.sub_area_id = m.sub_area_id
        AND dr.mr_id = m.manager_id
        AND dr.status = 'submitted'
    ) AS visit_count,
    m.created_at
  FROM public.manager_custom_areas m
  LEFT JOIN public.areas a ON a.id = m.territory_area_id
  WHERE m.manager_id = public.session_profile_id()
  ORDER BY m.name;
$$;

-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.add_doctor_to_manager_custom_area(
  p_custom_area_id uuid,
  p_full_name text,
  p_speciality text DEFAULT NULL,
  p_mobile text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_mgr uuid := public.session_profile_id();
  v_sub_area_id uuid;
  v_doctor_id uuid;
  v_code text;
BEGIN
  IF v_mgr IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT m.sub_area_id INTO v_sub_area_id
  FROM public.manager_custom_areas m
  WHERE m.id = p_custom_area_id AND m.manager_id = v_mgr;

  IF v_sub_area_id IS NULL THEN
    RAISE EXCEPTION 'Custom area not found';
  END IF;

  IF trim(COALESCE(p_full_name, '')) = '' THEN
    RAISE EXCEPTION 'Doctor name is required';
  END IF;

  v_code := 'MCD-' || left(replace(gen_random_uuid()::text, '-', ''), 10);

  INSERT INTO public.doctors (
    sub_area_id,
    doctor_code,
    full_name,
    speciality,
    mobile,
    master_list_complete,
    is_active
  )
  VALUES (
    v_sub_area_id,
    v_code,
    trim(p_full_name),
    NULLIF(trim(COALESCE(p_speciality, '')), ''),
    NULLIF(trim(COALESCE(p_mobile, '')), ''),
    false,
    true
  )
  RETURNING id INTO v_doctor_id;

  RETURN v_doctor_id;
END;
$$;

-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.assign_manager_custom_areas_to_territory(
  p_custom_area_ids uuid[],
  p_territory_area_id uuid
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_mgr uuid := public.session_profile_id();
  v_count int := 0;
  v_row record;
BEGIN
  IF v_mgr IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.areas a
    WHERE a.id = p_territory_area_id AND a.is_active = true
  ) THEN
    RAISE EXCEPTION 'Territory not found';
  END IF;

  FOR v_row IN
    SELECT m.id, m.sub_area_id
    FROM public.manager_custom_areas m
    WHERE m.manager_id = v_mgr
      AND m.id = ANY(COALESCE(p_custom_area_ids, '{}'::uuid[]))
  LOOP
    UPDATE public.sub_areas sa
    SET area_id = p_territory_area_id
    WHERE sa.id = v_row.sub_area_id;

    UPDATE public.manager_custom_areas m
    SET
      territory_area_id = p_territory_area_id,
      updated_at = now()
    WHERE m.id = v_row.id;

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_territory_with_sub_areas(
  p_territory_name text,
  p_sub_area_ids uuid[],
  p_assign_mr_ids uuid[] DEFAULT '{}'::uuid[]
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_mgr uuid := public.session_profile_id();
  v_area_id uuid;
  v_code text;
  v_sid uuid;
  v_mrid uuid;
BEGIN
  IF v_mgr IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF trim(COALESCE(p_territory_name, '')) = '' THEN
    RAISE EXCEPTION 'Territory name is required';
  END IF;

  v_code := 'MTR-' || left(replace(gen_random_uuid()::text, '-', ''), 10);

  INSERT INTO public.areas (name, code, is_active)
  VALUES (trim(p_territory_name), v_code, true)
  RETURNING id INTO v_area_id;

  IF p_sub_area_ids IS NOT NULL THEN
    FOREACH v_sid IN ARRAY p_sub_area_ids
    LOOP
      UPDATE public.sub_areas sa
      SET area_id = v_area_id
      WHERE sa.id = v_sid
        AND (
          sa.is_manager_custom = true
          AND sa.created_by_manager_id = v_mgr
          OR EXISTS (
            SELECT 1 FROM public.mr_sub_area_access msa
            WHERE msa.mr_id = v_mgr AND msa.sub_area_id = sa.id
          )
        );

      UPDATE public.manager_custom_areas m
      SET territory_area_id = v_area_id, updated_at = now()
      WHERE m.sub_area_id = v_sid AND m.manager_id = v_mgr;
    END LOOP;
  END IF;

  IF p_assign_mr_ids IS NOT NULL AND p_sub_area_ids IS NOT NULL THEN
    FOREACH v_mrid IN ARRAY p_assign_mr_ids
    LOOP
      IF EXISTS (
        SELECT 1 FROM public.mr_manager_map mm
        WHERE mm.manager_id = v_mgr AND mm.mr_id = v_mrid
      ) OR v_mrid = v_mgr THEN
        FOREACH v_sid IN ARRAY p_sub_area_ids
        LOOP
          INSERT INTO public.mr_sub_area_access (mr_id, sub_area_id)
          VALUES (v_mrid, v_sid)
          ON CONFLICT DO NOTHING;
        END LOOP;
      END IF;
    END LOOP;
  END IF;

  RETURN v_area_id;
END;
$$;

-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_manager_custom_areas_summary()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT jsonb_build_object(
    'area_count', COUNT(*)::int,
    'doctor_count', COALESCE(SUM(doc.cnt), 0)::int,
    'visit_count', COALESCE(SUM(vis.cnt), 0)::int
  )
  FROM public.manager_custom_areas m
  LEFT JOIN LATERAL (
    SELECT COUNT(*)::int AS cnt
    FROM public.doctors d
    WHERE d.sub_area_id = m.sub_area_id AND d.is_active = true
  ) doc ON true
  LEFT JOIN LATERAL (
    SELECT COUNT(*)::int AS cnt
    FROM public.report_visits rv
    INNER JOIN public.doctors d ON d.id = rv.doctor_id
    INNER JOIN public.daily_reports dr ON dr.id = rv.report_id
    WHERE d.sub_area_id = m.sub_area_id
      AND dr.mr_id = m.manager_id
      AND dr.status = 'submitted'
  ) vis ON true
  WHERE m.manager_id = public.session_profile_id();
$$;

-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.list_report_import_mr_names(p_mr_id uuid)
RETURNS TABLE (report_id uuid, mr_names text[])
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    i.manager_report_id AS report_id,
    array_agg(DISTINCT COALESCE(mr.full_name, 'MR') ORDER BY COALESCE(mr.full_name, 'MR')) AS mr_names
  FROM public.dcr_manager_imports i
  JOIN public.users mr ON mr.id = i.mr_id
  WHERE i.manager_id = p_mr_id
    AND i.status = 'completed'
    AND i.manager_report_id IS NOT NULL
  GROUP BY i.manager_report_id;
$$;

-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.refresh_manager_dcr_origin(p_report_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_row public.daily_reports%ROWTYPE;
  v_has_custom boolean;
  v_has_import boolean;
  v_has_standard boolean;
  v_origin text;
BEGIN
  SELECT * INTO v_row FROM public.daily_reports WHERE id = p_report_id;
  IF NOT FOUND OR v_row.status IS DISTINCT FROM 'submitted' THEN
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = v_row.mr_id AND u.role::text = 'manager'
  ) THEN
    RETURN;
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.report_visits rv
    JOIN public.doctors d ON d.id = rv.doctor_id
    JOIN public.sub_areas sa ON sa.id = d.sub_area_id
    WHERE rv.report_id = p_report_id AND sa.is_manager_custom = true
  ) INTO v_has_custom;

  SELECT EXISTS (
    SELECT 1 FROM public.dcr_manager_imports i
    WHERE i.manager_report_id = p_report_id AND i.status = 'completed'
  ) INTO v_has_import;

  SELECT EXISTS (
    SELECT 1
    FROM public.report_visits rv
    JOIN public.doctors d ON d.id = rv.doctor_id
    JOIN public.sub_areas sa ON sa.id = d.sub_area_id
    WHERE rv.report_id = p_report_id AND COALESCE(sa.is_manager_custom, false) = false
  ) INTO v_has_standard;

  IF v_has_import AND v_has_custom THEN
    v_origin := 'mixed';
  ELSIF v_has_import THEN
    v_origin := 'import';
  ELSIF v_has_custom AND NOT v_has_standard THEN
    v_origin := 'custom';
  ELSIF v_has_custom THEN
    v_origin := 'mixed';
  ELSE
    v_origin := 'standard';
  END IF;

  UPDATE public.daily_reports dr
  SET manager_dcr_origin = v_origin
  WHERE dr.id = p_report_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_refresh_manager_dcr_origin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status = 'submitted'
    AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'submitted')
  THEN
    PERFORM public.refresh_manager_dcr_origin(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_daily_reports_manager_dcr_origin ON public.daily_reports;
CREATE TRIGGER trg_daily_reports_manager_dcr_origin
  AFTER INSERT OR UPDATE OF status ON public.daily_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_refresh_manager_dcr_origin();

-- Include custom sub-areas in list_sub_areas_for_mr for the manager
DROP FUNCTION IF EXISTS public.list_sub_areas_for_mr(uuid);

CREATE OR REPLACE FUNCTION public.list_sub_areas_for_mr(p_mr_id uuid DEFAULT NULL)
RETURNS TABLE (
  sub_area_id uuid,
  sub_area_name text,
  sub_area_code text,
  area_id uuid,
  area_name text,
  is_manager_custom boolean
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  WITH target AS (
    SELECT u.id
    FROM public.users u
    WHERE u.is_active = true
      AND u.id = COALESCE(
        p_mr_id,
        (SELECT u2.id FROM public.users u2 WHERE u2.auth_user_id = auth.uid() AND u2.is_active LIMIT 1)
      )
    LIMIT 1
  ),
  assigned AS (
    SELECT
      sa.id AS sub_area_id,
      sa.name AS sub_area_name,
      sa.code AS sub_area_code,
      a.id AS area_id,
      a.name AS area_name,
      COALESCE(sa.is_manager_custom, false) AS is_manager_custom
    FROM target t
    INNER JOIN public.mr_sub_area_access msa ON msa.mr_id = t.id
    INNER JOIN public.sub_areas sa ON sa.id = msa.sub_area_id AND sa.is_active = true
    INNER JOIN public.areas a ON a.id = sa.area_id AND a.is_active = true
    WHERE EXISTS (
      SELECT 1
      FROM public.users me
      WHERE me.auth_user_id = auth.uid()
        AND me.is_active = true
        AND (
          me.role::text = 'admin'
          OR t.id = me.id
          OR (
            me.role::text = 'manager'
            AND (
              t.id = me.id
              OR EXISTS (
                SELECT 1 FROM public.mr_manager_map mm
                WHERE mm.manager_id = me.id AND mm.mr_id = t.id
              )
            )
          )
          OR (me.role::text = 'mr' AND t.id = me.id)
        )
    )
  )
  SELECT * FROM assigned
  ORDER BY is_manager_custom DESC, area_name, sub_area_name;
$$;

-- Patch complete_dcr_manager_import to refresh origin after visits copied
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

  PERFORM public.refresh_manager_dcr_origin(v_mgr_report_id);

  RETURN v_mgr_report_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_manager_custom_area(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_manager_custom_areas() TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_doctor_to_manager_custom_area(uuid, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.assign_manager_custom_areas_to_territory(uuid[], uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_territory_with_sub_areas(text, uuid[], uuid[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_manager_custom_areas_summary() TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_report_import_mr_names(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_manager_dcr_origin(uuid) TO authenticated;
