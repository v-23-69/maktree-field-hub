-- Rollback P0a: restore broad grants on analytics views (pre-2026-05-26 state).

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
    EXECUTE format(
      'GRANT SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON TABLE public.%I TO anon',
      v
    );
    EXECUTE format(
      'GRANT SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON TABLE public.%I TO authenticated',
      v
    );
  END LOOP;
END $$;
