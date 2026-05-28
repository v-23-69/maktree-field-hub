-- Expense line items: reliable access via session helpers + SECURITY DEFINER RPCs (fixes 403).
-- Manager: may delete team MR daily reports (re-fill allowed after delete).

GRANT SELECT, INSERT, DELETE, UPDATE ON public.expense_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.expense_reports TO authenticated;

ALTER TABLE public.expense_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS expense_items_select_scope ON public.expense_items;
CREATE POLICY expense_items_select_scope
ON public.expense_items
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.expense_reports er
    WHERE er.id = expense_items.expense_report_id
      AND public.session_can_access_mr_row(er.mr_id)
  )
);

DROP POLICY IF EXISTS expense_items_insert_scope ON public.expense_items;
CREATE POLICY expense_items_insert_scope
ON public.expense_items
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.expense_reports er
    WHERE er.id = expense_items.expense_report_id
      AND er.status = 'draft'
      AND er.mr_id = public.session_profile_id()
  )
);

DROP POLICY IF EXISTS expense_items_delete_scope ON public.expense_items;
CREATE POLICY expense_items_delete_scope
ON public.expense_items
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.expense_reports er
    WHERE er.id = expense_items.expense_report_id
      AND er.status = 'draft'
      AND er.mr_id = public.session_profile_id()
  )
);

-- ---------------------------------------------------------------------------
-- RPC: list / add / delete expense lines (bypasses RLS edge cases)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.list_expense_lines(p_expense_report_id uuid)
RETURNS SETOF public.expense_items
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ei.*
  FROM public.expense_items ei
  INNER JOIN public.expense_reports er ON er.id = ei.expense_report_id
  WHERE ei.expense_report_id = p_expense_report_id
    AND public.session_can_access_mr_row(er.mr_id)
  ORDER BY ei.created_at ASC;
$$;

CREATE OR REPLACE FUNCTION public.add_expense_line(
  p_expense_report_id uuid,
  p_category text,
  p_description text,
  p_amount numeric
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_mr_id uuid;
  v_status text;
  v_item_id uuid;
  v_total numeric;
BEGIN
  SELECT er.mr_id, er.status::text
  INTO v_mr_id, v_status
  FROM public.expense_reports er
  WHERE er.id = p_expense_report_id;

  IF v_mr_id IS NULL THEN
    RAISE EXCEPTION 'Expense report not found';
  END IF;

  IF v_mr_id IS DISTINCT FROM public.session_profile_id() THEN
    RAISE EXCEPTION 'Only the report owner can add expense lines';
  END IF;

  IF v_status IS DISTINCT FROM 'draft' THEN
    RAISE EXCEPTION 'Expense report is not editable';
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be greater than zero';
  END IF;

  INSERT INTO public.expense_items (expense_report_id, category, description, amount)
  VALUES (p_expense_report_id, p_category, NULLIF(trim(p_description), ''), p_amount)
  RETURNING id INTO v_item_id;

  SELECT COALESCE(SUM(amount), 0)
  INTO v_total
  FROM public.expense_items
  WHERE expense_report_id = p_expense_report_id;

  UPDATE public.expense_reports
  SET total_used = v_total
  WHERE id = p_expense_report_id;

  RETURN v_item_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_expense_line(p_item_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_report_id uuid;
  v_mr_id uuid;
  v_status text;
  v_total numeric;
BEGIN
  SELECT ei.expense_report_id, er.mr_id, er.status::text
  INTO v_report_id, v_mr_id, v_status
  FROM public.expense_items ei
  INNER JOIN public.expense_reports er ON er.id = ei.expense_report_id
  WHERE ei.id = p_item_id;

  IF v_report_id IS NULL THEN
    RAISE EXCEPTION 'Expense line not found';
  END IF;

  IF v_mr_id IS DISTINCT FROM public.session_profile_id() THEN
    RAISE EXCEPTION 'Only the report owner can delete expense lines';
  END IF;

  IF v_status IS DISTINCT FROM 'draft' THEN
    RAISE EXCEPTION 'Expense report is not editable';
  END IF;

  DELETE FROM public.expense_items WHERE id = p_item_id;

  SELECT COALESCE(SUM(amount), 0)
  INTO v_total
  FROM public.expense_items
  WHERE expense_report_id = v_report_id;

  UPDATE public.expense_reports
  SET total_used = v_total
  WHERE id = v_report_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.list_expense_lines(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_expense_line(uuid, text, text, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_expense_line(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- Manager may delete team MR daily reports (USING only — DELETE does not use WITH CHECK)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS manager_delete_team_reports ON public.daily_reports;
CREATE POLICY manager_delete_team_reports
ON public.daily_reports
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.users me
    WHERE me.auth_user_id = auth.uid()
      AND me.is_active = true
      AND me.role::text = 'manager'
      AND (
        daily_reports.mr_id = me.id
        OR EXISTS (
          SELECT 1
          FROM public.mr_manager_map mm
          WHERE mm.manager_id = me.id
            AND mm.mr_id = daily_reports.mr_id
        )
      )
  )
);
