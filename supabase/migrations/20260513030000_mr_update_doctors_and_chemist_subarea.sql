-- Allow MRs to UPDATE doctors in their assigned sub-areas
-- (so they can fill in doctor details like qualification, address, birthday, etc.)
CREATE POLICY IF NOT EXISTS mr_update_own_doctors ON public.doctors
  FOR UPDATE
  TO authenticated
  USING (
    is_active = true
    AND EXISTS (
      SELECT 1 FROM public.mr_sub_area_access msa
      WHERE msa.sub_area_id = doctors.sub_area_id
        AND msa.mr_id = public.session_profile_id()
    )
  )
  WITH CHECK (
    is_active = true
    AND EXISTS (
      SELECT 1 FROM public.mr_sub_area_access msa
      WHERE msa.sub_area_id = doctors.sub_area_id
        AND msa.mr_id = public.session_profile_id()
    )
  );
