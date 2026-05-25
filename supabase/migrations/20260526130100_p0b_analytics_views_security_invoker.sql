-- P0b: Definer analytics views → security_invoker (reversible via RESET).
-- Rollback: 20260526130300_p0b_rollback_analytics_views_security_invoker.sql
-- Five views already invoker: v_area_performance, v_competitor_intelligence,
-- v_competitor_summary, v_doctor_loyalty, v_monthly_support_summary

ALTER VIEW public.v_dcr_daily_status SET (security_invoker = true);
ALTER VIEW public.v_dcr_monthly_summary SET (security_invoker = true);
ALTER VIEW public.v_doctor_last_visit SET (security_invoker = true);
ALTER VIEW public.v_expense_by_category SET (security_invoker = true);
ALTER VIEW public.v_expense_monthly_summary SET (security_invoker = true);
ALTER VIEW public.v_master_list_completion SET (security_invoker = true);
ALTER VIEW public.v_target_achievement SET (security_invoker = true);
ALTER VIEW public.v_tour_plan_vs_actual SET (security_invoker = true);
ALTER VIEW public.v_visit_detail SET (security_invoker = true);
