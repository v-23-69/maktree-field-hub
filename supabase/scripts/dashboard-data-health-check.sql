-- Dashboard data health check
-- Run in Supabase SQL editor (safe, read-only).
-- Purpose:
-- 1) Verify all dashboard-dependent views/functions exist.
-- 2) Verify area/sub-area and access mappings are present and clean.
-- 3) Provide quick row-count sanity checks for core dashboard cards.

-- =========================================================
-- A) Required objects (views + functions) existence check
-- =========================================================
WITH required_objects AS (
  SELECT 'view' AS object_type, 'public' AS schema_name, 'v_master_list_completion' AS object_name
  UNION ALL SELECT 'view', 'public', 'v_target_achievement'
  UNION ALL SELECT 'view', 'public', 'v_dcr_daily_status'
  UNION ALL SELECT 'view', 'public', 'v_dcr_monthly_summary'
  UNION ALL SELECT 'view', 'public', 'v_monthly_support_summary'
  UNION ALL SELECT 'view', 'public', 'v_competitor_summary'
  UNION ALL SELECT 'view', 'public', 'v_visit_detail'
  UNION ALL SELECT 'view', 'public', 'v_area_performance'
  UNION ALL SELECT 'view', 'public', 'v_doctor_loyalty'
  UNION ALL SELECT 'view', 'public', 'v_competitor_intelligence'
  UNION ALL SELECT 'view', 'public', 'v_expense_monthly_summary'
  UNION ALL SELECT 'view', 'public', 'v_expense_by_category'
  UNION ALL SELECT 'function', 'public', 'list_mrs_for_manager'
  UNION ALL SELECT 'function', 'public', 'list_targets_for_setter'
  UNION ALL SELECT 'function', 'public', 'get_doctor_alerts'
)
SELECT
  r.object_type,
  r.schema_name,
  r.object_name,
  CASE
    WHEN r.object_type = 'view' AND EXISTS (
      SELECT 1
      FROM information_schema.views v
      WHERE v.table_schema = r.schema_name
        AND v.table_name = r.object_name
    ) THEN 'present'
    WHEN r.object_type = 'function' AND EXISTS (
      SELECT 1
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = r.schema_name
        AND p.proname = r.object_name
    ) THEN 'present'
    ELSE 'missing'
  END AS status
FROM required_objects r
ORDER BY r.object_type, r.object_name;

-- =========================================================
-- B) Area/Sub-area and assignment integrity
-- =========================================================
-- 1. Active areas with active sub-areas count
SELECT
  a.id AS area_id,
  a.name AS area_name,
  COUNT(sa.id) FILTER (WHERE sa.is_active) AS active_sub_area_count
FROM public.areas a
LEFT JOIN public.sub_areas sa ON sa.area_id = a.id
WHERE a.is_active
GROUP BY a.id, a.name
ORDER BY a.name;

-- 2. Sub-areas without parent area (should be 0)
SELECT COUNT(*) AS sub_areas_with_missing_parent_area
FROM public.sub_areas sa
LEFT JOIN public.areas a ON a.id = sa.area_id
WHERE a.id IS NULL;

-- 3. Doctors assigned to inactive/missing sub-area (should be 0)
SELECT COUNT(*) AS doctors_with_invalid_sub_area
FROM public.doctors d
LEFT JOIN public.sub_areas sa ON sa.id = d.sub_area_id
WHERE d.is_active
  AND (sa.id IS NULL OR sa.is_active = false);

-- 4. MR sub-area access rows pointing to inactive/missing entities (should be 0)
SELECT COUNT(*) AS invalid_mr_sub_area_access_rows
FROM public.mr_sub_area_access msa
LEFT JOIN public.users u ON u.id = msa.mr_id
LEFT JOIN public.sub_areas sa ON sa.id = msa.sub_area_id
WHERE u.id IS NULL
   OR sa.id IS NULL
   OR sa.is_active = false;

-- =========================================================
-- C) Core dashboard row-count sanity checks
-- =========================================================
SELECT
  (SELECT COUNT(*) FROM public.users WHERE role::text = 'mr' AND is_active) AS active_mr_count,
  (SELECT COUNT(*) FROM public.users WHERE role::text = 'manager' AND is_active) AS active_manager_count,
  (SELECT COUNT(*) FROM public.doctors WHERE is_active) AS active_doctor_count,
  (SELECT COUNT(*) FROM public.areas WHERE is_active) AS active_area_count,
  (SELECT COUNT(*) FROM public.daily_reports WHERE status::text = 'submitted') AS submitted_daily_reports_count,
  (SELECT COUNT(*) FROM public.expense_reports) AS expense_reports_count;

-- =========================================================
-- D) Duplicate guards (should be 0 rows)
-- =========================================================
SELECT mr_id, manager_id, COUNT(*) AS cnt
FROM public.mr_manager_map
GROUP BY mr_id, manager_id
HAVING COUNT(*) > 1;

SELECT mr_id, sub_area_id, COUNT(*) AS cnt
FROM public.mr_sub_area_access
GROUP BY mr_id, sub_area_id
HAVING COUNT(*) > 1;

SELECT mr_id, report_date, COUNT(*) AS cnt
FROM public.daily_reports
GROUP BY mr_id, report_date
HAVING COUNT(*) > 1;

SELECT mr_id, report_date, COUNT(*) AS cnt
FROM public.expense_reports
GROUP BY mr_id, report_date
HAVING COUNT(*) > 1;
