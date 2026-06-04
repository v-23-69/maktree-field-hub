-- Map doctor specialities to canonical e-detailing categories (GP, GYNI, ENT, …).

CREATE OR REPLACE FUNCTION public.normalize_edetailing_speciality(p_raw text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  s text := upper(trim(coalesce(p_raw, '')));
BEGIN
  IF s = '' THEN
    RETURN NULL;
  END IF;

  IF s ~ '^(ENT)$|\mENT\M' THEN RETURN 'ENT'; END IF;
  IF s ~ 'ORTHO|OTRHO' THEN RETURN 'ORTHO'; END IF;
  IF s ~ 'GYN|GYNE|DGO|OBSTET|GYNAEC|GYNI' THEN RETURN 'GYNI'; END IF;
  IF s ~ 'PEDIA|PEDIATRICIAN|GP-PEDIA|^PED\M|DCH|PAED|^PEDI' THEN RETURN 'PEDIA'; END IF;
  IF s ~ 'GASTRO' THEN RETURN 'GASTRO'; END IF;
  IF s ~ 'SURG|PROCTO|SUGRON' THEN RETURN 'SURGEON'; END IF;
  IF s ~ 'CHEST|PULMO' THEN RETURN 'CHEST'; END IF;
  IF s ~ 'AYU|BAMS|BHMS|DHMS' THEN RETURN 'AYURVEDA'; END IF;
  IF s ~ 'CARDIO' THEN RETURN 'CARDIO'; END IF;
  IF s ~ 'DERMA|\mDERM\M' THEN RETURN 'DERMA'; END IF;
  IF s ~ 'OPHTHAL|OPTH' THEN RETURN 'OPHTHAL'; END IF;
  IF s ~ '^MD[\s.]|MD MEDICINE' AND s !~ 'AYU|BAMS' THEN RETURN 'MEDICINE'; END IF;
  IF s ~ '^GP\M|GENERAL PHY|FAMILY PHY|PHYSICIAN|^PHY$|^GG$|^MBBS$' THEN RETURN 'GP'; END IF;

  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.canonical_edetailing_category_name(p_code text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE p_code
    WHEN 'ENT' THEN 'ENT'
    WHEN 'ORTHO' THEN 'Orthopedics'
    WHEN 'GYNI' THEN 'Gynecology'
    WHEN 'PEDIA' THEN 'Pediatrics'
    WHEN 'GASTRO' THEN 'Gastroenterology'
    WHEN 'SURGEON' THEN 'General Surgery'
    WHEN 'CHEST' THEN 'Chest / Pulmonology'
    WHEN 'AYURVEDA' THEN 'Ayurveda (BAMS)'
    WHEN 'CARDIO' THEN 'Cardiology'
    WHEN 'DERMA' THEN 'Dermatology'
    WHEN 'OPHTHAL' THEN 'Ophthalmology'
    WHEN 'MEDICINE' THEN 'Medicine (MD)'
    WHEN 'GP' THEN 'General Physician (GP)'
    ELSE p_code
  END;
$$;

CREATE OR REPLACE FUNCTION public.sync_e_detailing_categories_from_doctors()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_inserted int := 0;
  v_updated int := 0;
  v_pruned int := 0;
  r record;
  v_ord int := 0;
  v_role text;
BEGIN
  v_role := COALESCE(public.current_user_role(), '');

  IF v_role <> '' AND v_role NOT IN ('manager', 'admin') THEN
    RAISE EXCEPTION 'Only managers can sync e-detailing categories';
  END IF;

  -- Move images from old per-string category folders into canonical folder (when mappable)
  UPDATE public.e_detailing_media m
  SET folder_id = tgt.keep_id
  FROM public.e_detailing_folders f
  JOIN LATERAL (
    SELECT c.id AS keep_id
    FROM public.e_detailing_folders c
    WHERE c.parent_id IS NULL
      AND c.is_category = true
      AND c.category_code = public.normalize_edetailing_speciality(
        coalesce(f.category_code, f.name)
      )
    ORDER BY c.id
    LIMIT 1
  ) tgt ON true
  WHERE m.folder_id = f.id
    AND f.parent_id IS NULL
    AND f.is_category = true
    AND public.normalize_edetailing_speciality(coalesce(f.category_code, f.name)) IS NOT NULL;

  GET DIAGNOSTICS v_pruned = ROW_COUNT;

  FOR r IN
    WITH mapped AS (
      SELECT
        public.normalize_edetailing_speciality(d.speciality) AS code,
        count(*)::int AS cnt
      FROM public.doctors d
      WHERE d.is_active = true
        AND d.speciality IS NOT NULL
        AND trim(d.speciality) <> ''
        AND public.normalize_edetailing_speciality(d.speciality) IS NOT NULL
      GROUP BY 1
    )
    SELECT code, cnt
    FROM mapped
    ORDER BY code
  LOOP
    v_ord := v_ord + 1;

    IF EXISTS (
      SELECT 1 FROM public.e_detailing_folders f
      WHERE f.category_code = r.code AND f.parent_id IS NULL
    ) THEN
      UPDATE public.e_detailing_folders
      SET
        name = public.canonical_edetailing_category_name(r.code),
        sort_order = v_ord,
        is_category = true,
        is_enabled = true
      WHERE category_code = r.code AND parent_id IS NULL;
      v_updated := v_updated + 1;
    ELSE
      INSERT INTO public.e_detailing_folders (
        name, category_code, is_category, sort_order, parent_id, is_enabled
      )
      VALUES (
        public.canonical_edetailing_category_name(r.code),
        r.code,
        true,
        v_ord,
        NULL,
        true
      );
      v_inserted := v_inserted + 1;
    END IF;
  END LOOP;

  -- Drop empty legacy root categories (non-canonical labels)
  DELETE FROM public.e_detailing_folders f
  WHERE f.parent_id IS NULL
    AND f.is_category = true
    AND NOT EXISTS (SELECT 1 FROM public.e_detailing_media m WHERE m.folder_id = f.id)
    AND (
      f.category_code IS NULL
      OR public.normalize_edetailing_speciality(f.category_code) IS DISTINCT FROM f.category_code
    );

  -- Remove canonical categories with no active doctors (keep if they still have images)
  DELETE FROM public.e_detailing_folders f
  WHERE f.parent_id IS NULL
    AND f.is_category = true
    AND f.category_code IS NOT NULL
    AND NOT EXISTS (
      SELECT 1
      FROM public.doctors d
      WHERE d.is_active = true
        AND public.normalize_edetailing_speciality(d.speciality) = f.category_code
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.e_detailing_media m WHERE m.folder_id = f.id
    );

  RETURN jsonb_build_object(
    'inserted', v_inserted,
    'updated', v_updated,
    'pruned_duplicates', v_pruned,
    'total_categories', (
      SELECT count(*)::int
      FROM public.e_detailing_folders
      WHERE parent_id IS NULL AND is_category = true
    )
  );
END;
$$;

SELECT public.sync_e_detailing_categories_from_doctors();
