-- Phase 2D: server-scheduled push notifications (DCR reminders, birthdays, missed DCR)

CREATE TABLE IF NOT EXISTS public.scheduled_notification_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  kind text NOT NULL,
  run_date date NOT NULL DEFAULT public.today_ist(),
  slot text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT scheduled_notification_log_unique UNIQUE (user_id, kind, run_date, slot)
);

CREATE INDEX IF NOT EXISTS idx_scheduled_notification_log_run_date
  ON public.scheduled_notification_log (run_date, kind);

ALTER TABLE public.scheduled_notification_log ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.scheduled_notification_log FROM PUBLIC;

CREATE OR REPLACE FUNCTION public._scheduled_notify_once(
  p_user_id uuid,
  p_kind text,
  p_slot text,
  p_title text,
  p_body text,
  p_url text,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.scheduled_notification_log (user_id, kind, run_date, slot)
  VALUES (p_user_id, p_kind, public.today_ist(), p_slot)
  ON CONFLICT (user_id, kind, run_date, slot) DO NOTHING;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  PERFORM public._notify_user(p_user_id, p_kind, p_title, p_body, p_url, p_metadata);
  RETURN true;
EXCEPTION WHEN OTHERS THEN
  RETURN false;
END;
$$;

CREATE OR REPLACE FUNCTION public._mr_needs_dcr_reminder_today(p_mr_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    EXTRACT(DOW FROM public.today_ist()) <> 0
    AND NOT EXISTS (
      SELECT 1 FROM public.daily_reports dr
      WHERE dr.mr_id = p_mr_id
        AND dr.report_date = public.today_ist()
        AND dr.status = 'submitted'
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.leave_requests lr
      WHERE lr.mr_id = p_mr_id
        AND lr.leave_date = public.today_ist()
        AND lr.status = 'approved'
        AND lr.leave_type = 'full'
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.mr_holidays mh
      JOIN public.holidays h ON h.id = mh.holiday_id
      WHERE mh.mr_id = p_mr_id
        AND h.holiday_date = public.today_ist()
        AND mh.counts_as_leave = FALSE
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.strike_reports sr
      WHERE sr.mr_id = p_mr_id AND sr.strike_date = public.today_ist()
    );
$$;

-- DCR reminders at 8 PM / 11 PM IST (p_hour: 20 or 23)
CREATE OR REPLACE FUNCTION public.cron_send_dcr_reminders(p_hour integer DEFAULT 20)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_mr record;
  v_sent integer := 0;
  v_slot text;
  v_title text;
  v_body text;
BEGIN
  IF p_hour NOT IN (20, 23) THEN
    RAISE EXCEPTION 'p_hour must be 20 or 23 (IST)';
  END IF;

  v_slot := p_hour::text;
  v_title := CASE WHEN p_hour = 20 THEN 'DCR reminder — 8 PM' ELSE 'DCR reminder — 11 PM' END;
  v_body := CASE
    WHEN p_hour = 20 THEN 'You have not submitted today''s DCR yet. Tap to fill it now.'
    ELSE 'Last call: submit today''s DCR before the day ends.'
  END;

  FOR v_mr IN
    SELECT u.id, u.full_name
    FROM public.users u
    WHERE u.role = 'mr' AND u.is_active = true
      AND public._mr_needs_dcr_reminder_today(u.id)
  LOOP
    IF public._scheduled_notify_once(
      v_mr.id,
      'dcr_reminder',
      v_slot,
      v_title,
      v_body,
      '/mr/report/new',
      jsonb_build_object(
        'mr_id', v_mr.id,
        'reminder_hour', p_hour,
        'big_text', v_body,
        'channel', 'maktree_reminders'
      )
    ) THEN
      v_sent := v_sent + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object('ok', true, 'kind', 'dcr_reminder', 'hour', p_hour, 'sent', v_sent);
END;
$$;

-- Employee birthdays — notify active colleagues at 9 AM IST
CREATE OR REPLACE FUNCTION public.cron_send_employee_birthdays()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_bday record;
  v_user record;
  v_sent integer := 0;
  v_body text;
BEGIN
  FOR v_bday IN
    SELECT user_id, full_name, role
    FROM public.get_employees_birthday_today()
  LOOP
    v_body := COALESCE(v_bday.full_name, 'A team member') || ' celebrates a birthday today. Wish them a great day!';

    FOR v_user IN
      SELECT u.id
      FROM public.users u
      WHERE u.is_active = true
        AND u.role IN ('mr', 'manager', 'admin')
        AND u.id <> v_bday.user_id
    LOOP
      IF public._scheduled_notify_once(
        v_user.id,
        'employee_birthday',
        '09_' || v_bday.user_id::text,
        'Birthday today',
        v_body,
        CASE
          WHEN v_bday.role = 'mr' THEN '/manager/team/' || v_bday.user_id::text
          ELSE '/manager/dashboard'
        END,
        jsonb_build_object(
          'mr_id', CASE WHEN v_bday.role = 'mr' THEN v_bday.user_id ELSE NULL END,
          'mr_name', v_bday.full_name,
          'big_text', v_body,
          'channel', 'maktree_reminders'
        )
      ) THEN
        v_sent := v_sent + 1;
      END IF;
    END LOOP;
  END LOOP;

  RETURN jsonb_build_object('ok', true, 'kind', 'employee_birthday', 'sent', v_sent);
END;
$$;

-- Doctor birthdays today — notify owning MRs at 9 AM IST
CREATE OR REPLACE FUNCTION public.cron_send_doctor_birthdays_today()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row record;
  v_sent integer := 0;
  v_body text;
BEGIN
  FOR v_row IN
    SELECT DISTINCT ON (d.id, msa.mr_id)
      msa.mr_id,
      d.id AS doctor_id,
      d.full_name AS doctor_name,
      d.speciality
    FROM public.doctors d
    JOIN public.mr_sub_area_access msa ON msa.sub_area_id = d.sub_area_id
    JOIN public.users u ON u.id = msa.mr_id AND u.is_active = true AND u.role = 'mr'
    WHERE d.is_active = true
      AND d.birthday IS NOT NULL
      AND EXTRACT(MONTH FROM d.birthday) = EXTRACT(MONTH FROM public.today_ist())
      AND EXTRACT(DAY FROM d.birthday) = EXTRACT(DAY FROM public.today_ist())
    ORDER BY d.id, msa.mr_id
  LOOP
    v_body := 'Dr. ' || COALESCE(v_row.doctor_name, 'your doctor') ||
      CASE WHEN v_row.speciality IS NOT NULL AND trim(v_row.speciality) <> '' THEN ' (' || v_row.speciality || ')' ELSE '' END ||
      ' has a birthday today.';

    IF public._scheduled_notify_once(
      v_row.mr_id,
      'doctor_birthday',
      '09_' || v_row.doctor_id::text,
      'Doctor birthday today',
      v_body,
      '/mr/master-list',
      jsonb_build_object(
        'doctor_id', v_row.doctor_id,
        'entity_name', v_row.doctor_name,
        'speciality', v_row.speciality,
        'big_text', v_body,
        'channel', 'maktree_reminders'
      )
    ) THEN
      v_sent := v_sent + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object('ok', true, 'kind', 'doctor_birthday', 'sent', v_sent);
END;
$$;

-- Missed DCR: auto-mark + notify MR and managers (7 AM IST)
CREATE OR REPLACE FUNCTION public.cron_process_missed_dcr_alerts()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_marked jsonb;
  v_row record;
  v_mr_name text;
  v_sent_mr integer := 0;
  v_sent_mgr integer := 0;
  v_body text;
  v_ist_start timestamptz;
BEGIN
  v_ist_start := (public.today_ist()::timestamp AT TIME ZONE 'Asia/Kolkata');

  v_marked := public.auto_mark_missed_dcr_leave_without_pay(NULL);

  FOR v_row IN
    SELECT dr.mr_id, dr.report_date, u.full_name AS mr_name
    FROM public.daily_reports dr
    JOIN public.users u ON u.id = dr.mr_id
    WHERE dr.report_kind = 'leave'
      AND dr.leave_dcr_remark LIKE 'Auto-marked:%'
      AND dr.submitted_at >= v_ist_start
  LOOP
    v_body := 'DCR for ' || to_char(v_row.report_date, 'DD Mon YYYY') ||
      ' was auto-marked as leave without pay (not filed in time).';

    IF public._scheduled_notify_once(
      v_row.mr_id,
      'dcr_missed',
      '07_' || v_row.report_date::text,
      'Missed DCR alert',
      v_body,
      '/mr/dashboard',
      jsonb_build_object(
        'mr_id', v_row.mr_id,
        'report_date', v_row.report_date,
        'big_text', v_body,
        'channel', 'maktree_reminders'
      )
    ) THEN
      v_sent_mr := v_sent_mr + 1;
    END IF;

    PERFORM public._notify_mr_managers(
      v_row.mr_id,
      'dcr_missed',
      'Missed DCR alert',
      COALESCE(v_row.mr_name, 'Team member') || ' missed DCR for ' ||
        to_char(v_row.report_date, 'DD Mon YYYY') || '. Auto-marked as leave without pay.',
      '/manager/team/' || v_row.mr_id::text,
      jsonb_build_object(
        'mr_id', v_row.mr_id,
        'mr_name', v_row.mr_name,
        'report_date', v_row.report_date,
        'big_text', v_body,
        'channel', 'maktree_reminders'
      )
    );
    v_sent_mgr := v_sent_mgr + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'ok', true,
    'kind', 'dcr_missed',
    'auto_marked', COALESCE(v_marked ->> 'marked_count', '0'),
    'sent_mr', v_sent_mr,
    'sent_managers', v_sent_mgr
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.cron_run_daily_scheduled_notifications(p_job text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  CASE p_job
    WHEN 'dcr_reminder_20' THEN RETURN public.cron_send_dcr_reminders(20);
    WHEN 'dcr_reminder_23' THEN RETURN public.cron_send_dcr_reminders(23);
    WHEN 'birthdays' THEN
      RETURN jsonb_build_object(
        'employee', public.cron_send_employee_birthdays(),
        'doctor', public.cron_send_doctor_birthdays_today()
      );
    WHEN 'missed_dcr' THEN RETURN public.cron_process_missed_dcr_alerts();
    ELSE RAISE EXCEPTION 'Unknown scheduled job: %', p_job;
  END CASE;
END;
$$;

REVOKE ALL ON FUNCTION public._scheduled_notify_once(uuid, text, text, text, text, text, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public._mr_needs_dcr_reminder_today(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cron_send_dcr_reminders(integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cron_send_employee_birthdays() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cron_send_doctor_birthdays_today() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cron_process_missed_dcr_alerts() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cron_run_daily_scheduled_notifications(text) FROM PUBLIC;

-- pg_cron schedules (UTC). Enable pg_cron in Supabase Dashboard → Database → Extensions if missing.
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

DO $schedule$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    BEGIN PERFORM cron.unschedule('maktree-dcr-reminder-8pm-ist'); EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN PERFORM cron.unschedule('maktree-dcr-reminder-11pm-ist'); EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN PERFORM cron.unschedule('maktree-birthdays-9am-ist'); EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN PERFORM cron.unschedule('maktree-missed-dcr-7am-ist'); EXCEPTION WHEN OTHERS THEN NULL; END;

    PERFORM cron.schedule('maktree-dcr-reminder-8pm-ist', '30 14 * * *', $$SELECT public.cron_run_daily_scheduled_notifications('dcr_reminder_20');$$);
    PERFORM cron.schedule('maktree-dcr-reminder-11pm-ist', '30 17 * * *', $$SELECT public.cron_run_daily_scheduled_notifications('dcr_reminder_23');$$);
    PERFORM cron.schedule('maktree-birthdays-9am-ist', '30 3 * * *', $$SELECT public.cron_run_daily_scheduled_notifications('birthdays');$$);
    PERFORM cron.schedule('maktree-missed-dcr-7am-ist', '30 1 * * *', $$SELECT public.cron_run_daily_scheduled_notifications('missed_dcr');$$);
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'pg_cron scheduling skipped: %', SQLERRM;
END;
$schedule$;
