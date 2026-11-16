-- One notice per day when clinic capture keeps failing because GPS stays weak.
ALTER TABLE public.field_activity_points
  DROP CONSTRAINT IF EXISTS field_activity_points_event_type_check;

ALTER TABLE public.field_activity_points
  ADD CONSTRAINT field_activity_points_event_type_check
  CHECK (event_type IN (
    'ping', 'dcr_submit', 'plan_submit', 'priority_call',
    'location_capture', 'doctor_unavailable', 'gps_off', 'dcr_open', 'gps_weak'
  ));

CREATE OR REPLACE FUNCTION public.note_gps_weak()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := public.current_app_user_id();
  v_name text;
BEGIN
  IF v_uid IS NULL OR public.current_user_role() <> 'mr' THEN
    RETURN;
  END IF;

  SELECT full_name INTO v_name FROM public.users WHERE id = v_uid;
  IF public._scheduled_notify_once(
    v_uid, 'gps_weak', 'mr',
    'GPS is weak',
    'The phone GPS stayed weak after several tries. Capture the clinic location later.',
    '/mr/plan',
    jsonb_build_object('channel', 'maktree_reminders')
  ) THEN
    INSERT INTO public.field_activity_points (user_id, event_type, metadata)
    VALUES (v_uid, 'gps_weak', jsonb_build_object('source', 'capture'));
    PERFORM public._notify_mr_managers(
      v_uid, 'gps_weak',
      'MR GPS is weak',
      COALESCE(v_name, 'An MR') || ' tried to capture a clinic location, but the GPS stayed weak. They can try later.',
      '/manager/activity?mrId=' || v_uid::text,
      jsonb_build_object('mr_id', v_uid, 'channel', 'maktree_reminders')
    );
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.note_gps_weak() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.note_gps_weak() FROM anon;
GRANT EXECUTE ON FUNCTION public.note_gps_weak() TO authenticated;
