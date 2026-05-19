-- Fix manager analytics 400s (views missing mr_id) and expense_reports 403
-- (legacy policy reading auth.users fails RLS evaluation for authenticated role).

-- ---------------------------------------------------------------------------
-- Expense reports: remove legacy policies that break SELECT for all roles
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS expense_reports_admin ON public.expense_reports;
DROP POLICY IF EXISTS expense_reports_mr ON public.expense_reports;

DROP POLICY IF EXISTS expense_reports_select_scope ON public.expense_reports;
CREATE POLICY expense_reports_select_scope
ON public.expense_reports
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.users me
    WHERE me.auth_user_id = auth.uid()
      AND (
        me.role::text = 'admin'
        OR me.id = expense_reports.mr_id
        OR (
          me.role::text = 'manager'
          AND EXISTS (
            SELECT 1
            FROM public.mr_manager_map mm
            WHERE mm.manager_id = me.id
              AND mm.mr_id = expense_reports.mr_id
          )
        )
      )
  )
);

DROP POLICY IF EXISTS expense_reports_insert_mr ON public.expense_reports;
CREATE POLICY expense_reports_insert_mr
ON public.expense_reports
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.users me
    WHERE me.auth_user_id = auth.uid()
      AND (
        me.role::text = 'admin'
        OR me.id = expense_reports.mr_id
      )
  )
);

DROP POLICY IF EXISTS expense_reports_update_scope ON public.expense_reports;
CREATE POLICY expense_reports_update_scope
ON public.expense_reports
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.users me
    WHERE me.auth_user_id = auth.uid()
      AND (
        me.role::text = 'admin'
        OR me.id = expense_reports.mr_id
        OR (
          me.role::text = 'manager'
          AND EXISTS (
            SELECT 1
            FROM public.mr_manager_map mm
            WHERE mm.manager_id = me.id
              AND mm.mr_id = expense_reports.mr_id
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
      AND (
        me.role::text = 'admin'
        OR me.id = expense_reports.mr_id
        OR (
          me.role::text = 'manager'
          AND EXISTS (
            SELECT 1
            FROM public.mr_manager_map mm
            WHERE mm.manager_id = me.id
              AND mm.mr_id = expense_reports.mr_id
          )
        )
      )
  )
);

GRANT SELECT, INSERT, UPDATE ON public.expense_reports TO authenticated;

-- ---------------------------------------------------------------------------
-- Analytics views: expose mr_id for PostgREST filters used by the app
-- (DROP required: CREATE OR REPLACE cannot reorder/rename leading columns.)
-- ---------------------------------------------------------------------------
DROP VIEW IF EXISTS public.v_monthly_support_summary CASCADE;
DROP VIEW IF EXISTS public.v_competitor_summary CASCADE;
DROP VIEW IF EXISTS public.v_area_performance CASCADE;
DROP VIEW IF EXISTS public.v_doctor_loyalty CASCADE;
DROP VIEW IF EXISTS public.v_competitor_intelligence CASCADE;

CREATE VIEW public.v_monthly_support_summary
WITH (security_invoker = true) AS
SELECT
  dr.mr_id,
  dr.report_date,
  mr.full_name AS mr_name,
  mr.employee_code AS mr_code,
  d.full_name AS doctor_name,
  d.doctor_code,
  sa.name AS sub_area,
  a.name AS area,
  p.name AS product_name,
  mse.quantity
FROM public.monthly_support_entries mse
JOIN public.report_visits rv ON rv.id = mse.visit_id
JOIN public.daily_reports dr ON dr.id = rv.report_id
JOIN public.users mr ON mr.id = dr.mr_id
JOIN public.doctors d ON d.id = rv.doctor_id
JOIN public.sub_areas sa ON sa.id = d.sub_area_id
JOIN public.areas a ON a.id = sa.area_id
JOIN public.products p ON p.id = mse.product_id
WHERE dr.status = 'submitted';

CREATE VIEW public.v_competitor_summary
WITH (security_invoker = true) AS
SELECT
  dr.mr_id,
  dr.report_date,
  mr.full_name AS mr_name,
  mr.employee_code AS mr_code,
  d.full_name AS doctor_name,
  sa.name AS sub_area,
  a.name AS area,
  ce.brand_name AS competitor_brand,
  ce.quantity
FROM public.competitor_entries ce
JOIN public.report_visits rv ON rv.id = ce.visit_id
JOIN public.daily_reports dr ON dr.id = rv.report_id
JOIN public.users mr ON mr.id = dr.mr_id
JOIN public.doctors d ON d.id = rv.doctor_id
JOIN public.sub_areas sa ON sa.id = d.sub_area_id
JOIN public.areas a ON a.id = sa.area_id
WHERE dr.status = 'submitted';

CREATE VIEW public.v_area_performance
WITH (security_invoker = true) AS
SELECT
  dr.mr_id,
  a.id AS area_id,
  a.name AS area,
  sa.id AS sub_area_id,
  sa.name AS sub_area,
  p.name AS product_name,
  count(DISTINCT rv.doctor_id) AS doctors_covered,
  sum(mse.quantity) AS total_quantity,
  date_trunc('month', dr.report_date::timestamptz) AS month
FROM public.monthly_support_entries mse
JOIN public.report_visits rv ON rv.id = mse.visit_id
JOIN public.daily_reports dr ON dr.id = rv.report_id
JOIN public.doctors d ON d.id = rv.doctor_id
JOIN public.sub_areas sa ON sa.id = d.sub_area_id
JOIN public.areas a ON a.id = sa.area_id
JOIN public.products p ON p.id = mse.product_id
WHERE dr.status = 'submitted'
GROUP BY
  dr.mr_id,
  a.id,
  a.name,
  sa.id,
  sa.name,
  p.name,
  date_trunc('month', dr.report_date::timestamptz);

CREATE VIEW public.v_doctor_loyalty
WITH (security_invoker = true) AS
SELECT
  dr.mr_id,
  rv.doctor_id,
  d.full_name AS doctor_name,
  d.speciality,
  sa.name AS sub_area,
  a.name AS area,
  p.name AS product_name,
  count(DISTINCT dr.report_date) AS months_written,
  sum(mse.quantity) AS total_quantity,
  max(dr.report_date) AS last_written_date,
  min(dr.report_date) AS first_written_date
FROM public.monthly_support_entries mse
JOIN public.report_visits rv ON rv.id = mse.visit_id
JOIN public.daily_reports dr ON dr.id = rv.report_id
JOIN public.doctors d ON d.id = rv.doctor_id
JOIN public.sub_areas sa ON sa.id = d.sub_area_id
JOIN public.areas a ON a.id = sa.area_id
JOIN public.products p ON p.id = mse.product_id
WHERE dr.status = 'submitted'
GROUP BY
  dr.mr_id,
  rv.doctor_id,
  d.full_name,
  d.speciality,
  sa.name,
  a.name,
  p.name;

CREATE VIEW public.v_competitor_intelligence
WITH (security_invoker = true) AS
SELECT
  dr.mr_id,
  ce.brand_name AS competitor_brand,
  sa.name AS sub_area,
  a.name AS area,
  d.speciality AS doctor_speciality,
  count(DISTINCT rv.doctor_id) AS doctor_count,
  sum(ce.quantity) AS total_quantity,
  date_trunc('month', dr.report_date::timestamptz) AS month
FROM public.competitor_entries ce
JOIN public.report_visits rv ON rv.id = ce.visit_id
JOIN public.daily_reports dr ON dr.id = rv.report_id
JOIN public.doctors d ON d.id = rv.doctor_id
JOIN public.sub_areas sa ON sa.id = d.sub_area_id
JOIN public.areas a ON a.id = sa.area_id
WHERE dr.status = 'submitted'
GROUP BY
  dr.mr_id,
  ce.brand_name,
  sa.name,
  a.name,
  d.speciality,
  date_trunc('month', dr.report_date::timestamptz);

GRANT SELECT ON public.v_monthly_support_summary TO authenticated, anon;
GRANT SELECT ON public.v_competitor_summary TO authenticated, anon;
GRANT SELECT ON public.v_area_performance TO authenticated, anon;
GRANT SELECT ON public.v_doctor_loyalty TO authenticated, anon;
GRANT SELECT ON public.v_competitor_intelligence TO authenticated, anon;
