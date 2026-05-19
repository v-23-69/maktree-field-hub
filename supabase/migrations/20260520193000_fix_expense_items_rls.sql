-- Ensure expense_items RLS allows MR/manager/admin to read line items on accessible reports.

DROP POLICY IF EXISTS expense_items_select_scope ON public.expense_items;
CREATE POLICY expense_items_select_scope
ON public.expense_items
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.expense_reports er
    JOIN public.users me ON me.auth_user_id = auth.uid()
    WHERE er.id = expense_items.expense_report_id
      AND (
        me.role::text = 'admin'
        OR me.id = er.mr_id
        OR (
          me.role::text = 'manager'
          AND EXISTS (
            SELECT 1
            FROM public.mr_manager_map mm
            WHERE mm.manager_id = me.id
              AND mm.mr_id = er.mr_id
          )
        )
      )
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
    JOIN public.users me ON me.auth_user_id = auth.uid()
    WHERE er.id = expense_items.expense_report_id
      AND er.status = 'draft'
      AND (
        me.role::text = 'admin'
        OR me.id = er.mr_id
      )
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
    JOIN public.users me ON me.auth_user_id = auth.uid()
    WHERE er.id = expense_items.expense_report_id
      AND er.status = 'draft'
      AND (
        me.role::text = 'admin'
        OR me.id = er.mr_id
      )
  )
);

GRANT SELECT, INSERT, DELETE ON public.expense_items TO authenticated;
