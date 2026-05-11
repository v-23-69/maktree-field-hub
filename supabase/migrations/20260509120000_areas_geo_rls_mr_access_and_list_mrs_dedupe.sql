-- Fix area/sub-area 403s for managers/MRs, assign-sub-area inserts, duplicate MR rows from mr_manager_map,
-- admin block_complaints reads, and dedupe list_mrs_for_manager RPC output.

-- ============================================================
-- 1) MR list: one row per MR even when mr_manager_map has duplicates
-- ============================================================
CREATE OR REPLACE FUNCTION public.list_mrs_for_manager()
RETURNS TABLE (
  id uuid,
  employee_code text,
  full_name text,
  role text,
  email text,
  is_active boolean,
  auth_user_id uuid,
  must_change_password boolean,
  created_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  WITH me AS (
    SELECT u.id, u.role::text AS role_name
    FROM public.users u
    WHERE u.auth_user_id = auth.uid()
    LIMIT 1
  ),
  mapped AS (
    SELECT DISTINCT ON (mr.id)
      mr.id,
      mr.employee_code::text,
      mr.full_name::text,
      mr.role::text,
      mr.email::text,
      mr.is_active,
      mr.auth_user_id,
      mr.must_change_password,
      mr.created_at
    FROM public.users mr
    INNER JOIN public.mr_manager_map m ON m.mr_id = mr.id
    INNER JOIN me ON me.id = m.manager_id
    WHERE me.role_name = 'manager'
      AND mr.role::text = 'mr'
      AND mr.is_active = true
    ORDER BY mr.id, mr.full_name ASC
  ),
  fallback AS (
    SELECT
      mr.id,
      mr.employee_code::text,
      mr.full_name::text,
      mr.role::text,
      mr.email::text,
      mr.is_active,
      mr.auth_user_id,
      mr.must_change_password,
      mr.created_at
    FROM public.users mr
    CROSS JOIN me
    WHERE me.role_name = 'manager'
      AND mr.role::text = 'mr'
      AND mr.is_active = true
      AND NOT EXISTS (SELECT 1 FROM mapped)
  )
  SELECT * FROM (
    SELECT * FROM mapped
    UNION ALL
    SELECT * FROM fallback
  ) s
  ORDER BY s.full_name;
$$;

GRANT EXECUTE ON FUNCTION public.list_mrs_for_manager() TO authenticated;

-- ============================================================
-- 2) Areas + sub_areas: read for operational roles; write for manager/admin
-- ============================================================
ALTER TABLE public.areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sub_areas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS areas_select_operational ON public.areas;
CREATE POLICY areas_select_operational
ON public.areas
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.users me
    WHERE me.auth_user_id = auth.uid()
      AND me.is_active = true
      AND me.role::text IN ('admin', 'manager', 'mr')
  )
);

DROP POLICY IF EXISTS areas_insert_manager_admin ON public.areas;
CREATE POLICY areas_insert_manager_admin
ON public.areas
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.users me
    WHERE me.auth_user_id = auth.uid()
      AND me.is_active = true
      AND me.role::text IN ('admin', 'manager')
  )
);

DROP POLICY IF EXISTS areas_update_manager_admin ON public.areas;
CREATE POLICY areas_update_manager_admin
ON public.areas
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.users me
    WHERE me.auth_user_id = auth.uid()
      AND me.is_active = true
      AND me.role::text IN ('admin', 'manager')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.users me
    WHERE me.auth_user_id = auth.uid()
      AND me.is_active = true
      AND me.role::text IN ('admin', 'manager')
  )
);

DROP POLICY IF EXISTS sub_areas_select_operational ON public.sub_areas;
CREATE POLICY sub_areas_select_operational
ON public.sub_areas
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.users me
    WHERE me.auth_user_id = auth.uid()
      AND me.is_active = true
      AND me.role::text IN ('admin', 'manager', 'mr')
  )
);

DROP POLICY IF EXISTS sub_areas_insert_manager_admin ON public.sub_areas;
CREATE POLICY sub_areas_insert_manager_admin
ON public.sub_areas
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.users me
    WHERE me.auth_user_id = auth.uid()
      AND me.is_active = true
      AND me.role::text IN ('admin', 'manager')
  )
);

DROP POLICY IF EXISTS sub_areas_update_manager_admin ON public.sub_areas;
CREATE POLICY sub_areas_update_manager_admin
ON public.sub_areas
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.users me
    WHERE me.auth_user_id = auth.uid()
      AND me.is_active = true
      AND me.role::text IN ('admin', 'manager')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.users me
    WHERE me.auth_user_id = auth.uid()
      AND me.is_active = true
      AND me.role::text IN ('admin', 'manager')
  )
);

-- ============================================================
-- 3) MR sub-area access: managers can read/assign for their MRs (and self)
-- ============================================================
ALTER TABLE public.mr_sub_area_access ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS mr_sub_area_access_select_scope ON public.mr_sub_area_access;
CREATE POLICY mr_sub_area_access_select_scope
ON public.mr_sub_area_access
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
        OR mr_sub_area_access.mr_id = me.id
        OR (
          me.role::text = 'manager'
          AND EXISTS (
            SELECT 1
            FROM public.mr_manager_map mm
            WHERE mm.manager_id = me.id
              AND mm.mr_id = mr_sub_area_access.mr_id
          )
        )
      )
  )
);

DROP POLICY IF EXISTS mr_sub_area_access_insert_scope ON public.mr_sub_area_access;
CREATE POLICY mr_sub_area_access_insert_scope
ON public.mr_sub_area_access
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
        OR (
          me.role::text = 'mr'
          AND mr_sub_area_access.mr_id = me.id
        )
        OR (
          me.role::text = 'manager'
          AND (
            mr_sub_area_access.mr_id = me.id
            OR EXISTS (
              SELECT 1
              FROM public.mr_manager_map mm
              WHERE mm.manager_id = me.id
                AND mm.mr_id = mr_sub_area_access.mr_id
            )
          )
        )
      )
  )
);

DROP POLICY IF EXISTS mr_sub_area_access_delete_scope ON public.mr_sub_area_access;
CREATE POLICY mr_sub_area_access_delete_scope
ON public.mr_sub_area_access
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.users me
    WHERE me.auth_user_id = auth.uid()
      AND me.is_active = true
      AND (
        me.role::text = 'admin'
        OR (
          me.role::text = 'manager'
          AND (
            mr_sub_area_access.mr_id = me.id
            OR EXISTS (
              SELECT 1
              FROM public.mr_manager_map mm
              WHERE mm.manager_id = me.id
                AND mm.mr_id = mr_sub_area_access.mr_id
            )
          )
        )
      )
  )
);

-- ============================================================
-- 4) Admin dashboard: pending block complaints count
-- ============================================================
ALTER TABLE public.block_complaints ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS block_complaints_select_admin ON public.block_complaints;
CREATE POLICY block_complaints_select_admin
ON public.block_complaints
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.users me
    WHERE me.auth_user_id = auth.uid()
      AND me.is_active = true
      AND me.role::text = 'admin'
  )
);
