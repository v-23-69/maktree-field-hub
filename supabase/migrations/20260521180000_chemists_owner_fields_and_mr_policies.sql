-- Optional proprietor fields per chemist outlet; MR can update chemists in territory and unlink from doctors.

ALTER TABLE public.chemists
  ADD COLUMN IF NOT EXISTS owner_name text,
  ADD COLUMN IF NOT EXISTS owner_contact text;

COMMENT ON COLUMN public.chemists.owner_name IS 'Optional outlet proprietor / owner name.';
COMMENT ON COLUMN public.chemists.owner_contact IS 'Optional owner contact number.';

DROP POLICY IF EXISTS mr_update_chemists_in_territory ON public.chemists;
CREATE POLICY mr_update_chemists_in_territory ON public.chemists
  FOR UPDATE TO authenticated
  USING (
    is_active = true
    AND public.current_user_role() = 'mr'
    AND EXISTS (
      SELECT 1 FROM public.mr_sub_area_access msa
      WHERE msa.sub_area_id = chemists.sub_area_id
        AND msa.mr_id = public.session_profile_id()
    )
  )
  WITH CHECK (
    is_active = true
    AND public.current_user_role() = 'mr'
    AND EXISTS (
      SELECT 1 FROM public.mr_sub_area_access msa
      WHERE msa.sub_area_id = chemists.sub_area_id
        AND msa.mr_id = public.session_profile_id()
    )
  );

DROP POLICY IF EXISTS mr_delete_chemist_doctor_map ON public.chemist_doctor_map;
CREATE POLICY mr_delete_chemist_doctor_map ON public.chemist_doctor_map
  FOR DELETE TO authenticated
  USING (
    public.current_user_role() = 'mr'
    AND EXISTS (
      SELECT 1 FROM public.doctors d
      JOIN public.mr_sub_area_access msa ON msa.sub_area_id = d.sub_area_id
        AND msa.mr_id = public.session_profile_id()
      WHERE d.id = chemist_doctor_map.doctor_id
        AND d.is_active = true
    )
  );
