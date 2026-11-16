-- Live reminder jobs were still the pre-start version and could mark 16 Nov as missed.
-- Skip every plan reminder and the end-of-day note until the day itself is 17 Nov 2026.
-- Tonight's 6:00 PM unlock still runs, because its target date is 17 Nov.

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

REVOKE ALL ON FUNCTION public.cron_field_plan_alerts(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cron_field_eod_summaries() FROM PUBLIC;
