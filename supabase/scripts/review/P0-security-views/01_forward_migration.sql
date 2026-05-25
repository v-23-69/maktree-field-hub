-- =============================================================================
-- P0 FORWARD MIGRATION (REVIEW ONLY — DO NOT APPLY UNTIL SIGN-OFF)
-- Project: maktree-field-hub (limgkjuywvudkxnantda)
-- Captured: 2026-05-26
--
-- Apply in two steps for safest rollout:
--   P0a: Section A only (grants)
--   P0b: Section B only (security_invoker on 9 views)
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- SECTION A — P0a: View grants → SELECT-only for API roles
-- Affects: ALL 14 public analytics views (v_*)
-- Expected behavior: No app change (client only .select() reads)
-- Risk: LOW
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
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon', v);
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM authenticated', v);
    EXECUTE format('GRANT SELECT ON TABLE public.%I TO anon', v);
    EXECUTE format('GRANT SELECT ON TABLE public.%I TO authenticated', v);
  END LOOP;
END $$;

-- -----------------------------------------------------------------------------
-- SECTION B — P0b: Enable security_invoker on definer views
-- Affects: 9 views (currently reloptions security_invoker IS NULL)
-- Already invoker (no ALTER needed): v_area_performance, v_competitor_intelligence,
--   v_competitor_summary, v_doctor_loyalty, v_monthly_support_summary
--
-- Expected behavior AFTER P0b:
--   • Queries evaluate RLS on underlying tables as the logged-in user.
--   • MR sees only own/territory-scoped analytics (not other MRs via view bypass).
--   • Manager sees team-scoped rows per daily_reports / users / doctors policies.
--   • Admin sees per admin policies on base tables (or RPC paths).
--   • Rows may DECREASE vs definer views — that is correct tightening, not a bug.
-- Risk: MEDIUM — validate checklist before production
-- -----------------------------------------------------------------------------

ALTER VIEW public.v_dcr_daily_status SET (security_invoker = true);
ALTER VIEW public.v_dcr_monthly_summary SET (security_invoker = true);
ALTER VIEW public.v_doctor_last_visit SET (security_invoker = true);
ALTER VIEW public.v_expense_by_category SET (security_invoker = true);
ALTER VIEW public.v_expense_monthly_summary SET (security_invoker = true);
ALTER VIEW public.v_master_list_completion SET (security_invoker = true);
ALTER VIEW public.v_target_achievement SET (security_invoker = true);
ALTER VIEW public.v_tour_plan_vs_actual SET (security_invoker = true);
ALTER VIEW public.v_visit_detail SET (security_invoker = true);

COMMIT;

-- Post-apply verification (run manually):
-- SELECT relname, reloptions FROM pg_class c
--   JOIN pg_namespace n ON n.oid = c.relnamespace
--   WHERE n.nspname = 'public' AND c.relkind = 'v' AND relname LIKE 'v_%'
--   ORDER BY relname;
