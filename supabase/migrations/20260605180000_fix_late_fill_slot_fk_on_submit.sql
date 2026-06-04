-- Fix FK violation on dcr_late_fill_slots.consumed_report_id:
-- BEFORE INSERT trigger consumed slots using NEW.id before the daily_reports row existed.

CREATE OR REPLACE FUNCTION public._consume_late_fill_slot_for_report(
  p_mr_id uuid,
  p_report_date date,
  p_report_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF p_report_id IS NULL THEN
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.daily_reports dr WHERE dr.id = p_report_id
  ) THEN
    RETURN;
  END IF;

  UPDATE public.dcr_late_fill_slots s
  SET
    consumed_at = COALESCE(s.consumed_at, now()),
    consumed_report_id = COALESCE(s.consumed_report_id, p_report_id)
  WHERE s.mr_id = p_mr_id
    AND s.report_date = p_report_date
    AND s.consumed_at IS NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_mark_late_submission_on_submit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status = 'submitted'
    AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'submitted')
  THEN
    IF EXISTS (
      SELECT 1
      FROM public.dcr_late_fill_slots s
      WHERE s.mr_id = NEW.mr_id
        AND s.report_date = NEW.report_date
        AND s.consumed_at IS NULL
    ) THEN
      NEW.is_late_submission := true;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_consume_late_fill_slot_after_submit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status = 'submitted'
    AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'submitted')
  THEN
    PERFORM public._consume_late_fill_slot_for_report(NEW.mr_id, NEW.report_date, NEW.id);
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_daily_reports_consume_late_slot ON public.daily_reports;

DROP TRIGGER IF EXISTS trg_daily_reports_mark_late_before ON public.daily_reports;
CREATE TRIGGER trg_daily_reports_mark_late_before
  BEFORE INSERT OR UPDATE OF status ON public.daily_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_mark_late_submission_on_submit();

DROP TRIGGER IF EXISTS trg_daily_reports_consume_late_after ON public.daily_reports;
CREATE TRIGGER trg_daily_reports_consume_late_after
  AFTER INSERT OR UPDATE OF status ON public.daily_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_consume_late_fill_slot_after_submit();

-- Drop obsolete combined trigger function (replaced by split before/after handlers).
DROP FUNCTION IF EXISTS public.trg_consume_late_fill_slot_on_submit();
