-- Spot working: daily field plans, Priority Calls, clinic locations, GPS trail,
-- and location-gated doctor visits.
-- Unlock radius: 800 metres. Daily plan: minimum 10 calls, maximum 16.
-- A daily plan opens at 6:00 PM the day before and closes at 11:00 AM IST.

CREATE TABLE IF NOT EXISTS public.doctor_locations (
  doctor_id uuid PRIMARY KEY REFERENCES public.doctors(id) ON DELETE CASCADE,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  accuracy_m double precision,
  captured_by uuid NOT NULL REFERENCES public.users(id),
  captured_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES public.users(id),
  updated_at timestamptz,
  CONSTRAINT doctor_locations_lat CHECK (latitude BETWEEN -90 AND 90),
  CONSTRAINT doctor_locations_lng CHECK (longitude BETWEEN -180 AND 180)
);

CREATE TABLE IF NOT EXISTS public.mr_plan_settings (
  mr_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  auto_approve boolean NOT NULL DEFAULT false,
  updated_by uuid REFERENCES public.users(id),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.field_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  plan_date date NOT NULL,
  kind text NOT NULL CHECK (kind IN ('daily', 'priority_call')),
  status text NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'missed')),
  working_with_ids uuid[] NOT NULL DEFAULT '{}',
  note text,
  replaces_doctor_id uuid REFERENCES public.doctors(id),
  submitted_at timestamptz,
  approved_at timestamptz,
  approved_by uuid REFERENCES public.users(id),
  approval_mode text CHECK (approval_mode IS NULL OR approval_mode IN ('manual', 'auto')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS field_plans_one_daily
  ON public.field_plans (user_id, plan_date)
  WHERE kind = 'daily';

CREATE INDEX IF NOT EXISTS idx_field_plans_user_date
  ON public.field_plans (user_id, plan_date);

CREATE INDEX IF NOT EXISTS idx_field_plans_date
  ON public.field_plans (plan_date, kind);

CREATE TABLE IF NOT EXISTS public.field_plan_calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES public.field_plans(id) ON DELETE CASCADE,
  doctor_id uuid NOT NULL REFERENCES public.doctors(id),
  sub_area_id uuid NOT NULL REFERENCES public.sub_areas(id),
  sort_order integer NOT NULL DEFAULT 0,
  outcome text NOT NULL DEFAULT 'planned' CHECK (outcome IN ('planned', 'visited', 'unavailable')),
  outcome_note text,
  outcome_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT field_plan_calls_unique UNIQUE (plan_id, doctor_id)
);

CREATE INDEX IF NOT EXISTS idx_field_plan_calls_plan
  ON public.field_plan_calls (plan_id);

CREATE TABLE IF NOT EXISTS public.field_activity_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  work_date date NOT NULL DEFAULT public.today_ist(),
  latitude double precision,
  longitude double precision,
  accuracy_m double precision,
  event_type text NOT NULL CHECK (event_type IN (
    'ping', 'dcr_submit', 'plan_submit', 'priority_call',
    'location_capture', 'doctor_unavailable', 'gps_off', 'dcr_open'
  )),
  doctor_id uuid REFERENCES public.doctors(id),
  report_id uuid REFERENCES public.daily_reports(id) ON DELETE SET NULL,
  plan_id uuid REFERENCES public.field_plans(id) ON DELETE SET NULL,
  flagged boolean NOT NULL DEFAULT false,
  flag_reason text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT field_activity_coords CHECK (
    (latitude IS NULL AND longitude IS NULL)
    OR (latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180)
  )
);

CREATE INDEX IF NOT EXISTS idx_field_activity_user_time
  ON public.field_activity_points (user_id, recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_field_activity_user_day
  ON public.field_activity_points (user_id, work_date, recorded_at);

ALTER TABLE public.daily_reports
  ADD COLUMN IF NOT EXISTS plan_missing boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS plan_remark text;

ALTER TABLE public.report_visits
  ADD COLUMN IF NOT EXISTS doctor_unavailable boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS unavailable_note text,
  ADD COLUMN IF NOT EXISTS spot_latitude double precision,
  ADD COLUMN IF NOT EXISTS spot_longitude double precision,
  ADD COLUMN IF NOT EXISTS spot_accuracy_m double precision,
  ADD COLUMN IF NOT EXISTS spot_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS plan_waived boolean NOT NULL DEFAULT false;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.haversine_m(
  lat1 double precision, lng1 double precision,
  lat2 double precision, lng2 double precision
)
RETURNS double precision
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT 6371000 * 2 * asin(LEAST(1::double precision, sqrt(
    power(sin(radians(lat2 - lat1) / 2), 2)
    + cos(radians(lat1)) * cos(radians(lat2)) * power(sin(radians(lng2 - lng1) / 2), 2)
  )));
$$;

CREATE OR REPLACE FUNCTION public._field_can_see_user(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p_user_id = public.current_app_user_id()
    OR public.current_user_role() = 'admin'
    OR (
      public.current_user_role() = 'manager'
      AND (
        EXISTS (
          SELECT 1 FROM public.mr_manager_map mm
          WHERE mm.manager_id = public.current_app_user_id()
            AND mm.mr_id = p_user_id
        )
        OR EXISTS (
          SELECT 1 FROM public.users u
          WHERE u.id = p_user_id AND u.role = 'manager'
        )
      )
    );
$$;

CREATE OR REPLACE FUNCTION public._user_is_field_off(p_user_id uuid, p_date date)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    EXTRACT(DOW FROM p_date) = 0
    OR EXISTS (
      SELECT 1 FROM public.leave_requests lr
      WHERE lr.mr_id = p_user_id
        AND lr.leave_date = p_date
        AND lr.status = 'approved'
        AND lr.leave_type = 'full'
    )
    OR EXISTS (
      SELECT 1 FROM public.mr_holidays mh
      JOIN public.holidays h ON h.id = mh.holiday_id
      WHERE mh.mr_id = p_user_id
        AND h.holiday_date = p_date
        AND mh.counts_as_leave = FALSE
    )
    OR EXISTS (
      SELECT 1 FROM public.strike_reports sr
      WHERE sr.mr_id = p_user_id AND sr.strike_date = p_date
    );
$$;

CREATE OR REPLACE FUNCTION public._ist_minutes(p_ts timestamptz DEFAULT now())
RETURNS integer
LANGUAGE sql
STABLE
AS $$
  SELECT (
    EXTRACT(HOUR FROM (p_ts AT TIME ZONE 'Asia/Kolkata'))::integer * 60
    + EXTRACT(MINUTE FROM (p_ts AT TIME ZONE 'Asia/Kolkata'))::integer
  );
$$;

CREATE OR REPLACE FUNCTION public._daily_plan_window(p_plan_date date, p_now timestamptz DEFAULT now())
RETURNS text
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_today date := (p_now AT TIME ZONE 'Asia/Kolkata')::date;
  v_minutes integer := public._ist_minutes(p_now);
BEGIN
  IF p_plan_date < v_today THEN
    RETURN 'closed';
  END IF;
  IF p_plan_date > (v_today + 1) THEN
    RETURN 'too_far';
  END IF;
  IF p_plan_date = (v_today + 1) THEN
    IF v_minutes >= 18 * 60 THEN RETURN 'open'; END IF;
    RETURN 'locked';
  END IF;
  IF v_minutes < 11 * 60 THEN RETURN 'open'; END IF;
  RETURN 'closed';
END;
$$;

CREATE OR REPLACE FUNCTION public._plan_home(p_role text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE WHEN p_role = 'manager' THEN '/manager/plan' ELSE '/mr/plan' END;
$$;

CREATE OR REPLACE FUNCTION public.spot_working_start_date()
RETURNS date
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT DATE '2026-11-17';
$$;

-- spot | open | blocked
CREATE OR REPLACE FUNCTION public._visit_spot_mode(p_user_id uuid, p_date date, p_doctor_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
  v_daily text;
  v_on_plan boolean := false;
  v_priority boolean := false;
  v_has_loc boolean := false;
BEGIN
  IF p_date < public.spot_working_start_date() THEN
    RETURN 'open';
  END IF;

  SELECT role INTO v_role FROM public.users WHERE id = p_user_id;
  IF v_role IS DISTINCT FROM 'mr' THEN
    RETURN 'open';
  END IF;

  SELECT fp.status INTO v_daily
  FROM public.field_plans fp
  WHERE fp.user_id = p_user_id AND fp.plan_date = p_date AND fp.kind = 'daily';

  SELECT EXISTS (
    SELECT 1
    FROM public.field_plan_calls c
    JOIN public.field_plans fp ON fp.id = c.plan_id
    WHERE fp.user_id = p_user_id AND fp.plan_date = p_date AND fp.kind = 'daily'
      AND fp.status IN ('approved', 'pending')
      AND c.doctor_id = p_doctor_id
  ) INTO v_on_plan;

  SELECT EXISTS (
    SELECT 1
    FROM public.field_plan_calls c
    JOIN public.field_plans fp ON fp.id = c.plan_id
    WHERE fp.user_id = p_user_id AND fp.plan_date = p_date AND fp.kind = 'priority_call'
      AND c.doctor_id = p_doctor_id
  ) INTO v_priority;

  SELECT EXISTS (
    SELECT 1 FROM public.doctor_locations dl WHERE dl.doctor_id = p_doctor_id
  ) INTO v_has_loc;

  -- No approved/pending daily plan: spot working stays off for the whole day.
  IF v_daily IS NULL OR v_daily IN ('missed', 'rejected') THEN
    RETURN 'open';
  END IF;

  IF v_priority AND v_has_loc THEN
    RETURN 'spot';
  END IF;
  IF v_priority AND NOT v_has_loc THEN
    RETURN 'open';
  END IF;

  IF v_daily = 'approved' AND NOT v_on_plan AND NOT v_priority THEN
    RETURN 'blocked';
  END IF;

  IF v_on_plan AND v_has_loc THEN
    RETURN 'spot';
  END IF;

  RETURN 'open';
END;
$$;

CREATE OR REPLACE FUNCTION public._pings_confirm_doctor(p_user_id uuid, p_doctor_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lat double precision;
  v_lng double precision;
  v_n integer;
  v_span double precision;
BEGIN
  SELECT dl.latitude, dl.longitude INTO v_lat, v_lng
  FROM public.doctor_locations dl
  WHERE dl.doctor_id = p_doctor_id;
  IF v_lat IS NULL THEN
    RETURN false;
  END IF;

  SELECT COUNT(*), EXTRACT(EPOCH FROM (MAX(p.recorded_at) - MIN(p.recorded_at)))
  INTO v_n, v_span
  FROM (
    SELECT recorded_at
    FROM public.field_activity_points p
    WHERE p.user_id = p_user_id
      AND p.recorded_at > now() - interval '4 minutes'
      AND p.flagged = false
      AND p.latitude IS NOT NULL
      AND p.accuracy_m IS NOT NULL
      AND p.accuracy_m >= 1
      AND p.accuracy_m <= 80
      AND public.haversine_m(p.latitude, p.longitude, v_lat, v_lng) <= 800
    ORDER BY p.recorded_at DESC
    LIMIT 6
  ) p;

  RETURN COALESCE(v_n, 0) >= 2 AND COALESCE(v_span, 0) >= 10;
END;
$$;

REVOKE ALL ON FUNCTION public.haversine_m(double precision, double precision, double precision, double precision) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.haversine_m(double precision, double precision, double precision, double precision) TO authenticated;
REVOKE ALL ON FUNCTION public._field_can_see_user(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public._user_is_field_off(uuid, date) FROM PUBLIC;
REVOKE ALL ON FUNCTION public._ist_minutes(timestamptz) FROM PUBLIC;
REVOKE ALL ON FUNCTION public._daily_plan_window(date, timestamptz) FROM PUBLIC;
REVOKE ALL ON FUNCTION public._plan_home(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public._visit_spot_mode(uuid, date, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public._pings_confirm_doctor(uuid, uuid) FROM PUBLIC;

-- ---------------------------------------------------------------------------
-- RLS: the app reads these tables; writes go through the functions.
-- ---------------------------------------------------------------------------

ALTER TABLE public.doctor_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mr_plan_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.field_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.field_plan_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.field_activity_points ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS doctor_locations_read ON public.doctor_locations;
CREATE POLICY doctor_locations_read ON public.doctor_locations
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS mr_plan_settings_read ON public.mr_plan_settings;
CREATE POLICY mr_plan_settings_read ON public.mr_plan_settings
  FOR SELECT TO authenticated
  USING (
    mr_id = (SELECT public.current_app_user_id())
    OR public.current_user_role() IN ('manager', 'admin')
  );

DROP POLICY IF EXISTS field_plans_read ON public.field_plans;
CREATE POLICY field_plans_read ON public.field_plans
  FOR SELECT TO authenticated
  USING (public._field_can_see_user(user_id));

DROP POLICY IF EXISTS field_plan_calls_read ON public.field_plan_calls;
CREATE POLICY field_plan_calls_read ON public.field_plan_calls
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.field_plans fp
      WHERE fp.id = field_plan_calls.plan_id
        AND public._field_can_see_user(fp.user_id)
    )
  );

DROP POLICY IF EXISTS field_activity_read ON public.field_activity_points;
CREATE POLICY field_activity_read ON public.field_activity_points
  FOR SELECT TO authenticated
  USING (public._field_can_see_user(user_id));

GRANT SELECT ON public.doctor_locations TO authenticated;
GRANT SELECT ON public.mr_plan_settings TO authenticated;
GRANT SELECT ON public.field_plans TO authenticated;
GRANT SELECT ON public.field_plan_calls TO authenticated;
GRANT SELECT ON public.field_activity_points TO authenticated;
