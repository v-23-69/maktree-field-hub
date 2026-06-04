-- Sync E-Detailing category folders from distinct doctor specialities in the database.

CREATE OR REPLACE FUNCTION public.sync_e_detailing_categories_from_doctors()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_inserted int := 0;
  v_updated int := 0;
  r record;
  v_code text;
  v_ord int := 0;
BEGIN
  IF COALESCE(public.current_user_role(), '') NOT IN ('manager', 'admin', '') THEN
    RAISE EXCEPTION 'Only managers can sync e-detailing categories';
  END IF;

  FOR r IN
    WITH tallies AS (
      SELECT
        upper(trim(d.speciality)) AS code,
        trim(d.speciality) AS display_name,
        count(*)::int AS cnt
      FROM public.doctors d
      WHERE d.speciality IS NOT NULL
        AND trim(d.speciality) <> ''
        AND d.is_active = true
      GROUP BY 1, 2
    ),
    best AS (
      SELECT DISTINCT ON (code)
        code,
        display_name,
        cnt
      FROM tallies
      ORDER BY code, cnt DESC, display_name
    )
    SELECT code, display_name
    FROM best
    ORDER BY code
  LOOP
    v_ord := v_ord + 1;
    v_code := r.code;

    IF EXISTS (
      SELECT 1 FROM public.e_detailing_folders f
      WHERE f.category_code = v_code AND f.parent_id IS NULL
    ) THEN
      UPDATE public.e_detailing_folders
      SET
        name = r.display_name,
        sort_order = v_ord,
        is_category = true
      WHERE category_code = v_code AND parent_id IS NULL;
      v_updated := v_updated + 1;
    ELSE
      INSERT INTO public.e_detailing_folders (
        name, category_code, is_category, sort_order, parent_id, is_enabled
      )
      VALUES (r.display_name, v_code, true, v_ord, NULL, true);
      v_inserted := v_inserted + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'inserted', v_inserted,
    'updated', v_updated,
    'total_categories', (SELECT count(*)::int FROM public.e_detailing_folders WHERE parent_id IS NULL AND is_category = true)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.sync_e_detailing_categories_from_doctors() TO authenticated;
