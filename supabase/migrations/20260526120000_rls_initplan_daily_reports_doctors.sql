-- RLS initplan optimization: evaluate auth/session helpers once per query, not per row.
-- Rollback: re-apply prior policy definitions from pg_policies snapshot (2026-05-26).

-- daily_reports
DROP POLICY IF EXISTS mr_own_reports ON public.daily_reports;
CREATE POLICY mr_own_reports ON public.daily_reports
  FOR ALL
  TO public
  USING (
    current_user_role() = 'mr'
    AND mr_id = (SELECT current_app_user_id())
  );

DROP POLICY IF EXISTS manager_all_reports ON public.daily_reports;
CREATE POLICY manager_all_reports ON public.daily_reports
  FOR ALL
  TO authenticated
  USING (
    current_user_role() = 'manager'
    AND (
      mr_id = (SELECT current_app_user_id())
      OR mr_id IN (
        SELECT mm.mr_id
        FROM mr_manager_map mm
        WHERE mm.manager_id = (SELECT current_app_user_id())
      )
    )
  )
  WITH CHECK (
    current_user_role() = 'manager'
    AND mr_id = (SELECT current_app_user_id())
  );

-- doctors
DROP POLICY IF EXISTS all_read_doctors ON public.doctors;
CREATE POLICY all_read_doctors ON public.doctors
  FOR SELECT
  TO public
  USING (
    (SELECT auth.uid()) IS NOT NULL
    AND is_active = true
  );

DROP POLICY IF EXISTS mr_insert_own_doctors ON public.doctors;
CREATE POLICY mr_insert_own_doctors ON public.doctors
  FOR INSERT
  TO authenticated
  WITH CHECK (
    is_active = true
    AND EXISTS (
      SELECT 1
      FROM mr_sub_area_access msa
      WHERE msa.sub_area_id = doctors.sub_area_id
        AND msa.mr_id = (SELECT session_profile_id())
    )
  );

DROP POLICY IF EXISTS mr_update_own_doctors ON public.doctors;
CREATE POLICY mr_update_own_doctors ON public.doctors
  FOR UPDATE
  TO authenticated
  USING (
    is_active = true
    AND EXISTS (
      SELECT 1
      FROM mr_sub_area_access msa
      WHERE msa.sub_area_id = doctors.sub_area_id
        AND msa.mr_id = (SELECT session_profile_id())
    )
  )
  WITH CHECK (
    is_active = true
    AND EXISTS (
      SELECT 1
      FROM mr_sub_area_access msa
      WHERE msa.sub_area_id = doctors.sub_area_id
        AND msa.mr_id = (SELECT session_profile_id())
    )
  );

DROP POLICY IF EXISTS manager_team_doctors_update ON public.doctors;
CREATE POLICY manager_team_doctors_update ON public.doctors
  FOR UPDATE
  TO authenticated
  USING (
    current_user_role() = 'manager'
    AND EXISTS (
      SELECT 1
      FROM mr_manager_map mmm
      JOIN mr_sub_area_access msa ON msa.mr_id = mmm.mr_id
      WHERE mmm.manager_id = (SELECT session_profile_id())
        AND msa.sub_area_id = doctors.sub_area_id
    )
  )
  WITH CHECK (
    current_user_role() = 'manager'
    AND EXISTS (
      SELECT 1
      FROM mr_manager_map mmm
      JOIN mr_sub_area_access msa ON msa.mr_id = mmm.mr_id
      WHERE mmm.manager_id = (SELECT session_profile_id())
        AND msa.sub_area_id = doctors.sub_area_id
    )
  );
