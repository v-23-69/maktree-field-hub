-- Rollback P0b: restore definer semantics on nine views.

ALTER VIEW public.v_dcr_daily_status RESET (security_invoker);
ALTER VIEW public.v_dcr_monthly_summary RESET (security_invoker);
ALTER VIEW public.v_doctor_last_visit RESET (security_invoker);
ALTER VIEW public.v_expense_by_category RESET (security_invoker);
ALTER VIEW public.v_expense_monthly_summary RESET (security_invoker);
ALTER VIEW public.v_master_list_completion RESET (security_invoker);
ALTER VIEW public.v_target_achievement RESET (security_invoker);
ALTER VIEW public.v_tour_plan_vs_actual RESET (security_invoker);
ALTER VIEW public.v_visit_detail RESET (security_invoker);
