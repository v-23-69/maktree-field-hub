-- Leave categories (MR), Leave DCR on daily_reports, manager self-leave,
-- monthly_visit_target on doctors, block/pause logic counts submitted leave DCR,
-- leave approval audit column.

-- ---------------------------------------------------------------------------
-- Schema changes
-- ---------------------------------------------------------------------------

ALTER TABLE public.leave_requests
  ADD COLUMN IF NOT EXISTS leave_category text NOT NULL DEFAULT 'casual'
    CHECK (leave_category IN ('casual', 'sick'));

ALTER TABLE public.leave_requests
  ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES public.users(id);

ALTER TABLE public.daily_reports
  ADD COLUMN IF NOT EXISTS report_kind text NOT NULL DEFAULT 'field'
    CHECK (report_kind IN ('field', 'leave'));

ALTER TABLE public.daily_reports
  ADD COLUMN IF NOT EXISTS leave_dcr_category text NULL,
  ADD COLUMN IF NOT EXISTS leave_dcr_remark text NULL;

ALTER TABLE public.doctors
  ADD COLUMN IF NOT EXISTS monthly_visit_target integer NOT NULL DEFAULT 4
    CHECK (monthly_visit_target >= 1 AND monthly_visit_target <= 99);

COMMENT ON COLUMN public.doctors.monthly_visit_target IS 'Target field visits per calendar month for this doctor (MR).';

CREATE TABLE IF NOT EXISTS public.manager_leave_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  manager_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  leave_date date NOT NULL,
  leave_category text NOT NULL DEFAULT 'casual' CHECK (leave_category IN ('casual', 'sick')),
  remark text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (manager_id, leave_date)
);

CREATE INDEX IF NOT EXISTS idx_manager_leave_entries_date ON public.manager_leave_entries(leave_date);

ALTER TABLE public.manager_leave_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS manager_leave_select_own ON public.manager_leave_entries;
CREATE POLICY manager_leave_select_own ON public.manager_leave_entries
  FOR SELECT TO authenticated
  USING (
    manager_id = (SELECT u.id FROM public.users u WHERE u.auth_user_id = auth.uid() AND u.is_active = true LIMIT 1)
  );

DROP POLICY IF EXISTS manager_leave_insert_own ON public.manager_leave_entries;
CREATE POLICY manager_leave_insert_own ON public.manager_leave_entries
  FOR INSERT TO authenticated
  WITH CHECK (
    manager_id = (SELECT u.id FROM public.users u WHERE u.auth_user_id = auth.uid() AND u.is_active = true LIMIT 1)
    AND EXISTS (SELECT 1 FROM public.users u WHERE u.id = manager_id AND u.role = 'manager')
  );

DROP POLICY IF EXISTS manager_leave_update_own ON public.manager_leave_entries;
CREATE POLICY manager_leave_update_own ON public.manager_leave_entries
  FOR UPDATE TO authenticated
  USING (
    manager_id = (SELECT u.id FROM public.users u WHERE u.auth_user_id = auth.uid() AND u.is_active = true LIMIT 1)
  )
  WITH CHECK (
    manager_id = (SELECT u.id FROM public.users u WHERE u.auth_user_id = auth.uid() AND u.is_active = true LIMIT 1)
  );

DROP POLICY IF EXISTS manager_leave_delete_own ON public.manager_leave_entries;
CREATE POLICY manager_leave_delete_own ON public.manager_leave_entries
  FOR DELETE TO authenticated
  USING (
    manager_id = (SELECT u.id FROM public.users u WHERE u.auth_user_id = auth.uid() AND u.is_active = true LIMIT 1)
  );

-- ---------------------------------------------------------------------------
-- Block / pause: approved full-day leave only excuses if Leave DCR submitted
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.check_report_block_status(p_mr_id uuid)
RETURNS TABLE(is_blocked boolean, missed_dates date[], has_pending_request boolean)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_missed      DATE[] := '{}';
  v_check_date  DATE;
  v_has_report  BOOLEAN;
  v_is_excused  BOOLEAN;
  v_has_pending BOOLEAN;
  v_is_blocked  BOOLEAN;
  v_today       DATE := today_ist();
BEGIN
  FOR i IN 1..3 LOOP
    v_check_date := v_today - i;
    SELECT EXISTS (
      SELECT 1 FROM public.daily_reports
      WHERE mr_id = p_mr_id AND report_date = v_check_date AND status = 'submitted'
    ) INTO v_has_report;
    IF NOT v_has_report THEN
      SELECT EXISTS (
        SELECT 1 FROM public.leave_requests lr
        WHERE lr.mr_id = p_mr_id AND lr.leave_date = v_check_date AND lr.status = 'approved' AND lr.leave_type = 'full'
          AND EXISTS (
            SELECT 1 FROM public.daily_reports dr
            WHERE dr.mr_id = p_mr_id AND dr.report_date = v_check_date AND dr.status = 'submitted' AND dr.report_kind = 'leave'
          )
        UNION ALL
        SELECT 1 FROM public.mr_holidays mh
        JOIN public.holidays h ON h.id = mh.holiday_id
        WHERE mh.mr_id = p_mr_id AND h.holiday_date = v_check_date AND mh.counts_as_leave = FALSE
        UNION ALL
        SELECT 1 FROM public.strike_reports WHERE mr_id = p_mr_id AND strike_date = v_check_date
        UNION ALL
        SELECT 1 WHERE EXTRACT(DOW FROM v_check_date) = 0
      ) INTO v_is_excused;
      IF NOT v_is_excused THEN
        v_missed := array_append(v_missed, v_check_date);
      END IF;
    END IF;
  END LOOP;
  v_is_blocked := array_length(v_missed, 1) = 3;
  SELECT EXISTS (
    SELECT 1 FROM public.report_unlock_requests WHERE mr_id = p_mr_id AND status = 'pending'
  ) INTO v_has_pending;
  IF EXISTS (
    SELECT 1 FROM public.report_unlock_requests
    WHERE mr_id = p_mr_id AND status = 'approved' AND requested_date >= v_today - 1
  ) THEN
    v_is_blocked := FALSE;
  END IF;
  RETURN QUERY SELECT v_is_blocked, v_missed, v_has_pending;
END;
$$;

CREATE OR REPLACE FUNCTION public.pause_accounts_missing_dcr()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_today date := today_ist();
  v_paused_count int := 0;
  v_user RECORD;
  v_missed int;
  v_check_date date;
  v_has_report boolean;
  v_is_excused boolean;
BEGIN
  FOR v_user IN
    SELECT u.id FROM users u
    WHERE u.role::text IN ('mr','manager')
      AND u.is_active = true AND u.is_paused = false
  LOOP
    v_missed := 0;
    FOR i IN 1..2 LOOP
      v_check_date := v_today - i;
      IF EXTRACT(DOW FROM v_check_date) = 0 THEN CONTINUE; END IF;

      SELECT EXISTS (
        SELECT 1 FROM daily_reports
        WHERE mr_id = v_user.id AND report_date = v_check_date AND status = 'submitted'
      ) INTO v_has_report;

      IF NOT v_has_report THEN
        SELECT EXISTS (
          SELECT 1 FROM leave_requests lr
          WHERE lr.mr_id = v_user.id AND lr.leave_date = v_check_date AND lr.status = 'approved' AND lr.leave_type = 'full'
            AND EXISTS (
              SELECT 1 FROM daily_reports dr
              WHERE dr.mr_id = v_user.id AND dr.report_date = v_check_date AND dr.status = 'submitted' AND dr.report_kind = 'leave'
            )
          UNION ALL
          SELECT 1 FROM mr_holidays mh JOIN holidays h ON h.id = mh.holiday_id
          WHERE mh.mr_id = v_user.id AND h.holiday_date = v_check_date AND mh.counts_as_leave = FALSE
          UNION ALL
          SELECT 1 FROM strike_reports WHERE mr_id = v_user.id AND strike_date = v_check_date
        ) INTO v_is_excused;
        IF NOT v_is_excused THEN
          v_missed := v_missed + 1;
        END IF;
      END IF;
    END LOOP;

    IF v_missed >= 2 THEN
      UPDATE users SET is_paused = true, paused_at = now(),
        pause_reason = 'DCR not submitted for 2 consecutive days'
      WHERE id = v_user.id;
      v_paused_count := v_paused_count + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object('paused_count', v_paused_count, 'checked_date', v_today);
END;
$$;

-- ---------------------------------------------------------------------------
-- MR-facing allowed dates: include day_type (leave = needs Leave DCR if not submitted)
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
WHERE EXTRACT(DOW FROM d::DATE) != 0
ORDER BY d DESC;
$$;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.manager_leave_entries TO authenticated;
