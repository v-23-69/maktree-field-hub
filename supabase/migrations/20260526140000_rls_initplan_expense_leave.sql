-- RLS initplan: expense_reports + leave_requests (auth.uid() evaluated once per query).
-- Rollback: 20260526140100_rollback_rls_initplan_expense_leave.sql

DROP POLICY IF EXISTS expense_reports_select_scope ON public.expense_reports;
CREATE POLICY expense_reports_select_scope ON public.expense_reports
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users me
      WHERE me.auth_user_id = (SELECT auth.uid())
        AND (
          me.role = 'admin'
          OR me.id = expense_reports.mr_id
          OR (
            me.role = 'manager'
            AND EXISTS (
              SELECT 1 FROM public.mr_manager_map mm
              WHERE mm.manager_id = me.id AND mm.mr_id = expense_reports.mr_id
            )
          )
        )
    )
  );

DROP POLICY IF EXISTS expense_reports_insert_mr ON public.expense_reports;
CREATE POLICY expense_reports_insert_mr ON public.expense_reports
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users me
      WHERE me.auth_user_id = (SELECT auth.uid())
        AND (me.role = 'admin' OR me.id = expense_reports.mr_id)
    )
  );

DROP POLICY IF EXISTS expense_reports_update_scope ON public.expense_reports;
CREATE POLICY expense_reports_update_scope ON public.expense_reports
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users me
      WHERE me.auth_user_id = (SELECT auth.uid())
        AND (
          me.role = 'admin'
          OR me.id = expense_reports.mr_id
          OR (
            me.role = 'manager'
            AND EXISTS (
              SELECT 1 FROM public.mr_manager_map mm
              WHERE mm.manager_id = me.id AND mm.mr_id = expense_reports.mr_id
            )
          )
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users me
      WHERE me.auth_user_id = (SELECT auth.uid())
        AND (
          me.role = 'admin'
          OR me.id = expense_reports.mr_id
          OR (
            me.role = 'manager'
            AND EXISTS (
              SELECT 1 FROM public.mr_manager_map mm
              WHERE mm.manager_id = me.id AND mm.mr_id = expense_reports.mr_id
            )
          )
        )
    )
  );

DROP POLICY IF EXISTS leave_requests_select_scope ON public.leave_requests;
CREATE POLICY leave_requests_select_scope ON public.leave_requests
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users me
      WHERE me.auth_user_id = (SELECT auth.uid())
        AND me.is_active = true
        AND (
          me.role = 'admin'
          OR me.id = leave_requests.mr_id
          OR me.id = leave_requests.manager_id
          OR (
            me.role = 'manager'
            AND EXISTS (
              SELECT 1 FROM public.mr_manager_map mm
              WHERE mm.manager_id = me.id AND mm.mr_id = leave_requests.mr_id
            )
          )
        )
    )
  );

DROP POLICY IF EXISTS leave_requests_insert_mr ON public.leave_requests;
CREATE POLICY leave_requests_insert_mr ON public.leave_requests
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users me
      WHERE me.auth_user_id = (SELECT auth.uid())
        AND me.is_active = true
        AND (
          me.role = 'admin'
          OR (me.role = 'mr' AND me.id = leave_requests.mr_id)
        )
    )
  );

DROP POLICY IF EXISTS leave_requests_update_scope ON public.leave_requests;
CREATE POLICY leave_requests_update_scope ON public.leave_requests
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users me
      WHERE me.auth_user_id = (SELECT auth.uid())
        AND me.is_active = true
        AND (
          me.role = 'admin'
          OR me.id = leave_requests.mr_id
          OR me.id = leave_requests.manager_id
          OR (
            me.role = 'manager'
            AND EXISTS (
              SELECT 1 FROM public.mr_manager_map mm
              WHERE mm.manager_id = me.id AND mm.mr_id = leave_requests.mr_id
            )
          )
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users me
      WHERE me.auth_user_id = (SELECT auth.uid())
        AND me.is_active = true
        AND (
          me.role = 'admin'
          OR me.id = leave_requests.mr_id
          OR me.id = leave_requests.manager_id
          OR (
            me.role = 'manager'
            AND EXISTS (
              SELECT 1 FROM public.mr_manager_map mm
              WHERE mm.manager_id = me.id AND mm.mr_id = leave_requests.mr_id
            )
          )
        )
    )
  );
