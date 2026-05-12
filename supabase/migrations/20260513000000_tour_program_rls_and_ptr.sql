-- ============================================================
-- 0. Prerequisite helper functions (idempotent CREATE OR REPLACE)
-- ============================================================

CREATE OR REPLACE FUNCTION public.session_profile_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT u.id
  FROM public.users u
  WHERE u.auth_user_id = auth.uid()
    AND u.is_active = true
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.session_profile_id() TO authenticated;

CREATE OR REPLACE FUNCTION public.session_can_access_mr_row(p_mr_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users me
    WHERE me.auth_user_id = auth.uid()
      AND me.is_active = true
      AND (
        me.role::text = 'admin'
        OR me.id = p_mr_id
        OR (
          me.role::text = 'manager'
          AND EXISTS (
            SELECT 1
            FROM public.mr_manager_map mm
            WHERE mm.manager_id = me.id
              AND mm.mr_id = p_mr_id
          )
        )
      )
  );
$$;

GRANT EXECUTE ON FUNCTION public.session_can_access_mr_row(uuid) TO authenticated;

-- ============================================================
-- 1. RLS policies for tour_programs and tour_program_entries
-- ============================================================

ALTER TABLE public.tour_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tour_program_entries ENABLE ROW LEVEL SECURITY;

-- tour_programs: MR can read/write own, manager can read own + team MRs', admin all
DROP POLICY IF EXISTS tp_select ON public.tour_programs;
CREATE POLICY tp_select ON public.tour_programs FOR SELECT TO authenticated
USING (public.session_can_access_mr_row(tour_programs.mr_id));

DROP POLICY IF EXISTS tp_insert ON public.tour_programs;
CREATE POLICY tp_insert ON public.tour_programs FOR INSERT TO authenticated
WITH CHECK (
  tour_programs.mr_id = public.session_profile_id()
  OR (auth.jwt() -> 'app_metadata' ->> 'role') IN ('manager', 'admin')
);

DROP POLICY IF EXISTS tp_update ON public.tour_programs;
CREATE POLICY tp_update ON public.tour_programs FOR UPDATE TO authenticated
USING (public.session_can_access_mr_row(tour_programs.mr_id))
WITH CHECK (public.session_can_access_mr_row(tour_programs.mr_id));

DROP POLICY IF EXISTS tp_delete ON public.tour_programs;
CREATE POLICY tp_delete ON public.tour_programs FOR DELETE TO authenticated
USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tour_programs TO authenticated;

-- tour_program_entries: same visibility as parent tour_program
DROP POLICY IF EXISTS tpe_select ON public.tour_program_entries;
CREATE POLICY tpe_select ON public.tour_program_entries FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.tour_programs tp
    WHERE tp.id = tour_program_entries.tour_program_id
      AND public.session_can_access_mr_row(tp.mr_id)
  )
);

DROP POLICY IF EXISTS tpe_insert ON public.tour_program_entries;
CREATE POLICY tpe_insert ON public.tour_program_entries FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.tour_programs tp
    WHERE tp.id = tour_program_entries.tour_program_id
      AND (
        tp.mr_id = public.session_profile_id()
        OR (auth.jwt() -> 'app_metadata' ->> 'role') IN ('manager', 'admin')
      )
  )
);

DROP POLICY IF EXISTS tpe_update ON public.tour_program_entries;
CREATE POLICY tpe_update ON public.tour_program_entries FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.tour_programs tp
    WHERE tp.id = tour_program_entries.tour_program_id
      AND public.session_can_access_mr_row(tp.mr_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.tour_programs tp
    WHERE tp.id = tour_program_entries.tour_program_id
      AND public.session_can_access_mr_row(tp.mr_id)
  )
);

DROP POLICY IF EXISTS tpe_delete ON public.tour_program_entries;
CREATE POLICY tpe_delete ON public.tour_program_entries FOR DELETE TO authenticated
USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tour_program_entries TO authenticated;

-- ============================================================
-- 2. Ensure mr_holidays RLS + grants are in place
-- ============================================================
ALTER TABLE public.mr_holidays ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS mr_holidays_select_session_mr ON public.mr_holidays;
CREATE POLICY mr_holidays_select_session_mr ON public.mr_holidays
FOR SELECT TO authenticated
USING (public.session_can_access_mr_row(mr_holidays.mr_id));

GRANT SELECT ON public.mr_holidays TO authenticated;

-- holidays base table (readable by all authenticated)
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS holidays_select_all ON public.holidays;
CREATE POLICY holidays_select_all ON public.holidays
FOR SELECT TO authenticated USING (true);

GRANT SELECT ON public.holidays TO authenticated;

-- ============================================================
-- 3. Ensure strike_reports RLS + grants
-- ============================================================
ALTER TABLE public.strike_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS strike_reports_select_scope ON public.strike_reports;
CREATE POLICY strike_reports_select_scope ON public.strike_reports
FOR SELECT TO authenticated
USING (public.session_can_access_mr_row(strike_reports.mr_id));

DROP POLICY IF EXISTS strike_reports_insert_self ON public.strike_reports;
CREATE POLICY strike_reports_insert_self ON public.strike_reports
FOR INSERT TO authenticated
WITH CHECK (strike_reports.mr_id = public.session_profile_id());

GRANT SELECT, INSERT ON public.strike_reports TO authenticated;

-- ============================================================
-- 4. Add PTR (price-to-retailer) column to products table
-- ============================================================
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS ptr numeric DEFAULT 0;

-- ============================================================
-- 5. RPC: is_tp_submission_late (if not exists)
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_tp_submission_late(p_month text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CURRENT_DATE > (p_month::date + interval '5 days')::date;
$$;

GRANT EXECUTE ON FUNCTION public.is_tp_submission_late(text) TO authenticated;

-- ============================================================
-- 6. RPC: get_month_working_days (if not exists)
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_month_working_days(p_mr_id uuid, p_month text)
RETURNS TABLE (
  work_date date,
  day_type text,
  holiday_name text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH month_days AS (
    SELECT generate_series(
      p_month::date,
      (p_month::date + interval '1 month' - interval '1 day')::date,
      '1 day'::interval
    )::date AS d
  ),
  hols AS (
    SELECT h.holiday_date, h.name
    FROM public.mr_holidays mh
    JOIN public.holidays h ON h.id = mh.holiday_id
    WHERE mh.mr_id = p_mr_id
      AND h.holiday_date >= p_month::date
      AND h.holiday_date < (p_month::date + interval '1 month')::date
  )
  SELECT
    md.d AS work_date,
    CASE
      WHEN EXTRACT(DOW FROM md.d) = 0 THEN 'sunday'
      WHEN hols.holiday_date IS NOT NULL THEN 'holiday'
      ELSE 'working'
    END AS day_type,
    hols.name AS holiday_name
  FROM month_days md
  LEFT JOIN hols ON hols.holiday_date = md.d
  ORDER BY md.d;
$$;

GRANT EXECUTE ON FUNCTION public.get_month_working_days(uuid, text) TO authenticated;
