-- MRs can add doctors in sub-areas they are assigned to; fix admin/manager doctor writes.

DROP POLICY IF EXISTS mr_insert_own_doctors ON public.doctors;
CREATE POLICY mr_insert_own_doctors ON public.doctors
  FOR INSERT
  TO authenticated
  WITH CHECK (
    is_active = true
    AND EXISTS (
      SELECT 1 FROM public.mr_sub_area_access msa
      WHERE msa.sub_area_id = doctors.sub_area_id
        AND msa.mr_id = public.session_profile_id()
    )
  );

DROP POLICY IF EXISTS admin_manager_write_doctors ON public.doctors;
CREATE POLICY admin_manager_write_doctors ON public.doctors
  FOR ALL
  TO authenticated
  USING (public.current_user_role() IN ('admin', 'manager'))
  WITH CHECK (public.current_user_role() IN ('admin', 'manager'));

-- Managers may deactivate doctors in their MRs' territories
DROP POLICY IF EXISTS manager_team_doctors_update ON public.doctors;
CREATE POLICY manager_team_doctors_update ON public.doctors
  FOR UPDATE
  TO authenticated
  USING (
    public.current_user_role() = 'manager'
    AND EXISTS (
      SELECT 1
      FROM public.mr_manager_map mmm
      JOIN public.mr_sub_area_access msa ON msa.mr_id = mmm.mr_id
      WHERE mmm.manager_id = public.session_profile_id()
        AND msa.sub_area_id = doctors.sub_area_id
    )
  )
  WITH CHECK (
    public.current_user_role() = 'manager'
    AND EXISTS (
      SELECT 1
      FROM public.mr_manager_map mmm
      JOIN public.mr_sub_area_access msa ON msa.mr_id = mmm.mr_id
      WHERE mmm.manager_id = public.session_profile_id()
        AND msa.sub_area_id = doctors.sub_area_id
    )
  );
