-- =============================================================================
-- P0 ROLLBACK MIGRATION (REVIEW ONLY)
-- Restores production state as of 2026-05-26 audit (definer views + broad grants)
-- Run only if P0a/P0b causes regression. Can roll back P0b alone (Section B only).
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- SECTION B rollback — Restore definer semantics on 9 views
-- -----------------------------------------------------------------------------

ALTER VIEW public.v_dcr_daily_status RESET (security_invoker);
ALTER VIEW public.v_dcr_monthly_summary RESET (security_invoker);
ALTER VIEW public.v_doctor_last_visit RESET (security_invoker);
ALTER VIEW public.v_expense_by_category RESET (security_invoker);
ALTER VIEW public.v_expense_monthly_summary RESET (security_invoker);
ALTER VIEW public.v_master_list_completion RESET (security_invoker);
ALTER VIEW public.v_target_achievement RESET (security_invoker);
ALTER VIEW public.v_tour_plan_vs_actual RESET (security_invoker);
ALTER VIEW public.v_visit_detail RESET (security_invoker);

-- -----------------------------------------------------------------------------
-- SECTION A rollback — Restore broad table grants on all 14 views
-- (Matches pre-P0a information_schema grants audit)
-- -----------------------------------------------------------------------------

DO $$
DECLARE
  v text;
  views text[] := ARRAY[
    'v_area_performance',
    'v_competitor_intelligence',
    'v_competitor_summary',
    'v_dcr_daily_status',
    'v_dcr_monthly_summary',
    'v_doctor_last_visit',
    'v_doctor_loyalty',
    'v_expense_by_category',
    'v_expense_monthly_summary',
    'v_master_list_completion',
    'v_monthly_support_summary',
    'v_target_achievement',
    'v_tour_plan_vs_actual',
    'v_visit_detail'
  ];
BEGIN
  FOREACH v IN ARRAY views LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON TABLE public.%I TO anon', v);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON TABLE public.%I TO authenticated', v);
  END LOOP;
END $$;

COMMIT;
