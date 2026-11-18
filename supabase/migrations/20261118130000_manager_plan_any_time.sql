-- Managers can submit today's plan at any time. MRs still close at 11:00 AM.
-- Tomorrow still opens at 6:00 PM for both.

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
  IF p_plan_date = v_today AND public.current_user_role() = 'manager' THEN
    RETURN 'open';
  END IF;
  IF v_minutes < 11 * 60 THEN RETURN 'open'; END IF;
  RETURN 'closed';
END;
$$;

CREATE OR REPLACE FUNCTION public.cron_field_plan_alerts(p_slot text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
        CASE WHEN v_user.role = 'manager'
          THEN 'You can submit tomorrow''s plan now. Today''s plan can be submitted any time.'
          ELSE 'You can submit tomorrow''s plan now. Submit it before 10:00 AM. After the 11:00 AM reminder it cannot be submitted.'
        END,
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

    IF p_slot = 'remind_1100' AND v_user.role = 'mr' THEN
      INSERT INTO public.field_plans (user_id, plan_date, kind, status, note, submitted_at)
      VALUES (
        v_user.id, v_target, 'daily', 'missed',
        'Daily plan was not submitted. Spot working is off. DCRs can be filed normally and will carry this remark.',
        now()
      )
      ON CONFLICT (user_id, plan_date) WHERE kind = 'daily' DO NOTHING;
    END IF;

    IF v_user.role = 'manager' THEN
      v_title := 'Plan still open';
      v_body := 'Today''s plan can still be submitted. There is no 11:00 AM close for a manager.';
    ELSE
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
    END IF;

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
$function$;

-- The 11:00 AM job already marked today's manager plans missed. Clear those empty marks.
DELETE FROM public.field_plans fp
USING public.users u
WHERE u.id = fp.user_id
  AND u.role = 'manager'
  AND fp.kind = 'daily'
  AND fp.status = 'missed'
  AND fp.plan_date = public.today_ist()
  AND NOT EXISTS (
    SELECT 1 FROM public.field_plan_calls c WHERE c.plan_id = fp.id
  );
