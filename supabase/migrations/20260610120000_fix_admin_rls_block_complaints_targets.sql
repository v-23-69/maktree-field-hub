-- Fix admin 403 on block_complaints and targets: use current_user_role() (public.users)
-- instead of auth.users.raw_app_meta_data which may be missing from JWT.

-- ---------------------------------------------------------------------------
-- block_complaints
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS complaints_admin ON public.block_complaints;
DROP POLICY IF EXISTS complaints_own ON public.block_complaints;
DROP POLICY IF EXISTS block_complaints_select_admin ON public.block_complaints;

CREATE POLICY block_complaints_admin_all ON public.block_complaints
  FOR ALL TO authenticated
  USING (public.current_user_role() = 'admin')
  WITH CHECK (public.current_user_role() = 'admin');

CREATE POLICY block_complaints_own_insert ON public.block_complaints
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = (
      SELECT u.id FROM public.users u
      WHERE u.auth_user_id = auth.uid()
      LIMIT 1
    )
  );

CREATE POLICY block_complaints_own_select ON public.block_complaints
  FOR SELECT TO authenticated
  USING (
    user_id = (
      SELECT u.id FROM public.users u
      WHERE u.auth_user_id = auth.uid()
      LIMIT 1
    )
  );

-- ---------------------------------------------------------------------------
-- targets
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS targets_manager_admin_all ON public.targets;
DROP POLICY IF EXISTS targets_mr_read ON public.targets;

CREATE POLICY targets_admin_manager_all ON public.targets
  FOR ALL TO authenticated
  USING (public.current_user_role() IN ('admin', 'manager'))
  WITH CHECK (public.current_user_role() IN ('admin', 'manager'));

CREATE POLICY targets_mr_select_own ON public.targets
  FOR SELECT TO authenticated
  USING (
    mr_id = (
      SELECT u.id FROM public.users u
      WHERE u.auth_user_id = auth.uid()
        AND u.is_active = true
      LIMIT 1
    )
  );
