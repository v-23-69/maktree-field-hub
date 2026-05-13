-- Fix 403 on leave_requests: old policies referenced auth.users (not readable by JWT role).
-- Align with expense_reports pattern: public.users + mr_manager_map only.

ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS leave_manager_admin ON public.leave_requests;
DROP POLICY IF EXISTS leave_mr_own ON public.leave_requests;

CREATE POLICY leave_requests_select_scope ON public.leave_requests
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.users me
    WHERE me.auth_user_id = auth.uid()
      AND me.is_active = true
      AND (
        me.role::text = 'admin'
        OR me.id = leave_requests.mr_id
        OR me.id = leave_requests.manager_id
        OR (
          me.role::text = 'manager'
          AND EXISTS (
            SELECT 1
            FROM public.mr_manager_map mm
            WHERE mm.manager_id = me.id
              AND mm.mr_id = leave_requests.mr_id
          )
        )
      )
  )
);

CREATE POLICY leave_requests_insert_mr ON public.leave_requests
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.users me
    WHERE me.auth_user_id = auth.uid()
      AND me.is_active = true
      AND (
        me.role::text = 'admin'
        OR (me.role::text = 'mr' AND me.id = leave_requests.mr_id)
      )
  )
);

CREATE POLICY leave_requests_update_scope ON public.leave_requests
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.users me
    WHERE me.auth_user_id = auth.uid()
      AND me.is_active = true
      AND (
        me.role::text = 'admin'
        OR me.id = leave_requests.mr_id
        OR me.id = leave_requests.manager_id
        OR (
          me.role::text = 'manager'
          AND EXISTS (
            SELECT 1
            FROM public.mr_manager_map mm
            WHERE mm.manager_id = me.id
              AND mm.mr_id = leave_requests.mr_id
          )
        )
      )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.users me
    WHERE me.auth_user_id = auth.uid()
      AND me.is_active = true
      AND (
        me.role::text = 'admin'
        OR me.id = leave_requests.mr_id
        OR me.id = leave_requests.manager_id
        OR (
          me.role::text = 'manager'
          AND EXISTS (
            SELECT 1
            FROM public.mr_manager_map mm
            WHERE mm.manager_id = me.id
              AND mm.mr_id = leave_requests.mr_id
          )
        )
      )
  )
);
