-- Visit geofence, plan remarks, and the daily plan / end-of-day alerts.

CREATE OR REPLACE FUNCTION public.enforce_spot_on_visit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_mr uuid;
  v_date date;
  v_kind text;
  v_role text;
  v_mode text;
  v_doc_lat double precision;
  v_doc_lng double precision;
  v_dist double precision;
  v_name text;
  v_fresh boolean := false;
BEGIN
  SELECT dr.mr_id, dr.report_date, COALESCE(dr.report_kind, 'field'), u.role
  INTO v_mr, v_date, v_kind, v_role
  FROM public.daily_reports dr
  JOIN public.users u ON u.id = dr.mr_id
  WHERE dr.id = NEW.report_id;

  IF v_role IS DISTINCT FROM 'mr' OR v_kind <> 'field' THEN
    RETURN NEW;
  END IF;

  v_mode := public._visit_spot_mode(v_mr, v_date, NEW.doctor_id);

  IF v_mode = 'blocked' THEN
    RAISE EXCEPTION 'This doctor is not on the approved plan. Add a Priority Call first.';
  END IF;

  IF v_mode = 'open' THEN
    NEW.plan_waived := true;
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE'
     AND OLD.spot_verified_at IS NOT NULL
     AND OLD.spot_verified_at > now() - interval '45 minutes'
     AND OLD.doctor_id = NEW.doctor_id THEN
    v_fresh := true;
    NEW.spot_verified_at := OLD.spot_verified_at;
    NEW.spot_latitude := COALESCE(NEW.spot_latitude, OLD.spot_latitude);
    NEW.spot_longitude := COALESCE(NEW.spot_longitude, OLD.spot_longitude);
    NEW.spot_accuracy_m := COALESCE(NEW.spot_accuracy_m, OLD.spot_accuracy_m);
  END IF;

  IF NOT v_fresh THEN
    IF NOT public._pings_confirm_doctor(v_mr, NEW.doctor_id) THEN
      RAISE EXCEPTION 'Stay inside the clinic for a few seconds so this DCR can unlock. Keep location on.';
    END IF;

    SELECT latitude, longitude INTO v_doc_lat, v_doc_lng
    FROM public.doctor_locations WHERE doctor_id = NEW.doctor_id;

    IF NEW.spot_latitude IS NULL OR NEW.spot_longitude IS NULL
       OR NEW.spot_accuracy_m IS NULL
       OR NEW.spot_accuracy_m < 1 OR NEW.spot_accuracy_m > 80
       OR public.haversine_m(NEW.spot_latitude, NEW.spot_longitude, v_doc_lat, v_doc_lng) > 800 THEN
      RAISE EXCEPTION 'This DCR opens only within 800 metres of the clinic.';
    END IF;

    SELECT public.haversine_m(NEW.spot_latitude, NEW.spot_longitude, p.latitude, p.longitude)
    INTO v_dist
    FROM public.field_activity_points p
    WHERE p.user_id = v_mr
      AND p.latitude IS NOT NULL
      AND p.flagged = false
      AND p.recorded_at > now() - interval '4 minutes'
    ORDER BY p.recorded_at DESC
    LIMIT 1;

    IF v_dist IS NULL OR v_dist > 150 THEN
      RAISE EXCEPTION 'This location does not match your recent GPS trail.';
    END IF;

    NEW.spot_verified_at := now();
  END IF;

  NEW.plan_waived := false;

  IF NOT COALESCE(NEW.doctor_unavailable, false) THEN
    UPDATE public.field_plan_calls c SET
      outcome = 'visited',
      outcome_at = COALESCE(c.outcome_at, now())
    FROM public.field_plans fp
    WHERE c.plan_id = fp.id
      AND fp.user_id = v_mr
      AND fp.plan_date = v_date
      AND c.doctor_id = NEW.doctor_id
      AND c.outcome = 'planned';
  ELSIF TG_OP = 'INSERT' OR OLD.doctor_unavailable IS DISTINCT FROM TRUE THEN
    UPDATE public.field_plan_calls c SET
      outcome = 'unavailable',
      outcome_note = COALESCE(NEW.unavailable_note, c.outcome_note),
      outcome_at = now()
    FROM public.field_plans fp
    WHERE c.plan_id = fp.id
      AND fp.user_id = v_mr
      AND fp.plan_date = v_date
      AND c.doctor_id = NEW.doctor_id;

    SELECT full_name INTO v_name FROM public.doctors WHERE id = NEW.doctor_id;
    PERFORM public._notify_mr_managers(
      v_mr,
      'doctor_unavailable',
      'Doctor unavailable',
      (SELECT full_name FROM public.users WHERE id = v_mr)
        || ' marked ' || COALESCE(v_name, 'a doctor') || ' unavailable.',
      '/manager/activity?mrId=' || v_mr::text || '&date=' || v_date::text,
      jsonb_build_object('doctor_id', NEW.doctor_id, 'report_date', v_date)
    );
    INSERT INTO public.field_activity_points (
      user_id, latitude, longitude, accuracy_m, event_type, doctor_id, report_id, metadata
    ) VALUES (
      v_mr, NEW.spot_latitude, NEW.spot_longitude, NEW.spot_accuracy_m,
      'doctor_unavailable', NEW.doctor_id, NEW.report_id,
      jsonb_build_object('doctor_name', v_name, 'note', NEW.unavailable_note)
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.guard_spot_visit_child()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_visit uuid;
  v_waived boolean;
  v_verified timestamptz;
  v_doctor uuid;
  v_mr uuid;
  v_role text;
  v_kind text;
BEGIN
  v_visit := COALESCE(NEW.visit_id, OLD.visit_id);
  SELECT rv.plan_waived, rv.spot_verified_at, rv.doctor_id, dr.mr_id, u.role, COALESCE(dr.report_kind, 'field')
  INTO v_waived, v_verified, v_doctor, v_mr, v_role, v_kind
  FROM public.report_visits rv
  JOIN public.daily_reports dr ON dr.id = rv.report_id
  JOIN public.users u ON u.id = dr.mr_id
  WHERE rv.id = v_visit;

  IF v_role IS DISTINCT FROM 'mr' OR v_kind <> 'field' OR COALESCE(v_waived, false) THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
    RETURN NEW;
  END IF;

  IF v_verified IS NOT NULL AND v_verified > now() - interval '45 minutes' THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
    RETURN NEW;
  END IF;

  IF public._pings_confirm_doctor(v_mr, v_doctor) THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'This DCR is locked because you left the clinic. Go back within 800 metres to change it.';
END;
$$;

CREATE OR REPLACE FUNCTION public.stamp_plan_remark()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
  v_status text;
BEGIN
  IF NEW.report_date < public.spot_working_start_date() THEN
    RETURN NEW;
  END IF;

  SELECT role INTO v_role FROM public.users WHERE id = NEW.mr_id;
  IF v_role IS DISTINCT FROM 'mr' THEN
    RETURN NEW;
  END IF;
  IF COALESCE(NEW.report_kind, 'field') <> 'field' THEN
    RETURN NEW;
  END IF;

  SELECT status INTO v_status
  FROM public.field_plans
  WHERE user_id = NEW.mr_id AND plan_date = NEW.report_date AND kind = 'daily';

  IF v_status IN ('approved', 'pending') THEN
    NEW.plan_missing := false;
    NEW.plan_remark := NULL;
  ELSIF v_status = 'rejected' THEN
    NEW.plan_missing := true;
    NEW.plan_remark := 'Daily plan was rejected and not resubmitted. Spot working was off for this day.';
  ELSE
    NEW.plan_missing := true;
    NEW.plan_remark := 'Daily plan was not submitted. Spot working was off. This DCR was filed as normal work.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_spot_on_visit ON public.report_visits;
CREATE TRIGGER trg_enforce_spot_on_visit
  BEFORE INSERT OR UPDATE ON public.report_visits
  FOR EACH ROW EXECUTE FUNCTION public.enforce_spot_on_visit();

DROP TRIGGER IF EXISTS trg_stamp_plan_remark ON public.daily_reports;
CREATE TRIGGER trg_stamp_plan_remark
  BEFORE INSERT OR UPDATE ON public.daily_reports
  FOR EACH ROW EXECUTE FUNCTION public.stamp_plan_remark();

DROP TRIGGER IF EXISTS trg_spot_guard_products ON public.promoted_products;
CREATE TRIGGER trg_spot_guard_products
  BEFORE INSERT OR UPDATE OR DELETE ON public.promoted_products
  FOR EACH ROW EXECUTE FUNCTION public.guard_spot_visit_child();

DROP TRIGGER IF EXISTS trg_spot_guard_competitors ON public.competitor_entries;
CREATE TRIGGER trg_spot_guard_competitors
  BEFORE INSERT OR UPDATE OR DELETE ON public.competitor_entries
  FOR EACH ROW EXECUTE FUNCTION public.guard_spot_visit_child();

DROP TRIGGER IF EXISTS trg_spot_guard_support ON public.monthly_support_entries;
CREATE TRIGGER trg_spot_guard_support
  BEFORE INSERT OR UPDATE OR DELETE ON public.monthly_support_entries
  FOR EACH ROW EXECUTE FUNCTION public.guard_spot_visit_child();

REVOKE ALL ON FUNCTION public.enforce_spot_on_visit() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.guard_spot_visit_child() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.stamp_plan_remark() FROM PUBLIC;

-- ---------------------------------------------------------------------------
-- Alerts: 6:00 PM unlock, 9:30 / 10:00 / 10:30 / 11:00 reminders, 9:30 PM summary
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.cron_field_plan_alerts(p_slot text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user record;
  v_target date;
  v_sent integer := 0;
  v_title text;
  v_body text;
  v_home text;
BEGIN
  IF p_slot = 'unlock_1800' THEN
    v_target := public.today_ist() + 1;
  ELSE
    v_target := public.today_ist();
  END IF;

  IF v_target < public.spot_working_start_date() THEN
    RETURN jsonb_build_object('ok', true, 'slot', p_slot, 'sent', 0, 'skipped', 'before_start');
  END IF;

  FOR v_user IN
    SELECT u.id, u.full_name, u.role
    FROM public.users u
    WHERE u.role IN ('mr', 'manager')
      AND u.is_active = true
      AND COALESCE(u.is_resigned, false) = false
      AND COALESCE(u.is_blocked, false) = false
      AND NOT public._user_is_field_off(u.id, v_target)
  LOOP
    v_home := public._plan_home(v_user.role);

    IF p_slot = 'unlock_1800' THEN
      IF EXISTS (
        SELECT 1 FROM public.field_plans fp
        WHERE fp.user_id = v_user.id AND fp.plan_date = v_target AND fp.kind = 'daily'
          AND fp.status IN ('pending', 'approved')
      ) THEN
        CONTINUE;
      END IF;
      IF public._scheduled_notify_once(
        v_user.id, 'field_plan_unlock', '1800',
        'Tomorrow''s plan is open',
        'You can submit tomorrow''s plan now. It closes at 11:00 AM.',
        v_home || '?date=' || v_target::text,
        jsonb_build_object('plan_date', v_target, 'channel', 'maktree_reminders')
      ) THEN
        v_sent := v_sent + 1;
      END IF;
      CONTINUE;
    END IF;

    IF EXISTS (
      SELECT 1 FROM public.field_plans fp
      WHERE fp.user_id = v_user.id AND fp.plan_date = v_target AND fp.kind = 'daily'
        AND fp.status IN ('pending', 'approved')
    ) THEN
      CONTINUE;
    END IF;

    IF p_slot = 'remind_1100' AND v_user.role IN ('mr', 'manager') THEN
      INSERT INTO public.field_plans (user_id, plan_date, kind, status, note, submitted_at)
      VALUES (
        v_user.id, v_target, 'daily', 'missed',
        'Daily plan was not submitted. Spot working is off. DCRs can be filed normally and will carry this remark.',
        now()
      )
      ON CONFLICT (user_id, plan_date) WHERE kind = 'daily' DO NOTHING;
    END IF;

    v_title := CASE p_slot
      WHEN 'remind_0930' THEN 'Plan reminder — 9:30 AM'
      WHEN 'remind_1000' THEN 'Plan reminder — 10:00 AM'
      WHEN 'remind_1030' THEN 'Plan reminder — 10:30 AM'
      ELSE 'Plan not submitted'
    END;
    v_body := CASE p_slot
      WHEN 'remind_0930' THEN 'Please submit today''s plan before 10:00 AM.'
      WHEN 'remind_1000' THEN 'It is 10:00 AM and today''s plan is still not submitted.'
      WHEN 'remind_1030' THEN 'Today''s plan is still open. Submit it before 11:00 AM.'
      ELSE 'Today''s plan was not submitted. Spot working is off. You can file DCRs normally, and the day will carry this remark.'
    END;

    IF public._scheduled_notify_once(
      v_user.id, 'field_plan_missing', p_slot,
      v_title, v_body, v_home || '?date=' || v_target::text,
      jsonb_build_object('plan_date', v_target, 'channel', 'maktree_reminders')
    ) THEN
      v_sent := v_sent + 1;
      IF v_user.role = 'mr' THEN
        PERFORM public._notify_mr_managers(
          v_user.id,
          'field_plan_missing',
          CASE WHEN p_slot = 'remind_1100' THEN 'Plan not submitted' ELSE 'Plan still missing' END,
          COALESCE(v_user.full_name, 'An MR') || CASE
            WHEN p_slot = 'remind_1100' THEN ' did not submit today''s plan. Spot working is off for this MR today.'
            ELSE ' has not submitted today''s plan.'
          END,
          '/manager/plan?date=' || v_target::text || '&mrId=' || v_user.id::text,
          jsonb_build_object('mr_id', v_user.id, 'plan_date', v_target, 'slot', p_slot, 'channel', 'maktree_reminders')
        );
      END IF;
    END IF;
  END LOOP;

  RETURN jsonb_build_object('ok', true, 'slot', p_slot, 'sent', v_sent);
END;
$$;

CREATE OR REPLACE FUNCTION public.cron_field_eod_summaries()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_mr record;
  v_body text;
  v_sent integer := 0;
  v_today date := public.today_ist();
BEGIN
  IF v_today < public.spot_working_start_date() THEN
    RETURN jsonb_build_object('ok', true, 'kind', 'field_eod', 'mrs', 0, 'skipped', 'before_start');
  END IF;

  FOR v_mr IN
    SELECT u.id, u.full_name
    FROM public.users u
    WHERE u.role = 'mr' AND u.is_active = true
      AND COALESCE(u.is_resigned, false) = false
      AND NOT public._user_is_field_off(u.id, v_today)
  LOOP
    INSERT INTO public.scheduled_notification_log (user_id, kind, run_date, slot)
    VALUES (v_mr.id, 'field_eod', v_today, 'eod')
    ON CONFLICT (user_id, kind, run_date, slot) DO NOTHING;
    IF NOT FOUND THEN
      CONTINUE;
    END IF;

    SELECT LEFT(
      COALESCE(v_mr.full_name, 'MR') || ': '
      || COALESCE(s.done, 0) || ' calls'
      || CASE WHEN COALESCE(s.unavailable, 0) > 0
        THEN ', ' || s.unavailable || ' unavailable (' || COALESCE(s.unavail_names, '—') || ')'
        ELSE '' END
      || CASE WHEN COALESCE(s.priority_n, 0) > 0
        THEN '. Priority Call: ' || COALESCE(s.priority_names, 'added')
        ELSE '. No Priority Call' END
      || '. Plan ' || COALESCE(s.plan_status, 'not submitted')
      || CASE WHEN s.products IS NOT NULL THEN '. Products: ' || s.products ELSE '' END
      || '.',
      320
    )
    INTO v_body
    FROM (
      SELECT
        (
          SELECT COUNT(*) FROM public.report_visits rv
          JOIN public.daily_reports dr ON dr.id = rv.report_id
          WHERE dr.mr_id = v_mr.id AND dr.report_date = v_today AND rv.doctor_unavailable = false
        ) AS done,
        (
          SELECT COUNT(*) FROM public.report_visits rv
          JOIN public.daily_reports dr ON dr.id = rv.report_id
          WHERE dr.mr_id = v_mr.id AND dr.report_date = v_today AND rv.doctor_unavailable = true
        ) AS unavailable,
        (
          SELECT string_agg(d.full_name, ', ')
          FROM public.report_visits rv
          JOIN public.daily_reports dr ON dr.id = rv.report_id
          JOIN public.doctors d ON d.id = rv.doctor_id
          WHERE dr.mr_id = v_mr.id AND dr.report_date = v_today AND rv.doctor_unavailable = true
        ) AS unavail_names,
        (
          SELECT COUNT(*) FROM public.field_plans fp
          WHERE fp.user_id = v_mr.id AND fp.plan_date = v_today AND fp.kind = 'priority_call'
        ) AS priority_n,
        (
          SELECT string_agg(d.full_name, ', ')
          FROM public.field_plan_calls c
          JOIN public.field_plans fp ON fp.id = c.plan_id
          JOIN public.doctors d ON d.id = c.doctor_id
          WHERE fp.user_id = v_mr.id AND fp.plan_date = v_today AND fp.kind = 'priority_call'
        ) AS priority_names,
        (
          SELECT fp.status FROM public.field_plans fp
          WHERE fp.user_id = v_mr.id AND fp.plan_date = v_today AND fp.kind = 'daily'
        ) AS plan_status,
        (
          SELECT string_agg(DISTINCT pr.name, ', ')
          FROM public.promoted_products pp
          JOIN public.products pr ON pr.id = pp.product_id
          JOIN public.report_visits rv ON rv.id = pp.visit_id
          JOIN public.daily_reports dr ON dr.id = rv.report_id
          WHERE dr.mr_id = v_mr.id AND dr.report_date = v_today
        ) AS products
    ) s;

    PERFORM public._notify_mr_managers(
      v_mr.id,
      'field_eod',
      'End of day — ' || COALESCE(v_mr.full_name, 'MR'),
      COALESCE(v_body, COALESCE(v_mr.full_name, 'MR') || ' has no field activity today.'),
      '/manager/activity?mrId=' || v_mr.id::text || '&date=' || v_today::text,
      jsonb_build_object('mr_id', v_mr.id, 'report_date', v_today, 'channel', 'maktree_reminders', 'big_text', v_body)
    );
    v_sent := v_sent + 1;
  END LOOP;

  RETURN jsonb_build_object('ok', true, 'kind', 'field_eod', 'mrs', v_sent);
END;
$$;

CREATE OR REPLACE FUNCTION public.cron_run_daily_scheduled_notifications(p_job text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_job IN ('plan_0930', 'plan_1000', 'plan_1030', 'plan_1100', 'field_eod')
     AND public.today_ist() < public.spot_working_start_date() THEN
    RETURN jsonb_build_object('ok', true, 'job', p_job, 'skipped', 'before_start');
  END IF;
  IF p_job = 'plan_unlock_1800'
     AND (public.today_ist() + 1) < public.spot_working_start_date() THEN
    RETURN jsonb_build_object('ok', true, 'job', p_job, 'skipped', 'before_start');
  END IF;

  CASE p_job
    WHEN 'dcr_reminder_20' THEN RETURN public.cron_send_dcr_reminders(20);
    WHEN 'dcr_reminder_23' THEN RETURN public.cron_send_dcr_reminders(23);
    WHEN 'birthdays' THEN
      RETURN jsonb_build_object(
        'employee', public.cron_send_employee_birthdays(),
        'doctor', public.cron_send_doctor_birthdays_today()
      );
    WHEN 'missed_dcr' THEN RETURN public.cron_process_missed_dcr_alerts();
    WHEN 'plan_unlock_1800' THEN RETURN public.cron_field_plan_alerts('unlock_1800');
    WHEN 'plan_0930' THEN RETURN public.cron_field_plan_alerts('remind_0930');
    WHEN 'plan_1000' THEN RETURN public.cron_field_plan_alerts('remind_1000');
    WHEN 'plan_1030' THEN RETURN public.cron_field_plan_alerts('remind_1030');
    WHEN 'plan_1100' THEN RETURN public.cron_field_plan_alerts('remind_1100');
    WHEN 'field_eod' THEN RETURN public.cron_field_eod_summaries();
    ELSE RAISE EXCEPTION 'Unknown scheduled job: %', p_job;
  END CASE;
END;
$$;

REVOKE ALL ON FUNCTION public.cron_field_plan_alerts(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cron_field_eod_summaries() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cron_run_daily_scheduled_notifications(text) FROM PUBLIC;

DO $schedule$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    BEGIN PERFORM cron.unschedule('maktree-plan-unlock-6pm-ist'); EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN PERFORM cron.unschedule('maktree-plan-reminder-930-ist'); EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN PERFORM cron.unschedule('maktree-plan-reminder-1000-ist'); EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN PERFORM cron.unschedule('maktree-plan-reminder-1030-ist'); EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN PERFORM cron.unschedule('maktree-plan-reminder-1100-ist'); EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN PERFORM cron.unschedule('maktree-field-eod-930pm-ist'); EXCEPTION WHEN OTHERS THEN NULL; END;

    PERFORM cron.schedule('maktree-plan-unlock-6pm-ist', '30 12 * * *', $$SELECT public.cron_run_daily_scheduled_notifications('plan_unlock_1800');$$);
    PERFORM cron.schedule('maktree-plan-reminder-930-ist', '0 4 * * *', $$SELECT public.cron_run_daily_scheduled_notifications('plan_0930');$$);
    PERFORM cron.schedule('maktree-plan-reminder-1000-ist', '30 4 * * *', $$SELECT public.cron_run_daily_scheduled_notifications('plan_1000');$$);
    PERFORM cron.schedule('maktree-plan-reminder-1030-ist', '0 5 * * *', $$SELECT public.cron_run_daily_scheduled_notifications('plan_1030');$$);
    PERFORM cron.schedule('maktree-plan-reminder-1100-ist', '30 5 * * *', $$SELECT public.cron_run_daily_scheduled_notifications('plan_1100');$$);
    PERFORM cron.schedule('maktree-field-eod-930pm-ist', '30 16 * * *', $$SELECT public.cron_run_daily_scheduled_notifications('field_eod');$$);
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'pg_cron scheduling skipped: %', SQLERRM;
END;
$schedule$;

REVOKE ALL ON FUNCTION public.submit_field_plan(date, text, uuid[], uuid[], text, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.review_field_plan(uuid, boolean, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.set_mr_plan_auto_approve(uuid, boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.capture_doctor_location(uuid, double precision, double precision, double precision) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.note_gps_off() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.spot_scan(double precision, double precision, double precision) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.field_day_board(date) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.field_activity_day(uuid, date) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.field_month_summary(uuid, date) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.submit_field_plan(date, text, uuid[], uuid[], text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.review_field_plan(uuid, boolean, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_mr_plan_auto_approve(uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.capture_doctor_location(uuid, double precision, double precision, double precision) TO authenticated;
GRANT EXECUTE ON FUNCTION public.note_gps_off() TO authenticated;
GRANT EXECUTE ON FUNCTION public.spot_scan(double precision, double precision, double precision) TO authenticated;
GRANT EXECUTE ON FUNCTION public.field_day_board(date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.field_activity_day(uuid, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.field_month_summary(uuid, date) TO authenticated;
