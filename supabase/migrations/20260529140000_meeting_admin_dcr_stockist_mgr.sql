-- Meeting DCR, Admin day DCR (manager-only), leave without pay, manager stockist meets.

ALTER TABLE public.daily_reports
  DROP CONSTRAINT IF EXISTS daily_reports_report_kind_check;

ALTER TABLE public.daily_reports
  ADD CONSTRAINT daily_reports_report_kind_check
  CHECK (
    report_kind = ANY (
      ARRAY[
        'field'::text,
        'leave'::text,
        'sunday'::text,
        'strike'::text,
        'holiday'::text,
        'meeting'::text,
        'admin_day'::text
      ]
    )
  );

ALTER TABLE public.daily_reports
  DROP CONSTRAINT IF EXISTS daily_reports_leave_dcr_category_check;

ALTER TABLE public.daily_reports
  ADD CONSTRAINT daily_reports_leave_dcr_category_check
  CHECK (
    leave_dcr_category IS NULL
    OR leave_dcr_category = ANY (ARRAY['casual'::text, 'sick'::text, 'without_pay'::text])
  );

ALTER TABLE public.leave_requests
  DROP CONSTRAINT IF EXISTS leave_requests_leave_category_check;

ALTER TABLE public.leave_requests
  ADD CONSTRAINT leave_requests_leave_category_check
  CHECK (leave_category = ANY (ARRAY['casual'::text, 'sick'::text, 'without_pay'::text]));

ALTER TABLE public.daily_reports
  ADD COLUMN IF NOT EXISTS meeting_duration_type text,
  ADD COLUMN IF NOT EXISTS meeting_start_time time,
  ADD COLUMN IF NOT EXISTS meeting_end_time time,
  ADD COLUMN IF NOT EXISTS meeting_type text,
  ADD COLUMN IF NOT EXISTS meeting_attendee_ids uuid[] DEFAULT '{}'::uuid[],
  ADD COLUMN IF NOT EXISTS meeting_notes text,
  ADD COLUMN IF NOT EXISTS admin_day_start_time time,
  ADD COLUMN IF NOT EXISTS admin_day_end_time time,
  ADD COLUMN IF NOT EXISTS admin_day_notes text;

ALTER TABLE public.daily_reports
  DROP CONSTRAINT IF EXISTS daily_reports_meeting_duration_type_check;

ALTER TABLE public.daily_reports
  ADD CONSTRAINT daily_reports_meeting_duration_type_check
  CHECK (
    meeting_duration_type IS NULL
    OR meeting_duration_type = ANY (ARRAY['full_day'::text, 'half_day'::text])
  );

ALTER TABLE public.daily_reports
  DROP CONSTRAINT IF EXISTS daily_reports_meeting_type_check;

ALTER TABLE public.daily_reports
  ADD CONSTRAINT daily_reports_meeting_type_check
  CHECK (
    meeting_type IS NULL
    OR meeting_type = ANY (ARRAY['cycle'::text, 'sales_review'::text, 'weekly'::text])
  );

-- MR or manager: stockist meet for assigned HQ areas
CREATE OR REPLACE FUNCTION public.upsert_my_stockist_meet(
  p_meet_date date,
  p_stockist_id uuid,
  p_meet_time time DEFAULT NULL,
  p_notes text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_me uuid;
  v_role text;
  v_allowed uuid[];
  v_stockist_area uuid;
  v_id uuid;
BEGIN
  SELECT u.id, u.role::text INTO v_me, v_role
  FROM public.users u
  WHERE u.auth_user_id = auth.uid() AND u.is_active = true
  LIMIT 1;

  IF v_me IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF v_role NOT IN ('mr', 'manager') THEN
    RAISE EXCEPTION 'Only MRs and managers can save stockist meets here';
  END IF;
  IF p_meet_date IS NULL THEN RAISE EXCEPTION 'Select date'; END IF;
  IF p_stockist_id IS NULL THEN RAISE EXCEPTION 'Select stockist'; END IF;

  SELECT array_agg(DISTINCT sa.area_id) INTO v_allowed
  FROM public.mr_sub_area_access msa
  JOIN public.sub_areas sa ON sa.id = msa.sub_area_id
  WHERE msa.mr_id = v_me AND sa.is_active = true;

  IF v_role = 'manager' AND (v_allowed IS NULL OR cardinality(v_allowed) = 0) THEN
    SELECT array_agg(DISTINCT a.id) INTO v_allowed
    FROM public.areas a
    WHERE a.is_active = true;
  END IF;

  IF v_allowed IS NULL OR cardinality(v_allowed) = 0 THEN
    RAISE EXCEPTION 'No HQ assigned to your account';
  END IF;

  SELECT s.area_id INTO v_stockist_area
  FROM public.stockists s
  WHERE s.id = p_stockist_id AND s.is_active = true
  LIMIT 1;

  IF v_stockist_area IS NULL THEN RAISE EXCEPTION 'Stockist not found'; END IF;
  IF NOT (v_stockist_area = ANY (v_allowed)) THEN
    RAISE EXCEPTION 'You can only meet stockists from your assigned HQ(s)';
  END IF;

  INSERT INTO public.stockist_meets(user_id, meet_date, meet_time, area_id, stockist_id, notes)
  VALUES (v_me, p_meet_date, p_meet_time, v_stockist_area, p_stockist_id, NULLIF(trim(p_notes), ''))
  ON CONFLICT (user_id, meet_date, stockist_id)
  DO UPDATE SET
    meet_time = EXCLUDED.meet_time,
    notes = EXCLUDED.notes,
    area_id = EXCLUDED.area_id,
    updated_at = now()
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$function$;
