-- P0a: Analytics views — SELECT-only for API roles (reversible).
-- Rollback: 20260526130200_p0a_rollback_analytics_views_grants.sql

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
