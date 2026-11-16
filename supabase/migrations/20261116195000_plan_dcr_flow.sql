-- A pending plan is the day's DCR list, same as an approved plan.
-- A planned day with no submitted DCR drops out of the normal window the next morning.
-- The manager opens that day again with the existing late-DCR grant.
-- The screen asks for the plan by 10:00 AM. The 11:00 AM reminder is the last one, and the plan closes then.

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

  IF v_daily IS NULL OR v_daily IN ('missed', 'rejected') THEN
    RETURN 'open';
  END IF;

  IF v_priority AND v_has_loc THEN
    RETURN 'spot';
  END IF;
  IF v_priority AND NOT v_has_loc THEN
    RETURN 'open';
  END IF;

  IF v_daily IN ('approved', 'pending') AND NOT v_on_plan AND NOT v_priority THEN
    RETURN 'blocked';
  END IF;

  IF v_on_plan AND v_has_loc THEN
    RETURN 'spot';
  END IF;

  RETURN 'open';
END;
$$;

CREATE OR REPLACE FUNCTION public.get_allowed_report_dates(p_mr_id uuid)
RETURNS TABLE(report_date date, already_submitted boolean, day_type text, is_late_slot boolean)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH window_dates AS (
    SELECT d::date AS report_date
    FROM generate_series(public.today_ist() - INTERVAL '2 days', public.today_ist(), INTERVAL '1 day') AS d
  ),
  spot_locked AS (
    SELECT fp.plan_date AS report_date
    FROM public.field_plans fp
    WHERE fp.user_id = p_mr_id
      AND fp.kind = 'daily'
      AND fp.status IN ('pending', 'approved')
      AND fp.plan_date >= public.spot_working_start_date()
      AND fp.plan_date < public.today_ist()
      AND NOT EXISTS (
        SELECT 1
        FROM public.daily_reports dr
        WHERE dr.mr_id = p_mr_id
          AND dr.report_date = fp.plan_date
          AND dr.status = 'submitted'
      )
  ),
  late_dates AS (
    SELECT s.report_date
    FROM public.dcr_late_fill_slots s
    WHERE s.mr_id = p_mr_id
      AND s.consumed_at IS NULL
      AND s.report_date < public.today_ist()
      AND (
        s.report_date < public.today_ist() - 2
        OR EXISTS (SELECT 1 FROM spot_locked sl WHERE sl.report_date = s.report_date)
      )
  ),
  all_dates AS (
    SELECT w.report_date
    FROM window_dates w
    WHERE NOT EXISTS (SELECT 1 FROM spot_locked sl WHERE sl.report_date = w.report_date)
    UNION
    SELECT report_date FROM late_dates
  )
  SELECT
    ad.report_date,
    EXISTS (
      SELECT 1
      FROM public.daily_reports dr
      WHERE dr.mr_id = p_mr_id
        AND dr.report_date = ad.report_date
        AND dr.status = 'submitted'
    ) AS already_submitted,
    public.dcr_day_type_for_mr(p_mr_id, ad.report_date) AS day_type,
    (
      ad.report_date < public.today_ist()
      AND EXISTS (
        SELECT 1
        FROM public.dcr_late_fill_slots s
        WHERE s.mr_id = p_mr_id
          AND s.report_date = ad.report_date
          AND s.consumed_at IS NULL
      )
      AND (
        ad.report_date < public.today_ist() - 2
        OR EXISTS (SELECT 1 FROM spot_locked sl WHERE sl.report_date = ad.report_date)
      )
    ) AS is_late_slot
  FROM all_dates ad
  ORDER BY ad.report_date DESC;
$$;

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
        'You can submit tomorrow''s plan now. Submit it before 10:00 AM. After the 11:00 AM reminder it cannot be submitted.',
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
      WHEN 'remind_1030' THEN 'Submit today''s plan now. After 11:00 AM it cannot be submitted.'
      ELSE 'Today''s plan was not submitted. It can no longer be submitted. Spot working is off, and DCRs can be filed normally.'
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
