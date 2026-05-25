-- Manager dashboard: who is assigned to each sub-area (all MRs and managers).

CREATE OR REPLACE FUNCTION public.list_sub_area_assignments_for_manager()
RETURNS TABLE (
  area_id uuid,
  area_name text,
  sub_area_id uuid,
  sub_area_name text,
  user_id uuid,
  user_full_name text,
  user_role text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT
    a.id AS area_id,
    a.name AS area_name,
    sa.id AS sub_area_id,
    sa.name AS sub_area_name,
    u.id AS user_id,
    u.full_name AS user_full_name,
    u.role::text AS user_role
  FROM public.mr_sub_area_access msa
  INNER JOIN public.sub_areas sa ON sa.id = msa.sub_area_id AND sa.is_active = true
  INNER JOIN public.areas a ON a.id = sa.area_id AND a.is_active = true
  INNER JOIN public.users u ON u.id = msa.mr_id AND u.is_active = true
  WHERE EXISTS (
    SELECT 1
    FROM public.users me
    WHERE me.auth_user_id = auth.uid()
      AND me.is_active = true
      AND me.role::text IN ('manager', 'admin')
  )
  ORDER BY a.name, sa.name, u.role::text, u.full_name;
$$;

REVOKE ALL ON FUNCTION public.list_sub_area_assignments_for_manager() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_sub_area_assignments_for_manager() TO authenticated;
