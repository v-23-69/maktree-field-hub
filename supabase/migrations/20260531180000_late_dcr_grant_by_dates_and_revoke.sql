-- Grant exact dates only (no range auto-fill); list + revoke active slots.

DROP FUNCTION IF EXISTS public.grant_late_dcr_fill(uuid, date, date);

CREATE OR REPLACE FUNCTION public.grant_late_dcr_fill(p_mr_id uuid, p_dates date[])
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_me uuid;
  v_role text;
  v_active int;
  v_date date;
  v_granted date[] := '{}';
  v_count int := 0;
  v_cutoff date := today_ist() - 3;
  v_clean date[] := '{}';
BEGIN
  SELECT u.id, u.role::text INTO v_me, v_role
  FROM public.users u
  WHERE u.auth_user_id = auth.uid() AND u.is_active = true
  LIMIT 1;

  IF v_me IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF v_role <> 'manager' THEN
    RAISE EXCEPTION 'Only managers can grant late DCR dates';
  END IF;

  IF p_mr_id <> v_me AND NOT EXISTS (
    SELECT 1 FROM public.mr_manager_map mm
    WHERE mm.manager_id = v_me AND mm.mr_id = p_mr_id
  ) THEN
    RAISE EXCEPTION 'This MR is not on your team';
  END IF;

  IF p_dates IS NULL OR cardinality(p_dates) = 0 THEN
    RAISE EXCEPTION 'Select at least one date';
  END IF;

  IF cardinality(p_dates) > 15 THEN
    RAISE EXCEPTION 'You can grant at most 15 dates per batch';
  END IF;

  v_active := public.count_active_late_fill_slots(p_mr_id);
  IF v_active > 0 THEN
    RAISE EXCEPTION 'Complete the % open late DCR(s) first before granting a new batch.', v_active;
  END IF;

  FOREACH v_date IN ARRAY p_dates LOOP
    IF v_date = ANY (v_clean) THEN
      CONTINUE;
    END IF;
    IF v_date > v_cutoff THEN
      RAISE EXCEPTION 'Date % is still in the normal filing window', v_date;
    END IF;
    IF EXISTS (
      SELECT 1 FROM public.daily_reports dr
      WHERE dr.mr_id = p_mr_id AND dr.report_date = v_date AND dr.status = 'submitted'
    ) THEN
      RAISE EXCEPTION 'A DCR is already submitted for %', v_date;
    END IF;
    IF public.dcr_day_type_for_mr(p_mr_id, v_date) NOT IN ('working', 'sunday', 'leave') THEN
      RAISE EXCEPTION 'Date % is not eligible (holiday/strike)', v_date;
    END IF;
    v_clean := array_append(v_clean, v_date);
  END LOOP;

  IF cardinality(v_clean) = 0 THEN
    RAISE EXCEPTION 'No eligible dates selected';
  END IF;

  FOREACH v_date IN ARRAY v_clean LOOP
    BEGIN
      INSERT INTO public.dcr_late_fill_slots (mr_id, report_date, granted_by, source)
      VALUES (p_mr_id, v_date, v_me, 'manager_grant');
      v_granted := array_append(v_granted, v_date);
      v_count := v_count + 1;
    EXCEPTION WHEN unique_violation THEN
      RAISE EXCEPTION 'Late DCR slot already open for %', v_date;
    END;
  END LOOP;

  RETURN jsonb_build_object('granted_count', v_count, 'granted_dates', v_granted);
END;
$$;

GRANT EXECUTE ON FUNCTION public.grant_late_dcr_fill(uuid, date[]) TO authenticated;

CREATE OR REPLACE FUNCTION public.list_active_late_fill_slots(p_mr_id uuid)
RETURNS TABLE(slot_id uuid, report_date date)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT s.id AS slot_id, s.report_date
  FROM public.dcr_late_fill_slots s
  WHERE s.mr_id = p_mr_id
    AND s.consumed_at IS NULL
  ORDER BY s.report_date ASC;
$$;

GRANT EXECUTE ON FUNCTION public.list_active_late_fill_slots(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.revoke_late_dcr_fill_slots(p_mr_id uuid, p_dates date[])
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_me uuid;
  v_role text;
  v_deleted int;
BEGIN
  SELECT u.id, u.role::text INTO v_me, v_role
  FROM public.users u
  WHERE u.auth_user_id = auth.uid() AND u.is_active = true
  LIMIT 1;

  IF v_me IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF v_role <> 'manager' THEN
    RAISE EXCEPTION 'Only managers can revoke late DCR slots';
  END IF;

  IF p_mr_id <> v_me AND NOT EXISTS (
    SELECT 1 FROM public.mr_manager_map mm
    WHERE mm.manager_id = v_me AND mm.mr_id = p_mr_id
  ) THEN
    RAISE EXCEPTION 'This MR is not on your team';
  END IF;

  IF p_dates IS NULL OR cardinality(p_dates) = 0 THEN
    RAISE EXCEPTION 'Select at least one date to revoke';
  END IF;

  DELETE FROM public.dcr_late_fill_slots s
  WHERE s.mr_id = p_mr_id
    AND s.report_date = ANY (p_dates)
    AND s.consumed_at IS NULL;

  GET DIAGNOSTICS v_deleted = ROW_COUNT;

  IF v_deleted = 0 THEN
    RAISE EXCEPTION 'No open late slots found for those dates';
  END IF;

  RETURN jsonb_build_object('revoked_count', v_deleted);
END;
$$;

GRANT EXECUTE ON FUNCTION public.revoke_late_dcr_fill_slots(uuid, date[]) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_next_missed_late_batch_dates(p_mr_id uuid, p_limit int DEFAULT 15)
RETURNS SETOF date
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_date date := today_ist() - 3;
  v_found int := 0;
  v_i int := 0;
BEGIN
  WHILE v_i < 120 AND v_found < COALESCE(NULLIF(p_limit, 0), 15) LOOP
    IF EXTRACT(DOW FROM v_date) <> 0
      AND NOT EXISTS (
        SELECT 1 FROM public.daily_reports dr
        WHERE dr.mr_id = p_mr_id AND dr.report_date = v_date AND dr.status = 'submitted'
      )
      AND public.dcr_day_type_for_mr(p_mr_id, v_date) IN ('working', 'leave')
    THEN
      RETURN NEXT v_date;
      v_found := v_found + 1;
    END IF;
    v_date := v_date - 1;
    v_i := v_i + 1;
  END LOOP;
  RETURN;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_next_missed_late_batch_dates(uuid, int) TO authenticated;

-- MR requests: only dates in the next missed batch (15 most recent gaps).
CREATE OR REPLACE FUNCTION public.request_late_dcr_fill(p_dates date[])
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_me uuid;
  v_request_id uuid;
  v_role text;
  v_manager uuid;
  v_active int;
  v_date date;
  v_clean date[] := '{}';
  v_cutoff date := today_ist() - 3;
  v_allowed date[];
BEGIN
  SELECT u.id, u.role::text INTO v_me, v_role
  FROM public.users u
  WHERE u.auth_user_id = auth.uid() AND u.is_active = true
  LIMIT 1;

  IF v_me IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF v_role <> 'mr' THEN
    RAISE EXCEPTION 'Only MRs submit late DCR requests. Managers can grant dates directly.';
  END IF;

  v_active := public.count_active_late_fill_slots(v_me);
  IF v_active > 0 THEN
    RAISE EXCEPTION 'Complete your % pending late DCR(s) before requesting more.', v_active;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.dcr_late_fill_requests
    WHERE mr_id = v_me AND status = 'pending'
  ) THEN
    RAISE EXCEPTION 'You already have a pending late DCR request';
  END IF;

  IF p_dates IS NULL OR cardinality(p_dates) = 0 THEN
    RAISE EXCEPTION 'Select at least one date';
  END IF;

  IF cardinality(p_dates) > 15 THEN
    RAISE EXCEPTION 'You can request at most 15 dates at a time';
  END IF;

  SELECT array_agg(d ORDER BY d)
  INTO v_allowed
  FROM public.get_next_missed_late_batch_dates(v_me, 15) AS d;

  IF v_allowed IS NULL OR cardinality(v_allowed) = 0 THEN
    RAISE EXCEPTION 'No missed DCR dates available to request';
  END IF;

  FOREACH v_date IN ARRAY p_dates LOOP
    IF v_date > v_cutoff THEN
      RAISE EXCEPTION 'Date % is still in the normal filing window', v_date;
    END IF;
    IF NOT (v_date = ANY (v_allowed)) THEN
      RAISE EXCEPTION 'Date % is not in your current batch of requestable missed days', v_date;
    END IF;
    IF EXISTS (
      SELECT 1 FROM public.daily_reports dr
      WHERE dr.mr_id = v_me AND dr.report_date = v_date AND dr.status = 'submitted'
    ) THEN
      CONTINUE;
    END IF;
    IF v_date = ANY (v_clean) THEN
      CONTINUE;
    END IF;
    v_clean := array_append(v_clean, v_date);
  END LOOP;

  IF cardinality(v_clean) = 0 THEN
    RAISE EXCEPTION 'No eligible dates selected';
  END IF;

  SELECT mm.manager_id INTO v_manager
  FROM public.mr_manager_map mm
  WHERE mm.mr_id = v_me
  ORDER BY mm.assigned_at ASC
  LIMIT 1;

  IF v_manager IS NULL THEN
    RAISE EXCEPTION 'No manager assigned';
  END IF;

  INSERT INTO public.dcr_late_fill_requests (mr_id, manager_id, requested_dates)
  VALUES (v_me, v_manager, v_clean)
  RETURNING id INTO v_request_id;

  RETURN v_request_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.request_late_dcr_fill(date[]) TO authenticated;
