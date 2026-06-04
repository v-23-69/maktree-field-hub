-- Late DCR: auto-consume slots when DCR is submitted; backfill orphans.
-- Tour program: manager import from MR with optional dual apply + notification.
-- Backup audit log + scale indexes.

-- ---------------------------------------------------------------------------
-- Late DCR slot consumption
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public._consume_late_fill_slot_for_report(p_mr_id uuid, p_report_date date, p_report_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.dcr_late_fill_slots s
  SET
    consumed_at = COALESCE(s.consumed_at, now()),
    consumed_report_id = COALESCE(s.consumed_report_id, p_report_id)
  WHERE s.mr_id = p_mr_id
    AND s.report_date = p_report_date
    AND s.consumed_at IS NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_consume_late_fill_slot_on_submit()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_had_slot boolean;
BEGIN
  IF NEW.status = 'submitted'
    AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'submitted')
  THEN
    SELECT EXISTS (
      SELECT 1 FROM public.dcr_late_fill_slots s
      WHERE s.mr_id = NEW.mr_id
        AND s.report_date = NEW.report_date
        AND s.consumed_at IS NULL
    ) INTO v_had_slot;

    IF v_had_slot THEN
      NEW.is_late_submission := true;
    END IF;

    PERFORM public._consume_late_fill_slot_for_report(NEW.mr_id, NEW.report_date, NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_daily_reports_consume_late_slot ON public.daily_reports;
CREATE TRIGGER trg_daily_reports_consume_late_slot
  BEFORE INSERT OR UPDATE OF status ON public.daily_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_consume_late_fill_slot_on_submit();

-- Backfill: close slots where a submitted DCR already exists
UPDATE public.dcr_late_fill_slots s
SET
  consumed_at = COALESCE(s.consumed_at, dr.submitted_at, dr.created_at, now()),
  consumed_report_id = COALESCE(s.consumed_report_id, dr.id)
FROM public.daily_reports dr
WHERE s.mr_id = dr.mr_id
  AND s.report_date = dr.report_date
  AND dr.status = 'submitted'
  AND s.consumed_at IS NULL;

CREATE OR REPLACE FUNCTION public.count_active_late_fill_slots(p_mr_id uuid)
RETURNS integer
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COUNT(*)::integer
  FROM public.dcr_late_fill_slots s
  WHERE s.mr_id = p_mr_id
    AND s.consumed_at IS NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.daily_reports dr
      WHERE dr.mr_id = s.mr_id
        AND dr.report_date = s.report_date
        AND dr.status = 'submitted'
    );
$$;

CREATE OR REPLACE FUNCTION public.list_active_late_fill_slots(p_mr_id uuid)
RETURNS TABLE(slot_id uuid, report_date date)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT s.id AS slot_id, s.report_date
  FROM public.dcr_late_fill_slots s
  WHERE s.mr_id = p_mr_id
    AND s.consumed_at IS NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.daily_reports dr
      WHERE dr.mr_id = s.mr_id
        AND dr.report_date = s.report_date
        AND dr.status = 'submitted'
    )
  ORDER BY s.report_date ASC;
$$;

-- Keep submit_daily_report in sync (consume slot atomically)
CREATE OR REPLACE FUNCTION public.submit_daily_report(p_report_id uuid)
RETURNS public.daily_reports
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_me uuid;
  v_row public.daily_reports%ROWTYPE;
  v_slot_id uuid;
BEGIN
  SELECT u.id INTO v_me
  FROM public.users u
  WHERE u.auth_user_id = auth.uid() AND u.is_active = true
  LIMIT 1;

  IF v_me IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_row
  FROM public.daily_reports
  WHERE id = p_report_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Report not found';
  END IF;

  IF v_row.mr_id <> v_me AND NOT EXISTS (
    SELECT 1 FROM public.mr_manager_map mm
    WHERE mm.manager_id = v_me AND mm.mr_id = v_row.mr_id
  ) AND (SELECT current_user_role()) <> 'admin' THEN
    RAISE EXCEPTION 'Not allowed to submit this report';
  END IF;

  IF v_row.status = 'submitted' THEN
    RAISE EXCEPTION 'Report already submitted';
  END IF;

  IF NOT public.is_report_date_fillable(v_row.mr_id, v_row.report_date) THEN
    RAISE EXCEPTION 'This date is not open for DCR submission';
  END IF;

  SELECT s.id INTO v_slot_id
  FROM public.dcr_late_fill_slots s
  WHERE s.mr_id = v_row.mr_id
    AND s.report_date = v_row.report_date
    AND s.consumed_at IS NULL
  LIMIT 1;

  UPDATE public.daily_reports
  SET
    status = 'submitted',
    submitted_at = now(),
    is_late_submission = (v_slot_id IS NOT NULL)
  WHERE id = p_report_id
  RETURNING * INTO v_row;

  IF v_slot_id IS NOT NULL THEN
    PERFORM public._consume_late_fill_slot_for_report(v_row.mr_id, v_row.report_date, p_report_id);
  END IF;

  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_daily_report(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- Manager tour program import from MR
-- p_entries: [{ "work_date": "2026-06-03", "sub_area_id": "uuid", "apply_to": "self"|"both" }]
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.manager_import_tour_program(
  p_source_mr_id uuid,
  p_month date,
  p_entries jsonb
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_me uuid;
  v_role text;
  v_mgr_name text;
  v_source_name text;
  v_self_tp_id uuid;
  v_source_tp_id uuid;
  v_entry jsonb;
  v_work_date date;
  v_sub_area_id uuid;
  v_apply_to text;
  v_self_count int := 0;
  v_both_count int := 0;
  v_month_label text;
BEGIN
  SELECT u.id, u.role::text, u.full_name INTO v_me, v_role, v_mgr_name
  FROM public.users u
  WHERE u.auth_user_id = auth.uid() AND u.is_active = true
  LIMIT 1;

  IF v_me IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF v_role <> 'manager' THEN
    RAISE EXCEPTION 'Only managers can import tour programs';
  END IF;

  IF p_source_mr_id = v_me THEN
    RAISE EXCEPTION 'Select a team MR as the source';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.mr_manager_map mm
    WHERE mm.manager_id = v_me AND mm.mr_id = p_source_mr_id
  ) THEN
    RAISE EXCEPTION 'This MR is not on your team';
  END IF;

  IF p_entries IS NULL OR jsonb_typeof(p_entries) <> 'array' OR jsonb_array_length(p_entries) = 0 THEN
    RAISE EXCEPTION 'Select at least one day to import';
  END IF;

  SELECT full_name INTO v_source_name FROM public.users WHERE id = p_source_mr_id;

  INSERT INTO public.tour_programs (mr_id, month, manager_id, status)
  VALUES (v_me, p_month, NULL, 'draft')
  ON CONFLICT (mr_id, month) DO NOTHING;

  SELECT id INTO v_self_tp_id
  FROM public.tour_programs
  WHERE mr_id = v_me AND month = p_month
  LIMIT 1;

  IF v_self_tp_id IS NULL THEN
    RAISE EXCEPTION 'Could not create manager tour program';
  END IF;

  SELECT id INTO v_source_tp_id
  FROM public.tour_programs
  WHERE mr_id = p_source_mr_id AND month = p_month
  LIMIT 1;

  v_month_label := to_char(p_month, 'Mon YYYY');

  FOR v_entry IN SELECT * FROM jsonb_array_elements(p_entries) LOOP
    v_work_date := (v_entry->>'work_date')::date;
    v_sub_area_id := NULLIF(v_entry->>'sub_area_id', '')::uuid;
    v_apply_to := COALESCE(NULLIF(v_entry->>'apply_to', ''), 'self');

    IF v_work_date IS NULL OR v_sub_area_id IS NULL THEN
      CONTINUE;
    END IF;

    IF v_apply_to NOT IN ('self', 'both') THEN
      RAISE EXCEPTION 'Invalid apply_to for %', v_work_date;
    END IF;

    INSERT INTO public.tour_program_entries (
      tour_program_id, work_date, sub_area_id, working_with, working_with_ids, day_type, notes
    )
    VALUES (v_self_tp_id, v_work_date, v_sub_area_id, NULL, '{}', 'working', NULL)
    ON CONFLICT (tour_program_id, work_date)
    DO UPDATE SET sub_area_id = EXCLUDED.sub_area_id;

    v_self_count := v_self_count + 1;

    IF v_apply_to = 'both' THEN
      IF v_source_tp_id IS NULL THEN
        INSERT INTO public.tour_programs (mr_id, month, manager_id, status)
        VALUES (p_source_mr_id, p_month, v_me, 'draft')
        ON CONFLICT (mr_id, month) DO NOTHING
        RETURNING id INTO v_source_tp_id;
        IF v_source_tp_id IS NULL THEN
          SELECT id INTO v_source_tp_id
          FROM public.tour_programs
          WHERE mr_id = p_source_mr_id AND month = p_month;
        END IF;
      END IF;

      INSERT INTO public.tour_program_entries (
        tour_program_id, work_date, sub_area_id, working_with, working_with_ids, day_type, notes
      )
      VALUES (v_source_tp_id, v_work_date, v_sub_area_id, NULL, '{}', 'working', NULL)
      ON CONFLICT (tour_program_id, work_date)
      DO UPDATE SET sub_area_id = EXCLUDED.sub_area_id;

      v_both_count := v_both_count + 1;
    END IF;
  END LOOP;

  IF v_self_count = 0 THEN
    RAISE EXCEPTION 'No valid days to import';
  END IF;

  IF v_both_count > 0 THEN
    BEGIN
      PERFORM public._notify_user(
        p_source_mr_id,
        'tour_program_updated',
        'Tour program updated',
        COALESCE(v_mgr_name, 'Your manager') || ' aligned your tour program for '
          || v_both_count::text || ' day(s) in ' || v_month_label || ' while planning together.',
        '/mr/tour-program',
        jsonb_build_object(
          'month', p_month,
          'manager_id', v_me,
          'days_updated', v_both_count
        )
      );
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END IF;

  RETURN jsonb_build_object(
    'self_days', v_self_count,
    'mr_days_updated', v_both_count,
    'tour_program_id', v_self_tp_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.manager_import_tour_program(uuid, date, jsonb) TO authenticated;

-- One-shot reconcile (callable from app when UI detects stale open slots)
CREATE OR REPLACE FUNCTION public.reconcile_late_fill_slots(p_mr_id uuid)
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_fixed int;
BEGIN
  UPDATE public.dcr_late_fill_slots s
  SET
    consumed_at = COALESCE(s.consumed_at, dr.submitted_at, dr.created_at, now()),
    consumed_report_id = COALESCE(s.consumed_report_id, dr.id)
  FROM public.daily_reports dr
  WHERE s.mr_id = p_mr_id
    AND s.mr_id = dr.mr_id
    AND s.report_date = dr.report_date
    AND dr.status = 'submitted'
    AND s.consumed_at IS NULL;

  GET DIAGNOSTICS v_fixed = ROW_COUNT;
  RETURN v_fixed;
END;
$$;

GRANT EXECUTE ON FUNCTION public.reconcile_late_fill_slots(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- Manager backup audit (month-end reminder)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.manager_backup_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  manager_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  backup_label text NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  subject_user_ids uuid[] NOT NULL DEFAULT '{}',
  file_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_manager_backup_logs_manager_created
  ON public.manager_backup_logs (manager_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_manager_backup_logs_manager_period
  ON public.manager_backup_logs (manager_id, period_start, period_end);

ALTER TABLE public.manager_backup_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS manager_backup_logs_select ON public.manager_backup_logs;
CREATE POLICY manager_backup_logs_select ON public.manager_backup_logs
  FOR SELECT TO authenticated
  USING (manager_id = (SELECT current_app_user_id()));

DROP POLICY IF EXISTS manager_backup_logs_insert ON public.manager_backup_logs;
CREATE POLICY manager_backup_logs_insert ON public.manager_backup_logs
  FOR INSERT TO authenticated
  WITH CHECK (manager_id = (SELECT current_app_user_id()));

CREATE OR REPLACE FUNCTION public.log_manager_backup(
  p_period_start date,
  p_period_end date,
  p_subject_user_ids uuid[],
  p_file_name text,
  p_backup_label text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_me uuid;
  v_role text;
  v_id uuid;
BEGIN
  SELECT u.id, u.role::text INTO v_me, v_role
  FROM public.users u
  WHERE u.auth_user_id = auth.uid() AND u.is_active = true
  LIMIT 1;

  IF v_me IS NULL OR v_role <> 'manager' THEN
    RAISE EXCEPTION 'Only managers can log backups';
  END IF;

  INSERT INTO public.manager_backup_logs (
    manager_id, backup_label, period_start, period_end, subject_user_ids, file_name
  )
  VALUES (
    v_me,
    COALESCE(NULLIF(trim(p_backup_label), ''), to_char(p_period_start, 'YYYY-MM')),
    p_period_start,
    p_period_end,
    COALESCE(p_subject_user_ids, '{}'),
    p_file_name
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.log_manager_backup(date, date, uuid[], text, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.manager_months_needing_backup(p_months_back int DEFAULT 3)
RETURNS TABLE(month_start date, month_label text)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_me uuid;
  v_role text;
  v_i int := 1;
  v_month date;
BEGIN
  SELECT u.id, u.role::text INTO v_me, v_role
  FROM public.users u
  WHERE u.auth_user_id = auth.uid() AND u.is_active = true
  LIMIT 1;

  IF v_me IS NULL OR v_role <> 'manager' THEN
    RETURN;
  END IF;

  WHILE v_i <= GREATEST(COALESCE(p_months_back, 3), 1) LOOP
    v_month := date_trunc('month', today_ist())::date - (v_i || ' months')::interval;
    IF v_month >= date_trunc('month', today_ist())::date THEN
      v_i := v_i + 1;
      CONTINUE;
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM public.manager_backup_logs bl
      WHERE bl.manager_id = v_me
        AND bl.period_start = v_month
        AND bl.period_end = (v_month + INTERVAL '1 month' - INTERVAL '1 day')::date
    ) THEN
      month_start := v_month;
      month_label := to_char(v_month, 'Month YYYY');
      RETURN NEXT;
    END IF;
    v_i := v_i + 1;
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION public.manager_months_needing_backup(int) TO authenticated;

-- ---------------------------------------------------------------------------
-- Scale indexes (safe IF NOT EXISTS)
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_daily_reports_mr_date_status
  ON public.daily_reports (mr_id, report_date DESC, status);

CREATE INDEX IF NOT EXISTS idx_daily_reports_submitted_at
  ON public.daily_reports (submitted_at DESC)
  WHERE status = 'submitted';

CREATE INDEX IF NOT EXISTS idx_report_visits_doctor_id
  ON public.report_visits (doctor_id);

CREATE INDEX IF NOT EXISTS idx_monthly_support_entries_visit_id
  ON public.monthly_support_entries (visit_id);

CREATE INDEX IF NOT EXISTS idx_doctors_sub_area_created
  ON public.doctors (sub_area_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_chemists_sub_area_created
  ON public.chemists (sub_area_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_tour_programs_mr_month
  ON public.tour_programs (mr_id, month DESC);

CREATE INDEX IF NOT EXISTS idx_dcr_late_fill_slots_active_mr
  ON public.dcr_late_fill_slots (mr_id)
  WHERE consumed_at IS NULL;
