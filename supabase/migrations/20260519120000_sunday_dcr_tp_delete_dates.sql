-- Sunday DCR (mark_sunday_dcr), TP deletion (MR requests + manager direct),
-- include Sundays in get_allowed_report_dates (IST).

-- ---------------------------------------------------------------------------
-- 1) daily_reports.report_kind: allow 'sunday'
-- ---------------------------------------------------------------------------
ALTER TABLE public.daily_reports
  DROP CONSTRAINT IF EXISTS daily_reports_report_kind_check;

ALTER TABLE public.daily_reports
  ADD CONSTRAINT daily_reports_report_kind_check
  CHECK (report_kind IN ('field', 'leave', 'sunday'));

-- ---------------------------------------------------------------------------
-- 2) get_allowed_report_dates: last 3 calendar days in IST, including Sundays
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_allowed_report_dates(p_mr_id uuid)
RETURNS TABLE(report_date date, already_submitted boolean, day_type text)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
SELECT
  d::DATE AS report_date,
  EXISTS (
    SELECT 1 FROM public.daily_reports dr
    WHERE dr.mr_id = p_mr_id
      AND dr.report_date = d::DATE
      AND dr.status = 'submitted'
  ) AS already_submitted,
  CASE
    WHEN EXTRACT(DOW FROM d::DATE) = 0 THEN 'sunday'
    WHEN EXISTS (
      SELECT 1 FROM public.mr_holidays mh
      JOIN public.holidays h ON h.id = mh.holiday_id
      WHERE mh.mr_id = p_mr_id
        AND h.holiday_date = d::DATE
        AND mh.counts_as_leave = FALSE
    ) THEN 'holiday'
    WHEN EXISTS (
      SELECT 1 FROM public.leave_requests
      WHERE mr_id = p_mr_id
        AND leave_date = d::DATE
        AND status = 'approved'
        AND leave_type = 'full'
    ) THEN 'leave'
    WHEN EXISTS (
      SELECT 1 FROM public.strike_reports
      WHERE mr_id = p_mr_id
        AND strike_date = d::DATE
    ) THEN 'strike'
    ELSE 'working'
  END AS day_type
FROM generate_series(
  today_ist() - INTERVAL '2 days',
  today_ist(),
  INTERVAL '1 day'
) AS d
ORDER BY d DESC;
$$;

-- ---------------------------------------------------------------------------
-- 3) mark_sunday_dcr: one-tap submitted Sunday DCR (MR or manager self)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.mark_sunday_dcr(p_report_date date DEFAULT NULL)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_me uuid;
  v_role text;
  v_date date := COALESCE(p_report_date, today_ist());
  v_new_id uuid;
BEGIN
  IF EXTRACT(DOW FROM v_date) <> 0 THEN
    RAISE EXCEPTION 'Sunday DCR is only for Sundays (IST calendar date).';
  END IF;

  SELECT u.id, u.role::text INTO v_me, v_role
  FROM public.users u
  WHERE u.auth_user_id = auth.uid() AND u.is_active = true
  LIMIT 1;

  IF v_me IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF v_role NOT IN ('mr', 'manager') THEN
    RAISE EXCEPTION 'Only MR or manager accounts can submit Sunday DCR';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.daily_reports dr
    WHERE dr.mr_id = v_me AND dr.report_date = v_date AND dr.status = 'submitted'
  ) THEN
    RAISE EXCEPTION 'A DCR is already submitted for this date.';
  END IF;

  DELETE FROM public.daily_reports dr
  WHERE dr.mr_id = v_me AND dr.report_date = v_date AND dr.status = 'draft';

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
    v_me,
    NULL,
    '{}'::uuid[],
    v_date,
    'submitted',
    'sunday',
    now()
  )
  RETURNING id INTO v_new_id;

  RETURN v_new_id;
END;
$$;

REVOKE ALL ON FUNCTION public.mark_sunday_dcr(date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mark_sunday_dcr(date) TO authenticated;

-- ---------------------------------------------------------------------------
-- 4) Tour program deletion requests (FK: TP delete nulls id on request row)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tour_program_deletion_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_program_id uuid REFERENCES public.tour_programs(id) ON DELETE SET NULL,
  mr_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  manager_note text,
  resolved_by uuid REFERENCES public.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_tp_deletion_one_pending
  ON public.tour_program_deletion_requests (tour_program_id)
  WHERE status = 'pending' AND tour_program_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tp_deletion_mr ON public.tour_program_deletion_requests(mr_id);
CREATE INDEX IF NOT EXISTS idx_tp_deletion_status ON public.tour_program_deletion_requests(status);

ALTER TABLE public.tour_program_deletion_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tp_del_req_select ON public.tour_program_deletion_requests;
CREATE POLICY tp_del_req_select ON public.tour_program_deletion_requests
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users me
    WHERE me.auth_user_id = auth.uid() AND me.is_active = true
    AND (
      me.id = tour_program_deletion_requests.mr_id
      OR me.role::text = 'admin'
      OR (
        me.role::text = 'manager'
        AND EXISTS (
          SELECT 1 FROM public.mr_manager_map mm
          WHERE mm.manager_id = me.id AND mm.mr_id = tour_program_deletion_requests.mr_id
        )
      )
    )
  )
);

DROP POLICY IF EXISTS tp_del_req_insert_mr ON public.tour_program_deletion_requests;
CREATE POLICY tp_del_req_insert_mr ON public.tour_program_deletion_requests
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users me
    WHERE me.auth_user_id = auth.uid() AND me.is_active = true
    AND me.role::text = 'mr'
    AND me.id = tour_program_deletion_requests.mr_id
  )
);

DROP POLICY IF EXISTS tp_del_req_update_manager ON public.tour_program_deletion_requests;
CREATE POLICY tp_del_req_update_manager ON public.tour_program_deletion_requests
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users me
    WHERE me.auth_user_id = auth.uid() AND me.is_active = true
    AND (
      me.role::text = 'admin'
      OR (
        me.role::text = 'manager'
        AND EXISTS (
          SELECT 1 FROM public.mr_manager_map mm
          WHERE mm.manager_id = me.id AND mm.mr_id = tour_program_deletion_requests.mr_id
        )
      )
    )
  )
);

GRANT SELECT, INSERT, UPDATE ON public.tour_program_deletion_requests TO authenticated;

CREATE OR REPLACE FUNCTION public._delete_tour_program_by_id(p_tour_program_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.tour_program_entries WHERE tour_program_id = p_tour_program_id;
  DELETE FROM public.tour_programs WHERE id = p_tour_program_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_tour_program_as_manager(p_tour_program_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_me uuid;
  v_role text;
  v_tp_mr uuid;
BEGIN
  SELECT u.id, u.role::text INTO v_me, v_role
  FROM public.users u
  WHERE u.auth_user_id = auth.uid() AND u.is_active = true
  LIMIT 1;

  IF v_me IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  IF v_role NOT IN ('manager', 'admin') THEN
    RAISE EXCEPTION 'Only managers or admins can delete a tour program directly';
  END IF;

  SELECT tp.mr_id INTO v_tp_mr
  FROM public.tour_programs tp
  WHERE tp.id = p_tour_program_id
  LIMIT 1;

  IF v_tp_mr IS NULL THEN RAISE EXCEPTION 'Tour program not found'; END IF;

  IF v_role <> 'admin' THEN
    IF NOT (
      v_tp_mr = v_me
      OR EXISTS (
        SELECT 1 FROM public.mr_manager_map mm
        WHERE mm.manager_id = v_me AND mm.mr_id = v_tp_mr
      )
    ) THEN
      RAISE EXCEPTION 'Not allowed to delete this tour program';
    END IF;
  END IF;

  PERFORM public._delete_tour_program_by_id(p_tour_program_id);
END;
$$;

REVOKE ALL ON FUNCTION public._delete_tour_program_by_id(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.delete_tour_program_as_manager(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_tour_program_as_manager(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.request_tour_program_deletion(p_tour_program_id uuid)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_me uuid;
  v_role text;
  v_tp_mr uuid;
  v_id uuid;
BEGIN
  SELECT u.id, u.role::text INTO v_me, v_role
  FROM public.users u
  WHERE u.auth_user_id = auth.uid() AND u.is_active = true
  LIMIT 1;

  IF v_me IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF v_role <> 'mr' THEN RAISE EXCEPTION 'Only MR accounts request tour program deletion'; END IF;

  SELECT tp.mr_id INTO v_tp_mr FROM public.tour_programs tp WHERE tp.id = p_tour_program_id LIMIT 1;
  IF v_tp_mr IS NULL THEN RAISE EXCEPTION 'Tour program not found'; END IF;
  IF v_tp_mr <> v_me THEN RAISE EXCEPTION 'Not your tour program'; END IF;

  IF EXISTS (
    SELECT 1 FROM public.tour_program_deletion_requests r
    WHERE r.tour_program_id = p_tour_program_id AND r.status = 'pending'
  ) THEN
    RAISE EXCEPTION 'A deletion request is already pending for this tour program';
  END IF;

  INSERT INTO public.tour_program_deletion_requests (tour_program_id, mr_id, status)
  VALUES (p_tour_program_id, v_me, 'pending')
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.request_tour_program_deletion(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.request_tour_program_deletion(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.resolve_tour_program_deletion_request(
  p_request_id uuid,
  p_approve boolean,
  p_manager_note text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_me uuid;
  v_role text;
  r record;
BEGIN
  SELECT u.id, u.role::text INTO v_me, v_role
  FROM public.users u
  WHERE u.auth_user_id = auth.uid() AND u.is_active = true
  LIMIT 1;

  IF v_me IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF v_role NOT IN ('manager', 'admin') THEN RAISE EXCEPTION 'Only managers or admins can resolve'; END IF;

  SELECT * INTO r FROM public.tour_program_deletion_requests WHERE id = p_request_id FOR UPDATE;
  IF r IS NULL THEN RAISE EXCEPTION 'Request not found'; END IF;
  IF r.status <> 'pending' THEN RAISE EXCEPTION 'Request is not pending'; END IF;

  IF v_role <> 'admin' THEN
    IF r.mr_id <> v_me AND NOT EXISTS (
      SELECT 1 FROM public.mr_manager_map mm
      WHERE mm.manager_id = v_me AND mm.mr_id = r.mr_id
    ) THEN
      RAISE EXCEPTION 'Not allowed to resolve this request';
    END IF;
  END IF;

  IF p_approve AND r.tour_program_id IS NOT NULL THEN
    PERFORM public._delete_tour_program_by_id(r.tour_program_id);
  END IF;

  IF p_approve THEN
    UPDATE public.tour_program_deletion_requests
    SET status = 'approved', manager_note = p_manager_note, resolved_by = v_me, resolved_at = now()
    WHERE id = p_request_id;
  ELSE
    UPDATE public.tour_program_deletion_requests
    SET status = 'rejected', manager_note = p_manager_note, resolved_by = v_me, resolved_at = now()
    WHERE id = p_request_id;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.resolve_tour_program_deletion_request(uuid, boolean, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.resolve_tour_program_deletion_request(uuid, boolean, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.list_tour_program_deletion_requests_for_manager()
RETURNS SETOF public.tour_program_deletion_requests
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT r.*
  FROM public.tour_program_deletion_requests r
  INNER JOIN public.users me ON me.auth_user_id = auth.uid() AND me.is_active = true
  WHERE r.status = 'pending'
    AND me.role::text = 'manager'
    AND (
      r.mr_id = me.id
      OR EXISTS (
        SELECT 1 FROM public.mr_manager_map mm
        WHERE mm.manager_id = me.id AND mm.mr_id = r.mr_id
      )
    )
  ORDER BY r.created_at ASC;
$$;

REVOKE ALL ON FUNCTION public.list_tour_program_deletion_requests_for_manager() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_tour_program_deletion_requests_for_manager() TO authenticated;
