-- Manager analytics: expense views and line items must be readable for team rollups.
-- security_invoker on these views caused 403 when underlying RLS did not match view joins.

ALTER VIEW IF EXISTS public.v_expense_by_category RESET (security_invoker);
ALTER VIEW IF EXISTS public.v_expense_monthly_summary RESET (security_invoker);

GRANT SELECT ON TABLE public.v_expense_by_category TO authenticated;
GRANT SELECT ON TABLE public.v_expense_monthly_summary TO authenticated;

GRANT SELECT ON TABLE public.expense_items TO authenticated;
GRANT SELECT ON TABLE public.expense_reports TO authenticated;
