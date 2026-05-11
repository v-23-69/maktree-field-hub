-- Duplicate data audit for key portal tables.
-- Run SELECT blocks first, review results, then run DELETE blocks carefully.
--
-- Order matters if you use manager-self-and-uniqueness-hardening.sql:
-- remove duplicate rows in mr_manager_map / mr_sub_area_access / daily_reports first,
-- then create unique indexes (the index will fail while duplicates remain).

-- 1) Duplicate users by email
SELECT lower(trim(email)) AS email_key, COUNT(*) AS cnt, array_agg(id ORDER BY created_at) AS user_ids
FROM public.users
WHERE email IS NOT NULL AND trim(email) <> ''
GROUP BY lower(trim(email))
HAVING COUNT(*) > 1;

-- 2) Duplicate users by employee_code
SELECT lower(trim(employee_code)) AS code_key, COUNT(*) AS cnt, array_agg(id ORDER BY created_at) AS user_ids
FROM public.users
WHERE employee_code IS NOT NULL AND trim(employee_code) <> ''
GROUP BY lower(trim(employee_code))
HAVING COUNT(*) > 1;

-- 3) Duplicate MR-manager mappings
SELECT mr_id, manager_id, COUNT(*) AS cnt, array_agg(id ORDER BY assigned_at) AS row_ids
FROM public.mr_manager_map
GROUP BY mr_id, manager_id
HAVING COUNT(*) > 1;

-- 4) Duplicate MR-subarea access
SELECT mr_id, sub_area_id, COUNT(*) AS cnt, array_agg(id) AS row_ids
FROM public.mr_sub_area_access
GROUP BY mr_id, sub_area_id
HAVING COUNT(*) > 1;

-- 5) Duplicate doctor codes
SELECT lower(trim(doctor_code)) AS doctor_code_key, COUNT(*) AS cnt, array_agg(id ORDER BY created_at) AS doctor_ids
FROM public.doctors
WHERE doctor_code IS NOT NULL AND trim(doctor_code) <> ''
GROUP BY lower(trim(doctor_code))
HAVING COUNT(*) > 1;

-- 6) Duplicate chemist name per sub-area
SELECT sub_area_id, lower(trim(name)) AS chemist_name_key, COUNT(*) AS cnt, array_agg(id) AS chemist_ids
FROM public.chemists
GROUP BY sub_area_id, lower(trim(name))
HAVING COUNT(*) > 1;

-- 7) Duplicate daily reports for same MR/date
SELECT mr_id, report_date, COUNT(*) AS cnt, array_agg(id ORDER BY created_at) AS report_ids
FROM public.daily_reports
GROUP BY mr_id, report_date
HAVING COUNT(*) > 1;

-- 8) Duplicate expense reports for same MR/date
SELECT mr_id, report_date, COUNT(*) AS cnt, array_agg(id ORDER BY created_at) AS report_ids
FROM public.expense_reports
GROUP BY mr_id, report_date
HAVING COUNT(*) > 1;

-- ==============================
-- Optional cleanup blocks below
-- ==============================
-- Keeps oldest row and deletes duplicates.

-- Cleanup duplicate mr_manager_map rows
-- DELETE FROM public.mr_manager_map t
-- USING public.mr_manager_map d
-- WHERE t.id = d.id
--   AND d.id <> (
--     SELECT MIN(x.id)
--     FROM public.mr_manager_map x
--     WHERE x.mr_id = d.mr_id AND x.manager_id = d.manager_id
--   );

-- Cleanup duplicate mr_sub_area_access rows
-- DELETE FROM public.mr_sub_area_access t
-- USING public.mr_sub_area_access d
-- WHERE t.id = d.id
--   AND d.id <> (
--     SELECT MIN(x.id)
--     FROM public.mr_sub_area_access x
--     WHERE x.mr_id = d.mr_id AND x.sub_area_id = d.sub_area_id
--   );

-- Cleanup duplicate daily_reports (keep earliest)
-- DELETE FROM public.daily_reports t
-- USING public.daily_reports d
-- WHERE t.id = d.id
--   AND d.id <> (
--     SELECT x.id
--     FROM public.daily_reports x
--     WHERE x.mr_id = d.mr_id AND x.report_date = d.report_date
--     ORDER BY x.created_at ASC
--     LIMIT 1
--   );

-- Cleanup duplicate expense_reports (keep earliest)
-- DELETE FROM public.expense_reports t
-- USING public.expense_reports d
-- WHERE t.id = d.id
--   AND d.id <> (
--     SELECT x.id
--     FROM public.expense_reports x
--     WHERE x.mr_id = d.mr_id AND x.report_date = d.report_date
--     ORDER BY x.created_at ASC
--     LIMIT 1
--   );
