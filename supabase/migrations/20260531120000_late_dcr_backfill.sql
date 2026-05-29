-- Late / backfill DCR: manager grants or MR requests; max 15 active slots per MR at a time.

ALTER TABLE public.daily_reports
  ADD COLUMN IF NOT EXISTS is_late_submission boolean NOT NULL DEFAULT false;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.dcr_late_fill_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mr_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  manager_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  requested_dates date[] NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  manager_comment text,
  reviewed_by uuid REFERENCES public.users(id),
  reviewed_at timestamptz,
  approved_dates date[],
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT dcr_late_fill_requests_dates_nonempty CHECK (cardinality(requested_dates) > 0)
);

CREATE TABLE IF NOT EXISTS public.dcr_late_fill_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mr_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  report_date date NOT NULL,
  granted_by uuid NOT NULL REFERENCES public.users(id),
  source text NOT NULL CHECK (source IN ('manager_grant', 'request_approved')),
  request_id uuid REFERENCES public.dcr_late_fill_requests(id) ON DELETE SET NULL,
  consumed_at timestamptz,
  consumed_report_id uuid REFERENCES public.daily_reports(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_dcr_late_fill_slots_active
  ON public.dcr_late_fill_slots (mr_id, report_date)
  WHERE consumed_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_dcr_late_fill_slots_mr
  ON public.dcr_late_fill_slots (mr_id, report_date);

CREATE INDEX IF NOT EXISTS idx_dcr_late_fill_requests_manager_pending
  ON public.dcr_late_fill_requests (manager_id, status)
  WHERE status = 'pending';

ALTER TABLE public.dcr_late_fill_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dcr_late_fill_slots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS dcr_late_fill_requests_mr_select ON public.dcr_late_fill_requests;
CREATE POLICY dcr_late_fill_requests_mr_select ON public.dcr_late_fill_requests
  FOR SELECT TO authenticated
  USING (mr_id = (SELECT current_app_user_id()));

DROP POLICY IF EXISTS dcr_late_fill_requests_manager_select ON public.dcr_late_fill_requests;
CREATE POLICY dcr_late_fill_requests_manager_select ON public.dcr_late_fill_requests
  FOR SELECT TO authenticated
  USING (
    manager_id = (SELECT current_app_user_id())
    OR mr_id IN (
      SELECT mm.mr_id FROM public.mr_manager_map mm
      WHERE mm.manager_id = (SELECT current_app_user_id())
    )
  );

DROP POLICY IF EXISTS dcr_late_fill_slots_mr_select ON public.dcr_late_fill_slots;
CREATE POLICY dcr_late_fill_slots_mr_select ON public.dcr_late_fill_slots
  FOR SELECT TO authenticated
  USING (mr_id = (SELECT current_app_user_id()));

DROP POLICY IF EXISTS dcr_late_fill_slots_manager_select ON public.dcr_late_fill_slots;
CREATE POLICY dcr_late_fill_slots_manager_select ON public.dcr_late_fill_slots
  FOR SELECT TO authenticated
  USING (
    mr_id = (SELECT current_app_user_id())
    OR mr_id IN (
      SELECT mm.mr_id FROM public.mr_manager_map mm
      WHERE mm.manager_id = (SELECT current_app_user_id())
    )
  );

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.dcr_day_type_for_mr(p_mr_id uuid, p_date date)
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
SELECT CASE
  WHEN EXTRACT(DOW FROM p_date) = 0 THEN 'sunday'
  WHEN EXISTS (
    SELECT 1 FROM public.mr_holidays mh
    JOIN public.holidays h ON h.id = mh.holiday_id
    WHERE mh.mr_id = p_mr_id AND h.holiday_date = p_date AND mh.counts_as_leave = FALSE
  ) THEN 'holiday'
  WHEN EXISTS (
    SELECT 1 FROM public.leave_requests
    WHERE mr_id = p_mr_id AND leave_date = p_date AND status = 'approved' AND leave_type = 'full'
  ) THEN 'leave'
  WHEN EXISTS (
    SELECT 1 FROM public.strike_reports
    WHERE mr_id = p_mr_id AND strike_date = p_date
  ) THEN 'strike'
  ELSE 'working'
END;
$$;

CREATE OR REPLACE FUNCTION public.count_active_late_fill_slots(p_mr_id uuid)
RETURNS integer
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COUNT(*)::integer
  FROM public.dcr_late_fill_slots
  WHERE mr_id = p_mr_id AND consumed_at IS NULL;
$$;

CREATE OR REPLACE FUNCTION public.is_report_date_fillable(p_mr_id uuid, p_date date)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    p_date BETWEEN today_ist() - 2 AND today_ist()
    OR EXISTS (
      SELECT 1 FROM public.dcr_late_fill_slots s
      WHERE s.mr_id = p_mr_id
        AND s.report_date = p_date
        AND s.consumed_at IS NULL
    );
$$;

-- ---------------------------------------------------------------------------
-- get_allowed_report_dates: default 3-day window + approved late slots
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.get_allowed_report_dates(uuid);

CREATE OR REPLACE FUNCTION public.get_allowed_report_dates(p_mr_id uuid)
RETURNS TABLE(
  report_date date,
  already_submitted boolean,
  day_type text,
  is_late_slot boolean
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
WITH window_dates AS (
  SELECT d::date AS report_date
  FROM generate_series(
    today_ist() - INTERVAL '2 days',
    today_ist(),
    INTERVAL '1 day'
  ) AS d
),
late_dates AS (
  SELECT s.report_date
  FROM public.dcr_late_fill_slots s
  WHERE s.mr_id = p_mr_id
    AND s.consumed_at IS NULL
    AND s.report_date < today_ist() - 2
),
all_dates AS (
  SELECT report_date FROM window_dates
  UNION
  SELECT report_date FROM late_dates
)
SELECT
  ad.report_date,
  EXISTS (
    SELECT 1 FROM public.daily_reports dr
    WHERE dr.mr_id = p_mr_id
      AND dr.report_date = ad.report_date
      AND dr.status = 'submitted'
  ) AS already_submitted,
  public.dcr_day_type_for_mr(p_mr_id, ad.report_date) AS day_type,
  (
    ad.report_date < today_ist() - 2
    AND EXISTS (
      SELECT 1 FROM public.dcr_late_fill_slots s
      WHERE s.mr_id = p_mr_id
        AND s.report_date = ad.report_date
        AND s.consumed_at IS NULL
    )
  ) AS is_late_slot
FROM all_dates ad
ORDER BY ad.report_date DESC;
$$;

-- ---------------------------------------------------------------------------
-- submit_daily_report: mark late + consume slot atomically
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.submit_daily_report(p_report_id uuid)
RETURNS public.daily_reports
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_me uuid;
  v_row public.daily_reports%ROWTYPE;
  v_slot_id uuid;
BEGIN
  SELECT u.id INTO v_me
  FROM public.users u
  WHERE u.auth_user_id = auth.uid() AND u.is_active = true
  LIMIT 1;

  IF v_me IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_row
  FROM public.daily_reports
  WHERE id = p_report_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Report not found';
  END IF;

  IF v_row.mr_id <> v_me AND NOT EXISTS (
    SELECT 1 FROM public.mr_manager_map mm
    WHERE mm.manager_id = v_me AND mm.mr_id = v_row.mr_id
  ) AND (SELECT current_user_role()) <> 'admin' THEN
    RAISE EXCEPTION 'Not allowed to submit this report';
  END IF;

  IF v_row.status = 'submitted' THEN
    RAISE EXCEPTION 'Report already submitted';
  END IF;

  IF NOT public.is_report_date_fillable(v_row.mr_id, v_row.report_date) THEN
    RAISE EXCEPTION 'This date is not open for DCR submission';
  END IF;

  SELECT s.id INTO v_slot_id
  FROM public.dcr_late_fill_slots s
  WHERE s.mr_id = v_row.mr_id
    AND s.report_date = v_row.report_date
    AND s.consumed_at IS NULL
  LIMIT 1;

  UPDATE public.daily_reports
  SET
    status = 'submitted',
    submitted_at = now(),
    is_late_submission = (v_slot_id IS NOT NULL)
  WHERE id = p_report_id
  RETURNING * INTO v_row;

  IF v_slot_id IS NOT NULL THEN
    UPDATE public.dcr_late_fill_slots
    SET consumed_at = now(), consumed_report_id = p_report_id
    WHERE id = v_slot_id;
  END IF;

  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_daily_report(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- Manager grant late fill (max 15 per batch; none active before new batch)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.grant_late_dcr_fill(
  p_mr_id uuid,
  p_from_date date,
  p_to_date date
)
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
BEGIN
  IF p_from_date > p_to_date THEN
    RAISE EXCEPTION 'From date must be on or before to date';
  END IF;

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

  v_active := public.count_active_late_fill_slots(p_mr_id);
  IF v_active > 0 THEN
    RAISE EXCEPTION 'MR still has % pending late DCR(s). Complete them before granting more.', v_active;
  END IF;

  FOR v_date IN
    SELECT gs::date
    FROM generate_series(p_from_date, p_to_date, INTERVAL '1 day') AS gs
    ORDER BY gs
  LOOP
    EXIT WHEN v_count >= 15;

    IF v_date > v_cutoff THEN
      CONTINUE;
    END IF;

    IF EXISTS (
      SELECT 1 FROM public.daily_reports dr
      WHERE dr.mr_id = p_mr_id AND dr.report_date = v_date AND dr.status = 'submitted'
    ) THEN
      CONTINUE;
    END IF;

    IF public.dcr_day_type_for_mr(p_mr_id, v_date) NOT IN ('working', 'sunday', 'leave') THEN
      CONTINUE;
    END IF;

    BEGIN
      INSERT INTO public.dcr_late_fill_slots (mr_id, report_date, granted_by, source)
      VALUES (p_mr_id, v_date, v_me, 'manager_grant');
      v_granted := array_append(v_granted, v_date);
      v_count := v_count + 1;
    EXCEPTION WHEN unique_violation THEN
      NULL;
    END;
  END LOOP;

  IF v_count = 0 THEN
    RAISE EXCEPTION 'No eligible dates in range (past default window, not submitted, max 15)';
  END IF;

  RETURN jsonb_build_object('granted_count', v_count, 'granted_dates', v_granted);
END;
$$;

GRANT EXECUTE ON FUNCTION public.grant_late_dcr_fill(uuid, date, date) TO authenticated;

-- ---------------------------------------------------------------------------
-- MR request late fill dates
-- ---------------------------------------------------------------------------
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
BEGIN
  SELECT u.id, u.role::text INTO v_me, v_role
  FROM public.users u
  WHERE u.auth_user_id = auth.uid() AND u.is_active = true
  LIMIT 1;

  IF v_me IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF v_role NOT IN ('mr', 'manager') THEN
    RAISE EXCEPTION 'Only MR or manager accounts can request late DCR';
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

  FOREACH v_date IN ARRAY p_dates LOOP
    IF v_date > v_cutoff THEN
      RAISE EXCEPTION 'Date % is still in the normal filing window', v_date;
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

  IF v_manager IS NULL AND v_role = 'manager' THEN
    v_manager := v_me;
  END IF;

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

-- ---------------------------------------------------------------------------
-- Manager resolve late fill request
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.resolve_late_dcr_fill_request(
  p_request_id uuid,
  p_action text,
  p_manager_comment text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_me uuid;
  v_req public.dcr_late_fill_requests%ROWTYPE;
  v_date date;
  v_count int := 0;
BEGIN
  IF p_action NOT IN ('approved', 'rejected') THEN
    RAISE EXCEPTION 'Invalid action';
  END IF;

  SELECT u.id INTO v_me
  FROM public.users u
  WHERE u.auth_user_id = auth.uid() AND u.is_active = true
  LIMIT 1;

  IF v_me IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_req
  FROM public.dcr_late_fill_requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found';
  END IF;

  IF v_req.manager_id <> v_me THEN
    RAISE EXCEPTION 'Not your request to resolve';
  END IF;

  IF v_req.status <> 'pending' THEN
    RAISE EXCEPTION 'Request already resolved';
  END IF;

  IF p_action = 'rejected' THEN
    UPDATE public.dcr_late_fill_requests
    SET
      status = 'rejected',
      manager_comment = NULLIF(trim(p_manager_comment), ''),
      reviewed_by = v_me,
      reviewed_at = now()
  WHERE id = p_request_id;
    RETURN;
  END IF;

  IF public.count_active_late_fill_slots(v_req.mr_id) > 0 THEN
    RAISE EXCEPTION 'MR still has active late DCR slots';
  END IF;

  FOREACH v_date IN ARRAY v_req.requested_dates LOOP
    EXIT WHEN v_count >= 15;
    IF EXISTS (
      SELECT 1 FROM public.daily_reports dr
      WHERE dr.mr_id = v_req.mr_id AND dr.report_date = v_date AND dr.status = 'submitted'
    ) THEN
      CONTINUE;
    END IF;
    BEGIN
      INSERT INTO public.dcr_late_fill_slots (mr_id, report_date, granted_by, source, request_id)
      VALUES (v_req.mr_id, v_date, v_me, 'request_approved', p_request_id);
      v_count := v_count + 1;
    EXCEPTION WHEN unique_violation THEN
      NULL;
    END;
  END LOOP;

  IF v_count = 0 THEN
    RAISE EXCEPTION 'No dates could be approved';
  END IF;

  UPDATE public.dcr_late_fill_requests
  SET
    status = 'approved',
    manager_comment = NULLIF(trim(p_manager_comment), ''),
    reviewed_by = v_me,
    reviewed_at = now(),
    approved_dates = (
      SELECT array_agg(s.report_date ORDER BY s.report_date)
      FROM public.dcr_late_fill_slots s
      WHERE s.request_id = p_request_id
    )
  WHERE id = p_request_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.resolve_late_dcr_fill_request(uuid, text, text) TO authenticated;

-- ---------------------------------------------------------------------------
-- List pending late fill requests for manager
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.list_late_dcr_fill_requests_for_manager()
RETURNS TABLE(
  id uuid,
  mr_id uuid,
  mr_full_name text,
  manager_id uuid,
  requested_dates date[],
  status text,
  manager_comment text,
  reviewed_at timestamptz,
  created_at timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    r.id,
    r.mr_id,
    u.full_name AS mr_full_name,
    r.manager_id,
    r.requested_dates,
    r.status,
    r.manager_comment,
    r.reviewed_at,
    r.created_at
  FROM public.dcr_late_fill_requests r
  JOIN public.users u ON u.id = r.mr_id
  WHERE r.manager_id = (SELECT current_app_user_id())
  ORDER BY
    CASE WHEN r.status = 'pending' THEN 0 ELSE 1 END,
    r.created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.list_late_dcr_fill_requests_for_manager() TO authenticated;
