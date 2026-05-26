-- Reliable MR sub-area list for Tour Program / DCR (avoids PostgREST embed + RLS edge cases).
-- Rollback: DROP FUNCTION IF EXISTS public.list_sub_areas_for_mr(uuid);

CREATE OR REPLACE FUNCTION public.list_sub_areas_for_mr(p_mr_id uuid DEFAULT NULL)
RETURNS TABLE (
  sub_area_id uuid,
  sub_area_name text,
  sub_area_code text,
  area_id uuid,
  area_name text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  WITH target AS (
    SELECT u.id
    FROM public.users u
    WHERE u.is_active = true
      AND u.id = COALESCE(
        p_mr_id,
        (SELECT u2.id FROM public.users u2 WHERE u2.auth_user_id = auth.uid() AND u2.is_active LIMIT 1)
      )
    LIMIT 1
  )
  SELECT
    sa.id AS sub_area_id,
    sa.name AS sub_area_name,
    sa.code AS sub_area_code,
    a.id AS area_id,
    a.name AS area_name
  FROM target t
  INNER JOIN public.mr_sub_area_access msa ON msa.mr_id = t.id
  INNER JOIN public.sub_areas sa ON sa.id = msa.sub_area_id AND sa.is_active = true
  INNER JOIN public.areas a ON a.id = sa.area_id AND a.is_active = true
  WHERE EXISTS (
    SELECT 1
    FROM public.users me
    WHERE me.auth_user_id = auth.uid()
      AND me.is_active = true
      AND (
        me.role::text = 'admin'
        OR t.id = me.id
        OR (
          me.role::text = 'manager'
          AND (
            t.id = me.id
            OR EXISTS (
              SELECT 1 FROM public.mr_manager_map mm
              WHERE mm.manager_id = me.id AND mm.mr_id = t.id
            )
          )
        )
        OR (me.role::text = 'mr' AND t.id = me.id)
      )
  )
  ORDER BY a.name, sa.name;
$$;

REVOKE ALL ON FUNCTION public.list_sub_areas_for_mr(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_sub_areas_for_mr(uuid) TO authenticated;
