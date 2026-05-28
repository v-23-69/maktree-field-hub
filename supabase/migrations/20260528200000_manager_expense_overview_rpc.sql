-- Manager team expense rollup (bypasses view + direct expense_items 403 for managers).

CREATE OR REPLACE FUNCTION public.get_manager_team_expense_overview(p_mr_ids uuid[], p_month date)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_role text;
  v_month_start date;
  v_month_end date;
  v_allotted numeric;
  v_used numeric;
  v_by_cat jsonb;
BEGIN
  SELECT u.id, u.role::text INTO v_user_id, v_role
  FROM public.users u
  WHERE u.auth_user_id = auth.uid()
    AND u.is_active = true;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF v_role NOT IN ('admin', 'manager') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  IF v_role = 'manager' AND array_length(p_mr_ids, 1) > 0 THEN
    IF EXISTS (
      SELECT 1
      FROM unnest(p_mr_ids) AS mid(mr_id)
      WHERE mid.mr_id IS DISTINCT FROM v_user_id
        AND NOT EXISTS (
          SELECT 1
          FROM public.mr_manager_map mm
          WHERE mm.manager_id = v_user_id
            AND mm.mr_id = mid.mr_id
        )
    ) THEN
      RAISE EXCEPTION 'Forbidden';
    END IF;
  END IF;

  v_month_start := date_trunc('month', COALESCE(p_month, current_date))::date;
  v_month_end := (v_month_start + interval '1 month')::date;

  SELECT
    COALESCE(SUM(er.daily_limit), 0),
    COALESCE(SUM(er.total_used), 0)
  INTO v_allotted, v_used
  FROM public.expense_reports er
  WHERE (p_mr_ids IS NULL OR cardinality(p_mr_ids) = 0 OR er.mr_id = ANY(p_mr_ids))
    AND er.report_date >= v_month_start
    AND er.report_date < v_month_end;

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object('name', s.category, 'amount', s.amt)
      ORDER BY s.amt DESC
    ),
    '[]'::jsonb
  )
  INTO v_by_cat
  FROM (
    SELECT ei.category AS category, SUM(ei.amount)::numeric AS amt
    FROM public.expense_items ei
    INNER JOIN public.expense_reports er ON er.id = ei.expense_report_id
    WHERE (p_mr_ids IS NULL OR cardinality(p_mr_ids) = 0 OR er.mr_id = ANY(p_mr_ids))
      AND er.report_date >= v_month_start
      AND er.report_date < v_month_end
    GROUP BY ei.category
  ) s;

  RETURN jsonb_build_object(
    'totals', jsonb_build_object('allotted', v_allotted, 'used', v_used),
    'byCategory', v_by_cat
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_manager_team_expense_overview(uuid[], date) TO authenticated;

ALTER VIEW IF EXISTS public.v_expense_by_category RESET (security_invoker);
ALTER VIEW IF EXISTS public.v_expense_monthly_summary RESET (security_invoker);

GRANT SELECT ON TABLE public.v_expense_by_category TO authenticated;
GRANT SELECT ON TABLE public.v_expense_monthly_summary TO authenticated;
GRANT SELECT ON TABLE public.expense_items TO authenticated;
GRANT SELECT ON TABLE public.expense_reports TO authenticated;
