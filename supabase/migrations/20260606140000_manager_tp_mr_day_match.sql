-- Manager TP: match a team MR's area for a day and sync working_with on both tour programs.

CREATE OR REPLACE FUNCTION public.sync_manager_mr_tp_day_match(
  p_mr_id uuid,
  p_work_date date,
  p_month date,
  p_sub_area_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_mgr uuid := public.session_profile_id();
  v_mgr_tp_id uuid;
  v_mr_tp_id uuid;
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

  IF p_mr_id IS NULL OR p_mr_id = v_mgr THEN
    RAISE EXCEPTION 'Select a team MR';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.mr_manager_map mm
    WHERE mm.manager_id = v_mgr AND mm.mr_id = p_mr_id
  ) THEN
    RAISE EXCEPTION 'This MR is not on your team';
  END IF;

  IF p_sub_area_id IS NULL THEN
    RAISE EXCEPTION 'Area is required';
  END IF;

  INSERT INTO public.tour_programs (mr_id, month, manager_id, status)
  VALUES (v_mgr, p_month, NULL, 'draft')
  ON CONFLICT (mr_id, month) DO NOTHING;

  SELECT id INTO v_mgr_tp_id
  FROM public.tour_programs
  WHERE mr_id = v_mgr AND month = p_month
  LIMIT 1;

  IF v_mgr_tp_id IS NULL THEN
    RAISE EXCEPTION 'Manager tour program not found';
  END IF;

  INSERT INTO public.tour_program_entries (
    tour_program_id,
    work_date,
    sub_area_id,
    working_with,
    working_with_ids,
    day_type,
    notes
  )
  VALUES (
    v_mgr_tp_id,
    p_work_date,
    p_sub_area_id,
    p_mr_id,
    ARRAY[p_mr_id],
    'working',
    NULL
  )
  ON CONFLICT (tour_program_id, work_date)
  DO UPDATE SET
    sub_area_id = EXCLUDED.sub_area_id,
    working_with = EXCLUDED.working_with,
    working_with_ids = EXCLUDED.working_with_ids,
    day_type = 'working';

  INSERT INTO public.tour_programs (mr_id, month, manager_id, status)
  VALUES (p_mr_id, p_month, v_mgr, 'draft')
  ON CONFLICT (mr_id, month) DO NOTHING;

  SELECT id INTO v_mr_tp_id
  FROM public.tour_programs
  WHERE mr_id = p_mr_id AND month = p_month
  LIMIT 1;

  IF v_mr_tp_id IS NULL THEN
    RAISE EXCEPTION 'Could not create MR tour program';
  END IF;

  INSERT INTO public.tour_program_entries (
    tour_program_id,
    work_date,
    sub_area_id,
    working_with,
    working_with_ids,
    day_type,
    notes
  )
  VALUES (
    v_mr_tp_id,
    p_work_date,
    p_sub_area_id,
    v_mgr,
    ARRAY[v_mgr],
    'working',
    NULL
  )
  ON CONFLICT (tour_program_id, work_date)
  DO UPDATE SET
    sub_area_id = EXCLUDED.sub_area_id,
    working_with = EXCLUDED.working_with,
    working_with_ids = EXCLUDED.working_with_ids,
    day_type = 'working';
END;
$$;

GRANT EXECUTE ON FUNCTION public.sync_manager_mr_tp_day_match(uuid, date, date, uuid) TO authenticated;

-- When importing MR TP with apply_to both, set working_with on both sides
CREATE OR REPLACE FUNCTION public.manager_import_tour_program(
  p_source_mr_id uuid,
  p_month date,
  p_entries jsonb
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_me uuid;
  v_role text;
  v_mgr_name text;
  v_source_name text;
  v_self_tp_id uuid;
  v_source_tp_id uuid;
  v_entry jsonb;
  v_work_date date;
  v_sub_area_id uuid;
  v_apply_to text;
  v_self_count int := 0;
  v_both_count int := 0;
  v_month_label text;
BEGIN
  SELECT u.id, u.role::text, u.full_name INTO v_me, v_role, v_mgr_name
  FROM public.users u
  WHERE u.auth_user_id = auth.uid() AND u.is_active = true
  LIMIT 1;

  IF v_me IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF v_role <> 'manager' THEN
    RAISE EXCEPTION 'Only managers can import tour programs';
  END IF;

  IF p_source_mr_id = v_me THEN
    RAISE EXCEPTION 'Select a team MR as the source';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.mr_manager_map mm
    WHERE mm.manager_id = v_me AND mm.mr_id = p_source_mr_id
  ) THEN
    RAISE EXCEPTION 'This MR is not on your team';
  END IF;

  IF p_entries IS NULL OR jsonb_typeof(p_entries) <> 'array' OR jsonb_array_length(p_entries) = 0 THEN
    RAISE EXCEPTION 'Select at least one day to import';
  END IF;

  SELECT full_name INTO v_source_name FROM public.users WHERE id = p_source_mr_id;

  INSERT INTO public.tour_programs (mr_id, month, manager_id, status)
  VALUES (v_me, p_month, NULL, 'draft')
  ON CONFLICT (mr_id, month) DO NOTHING;

  SELECT id INTO v_self_tp_id
  FROM public.tour_programs
  WHERE mr_id = v_me AND month = p_month
  LIMIT 1;

  IF v_self_tp_id IS NULL THEN
    RAISE EXCEPTION 'Could not create manager tour program';
  END IF;

  SELECT id INTO v_source_tp_id
  FROM public.tour_programs
  WHERE mr_id = p_source_mr_id AND month = p_month
  LIMIT 1;

  v_month_label := to_char(p_month, 'Mon YYYY');

  FOR v_entry IN SELECT * FROM jsonb_array_elements(p_entries) LOOP
    v_work_date := (v_entry->>'work_date')::date;
    v_sub_area_id := NULLIF(v_entry->>'sub_area_id', '')::uuid;
    v_apply_to := COALESCE(NULLIF(v_entry->>'apply_to', ''), 'self');

    IF v_work_date IS NULL OR v_sub_area_id IS NULL THEN
      CONTINUE;
    END IF;

    IF v_apply_to NOT IN ('self', 'both') THEN
      RAISE EXCEPTION 'Invalid apply_to for %', v_work_date;
    END IF;

    INSERT INTO public.tour_program_entries (
      tour_program_id, work_date, sub_area_id, working_with, working_with_ids, day_type, notes
    )
    VALUES (
      v_self_tp_id,
      v_work_date,
      v_sub_area_id,
      CASE WHEN v_apply_to = 'both' THEN p_source_mr_id ELSE NULL END,
      CASE WHEN v_apply_to = 'both' THEN ARRAY[p_source_mr_id] ELSE '{}'::uuid[] END,
      'working',
      NULL
    )
    ON CONFLICT (tour_program_id, work_date)
    DO UPDATE SET
      sub_area_id = EXCLUDED.sub_area_id,
      working_with = EXCLUDED.working_with,
      working_with_ids = EXCLUDED.working_with_ids;

    v_self_count := v_self_count + 1;

    IF v_apply_to = 'both' THEN
      IF v_source_tp_id IS NULL THEN
        INSERT INTO public.tour_programs (mr_id, month, manager_id, status)
        VALUES (p_source_mr_id, p_month, v_me, 'draft')
        ON CONFLICT (mr_id, month) DO NOTHING
        RETURNING id INTO v_source_tp_id;
        IF v_source_tp_id IS NULL THEN
          SELECT id INTO v_source_tp_id
          FROM public.tour_programs
          WHERE mr_id = p_source_mr_id AND month = p_month;
        END IF;
      END IF;

      INSERT INTO public.tour_program_entries (
        tour_program_id, work_date, sub_area_id, working_with, working_with_ids, day_type, notes
      )
      VALUES (
        v_source_tp_id,
        v_work_date,
        v_sub_area_id,
        v_me,
        ARRAY[v_me],
        'working',
        NULL
      )
      ON CONFLICT (tour_program_id, work_date)
      DO UPDATE SET
        sub_area_id = EXCLUDED.sub_area_id,
        working_with = EXCLUDED.working_with,
        working_with_ids = EXCLUDED.working_with_ids;

      v_both_count := v_both_count + 1;
    END IF;
  END LOOP;

  IF v_self_count = 0 THEN
    RAISE EXCEPTION 'No valid days to import';
  END IF;

  IF v_both_count > 0 THEN
    BEGIN
      PERFORM public._notify_user(
        p_source_mr_id,
        'tour_program_updated',
        'Tour program updated',
        COALESCE(v_mgr_name, 'Your manager') || ' aligned your tour program for '
          || v_both_count::text || ' day(s) in ' || v_month_label || ' while planning together.',
        '/mr/tour-program',
        jsonb_build_object(
          'month', p_month,
          'manager_id', v_me,
          'days_updated', v_both_count
        )
      );
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END IF;

  RETURN jsonb_build_object(
    'self_days', v_self_count,
    'mr_days_updated', v_both_count,
    'tour_program_id', v_self_tp_id
  );
END;
$$;
